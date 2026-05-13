export interface HitboxDef {
  /** offset from fighter center */
  x: number;
  y: number;
  w: number;
  h: number;
  /** frame on which the hitbox becomes active (0-indexed within the attack) */
  activeStart: number;
  activeEnd: number;
  damage: number;
  /** knockback angle in degrees (0 = right, 90 = up) */
  angle: number;
  baseKnockback: number;
  knockbackScaling: number;
}

export interface ProjectileDef {
  spawnFrame: number;
  speed: number;     // px/s, fired in facing direction
  w: number;
  h: number;
  damage: number;
  angle: number;
  baseKnockback: number;
  knockbackScaling: number;
  color?: number;          // shape color (defaults to player color)
  shape?: 'rect' | 'circle' | 'diamond';
  spriteKey?: string;      // if set, use animated sprite instead of shape
  spriteFrames?: number;
  spriteFrameRate?: number;
}

export interface MoveData {
  totalFrames: number;
  hitboxes: HitboxDef[];
  projectile?: ProjectileDef; // zoner: fires a projectile instead of a melee box
  isCounter?: boolean;        // counter character: entering this move starts counter stance
}

export interface SpriteAnimDef {
  name: string;
  frames: number;
  frameRate: number;
  repeat: number; // -1 = loop, 0 = play once
}

export interface CharacterData {
  name: string;
  /** display color (used when no sprite is available) */
  color: number;
  /** base key for sprite assets, e.g. 'brawler'. Undefined = use shape rendering. */
  spriteKey?: string;
  spriteAnims?: SpriteAnimDef[];
  /** if set, special move launches the fighter forward at this speed (px/s) */
  specialDashSpeed?: number;
  width: number;
  height: number;
  walkSpeed: number;
  runSpeed: number;
  jumpForce: number;
  doubleJumpForce: number;
  fallSpeed: number;     // max fall speed (terminal velocity)
  fastFallSpeed: number;
  weight: number;        // affects knockback received (higher = less knockback)
  moves: {
    jab: MoveData;
    upTilt: MoveData;
    downTilt: MoveData;
    airAttack: MoveData;
    special: MoveData;
  };
}

