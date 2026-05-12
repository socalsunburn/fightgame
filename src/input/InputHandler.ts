export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
  shield: boolean;
  // edge-triggered (true for one frame only)
  jumpPressed: boolean;
  attackPressed: boolean;
  attackReleased: boolean;
  specialPressed: boolean;
  shieldPressed: boolean;
}

const EMPTY_INPUT: PlayerInput = {
  left: false, right: false, up: false, down: false,
  jump: false, attack: false, special: false, shield: false,
  jumpPressed: false, attackPressed: false, attackReleased: false,
  specialPressed: false, shieldPressed: false,
};

interface KeyboardMap {
  left: string; right: string; up: string; down: string;
  jump: string; attack: string; special: string; shield: string;
}

const KB_P1: KeyboardMap = {
  left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
  jump: 'KeyW', attack: 'KeyF', special: 'KeyG', shield: 'KeyH',
};

const KB_P2: KeyboardMap = {
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
  jump: 'ArrowUp', attack: 'KeyL', special: 'KeyK', shield: 'KeyJ',
};

// Gamepad button indices (standard layout)
const GP_JUMP    = 0; // A / Cross
const GP_ATTACK  = 2; // X / Square
const GP_SPECIAL = 1; // B / Circle
const GP_SHIELD  = 4; // LB / L1

export class InputHandler {
  private held = new Set<string>();
  private justPressed = new Set<string>();
  private justReleased = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.held.has(e.code)) this.justPressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.held.delete(e.code);
      this.justReleased.add(e.code);
    });
  }

  /** Call once per frame AFTER reading inputs, to clear edge-triggered sets. */
  flush(): void {
    this.justPressed.clear();
    this.justReleased.clear();
  }

  getPlayer(playerIndex: 0 | 1): PlayerInput {
    const map = playerIndex === 0 ? KB_P1 : KB_P2;
    const gp = this.getGamepad(playerIndex);

    const left    = this.held.has(map.left)    || (gp?.axes[0] ?? 0) < -0.3;
    const right   = this.held.has(map.right)   || (gp?.axes[0] ?? 0) > 0.3;
    const up      = this.held.has(map.up)      || (gp?.axes[1] ?? 0) < -0.3;
    const down    = this.held.has(map.down)    || (gp?.axes[1] ?? 0) > 0.3;
    const jump    = this.held.has(map.jump)    || (gp ? this.gpHeld(gp, GP_JUMP)    : false);
    const attack  = this.held.has(map.attack)  || (gp ? this.gpHeld(gp, GP_ATTACK)  : false);
    const special = this.held.has(map.special) || (gp ? this.gpHeld(gp, GP_SPECIAL) : false);
    const shield  = this.held.has(map.shield)  || (gp ? this.gpHeld(gp, GP_SHIELD)  : false);

    return {
      left, right, up, down, jump, attack, special, shield,
      jumpPressed:     this.justPressed.has(map.jump)    || (gp ? this.gpJust(gp, GP_JUMP, playerIndex)        : false),
      attackPressed:   this.justPressed.has(map.attack)  || (gp ? this.gpJust(gp, GP_ATTACK, playerIndex)      : false),
      attackReleased:  this.justReleased.has(map.attack) || (gp ? this.gpJustReleased(gp, GP_ATTACK, playerIndex) : false),
      specialPressed:  this.justPressed.has(map.special) || (gp ? this.gpJust(gp, GP_SPECIAL, playerIndex)     : false),
      shieldPressed:   this.justPressed.has(map.shield)  || (gp ? this.gpJust(gp, GP_SHIELD, playerIndex)      : false),
    };
  }

  private getGamepad(index: number): Gamepad | null {
    return navigator.getGamepads?.()[index] ?? null;
  }

  private gpHeld(gp: Gamepad, btn: number): boolean {
    return (gp.buttons[btn]?.pressed) ?? false;
  }

  // Gamepad edge-detection: track previous button state per player per button
  private prevGpButtons: Record<number, Record<number, boolean>> = {};

  private gpJust(gp: Gamepad, btn: number, playerIndex: number): boolean {
    const prev = this.prevGpButtons[playerIndex]?.[btn] ?? false;
    return !prev && this.gpHeld(gp, btn);
  }

  private gpJustReleased(gp: Gamepad, btn: number, playerIndex: number): boolean {
    const prev = this.prevGpButtons[playerIndex]?.[btn] ?? false;
    return prev && !this.gpHeld(gp, btn);
  }

  /** Call once per frame to update gamepad edge state, BEFORE reading inputs. */
  updateGamepadState(): void {
    for (const playerIndex of [0, 1] as const) {
      const gp = this.getGamepad(playerIndex);
      if (!gp) continue;
      if (!this.prevGpButtons[playerIndex]) this.prevGpButtons[playerIndex] = {};
      for (let b = 0; b < gp.buttons.length; b++) {
        this.prevGpButtons[playerIndex][b] = gp.buttons[b]?.pressed ?? false;
      }
    }
  }
}

export { EMPTY_INPUT };
