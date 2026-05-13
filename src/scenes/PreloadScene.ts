import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

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

    // Menu background (shared across menu, stage select, char select)
    this.load.image('menu-bg', 'sprites/menu-bg.png');

    // Music tracks — silently ignored if files are missing
    this.load.on('loaderror', () => {}); // suppress missing-file errors
    this.load.audio('music-menu',  'music/menu.ogg');
    this.load.audio('music-lobby', 'music/lobby.ogg');
    this.load.audio('music-battle1', 'music/battle1.ogg');
    this.load.audio('music-battle2', 'music/battle2.ogg');
    this.load.audio('music-battle3', 'music/battle3.ogg');
    this.load.audio('music-battle4', 'music/battle4.ogg');

    // Load stage background images
    for (const stage of STAGES) {
      if (stage.backgroundImage) {
        this.load.image(stage.backgroundImage, `sprites/backgrounds/${stage.key}.png`);
      }
    }

    // Load sprites for every character that has a spriteKey
    for (const [charKey, data] of Object.entries(CHARACTERS)) {
      if (data.spriteKey && data.spriteAnims) {
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
      }

      // Load projectile sprites — works for any character, sprite or not
      const projDef = data.moves.special.projectile;
      if (projDef?.spriteKey && projDef.spriteFrames) {
        for (const dir of ['east', 'west']) {
          for (let i = 0; i < projDef.spriteFrames; i++) {
            const frameNum = String(i).padStart(3, '0');
            this.load.image(
              `${projDef.spriteKey}-${dir}-${i}`,
              `sprites/${charKey}/fireball/${dir}/frame_${frameNum}.png`,
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