export const CHARACTERS: Record<string, CharacterData> = {
  brawler: {
    name: 'Brawler',
    color: 0x4488ff,
    spriteKey: 'brawler',
    spriteAnims: [
      { name: 'idle',    frames: 8, frameRate: 8,  repeat: -1 },
      { name: 'run',     frames: 6, frameRate: 12, repeat: -1 },
      { name: 'attack',  frames: 3, frameRate: 12, repeat:  0 },
      { name: 'jump',    frames: 8, frameRate: 10, repeat: -1 },
      { name: 'hitstun', frames: 6, frameRate: 12, repeat:  0 },
    ],
    width: 40,
    height: 60,
    walkSpeed: 180,
    runSpeed: 300,
    jumpForce: -580,
    doubleJumpForce: -520,
    fallSpeed: 600,
    fastFallSpeed: 900,
    weight: 100,
    specialDashSpeed: 620,
    moves: {
      jab: {
        totalFrames: 20,
        hitboxes: [
          {
            x: 35, y: 0, w: 40, h: 30,
            activeStart: 5, activeEnd: 9,
            damage: 6,
            angle: 45,
            baseKnockback: 30,
            knockbackScaling: 0.8,
          },
        ],
      },
      upTilt: {
        totalFrames: 24,
        hitboxes: [
          {
            x: 0, y: -55, w: 50, h: 40,
            activeStart: 6, activeEnd: 12,
            damage: 8,
            angle: 88,
            baseKnockback: 38,
            knockbackScaling: 0.9,
          },
        ],
      },
      downTilt: {
        totalFrames: 18,
        hitboxes: [
          {
            x: 25, y: 20, w: 55, h: 22,
            activeStart: 5, activeEnd: 9,
            damage: 5,
            angle: 72,
            baseKnockback: 22,
            knockbackScaling: 0.65,
          },
        ],
      },
      airAttack: {
        totalFrames: 26,
        hitboxes: [
          {
            x: 40, y: 5, w: 55, h: 40,
            activeStart: 4, activeEnd: 10,
            damage: 10,
            angle: 30,
            baseKnockback: 42,
            knockbackScaling: 1.0,
          },
        ],
      },
      special: {
        totalFrames: 35,
        hitboxes: [
          {
            x: 50, y: 0, w: 60, h: 40,
            activeStart: 10, activeEnd: 18,
            damage: 14,
            angle: 60,
            baseKnockback: 60,
            knockbackScaling: 1.2,
          },
        ],
      },
    },
  },

  swift: {
    name: 'Swift',
    color: 0xff4444,
    spriteKey: 'swift',
    spriteAnims: [
      { name: 'idle',    frames: 8, frameRate: 8,  repeat: -1 },
      { name: 'run',     frames: 6, frameRate: 14, repeat: -1 },
      { name: 'attack',  frames: 4, frameRate: 14, repeat:  0 },
      { name: 'special', frames: 7, frameRate: 14, repeat:  0 },
      { name: 'jump',    frames: 7, frameRate: 10, repeat: -1 },
      { name: 'hitstun', frames: 6, frameRate: 12, repeat:  0 },
    ],
    width: 36,
    height: 54,
    walkSpeed: 220,
    runSpeed: 380,
    jumpForce: -620,
    doubleJumpForce: -560,
    fallSpeed: 500,
    fastFallSpeed: 800,
    weight: 80,
    moves: {
      jab: {
        totalFrames: 14,
        hitboxes: [
          {
            x: 36, y: 16, w: 42, h: 22,
            activeStart: 3, activeEnd: 6,
            damage: 4,
            angle: 35,
            baseKnockback: 20,
            knockbackScaling: 0.6,
          },
        ],
      },
      upTilt: {
        totalFrames: 16,
        hitboxes: [
          {
            x: 0, y: -48, w: 38, h: 35,
            activeStart: 3, activeEnd: 7,
            damage: 5,
            angle: 90,
            baseKnockback: 28,
            knockbackScaling: 0.7,
          },
        ],
      },
      downTilt: {
        totalFrames: 14,
        hitboxes: [
          {
            x: 22, y: 18, w: 42, h: 18,
            activeStart: 3, activeEnd: 6,
            damage: 3,
            angle: 70,
            baseKnockback: 16,
            knockbackScaling: 0.5,
          },
        ],
      },
      airAttack: {
        totalFrames: 22,
        hitboxes: [
          {
            x: 32, y: -8, w: 46, h: 36,
            activeStart: 3, activeEnd: 9,
            damage: 8,
            angle: 28,
            baseKnockback: 34,
            knockbackScaling: 0.88,
          },
        ],
      },
      special: {
        totalFrames: 28,
        hitboxes: [
          {
            x: 0, y: -30, w: 44, h: 44,
            activeStart: 8, activeEnd: 16,
            damage: 10,
            angle: 80,
            baseKnockback: 50,
            knockbackScaling: 1.0,
          },
        ],
      },
    },
  },

  phantom: {
    name: 'Phantom',
    color: 0xaa44ff,
    spriteKey: 'phantom',
    spriteAnims: [
      { name: 'idle',    frames: 8, frameRate: 8,  repeat: -1 },
      { name: 'run',     frames: 6, frameRate: 14, repeat: -1 },
      { name: 'attack',  frames: 6, frameRate: 12, repeat:  0 },
      { name: 'jump',    frames: 9, frameRate: 10, repeat: -1 },
      { name: 'hitstun', frames: 6, frameRate: 12, repeat:  0 },
    ],
    width: 32,
    height: 50,
    walkSpeed: 250,
    runSpeed: 420,
    jumpForce: -680,
    doubleJumpForce: -620,
    fallSpeed: 460,
    fastFallSpeed: 780,
    weight: 62,
    moves: {
      jab:       { totalFrames: 12, hitboxes: [{ x: 28, y: -2, w: 36, h: 26, activeStart: 2, activeEnd: 5,  damage: 5,  angle: 40, baseKnockback: 25, knockbackScaling: 0.7  }] },
      upTilt:    { totalFrames: 14, hitboxes: [{ x:  0, y:-48, w: 38, h: 36, activeStart: 3, activeEnd: 7,  damage: 7,  angle: 88, baseKnockback: 34, knockbackScaling: 0.85 }] },
      downTilt:  { totalFrames: 12, hitboxes: [{ x: 22, y: 18, w: 40, h: 18, activeStart: 2, activeEnd: 5,  damage: 4,  angle: 75, baseKnockback: 20, knockbackScaling: 0.6  }] },
      airAttack: { totalFrames: 18, hitboxes: [{ x: 34, y: -5, w: 48, h: 34, activeStart: 3, activeEnd: 8,  damage: 8,  angle: 35, baseKnockback: 38, knockbackScaling: 0.9  }] },
      special: {
        totalFrames: 38,
        hitboxes: [],
        projectile: { spawnFrame: 12, speed: 480, w: 20, h: 20, damage: 13, angle: 5, baseKnockback: 52, knockbackScaling: 1.2, color: 0xaa44ff, shape: 'circle' },
      },
    },
  },

  volt: {
    name: 'Volt',
    color: 0x00ddcc,
    spriteKey: 'volt',
    spriteAnims: [
      { name: 'idle',    frames: 8, frameRate: 8,  repeat: -1 },
      { name: 'run',     frames: 6, frameRate: 12, repeat: -1 },
      { name: 'attack',  frames: 6, frameRate: 10, repeat:  0 },
      { name: 'jump',    frames: 9, frameRate: 10, repeat: -1 },
      { name: 'hitstun', frames: 6, frameRate: 12, repeat:  0 },
    ],
    width: 38,
    height: 56,
    walkSpeed: 200,
    runSpeed: 320,
    jumpForce: -590,
    doubleJumpForce: -530,
    fallSpeed: 530,
    fastFallSpeed: 830,
    weight: 92,
    moves: {
      jab:       { totalFrames: 18, hitboxes: [{ x: 30, y:  0, w: 38, h: 28, activeStart: 5, activeEnd: 9,  damage: 5, angle: 40, baseKnockback: 22, knockbackScaling: 0.65 }] },
      upTilt:    { totalFrames: 22, hitboxes: [{ x:  0, y:-50, w: 42, h: 38, activeStart: 6, activeEnd: 11, damage: 7, angle: 88, baseKnockback: 32, knockbackScaling: 0.85 }] },
      downTilt:  { totalFrames: 16, hitboxes: [{ x: 24, y: 20, w: 44, h: 20, activeStart: 4, activeEnd: 8,  damage: 4, angle: 68, baseKnockback: 18, knockbackScaling: 0.55 }] },
      airAttack: { totalFrames: 22, hitboxes: [{ x: 32, y: -6, w: 46, h: 34, activeStart: 4, activeEnd: 9,  damage: 7, angle: 30, baseKnockback: 32, knockbackScaling: 0.88 }] },
      special:   {
        totalFrames: 40,
        hitboxes: [],
        projectile: { spawnFrame: 15, speed: 520, w: 18, h: 18, damage: 9, angle: 0, baseKnockback: 42, knockbackScaling: 0.88, color: 0xffffff, shape: 'diamond' },
      },
    },
  },

  crusher: {
    name: 'Crusher',
    color: 0xff7700,
    spriteKey: 'crusher',
    spriteAnims: [
      { name: 'idle',    frames: 8, frameRate: 8,  repeat: -1 },
      { name: 'run',     frames: 6, frameRate: 10, repeat: -1 },
      { name: 'attack',  frames: 6, frameRate: 10, repeat:  0 },
      { name: 'jump',    frames: 9, frameRate: 10, repeat: -1 },
      { name: 'hitstun', frames: 6, frameRate: 12, repeat:  0 },
    ],
    width: 46,
    height: 66,
    walkSpeed: 150,
    runSpeed: 240,
    jumpForce: -520,
    doubleJumpForce: -460,
    fallSpeed: 700,
    fastFallSpeed: 1000,
    weight: 128,
    moves: {
      jab:       { totalFrames: 26, hitboxes: [{ x: 36, y:  0, w: 44, h: 34, activeStart: 8,  activeEnd: 14, damage: 8,  angle: 45, baseKnockback: 40, knockbackScaling: 0.7  }] },
      upTilt:    { totalFrames: 28, hitboxes: [{ x:  0, y:-58, w: 54, h: 44, activeStart: 8,  activeEnd: 15, damage: 10, angle: 88, baseKnockback: 48, knockbackScaling: 0.85 }] },
      downTilt:  { totalFrames: 22, hitboxes: [{ x: 28, y: 22, w: 58, h: 24, activeStart: 6,  activeEnd: 11, damage: 6,  angle: 68, baseKnockback: 28, knockbackScaling: 0.6  }] },
      airAttack: { totalFrames: 30, hitboxes: [{ x: 42, y:  6, w: 58, h: 44, activeStart: 6,  activeEnd: 13, damage: 12, angle: 35, baseKnockback: 50, knockbackScaling: 0.9  }] },
      // Grab: must be close, high base KB, low scaling — punishes regardless of damage %
      special:   { totalFrames: 28, hitboxes: [{ x: 22, y:  0, w: 28, h: 62, activeStart: 10, activeEnd: 18, damage: 12, angle: 50, baseKnockback: 85, knockbackScaling: 0.2  }] },
    },
  },

  mirror: {
    name: 'Mirror',
    color: 0xffdd00,
    width: 36,
    height: 58,
    walkSpeed: 190,
    runSpeed: 310,
    jumpForce: -600,
    doubleJumpForce: -540,
    fallSpeed: 540,
    fastFallSpeed: 850,
    weight: 90,
    moves: {
      jab:       { totalFrames: 16, hitboxes: [{ x: 30, y: -2, w: 36, h: 28, activeStart: 4, activeEnd: 8, damage: 5, angle: 42, baseKnockback: 26, knockbackScaling: 0.72 }] },
      upTilt:    { totalFrames: 18, hitboxes: [{ x:  0, y:-50, w: 40, h: 36, activeStart: 4, activeEnd: 9, damage: 6, angle: 86, baseKnockback: 30, knockbackScaling: 0.78 }] },
      downTilt:  { totalFrames: 14, hitboxes: [{ x: 22, y: 18, w: 42, h: 20, activeStart: 3, activeEnd: 7, damage: 3, angle: 70, baseKnockback: 17, knockbackScaling: 0.52 }] },
      airAttack: { totalFrames: 20, hitboxes: [{ x: 32, y: -6, w: 44, h: 34, activeStart: 3, activeEnd: 8, damage: 7, angle: 28, baseKnockback: 32, knockbackScaling: 0.86 }] },
      // Counter stance — isCounter flag routes special input to COUNTER state in Fighter
      special:   { totalFrames: 35, hitboxes: [], isCounter: true },
    },
  },
};
