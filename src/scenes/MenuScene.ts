import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload(): void {
    this.load.image('menu-bg', 'sprites/menu-bg.png');
  }

  create(): void {
    const { width, height } = this.scale;

    // Background art — shows if the image loaded, otherwise stays black
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

    this.add.text(width / 2, height - 44, 'P1: WASD + F/G   |   P2: ARROWS + L/K   |   SHIELD: H / J', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(width / 2, height - 24, 'Gamepads supported   |   DOWN = fast fall', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

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
