export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StageData {
  key: string;
  name: string;
  backgroundColor: string;
  platformColor: number;
  platforms: PlatformDef[];
  backgroundImage?: string;
}

export const STAGES: StageData[] = [
  {
    key: 'void',
    name: 'THE VOID',
    backgroundColor: '#1a1a2e',
    platformColor: 0x445566,
    backgroundImage: 'bg-void',
    platforms: [
      { x: 100, y: 520, w: 1080, h: 24 },
      { x: 160, y: 380, w: 260,  h: 16 },
      { x: 860, y: 380, w: 260,  h: 16 },
      { x: 510, y: 280, w: 260,  h: 16 },
    ],
  },
  {
    key: 'sky',
    name: 'SKY TEMPLE',
    backgroundColor: '#0d1f3c',
    platformColor: 0x5588bb,
    backgroundImage: 'bg-sky',
    platforms: [
      { x: 200, y: 540, w: 880, h: 20 },
      { x: 80,  y: 400, w: 240, h: 16 },
      { x: 960, y: 400, w: 240, h: 16 },
      { x: 360, y: 310, w: 200, h: 16 },
      { x: 720, y: 310, w: 200, h: 16 },
    ],
  },
  {
    key: 'ember',
    name: 'EMBER FORGE',
    backgroundColor: '#1a0800',
    platformColor: 0x885533,
    backgroundImage: 'bg-ember',
    platforms: [
      { x: 50,  y: 520, w: 1180, h: 24 },
      { x: 100, y: 240, w: 200,  h: 16 },
      { x: 980, y: 240, w: 200,  h: 16 },
      { x: 490, y: 340, w: 300,  h: 16 },
    ],
  },
  {
    key: 'ruins',
    name: 'ANCIENT RUINS',
    backgroundColor: '#0d1a0d',
    platformColor: 0x557744,
    backgroundImage: 'bg-ruins',
    platforms: [
      { x: 80,  y: 520, w: 460, h: 24 },
      { x: 740, y: 520, w: 460, h: 24 },
      { x: 200, y: 390, w: 220, h: 16 },
      { x: 530, y: 310, w: 220, h: 16 },
      { x: 860, y: 390, w: 220, h: 16 },
    ],
  },
];
