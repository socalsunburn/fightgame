import Phaser from 'phaser';
import { FighterState } from './FighterState';
import { CharacterData, ProjectileDef } from '../data/characters';
import { PlayerInput } from '../input/InputHandler';
import { PendingProjectile } from './Projectile';

const GRAVITY             = 1400;
const FIXED_DT_SEC        = 1 / 60;
const RESPAWN_DURATION    = 120;
const INVINCIBLE_DURATION = 120;
const HITSTUN_MIN         = 10;
const MAX_CHARGE          = 60; // frames (1 second) for full charge

export interface FighterSnapshot {
  x: number; y: number;
  vx: number; vy: number;
  state: FighterState;
  stateFrame: number;
  damage: number;
  stocks: number;
  facingRight: boolean;
  hitstunFrames: number;
  invincibleFrames: number;
  respawnFrames: number;
  usedDoubleJump: boolean;
  onGround: boolean;
  fastFalling: boolean;
  hitThisAttack: number[];
  chargeFrames: number;
}

export interface ActiveHitbox {
  bounds: Phaser.Geom.Rectangle;
  damage: number;
  angle: number;
  baseKnockback: number;
  knockbackScaling: number;
  sourcePlayer: number;
}

export class Fighter {
  readonly playerIndex: number;
  readonly data: CharacterData;

  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  facingRight: boolean;

  state: FighterState = FighterState.FALL;
  damage: number = 0;
  stocks: number = 3;

  private stateFrame: number = 0;
  private hitstunFrames: number = 0;
  private invincibleFrames: number = 0;
  private respawnFrames: number = 0;
  private usedDoubleJump: boolean = false;
  private onGround: boolean = false;
  private fastFalling: boolean = false;
  private hitThisAttack = new Set<number>();
  private chargeFrames: number = 0;

  private readonly playerColor: number;
  private graphics: Phaser.GameObjects.Graphics;
  private gameSprite: Phaser.GameObjects.Sprite | null = null;
  private readonly playerLabel: Phaser.GameObjects.Text;

  private pendingProjectiles: PendingProjectile[] = [];
  pendingCounterHit: ActiveHitbox | null = null;

  constructor(
    scene: Phaser.Scene,
    playerIndex: number,
    data: CharacterData,
    startX: number,
    startY: number,
  ) {
    this.playerIndex = playerIndex;
    this.data = data;
    this.x = startX;
    this.y = startY;
    this.facingRight = playerIndex === 0;
    this.playerColor = playerIndex === 0 ? 0x4488ff : 0xff4444;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);

