import Phaser from 'phaser';
import { MusicManager } from '../audio/MusicManager';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    const { width, height } = this.scale;

    MusicManager.play(this, 'music-menu');

    // Background art
    if (this.textures.exists('menu-bg')) {
      this.add.image(width / 2, height / 2, 'menu-bg').setDisplaySize(width, height).setDepth(0);
    }

    // Title is part of the background art — no text title needed

    const startText = this.add.text(width / 2, height * 0.72, 'PRESS ANY KEY OR BUTTON TO START', {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);

    const creditStyle = {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    };
    this.add.text(width / 2, height - 52, 'Created by Peter Gentile', creditStyle).setOrigin(0.5).setDepth(2);
    this.add.text(width / 2, height - 34, 'Crash-N-Burn Games',       creditStyle).setOrigin(0.5).setDepth(2);
    this.add.text(width / 2, height - 16, 'Copyright 2026',           creditStyle).setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown', () => this.scene.start('StageSelectScene'));

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        for (const gp of navigator.getGamepads()) {
          if (gp && gp.buttons.some(b => b.pressed)) {
            this.scene.start('StageSelectScene');
          }
        }
      },
    });
  }
}
