import Phaser from 'phaser';

const FIXED_DT_SEC = 1 / 60;

export interface PendingProjectile {
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
  damage: number;
  angle: number;
  baseKnockback: number;
  knockbackScaling: number;
  sourcePlayer: number;
  color: number;
  spriteKey?: string;    // if set, use animated sprite instead of rectangle
  spriteFrames?: number;
  spriteFrameRate?: number;
}

export class Projectile {
  x: number;
  y: number;
  active: boolean = true;

  readonly vx: number;
  readonly damage: number;
  readonly angle: number;
  readonly baseKnockback: number;
  readonly knockbackScaling: number;
  readonly sourcePlayer: number;

  private readonly w: number;
  private readonly h: number;
  private readonly graphic: Phaser.GameObjects.Rectangle | null;
  private readonly gameSprite: Phaser.GameObjects.Sprite | null;

  constructor(scene: Phaser.Scene, data: PendingProjectile) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.w = data.w;
    this.h = data.h;
    this.damage = data.damage;
    this.angle = data.angle;
    this.baseKnockback = data.baseKnockback;
    this.knockbackScaling = data.knockbackScaling;
    this.sourcePlayer = data.sourcePlayer;

    if (data.spriteKey) {
      const dir = data.vx >= 0 ? 'east' : 'west';
      const animKey = `${data.spriteKey}-${dir}`;
      this.gameSprite = scene.add.sprite(data.x, data.y, `${animKey}-0`);
      this.gameSprite.setDepth(3);
      this.gameSprite.play(animKey);
      this.graphic = null;
    } else {
      this.graphic = scene.add.rectangle(data.x, data.y, data.w, data.h, data.color);
      this.graphic.setDepth(3);
      this.gameSprite = null;
    }
  }

  tick(): void {
    this.x += this.vx * FIXED_DT_SEC;
    this.graphic?.setPosition(this.x, this.y);
    this.gameSprite?.setPosition(this.x, this.y);
  }

  getHitbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.w / 2,
      this.y - this.h / 2,
      this.w,
      this.h,
    );
  }

  destroy(): void {
    this.graphic?.destroy();
    this.gameSprite?.destroy();
  }
}
