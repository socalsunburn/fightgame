import Phaser from 'phaser';
import { CHARACTERS, CharacterData } from '../data/characters';

const PLAYER_COLORS     = [0x4488ff, 0xff4444];
const PLAYER_COLORS_HEX = ['#4488ff', '#ff4444'];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super('CharacterSelectScene'); }

  private charKeys: string[] = [];
  private selections: [number, number] = [0, 0];
  private locked: [boolean, boolean] = [false, false];

  private charRects: Phaser.GameObjects.Rectangle[] = [];
  private charPortraits: (Phaser.GameObjects.Image | null)[] = [];
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private statTexts: Phaser.GameObjects.Text[] = [];
  private lockTexts: Phaser.GameObjects.Text[] = [];

  create(): void {
    this.charKeys      = Object.keys(CHARACTERS);
    this.selections    = [0, 1];
    this.locked        = [false, false];
    this.charRects     = [];
    this.charPortraits = [];
    this.nameTexts     = [];
    this.statTexts     = [];
    this.lockTexts     = [];

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0d0d1f');

    this.add.text(width / 2, 44, 'SELECT YOUR FIGHTER', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // center divider
    this.add.rectangle(width / 2, height / 2, 2, height, 0x2a2a44);

    for (let p = 0; p < 2; p++) {
      const cx = p === 0 ? width * 0.25 : width * 0.75;

      this.add.text(cx, 100, `P${p + 1}`, {
        fontSize: '32px', color: PLAYER_COLORS_HEX[p], fontFamily: 'monospace',
      }).setOrigin(0.5);

      // left/right arrows
      this.add.text(cx - 90, 300, '◄', {
        fontSize: '22px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.add.text(cx + 90, 300, '►', {
        fontSize: '22px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(0.5);

      // character preview — portrait image if available, otherwise colored rectangle
      const rect = this.add.rectangle(cx, 300, 80, 120, PLAYER_COLORS[p]);
      this.charRects.push(rect);

      const portrait = this.add.image(cx, 300, '').setScale(2.0).setVisible(false);
      this.charPortraits.push(portrait);

      const nameText = this.add.text(cx, 390, '', {
        fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.nameTexts.push(nameText);

      const statText = this.add.text(cx, 425, '', {
        fontSize: '14px', color: '#888899', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5);
      this.statTexts.push(statText);

      const browseKey = p === 0 ? 'A / D' : '◄ / ►';
      const lockKey   = p === 0 ? 'F' : 'L';
      this.add.text(cx, 500, `${browseKey}  to browse`, {
        fontSize: '13px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.add.text(cx, 520, `${lockKey}  to lock in`, {
        fontSize: '13px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const lockText = this.add.text(cx, 580, '', {
        fontSize: '24px', color: PLAYER_COLORS_HEX[p], fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.lockTexts.push(lockText);
    }

    this.add.text(width / 2, height - 24, 'ESC — back to menu', {
      fontSize: '12px', color: '#333355', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.handleKey(e.code));

    this.updatePanels();
  }

  private handleKey(code: string): void {
    if (code === 'Escape') { this.scene.start('MenuScene'); return; }

    if (!this.locked[0]) {
      if (code === 'KeyA') { this.cycle(0, -1); return; }
      if (code === 'KeyD') { this.cycle(0,  1); return; }
      if (code === 'KeyF') { this.lockIn(0);    return; }
    }
    if (!this.locked[1]) {
      if (code === 'ArrowLeft')  { this.cycle(1, -1); return; }
      if (code === 'ArrowRight') { this.cycle(1,  1); return; }
      if (code === 'KeyL')       { this.lockIn(1);    return; }
    }
  }

  private cycle(player: number, dir: number): void {
    const n = this.charKeys.length;
    this.selections[player] = (this.selections[player] + dir + n) % n;
    this.updatePanels();
  }

  private lockIn(player: number): void {
    this.locked[player] = true;
    this.lockTexts[player].setText('READY!');
    this.charRects[player].setAlpha(0.55);

    if (this.locked[0] && this.locked[1]) {
      this.time.delayedCall(500, () => {
        this.scene.start('BattleScene', {
          p1: this.charKeys[this.selections[0]],
          p2: this.charKeys[this.selections[1]],
        });
      });
    }
  }

  private updatePanels(): void {
    for (let p = 0; p < 2; p++) {
      const key  = this.charKeys[this.selections[p]];
      const char = CHARACTERS[key];

      this.nameTexts[p].setText(char.name.toUpperCase());
      this.statTexts[p].setText(this.statLine(char));

      if (char.spriteKey && this.textures.exists(`${key}-portrait`)) {
        this.charRects[p].setVisible(false);
        this.charPortraits[p]!.setTexture(`${key}-portrait`).setVisible(true);
      } else {
        this.charPortraits[p]!.setVisible(false);
        this.charRects[p].setSize(char.width * 2, char.height * 2).setVisible(true);
      }
    }
  }

  private statLine(char: CharacterData): string {
    const weight = char.weight >= 100 ? 'Heavy' : char.weight >= 90 ? 'Medium' : 'Light';
    const speed  = char.runSpeed >= 350 ? 'Fast' : char.runSpeed >= 280 ? 'Medium' : 'Slow';
    return `${weight}  ·  ${speed}`;
  }
}
