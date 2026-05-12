import Phaser from 'phaser';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }

  create(data: { winner: number }): void {
    const { width, height } = this.scale;
    const colors = ['#4488ff', '#ff4444'];
    const names  = ['P1', 'P2'];

    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(width / 2, height / 2 - 80, `${names[data.winner]} WINS!`, {
      fontSize: '72px',
      color: colors[data.winner],
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const rematch = this.add.text(width / 2, height / 2 + 40, 'REMATCH — PRESS ANY KEY', {
      fontSize: '22px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80, 'MENU — PRESS ESCAPE', {
      fontSize: '16px',
      color: '#555555',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({ targets: rematch, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('CharacterSelectScene');
      }
    });
  }
}
