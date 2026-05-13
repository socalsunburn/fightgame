import Phaser from 'phaser';
import { Fighter } from '../characters/Fighter';
import { Projectile } from '../characters/Projectile';
import { InputHandler, PlayerInput } from '../input/InputHandler';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';
import { SoundManager } from '../audio/SoundManager';
import { MusicManager } from '../audio/MusicManager';

const FIXED_DT   = 1000 / 60;
const BLAST_ZONE = { left: -300, right: 1580, top: -400, bottom: 900 };

export class BattleScene extends Phaser.Scene {
  private fighters: Fighter[] = [];
  private projectiles: Projectile[] = [];
  private inputHandler!: InputHandler;
  private stockIcons: Phaser.GameObjects.Rectangle[][] = [];
  private damageTexts: Phaser.GameObjects.Text[] = [];
  private matchOver: boolean = false;
  private currentPlatforms: Phaser.Geom.Rectangle[] = [];

  /** Current game frame — deterministic, increments once per simulation tick. */
  gameFrame: number = 0;

  /** Leftover time from last render frame, carries over into next. */
  private accumulator: number = 0;

  constructor() { super('BattleScene'); }

  create(data?: { p1?: string; p2?: string; stageKey?: string }): void {
    const { width } = this.scale;

    this.fighters    = [];
    this.projectiles = [];
    this.stockIcons  = [];
    this.damageTexts = [];

    const stageData = STAGES.find(s => s.key === (data?.stageKey ?? 'void')) ?? STAGES[0];
    const platforms = stageData.platforms.map(
      p => new Phaser.Geom.Rectangle(p.x, p.y, p.w, p.h)
    );

    MusicManager.play(this, stageData.musicKey);

    this.cameras.main.setBackgroundColor(stageData.backgroundColor);

    if (stageData.backgroundImage && this.textures.exists(stageData.backgroundImage)) {
      this.add.image(640, 360, stageData.backgroundImage).setDepth(-1);
    }

    for (const plat of platforms) {
      this.add.rectangle(plat.centerX, plat.centerY, plat.width, plat.height, stageData.platformColor);
    }

    const keys  = Object.keys(CHARACTERS);
    const p1key = data?.p1 ?? keys[0];
    const p2key = data?.p2 ?? keys[1];
    const mainFloor = platforms[0].top;
    this.fighters = [
      new Fighter(this, 0, CHARACTERS[p1key], 340, mainFloor - CHARACTERS[p1key].height / 2),
      new Fighter(this, 1, CHARACTERS[p2key], 940, mainFloor - CHARACTERS[p2key].height / 2),
    ];

    this.inputHandler = new InputHandler();
    this.gameFrame    = 0;
    this.accumulator  = 0;
    this.matchOver    = false;

    this.buildHUD(width);
    this.currentPlatforms = platforms;
  }

  // ── Fixed-timestep loop ───────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.matchOver) return;
    this.accumulator += delta;
    // prevent spiral of death if tab goes idle
    this.accumulator = Math.min(this.accumulator, FIXED_DT * 5);

    // snapshot gamepad prev-state once per render frame before the tick loop
    this.inputHandler.updateGamepadState();

    while (this.accumulator >= FIXED_DT) {
      if (this.matchOver) break;

      const p1 = this.inputHandler.getPlayer(0);
      const p2 = this.inputHandler.getPlayer(1);

      this.simulateTick([p1, p2]);

      this.accumulator -= FIXED_DT;
      this.gameFrame++;

      // flush edge-triggers so a held key doesn't re-fire on catch-up ticks
      this.inputHandler.flush();
      // update gamepad prev-state so next catch-up tick also sees edges as consumed
      this.inputHandler.updateGamepadState();
    }

