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
  shape?: 'rect' | 'circle' | 'diamond';
  spriteKey?: string;
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
  private readonly visual: Phaser.GameObjects.Graphics | Phaser.GameObjects.Sprite;

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
      const sprite = scene.add.sprite(data.x, data.y, `${animKey}-0`);
      sprite.setDepth(3);
      sprite.play(animKey);
      this.visual = sprite;
    } else {
      const g = scene.add.graphics();
      g.setDepth(3);
      this.drawShape(g, data.shape ?? 'rect', data.color, data.w, data.h);
      g.setPosition(data.x, data.y);
      this.visual = g;
    }
  }

  private drawShape(
    g: Phaser.GameObjects.Graphics,
    shape: 'rect' | 'circle' | 'diamond',
    color: number,
    w: number,
    h: number,
  ): void {
    g.fillStyle(color, 1);
    if (shape === 'circle') {
      g.fillCircle(0, 0, w / 2);
    } else if (shape === 'diamond') {
      const rx = w / 2;
      const ry = h / 2;
      g.fillTriangle(-rx, 0, 0, -ry, rx, 0);
      g.fillTriangle(-rx, 0, 0,  ry, rx, 0);
    } else {
      g.fillRect(-w / 2, -h / 2, w, h);
    }
  }

  tick(): void {
    this.x += this.vx * FIXED_DT_SEC;
    this.visual.setPosition(this.x, this.y);
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
    this.visual.destroy();
  }
}
