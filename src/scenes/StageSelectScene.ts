import Phaser from 'phaser';
import { STAGES, StageData } from '../data/stages';
import { MusicManager } from '../audio/MusicManager';

const CARD_W    = 260;
const CARD_H    = 200;
const PREVIEW_W = 240;
const PREVIEW_H = 135;
const SCALE     = PREVIEW_W / 1280;


export class StageSelectScene extends Phaser.Scene {
  private selected: number = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private selectionBorder!: Phaser.GameObjects.Rectangle;

  constructor() { super('StageSelectScene'); }

  create(): void {
    const { width, height } = this.scale;
    this.selected = 0;
    this.cards = [];

    MusicManager.play(this, 'music-menu');

    this.cameras.main.setBackgroundColor('#0d0d1f');

    if (this.textures.exists('menu-bg')) {
      this.add.image(width / 2, height / 2, 'menu-bg').setDisplaySize(width, height).setDepth(-2);
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.70).setDepth(-1);
    }

    this.add.text(width / 2, 44, 'SELECT STAGE', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const totalW  = STAGES.length * CARD_W + (STAGES.length - 1) * 20;
    const startX  = (width - totalW) / 2 + CARD_W / 2;
    const centerY = height / 2 + 20;

    // Selection highlight — drawn before cards so it sits behind
    this.selectionBorder = this.add.rectangle(startX, centerY, CARD_W + 8, CARD_H + 8)
      .setStrokeStyle(3, 0xffffff).setFillStyle(0xffffff, 0.06);

    for (let i = 0; i < STAGES.length; i++) {
      const cx = startX + i * (CARD_W + 20);
      const card = this.buildCard(STAGES[i], cx, centerY);
      this.cards.push(card);
    }

    this.add.text(width / 2, height - 144, 'ARROW KEYS or A / D  to browse    ENTER or SPACE to confirm', {
      fontSize: '13px', color: '#ffd700', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 124, 'ESC — back to menu', {
      fontSize: '12px', color: '#44ccff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.handleKey(e.code));
    this.updateSelection();
  }

  private buildCard(stage: StageData, cx: number, cy: number): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy);

    // Card background
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x111122);
    container.add(bg);

    // Preview background — real image if loaded, otherwise solid color + decorations
    const previewBg = this.add.rectangle(0, -16, PREVIEW_W, PREVIEW_H, Phaser.Display.Color.HexStringToColor(stage.backgroundColor).color);
    container.add(previewBg);

    if (stage.backgroundImage && this.textures.exists(stage.backgroundImage)) {
      const thumb = this.add.image(0, -16, stage.backgroundImage)
        .setDisplaySize(PREVIEW_W, PREVIEW_H);
      container.add(thumb);
    } else {
      container.add(this.buildDecoGraphics(stage.key, 0, -16));
    }

    // Mini platforms
    const platG = this.add.graphics();
    platG.fillStyle(stage.platformColor, 1);
    for (const p of stage.platforms) {
      const px = (p.x + p.w / 2) * SCALE - PREVIEW_W / 2;
      const py = (p.y) * SCALE - PREVIEW_H / 2 - 16 + (PREVIEW_H - 720 * SCALE) / 2;
      platG.fillRect(px, py, p.w * SCALE, Math.max(3, p.h * SCALE));
    }
    container.add(platG);

    // Stage name
    const label = this.add.text(0, CARD_H / 2 - 22, stage.name, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    container.add(label);

    return container;
  }

  private buildDecoGraphics(key: string, offsetX: number, offsetY: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.setPosition(offsetX, offsetY);

    switch (key) {
      case 'void':
        g.fillStyle(0xffffff, 0.5);
        for (const [sx, sy] of [[-90,-56],[70,-40],[-30,-30],[100,-46],[-60,-62],[30,-52]]) {
          g.fillRect(sx, sy, 2, 2);
        }
        g.fillStyle(0xaaaacc, 0.4);
        g.fillCircle(95, -54, 10);
        g.fillStyle(0x111122, 1);
        g.fillCircle(99, -54, 8);
        break;

      case 'sky':
        g.fillStyle(0xaaccff, 0.18);
        g.fillEllipse(-60, -46, 80, 28);
        g.fillEllipse(60,  -40, 70, 22);
        g.fillStyle(0xffffaa, 0.35);
        g.fillCircle(95, -50, 14);
        break;

      case 'ember':
        g.fillStyle(0x330800, 0.8);
        g.fillTriangle(-90, 60, -60, 10, -30, 60);
        g.fillTriangle(50,  60,  85,  5, 120, 60);
        g.fillStyle(0xff4400, 0.12);
        g.fillRect(-PREVIEW_W / 2, 47, PREVIEW_W, 20);
        g.fillStyle(0xff6600, 0.5);
        for (const [ex, ey] of [[-80,18],[60,8],[-20,28],[100,13],[-110,4]]) {
          g.fillRect(ex, ey, 3, 3);
        }
        break;

      case 'ruins':
        g.fillStyle(0x334433, 0.7);
        g.fillRect(-100, 20, 14, 40);
        g.fillRect(-103, 15, 20, 8);
        g.fillRect(80,   30, 14, 30);
        g.fillRect(77,   25, 20, 8);
        g.fillStyle(0x88aa88, 0.25);
        g.fillCircle(0, -50, 18);
        break;
    }
    return g;
  }

  private handleKey(code: string): void {
    if (code === 'Escape') { this.scene.start('MenuScene'); return; }

    if (code === 'ArrowLeft' || code === 'KeyA') {
      this.selected = (this.selected - 1 + STAGES.length) % STAGES.length;
      this.updateSelection();
    } else if (code === 'ArrowRight' || code === 'KeyD') {
      this.selected = (this.selected + 1) % STAGES.length;
      this.updateSelection();
    } else if (code === 'Enter' || code === 'Space' || code === 'KeyF' || code === 'KeyL') {
      this.scene.start('CharacterSelectScene', { stageKey: STAGES[this.selected].key });
    }
  }

  private updateSelection(): void {
    const card = this.cards[this.selected];
    this.selectionBorder.setPosition(card.x, card.y);
  }
}
