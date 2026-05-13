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

    // Dark overlay so text stays readable over any background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(1);

    // Title
    this.add.text(width / 2, height / 2 - 90, 'MINI BRAWL', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#ff6600',
      strokeThickness: 6,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5).setDepth(2);

    const startText = this.add.text(width / 2, height / 2 + 30, 'PRESS ANY KEY OR BUTTON TO START', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: '"Press Start 2P", monospace',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(width / 2, height / 2 + 90, 'P1: WASD + F/G  |  P2: ARROWS + L/K', {
      fontSize: '11px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(width / 2, height / 2 + 115, 'Gamepads supported  |  SHIELD: H / J  |  DOWN = fast fall', {
      fontSize: '11px',
      color: '#666666',
      fontFamily: 'monospace',
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