    const labelColors = ['#4488ff', '#ff4444'];
    this.playerLabel = scene.add.text(startX, startY, `P${playerIndex + 1}\n▼`, {
      fontSize: '14px',
      color: labelColors[playerIndex],
      fontFamily: 'monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1.0).setDepth(20);

    if (data.spriteKey) {
      const firstFrame = `${data.spriteKey}-idle-east-0`;
      this.gameSprite = scene.add.sprite(startX, startY, firstFrame);
      this.gameSprite.setDepth(1);
      this.gameSprite.setOrigin(0.5, 0.5);
    }
  }

  // ── Serialization ────────────────────────────────────────────────────────────

  saveState(): FighterSnapshot {
    return {
      x: this.x, y: this.y,
      vx: this.vx, vy: this.vy,
      state: this.state,
      stateFrame: this.stateFrame,
      damage: this.damage,
      stocks: this.stocks,
      facingRight: this.facingRight,
      hitstunFrames: this.hitstunFrames,
      invincibleFrames: this.invincibleFrames,
      respawnFrames: this.respawnFrames,
      usedDoubleJump: this.usedDoubleJump,
      onGround: this.onGround,
      fastFalling: this.fastFalling,
      hitThisAttack: [...this.hitThisAttack],
      chargeFrames: this.chargeFrames,
    };
  }

  restoreState(snap: FighterSnapshot): void {
    this.x = snap.x; this.y = snap.y;
    this.vx = snap.vx; this.vy = snap.vy;
    this.state = snap.state;
    this.stateFrame = snap.stateFrame;
    this.damage = snap.damage;
    this.stocks = snap.stocks;
    this.facingRight = snap.facingRight;
    this.hitstunFrames = snap.hitstunFrames;
    this.invincibleFrames = snap.invincibleFrames;
    this.respawnFrames = snap.respawnFrames;
    this.usedDoubleJump = snap.usedDoubleJump;
    this.onGround = snap.onGround;
    this.fastFalling = snap.fastFalling;
    this.hitThisAttack = new Set(snap.hitThisAttack);
    this.chargeFrames = snap.chargeFrames;
    this.pendingProjectiles = [];
    this.pendingCounterHit = null;
    this.updateGraphics();
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  get isInvincible(): boolean {
    return this.invincibleFrames > 0 || this.state === FighterState.RESPAWN;
  }

  get isDead(): boolean {
    return this.state === FighterState.DEAD;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.data.width / 2,
      this.y - this.data.height / 2,
      this.data.width,
      this.data.height,
    );
  }

  getActiveHitboxes(): ActiveHitbox[] {
    const moveData = this.getMoveDataForState();
    if (!moveData) return [];

    const chargeFactor = this.state === FighterState.CHARGED_ATTACK
      ? Math.min(this.chargeFrames / MAX_CHARGE, 1)
      : 0;

    const result: ActiveHitbox[] = [];
    for (const hbDef of moveData.hitboxes) {
      if (this.stateFrame < hbDef.activeStart || this.stateFrame > hbDef.activeEnd) continue;
      const dir = this.facingRight ? 1 : -1;
      result.push({
        bounds: new Phaser.Geom.Rectangle(
          this.x + hbDef.x * dir - hbDef.w / 2,
          this.y + hbDef.y - hbDef.h / 2,
          hbDef.w, hbDef.h,
        ),
        damage:           Math.round(hbDef.damage * (1 + chargeFactor * 1.5)),
        angle:            this.facingRight ? hbDef.angle : 180 - hbDef.angle,
        baseKnockback:    hbDef.baseKnockback * (1 + chargeFactor * 2.0),
        knockbackScaling: hbDef.knockbackScaling * (1 + chargeFactor * 0.5),
        sourcePlayer:     this.playerIndex,
      });
    }
    return result;
  }

  private getMoveDataForState() {
    switch (this.state) {
      case FighterState.ATTACK:
      case FighterState.CHARGED_ATTACK: return this.data.moves.jab;
      case FighterState.UP_TILT:        return this.data.moves.upTilt;
      case FighterState.DOWN_TILT:      return this.data.moves.downTilt;
      case FighterState.AIR_ATTACK:     return this.data.moves.airAttack;
      case FighterState.SPECIAL:        return this.data.moves.special;
      default:                          return null;
    }
  }

  drainPendingProjectiles(): PendingProjectile[] {
    const out = this.pendingProjectiles;
    this.pendingProjectiles = [];
    return out;
  }

  private isAttacking(): boolean {
    return this.state === FighterState.ATTACK
      || this.state === FighterState.CHARGING
      || this.state === FighterState.CHARGED_ATTACK
      || this.state === FighterState.UP_TILT
      || this.state === FighterState.DOWN_TILT
      || this.state === FighterState.AIR_ATTACK
      || this.state === FighterState.SPECIAL
      || this.state === FighterState.COUNTER;
  }

  alreadyHit(opponentIndex: number): boolean {
    return this.hitThisAttack.has(opponentIndex);
  }

  registerHit(opponentIndex: number): void {
    this.hitThisAttack.add(opponentIndex);
  }

  receiveHit(hitbox: ActiveHitbox): void {
    if (this.isInvincible) return;
    if (this.state === FighterState.SHIELD) return;

    if (this.state === FighterState.COUNTER) {
      this.pendingCounterHit = hitbox;
      this.transitionTo(FighterState.IDLE);
      return;
    }

    this.damage += hitbox.damage;

    const kb = hitbox.baseKnockback + this.damage * hitbox.knockbackScaling * (100 / this.data.weight);
    const rad = Phaser.Math.DegToRad(hitbox.angle);
    this.vx = Math.cos(rad) * kb;
    this.vy = -Math.sin(rad) * kb;

    this.hitstunFrames = Math.max(HITSTUN_MIN, Math.floor(kb * 0.4));
    this.transitionTo(FighterState.HITSTUN);
  }

  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.damage = 0;
    this.usedDoubleJump = false;
    this.fastFalling = false;
    this.respawnFrames = RESPAWN_DURATION;
    this.invincibleFrames = INVINCIBLE_DURATION;
    this.transitionTo(FighterState.RESPAWN);
  }

