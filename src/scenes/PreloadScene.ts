import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  preload(): void {
    const { width, height } = this.scale;

    // Simple loading bar
    const bar = this.add.rectangle(width / 2, height / 2, 0, 12, 0x4488ff);
    this.add.rectangle(width / 2, height / 2, 320, 16).setStrokeStyle(2, 0x444466);
    this.add.text(width / 2, height / 2 - 30, 'Loading...', {
      fontSize: '18px', color: '#888899', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => bar.setSize(300 * v, 12));

    // Load sprites for every character that has a spriteKey
    for (const [charKey, data] of Object.entries(CHARACTERS)) {
      if (!data.spriteKey || !data.spriteAnims) continue;
      const base = `sprites/${data.spriteKey}`;

      this.load.image(`${charKey}-portrait`, `${base}/portrait.png`);

      for (const anim of data.spriteAnims) {
        for (const dir of ['east', 'west']) {
          for (let i = 0; i < anim.frames; i++) {
            const frameNum = String(i).padStart(3, '0');
            this.load.image(
              `${charKey}-${anim.name}-${dir}-${i}`,
              `${base}/${anim.name}/${dir}/frame_${frameNum}.png`,
            );
          }
        }
      }

      // Load projectile sprites if defined
      const projDef = data.moves.special.projectile;
      if (projDef?.spriteKey && projDef.spriteFrames) {
        for (const dir of ['east', 'west']) {
          for (let i = 0; i < projDef.spriteFrames; i++) {
            const frameNum = String(i).padStart(3, '0');
            this.load.image(
              `${projDef.spriteKey}-${dir}-${i}`,
              `${base}/fireball/${dir}/frame_${frameNum}.png`,
            );
          }
        }
      }
    }
  }

  create(): void {
    this.registerAnimations();
    this.scene.start('MenuScene');
  }

  private registerAnimations(): void {
    for (const [charKey, data] of Object.entries(CHARACTERS)) {
      if (!data.spriteKey || !data.spriteAnims) continue;

      for (const anim of data.spriteAnims) {
        for (const dir of ['east', 'west']) {
          const key = `${charKey}-${anim.name}-${dir}`;
          if (this.anims.exists(key)) continue;
          this.anims.create({
            key,
            frames: Array.from({ length: anim.frames }, (_, i) => ({
              key: `${charKey}-${anim.name}-${dir}-${i}`,
            })),
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          });
        }
      }

      // Register projectile animation if defined
      const projDef = data.moves.special.projectile;
      if (projDef?.spriteKey && projDef.spriteFrames) {
        for (const dir of ['east', 'west']) {
          const key = `${projDef.spriteKey}-${dir}`;
          if (this.anims.exists(key)) continue;
          this.anims.create({
            key,
            frames: Array.from({ length: projDef.spriteFrames }, (_, i) => ({
              key: `${projDef.spriteKey}-${dir}-${i}`,
            })),
            frameRate: projDef.spriteFrameRate ?? 12,
            repeat: -1,
          });
        }
      }
    }
  }
}
