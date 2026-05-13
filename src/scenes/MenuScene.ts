import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 80, 'FIGHT GAME', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height / 2 + 20, 'PRESS ANY KEY OR BUTTON TO START', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80, 'P1: WASD + F/G  |  P2: ARROWS + L/K', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 105, 'Gamepads supported  |  SHIELD: H / J  |  DOWN = fast fall', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown', () => this.scene.start('StageSelectScene'));

    // Gamepad start
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