    this.updateHUD();
  }

  /**
   * One deterministic simulation step.
   * All game logic lives here — no rendering, no delta time.
   * This signature is what a future rollback system will call with replayed inputs.
   */
  simulateTick(inputs: [PlayerInput, PlayerInput]): void {
    for (let i = 0; i < this.fighters.length; i++) {
      this.fighters[i].tick(inputs[i], this.currentPlatforms);
    }

    // Spawn any projectiles the fighters queued this tick
    for (const fighter of this.fighters) {
      for (const p of fighter.drainPendingProjectiles()) {
        this.projectiles.push(new Projectile(this, p));
        SoundManager.projectile();
      }
    }

    // Advance projectiles
    for (const proj of this.projectiles) proj.tick();

    this.resolveHits();
    this.resolveProjectileHits();
    this.resolveCounterHits();
    this.checkBlastZones();

    // Remove projectiles that hit or flew off-stage
    this.projectiles = this.projectiles.filter(p => {
      if (!p.active || p.x < BLAST_ZONE.left || p.x > BLAST_ZONE.right) {
        p.destroy();
        return false;
      }
      return true;
    });
  }

  // ── Collision / hit detection ────────────────────────────────────────────────

  private resolveHits(): void {
    for (const attacker of this.fighters) {
      const hitboxes = attacker.getActiveHitboxes();
      if (!hitboxes.length) continue;

      for (const defender of this.fighters) {
        if (defender.playerIndex === attacker.playerIndex) continue;
        if (defender.isInvincible) continue;
        if (attacker.alreadyHit(defender.playerIndex)) continue;

        const hurtbox = defender.getHurtbox();
        for (const hb of hitboxes) {
          if (Phaser.Geom.Rectangle.Overlaps(hb.bounds, hurtbox)) {
            defender.receiveHit(hb);
            attacker.registerHit(defender.playerIndex);
            SoundManager.hit();
            this.cameras.main.shake(80, 0.006);
            break;
          }
        }
      }
    }
  }

  private resolveProjectileHits(): void {
    for (const proj of this.projectiles) {
      if (!proj.active) continue;
      for (const defender of this.fighters) {
        if (defender.playerIndex === proj.sourcePlayer) continue;
        if (defender.isInvincible) continue;
        if (Phaser.Geom.Rectangle.Overlaps(proj.getHitbox(), defender.getHurtbox())) {
          defender.receiveHit({
            bounds: proj.getHitbox(),
            damage: proj.damage,
            angle: proj.angle,
            baseKnockback: proj.baseKnockback,
            knockbackScaling: proj.knockbackScaling,
            sourcePlayer: proj.sourcePlayer,
          });
          proj.active = false;
          SoundManager.hit();
          this.cameras.main.shake(60, 0.004);
        }
      }
    }
  }

  private resolveCounterHits(): void {
    for (const fighter of this.fighters) {
      if (!fighter.pendingCounterHit) continue;
      const incoming = fighter.pendingCounterHit;
      fighter.pendingCounterHit = null;
      const attacker = this.fighters.find(f => f.playerIndex === incoming.sourcePlayer);
      if (!attacker) continue;
      attacker.receiveHit({
        ...incoming,
        damage: Math.round(incoming.damage * 1.5),
        baseKnockback: incoming.baseKnockback * 2,
        sourcePlayer: fighter.playerIndex,
      });
      SoundManager.heavyHit();
      this.cameras.main.shake(250, 0.016);
    }
  }

  private checkBlastZones(): void {
    for (const fighter of this.fighters) {
      if (fighter.isDead) continue;
      const { x, y } = fighter;
      if (x < BLAST_ZONE.left || x > BLAST_ZONE.right || y < BLAST_ZONE.top || y > BLAST_ZONE.bottom) {
        fighter.stocks--;
        SoundManager.ko();
        this.showKO(fighter.playerIndex);
        if (fighter.stocks <= 0) {
          this.matchOver = true;
          const winner = fighter.playerIndex === 0 ? 1 : 0;
          this.time.delayedCall(1000, () => this.endMatch(winner));
          return;
        }
        fighter.respawn(640, 200);
      }
    }
  }

  private showKO(loserIndex: number): void {
    const { width, height } = this.scale;
    const colors = ['#4488ff', '#ff4444'];

    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.5).setDepth(20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    const ko = this.add.text(width / 2, height / 2 - 60, 'KO!', {
      fontSize: '100px',
      color: colors[loserIndex],
      fontFamily: 'monospace',
      stroke: '#ffffff',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(21).setScale(0.2);

    this.tweens.add({ targets: ko, scale: 1, duration: 250, ease: 'Back.Out' });
    this.tweens.add({
      targets: ko,
      alpha: 0,
      y: height / 2 - 120,
      duration: 350,
      delay: 500,
      onComplete: () => ko.destroy(),
    });

    this.cameras.main.shake(400, 0.018);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────

  private buildHUD(width: number): void {
    const playerColors = [0x4488ff, 0xff4444];
    const xPositions   = [width * 0.25, width * 0.75];

    for (let i = 0; i < 2; i++) {
      const dmgText = this.add.text(xPositions[i], 570, '0%', {
        fontSize: '36px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(10);
      this.damageTexts.push(dmgText);

      const icons: Phaser.GameObjects.Rectangle[] = [];
      for (let s = 0; s < 3; s++) {
        const icon = this.add.rectangle(xPositions[i] + (s - 1) * 22, 616, 14, 14, playerColors[i]).setDepth(10);
        icons.push(icon);
      }
      this.stockIcons.push(icons);
    }
  }

  private updateHUD(): void {
    for (let i = 0; i < this.fighters.length; i++) {
      const f = this.fighters[i];
      this.damageTexts[i].setText(`${f.damage}%`);
      this.damageTexts[i].setColor(f.damage > 100 ? '#ff6600' : f.damage > 50 ? '#ffcc00' : '#ffffff');
      for (let s = 0; s < 3; s++) {
        this.stockIcons[i][s].setAlpha(s < f.stocks ? 1 : 0.15);
      }
    }
  }

  private endMatch(winnerIndex: number): void {
    MusicManager.stop();
    this.scene.start('ResultsScene', { winner: winnerIndex });
  }
}