  // ── Fixed-timestep update ────────────────────────────────────────────────────

  tick(input: PlayerInput, platforms: Phaser.Geom.Rectangle[]): void {
    if (this.state === FighterState.DEAD) return;

    this.stateFrame++;
    if (this.invincibleFrames > 0) this.invincibleFrames--;

    switch (this.state) {
      case FighterState.RESPAWN:
        this.respawnFrames--;
        if (this.respawnFrames <= 0) this.transitionTo(FighterState.FALL);
        break;

      case FighterState.HITSTUN:
        this.hitstunFrames--;
        this.applyGravity();
        this.move();
        this.resolveCollisions(platforms);
        if (this.hitstunFrames <= 0) this.transitionTo(this.onGround ? FighterState.IDLE : FighterState.FALL);
        break;

      case FighterState.CHARGING: {
        this.chargeFrames++;
        // Slow shuffle allowed while charging
        if (input.left)       { this.vx = -this.data.runSpeed * 0.3; this.facingRight = false; }
        else if (input.right) { this.vx =  this.data.runSpeed * 0.3; this.facingRight = true;  }
        else                  { this.vx *= 0.85; }
        this.applyGravity();
        this.move();
        this.resolveCollisions(platforms);
        if (!this.onGround) {
          // Fell off ledge — cancel charge into fall
          this.chargeFrames = 0;
          this.transitionTo(FighterState.FALL);
        } else if (input.jumpPressed) {
          // Jump cancels charge
          this.chargeFrames = 0;
          this.vy = this.data.jumpForce;
          this.onGround = false;
          this.usedDoubleJump = false;
          this.transitionTo(FighterState.JUMP);
        } else if (input.attackReleased || this.chargeFrames >= MAX_CHARGE) {
          this.transitionTo(FighterState.CHARGED_ATTACK);
        }
        break;
      }

      case FighterState.CHARGED_ATTACK: {
        const moveData = this.data.moves.jab;
        if (this.stateFrame >= moveData.totalFrames) {
          this.chargeFrames = 0;
          this.transitionTo(this.onGround ? FighterState.IDLE : FighterState.FALL);
        }
        if (this.onGround) this.vx *= 0.85;
        this.applyGravity();
        this.move();
        this.resolveCollisions(platforms);
        break;
      }

      case FighterState.ATTACK:
      case FighterState.UP_TILT:
      case FighterState.DOWN_TILT:
      case FighterState.AIR_ATTACK:
      case FighterState.SPECIAL: {
        const moveData = this.getMoveDataForState()!;
        const spawnProj = this.state === FighterState.SPECIAL
          && moveData.projectile?.spawnFrame === this.stateFrame;
        if (this.stateFrame >= moveData.totalFrames) {
          this.transitionTo(this.onGround ? FighterState.IDLE : FighterState.FALL);
        }
        if (spawnProj) this.spawnProjectile(moveData.projectile!);
        if (this.onGround) this.vx *= 0.85;
        this.applyGravity();
        this.move();
        this.resolveCollisions(platforms);
        break;
      }

      case FighterState.COUNTER: {
        if (this.stateFrame >= this.data.moves.special.totalFrames) {
          this.pendingCounterHit = null;
          this.transitionTo(this.onGround ? FighterState.IDLE : FighterState.FALL);
        }
        if (this.onGround) this.vx *= 0.85;
        this.applyGravity();
        this.move();
        this.resolveCollisions(platforms);
        break;
      }

      default:
        this.handleMovement(input, platforms);
        break;
    }

    this.updateGraphics();
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private handleMovement(input: PlayerInput, platforms: Phaser.Geom.Rectangle[]): void {
    const isAirborne = this.state === FighterState.JUMP
      || this.state === FighterState.DOUBLE_JUMP
      || this.state === FighterState.FALL;

    if (input.left) {
      this.vx = -this.data.runSpeed;
      this.facingRight = false;
      if (this.onGround) this.transitionTo(FighterState.RUN);
    } else if (input.right) {
      this.vx = this.data.runSpeed;
      this.facingRight = true;
      if (this.onGround) this.transitionTo(FighterState.RUN);
    } else {
      this.vx *= this.onGround ? 0.75 : 0.97;
      if (this.onGround && this.state === FighterState.RUN) this.transitionTo(FighterState.IDLE);
    }

    if (input.jumpPressed) {
      if (this.onGround || this.state === FighterState.IDLE || this.state === FighterState.RUN) {
        this.vy = this.data.jumpForce;
        this.onGround = false;
        this.usedDoubleJump = false;
        this.transitionTo(FighterState.JUMP);
      } else if (!this.usedDoubleJump && isAirborne) {
        this.vy = this.data.doubleJumpForce;
        this.usedDoubleJump = true;
        this.fastFalling = false;
        this.transitionTo(FighterState.DOUBLE_JUMP);
      }
    }

    if (input.down && isAirborne && this.vy > 0 && !this.fastFalling) {
      this.fastFalling = true;
      this.vy = Math.max(this.vy, 200);
    }

    if (input.attackPressed && !this.isAttacking()) {
      this.hitThisAttack.clear();
      if (!this.onGround) {
        this.transitionTo(FighterState.AIR_ATTACK);
      } else if (input.up) {
        this.transitionTo(FighterState.UP_TILT);
      } else if (input.down) {
        this.transitionTo(FighterState.DOWN_TILT);
      } else {
        // Ground neutral: enter charge; releasing quickly = weak, holding = strong
        this.chargeFrames = 0;
        this.transitionTo(FighterState.CHARGING);
      }
    } else if (input.specialPressed && !this.isAttacking()) {
      this.hitThisAttack.clear();
      if (this.data.moves.special.isCounter) {
        this.transitionTo(FighterState.COUNTER);
      } else {
        if (this.data.specialDashSpeed) {
          this.vx = (this.facingRight ? 1 : -1) * this.data.specialDashSpeed;
        }
        this.transitionTo(FighterState.SPECIAL);
      }
    }

    if (input.shield && this.onGround) {
      this.transitionTo(FighterState.SHIELD);
    } else if (this.state === FighterState.SHIELD && !input.shield) {
      this.transitionTo(FighterState.IDLE);
    }

    this.applyGravity();
    this.move();
    this.resolveCollisions(platforms);

    if (this.state === FighterState.JUMP && this.vy >= 0) this.transitionTo(FighterState.FALL);
    if (this.state === FighterState.DOUBLE_JUMP && this.vy >= 0) this.transitionTo(FighterState.FALL);
  }

  private applyGravity(): void {
    if (this.onGround) return;
    this.vy += GRAVITY * FIXED_DT_SEC;
    const maxFall = this.fastFalling ? this.data.fastFallSpeed : this.data.fallSpeed;
    this.vy = Math.min(this.vy, maxFall);
  }

  private move(): void {
    this.x += this.vx * FIXED_DT_SEC;
    this.y += this.vy * FIXED_DT_SEC;
  }

  private resolveCollisions(platforms: Phaser.Geom.Rectangle[]): void {
    this.onGround = false;
    const hw = this.data.width / 2;
    const hh = this.data.height / 2;

    for (const plat of platforms) {
      const prevBottom = this.y + hh - this.vy * FIXED_DT_SEC;
      const curBottom  = this.y + hh;
      const overlapH   = (this.x + hw) > plat.left && (this.x - hw) < plat.right;
      const landedOn   = prevBottom <= plat.top && curBottom >= plat.top;

      if (overlapH && landedOn && this.vy >= 0) {
        this.y = plat.top - hh;
        this.vy = 0;
        this.onGround = true;
        this.usedDoubleJump = false;
        this.fastFalling = false;

        if (
          this.state === FighterState.FALL ||
          this.state === FighterState.JUMP ||
          this.state === FighterState.DOUBLE_JUMP
        ) {
          this.transitionTo(FighterState.IDLE);
        }
      }
    }
  }

  private transitionTo(next: FighterState): void {
    this.state = next;
    this.stateFrame = 0;
  }

  private spawnProjectile(def: ProjectileDef): void {
    const dir = this.facingRight ? 1 : -1;
    this.pendingProjectiles.push({
      x: this.x + 30 * dir,
      y: this.y,
      vx: def.speed * dir,
      w: def.w,
      h: def.h,
      damage: def.damage,
      angle: this.facingRight ? def.angle : 180 - def.angle,
      baseKnockback: def.baseKnockback,
      knockbackScaling: def.knockbackScaling,
      sourcePlayer: this.playerIndex,
      color: def.color ?? this.playerColor,
      shape: def.shape,
      spriteKey: def.spriteKey,
      spriteFrames: def.spriteFrames,
      spriteFrameRate: def.spriteFrameRate,
    });
  }

  private updateGraphics(): void {
    if (this.gameSprite) {
      this.updateSpriteMode();
    } else {
      this.drawSprite();
    }
    // Player indicator floats above the character's head
    const headTop = this.data.spriteKey
      ? this.y - 50
      : this.y - this.data.height / 2;
    this.playerLabel.setPosition(this.x, headTop - 4);
  }

  private updateSpriteMode(): void {
    const dir = this.facingRight ? 'east' : 'west';
    const animName = this.getSpriteAnimName();
    const key = `${this.data.spriteKey}-${animName}-${dir}`;

    this.gameSprite!.setPosition(this.x, this.y);

    const invAlpha = this.isInvincible
      ? 0.4 + Math.sin(this.stateFrame * 0.5) * 0.3
      : 1.0;
    this.gameSprite!.setAlpha(invAlpha);

    if (this.gameSprite!.anims.currentAnim?.key !== key) {
      this.gameSprite!.play(key);
    }

    // Shield bubble overlay
    this.graphics.clear();
    if (this.state === FighterState.SHIELD) {
      this.graphics.fillStyle(0x8888ff, 0.40);
      this.graphics.fillEllipse(this.x, this.y, this.data.width * 1.35, this.data.height * 1.1);
    }
  }

  private getSpriteAnimName(): string {
    switch (this.state) {
      case FighterState.RUN:                return 'run';
      case FighterState.JUMP:
      case FighterState.DOUBLE_JUMP:
      case FighterState.FALL:               return 'jump';
      case FighterState.ATTACK:
      case FighterState.CHARGED_ATTACK:
      case FighterState.UP_TILT:
      case FighterState.DOWN_TILT:
      case FighterState.AIR_ATTACK:         return 'attack';
      case FighterState.SPECIAL:
      case FighterState.COUNTER:
        return this.data.spriteAnims?.some(a => a.name === 'special') ? 'special' : 'attack';
      case FighterState.HITSTUN:            return 'hitstun';
      default:                              return 'idle';
    }
  }

  private drawSprite(): void {
    const g = this.graphics;
    g.clear();

    const { width: W, height: H } = this.data;
    const hh = H / 2;
    const dir = this.facingRight ? 1 : -1;

    // — Per-state animation offsets —
    let bobY   = 0;   // whole-body vertical shift
    let lean   = 0;   // torso X lean
    let legL   = 0;   // left-leg extra length
    let legR   = 0;   // right-leg extra length
    let armRch = 0;   // additional arm reach in facing direction
    let armLft = 0;   // arm vertical offset (negative = raised)
    let scX    = 1;
    let scY    = 1;
    let wobX   = 0;
    let wobY   = 0;

    switch (this.state) {
      case FighterState.IDLE:
        bobY = Math.sin(this.stateFrame * 0.07) * 1.5;
        break;
      case FighterState.RUN: {
        const ph = this.stateFrame * 0.38;
        legL =  Math.sin(ph)           * H * 0.12;
        legR =  Math.sin(ph + Math.PI) * H * 0.12;
        bobY = -Math.abs(Math.sin(ph)) * 1.5;
        lean = dir * 3;
        break;
      }
      case FighterState.JUMP:
      case FighterState.DOUBLE_JUMP:
        scX  = 0.88; scY = 1.12;
        legL = legR = -H * 0.08;
        armLft = -H * 0.06;
        break;
      case FighterState.FALL:
        scX  = 1.08; scY = 0.93;
        legL = legR = H * 0.04;
        armLft = H * 0.05;
        break;
      case FighterState.ATTACK:
      case FighterState.CHARGED_ATTACK: {
        const t = Math.min(this.stateFrame / 6, 1);
        armRch = W * 0.6 * Math.sin(t * Math.PI);
        armLft = -H * 0.04;
        break;
      }
      case FighterState.AIR_ATTACK:
        armRch = W * 0.45;
        armLft = -H * 0.04;
        break;
      case FighterState.UP_TILT:
        armLft = -H * 0.40;
        armRch = W * 0.08;
        break;
      case FighterState.DOWN_TILT:
        armLft =  H * 0.20;
        armRch =  W * 0.25;
        break;
      case FighterState.SPECIAL:
        armRch = W * 0.52;
        break;
      case FighterState.COUNTER:
        armLft = -H * 0.06;
        break;
      case FighterState.HITSTUN:
        wobX = (Math.random() - 0.5) * 5;
        wobY = (Math.random() - 0.5) * 3;
        scX  = 1.05; scY = 0.95;
        break;
      case FighterState.SHIELD:
        bobY = H * 0.05;
        scX  = 1.08; scY = 0.88;
        break;
      case FighterState.CHARGING: {
        const t = Math.min(this.chargeFrames / MAX_CHARGE, 1);
        scX = 1 + t * 0.12; scY = 1 + t * 0.12;
        bobY = Math.sin(this.stateFrame * 0.25) * 2;
        break;
      }
      case FighterState.RESPAWN:
        bobY = Math.sin(this.stateFrame * 0.10) * 3;
        break;
    }

    // — Color —
    let color = this.playerColor;
    const flashWhite =
      (this.state === FighterState.COUNTER  && Math.sin(this.stateFrame * 0.6) > 0) ||
      (this.state === FighterState.CHARGING && this.chargeFrames >= MAX_CHARGE && Math.sin(this.stateFrame * 1.5) > 0);
    if (flashWhite) color = 0xffffff;

    const invAlpha = this.isInvincible ? 0.4 + Math.sin(this.stateFrame * 0.5) * 0.3 : 1;
    g.setAlpha(invAlpha);

    // — Dimensions (squash/stretch applied) —
    const headW    = W * 0.62 * scX;
    const headH    = H * 0.26 * scY;
    const torsoW   = W * 0.76 * scX;
    const torsoH   = H * 0.34 * scY;
    const legW     = W * 0.28 * scX;
    const legBaseH = H * 0.32 * scY;
    const armBaseW = W * 0.44;
    const armH     = H * 0.13 * scY;

    // — World-space positions —
    const cx      = this.x + wobX;
    const cy      = this.y + bobY + wobY;
    const top     = cy - hh;
    const headTop = top + 1;
    const torsoTop = headTop + headH + 2;
    const legsTop  = torsoTop + torsoH + 1;
    const torsoMidX = cx + lean;
    const armMidY   = torsoTop + torsoH * 0.35 + armLft;
    const armTotalW = armBaseW + armRch;

    // Arm (drawn first — behind torso)
    g.fillStyle(color, 1);
    const armLeft = dir > 0
      ? torsoMidX + torsoW / 2
      : torsoMidX - torsoW / 2 - armTotalW;
    g.fillRect(armLeft, armMidY - armH / 2, armTotalW, armH);

    // Legs
    const legLH = Math.max(4, legBaseH + legL);
    const legRH = Math.max(4, legBaseH + legR);
    g.fillRect(cx - legW - 1, legsTop, legW, legLH);
    g.fillRect(cx + 1,        legsTop, legW, legRH);

    // Torso (slightly darker for depth)
    g.fillStyle(this.darkenColor(color, 0.18), 1);
    g.fillRect(torsoMidX - torsoW / 2, torsoTop, torsoW, torsoH);

    // Head
    g.fillStyle(color, 1);
    g.fillRect(cx - headW / 2, headTop, headW, headH);

    // Eye (single dark dot on the facing side)
    g.fillStyle(0x000000, 0.6);
    const eyeW = Math.max(2, headW * 0.13);
    const eyeH = Math.max(2, headH * 0.35);
    const eyeX = cx + dir * headW * 0.18 - eyeW / 2;
    const eyeY = headTop + headH * 0.28;
    g.fillRect(eyeX, eyeY, eyeW, eyeH);

    // Shield bubble (on top of everything)
    if (this.state === FighterState.SHIELD) {
      g.fillStyle(0x8888ff, 0.40);
      g.fillEllipse(cx, cy, W * 1.35, H * 1.1);
    }
  }

  private darkenColor(color: number, amount: number): number {
    const r   = (color >> 16) & 0xff;
    const grn = (color >>  8) & 0xff;
    const b   =  color        & 0xff;
    const f   = 1 - amount;
    return (Math.round(r * f) << 16) | (Math.round(grn * f) << 8) | Math.round(b * f);
  }

  destroy(): void {
    this.graphics.destroy();
    this.gameSprite?.destroy();
    this.playerLabel.destroy();
  }
}
