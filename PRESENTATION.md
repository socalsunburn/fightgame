# Fight Game — Build Presentation

This document traces how the game was built stage by stage using Claude Code as an AI pair-programming assistant. Each stage describes what was added, why, and what key decisions were made.

---

## Stage 1 — Project Setup

**What:** Scaffolded a Phaser 3 + Vite + TypeScript project.

**Why those tools:**
- **Phaser 3** is a mature 2D game framework that handles rendering, input, and scene management
- **Vite** is a fast build tool — the game reloads in the browser instantly after any code change
- **TypeScript** adds type checking on top of JavaScript, catching mistakes like missing fields or wrong argument types before the game even runs

**Key decision:** Use TypeScript over plain JavaScript. The extra setup cost pays off as the project grows — if you add a field to a character definition, TypeScript immediately tells you every place in the code that needs updating.

---

## Stage 2 — Physics & Fixed Timestep

**What:** Built a `Fighter` class with position, velocity, gravity, jumping, and platform collision.

**Key decision:** Use a **fixed timestep** (1/60th of a second per simulation step) instead of variable delta time.

Most games use variable delta time — they calculate how much time passed since the last frame and scale movement by that amount. This is simpler, but means the game can behave slightly differently depending on frame rate.

A fixed timestep runs the simulation in exact 1/60s chunks regardless of frame rate. If the frame takes longer than expected, the simulation catches up by running multiple ticks. This makes the game **deterministic** — the same inputs always produce the same result. This is a prerequisite for rollback netcode (online multiplayer).

```typescript
// BattleScene.ts — the accumulator loop
while (this.accumulator >= FIXED_DT) {
  this.simulateTick([p1, p2]);
  this.accumulator -= FIXED_DT;
}
```

**Also built:** `saveState()` and `restoreState()` on Fighter — a complete serialisable snapshot of all mutable state. This is the other prerequisite for rollback netcode (you need to be able to rewind time).

---

## Stage 3 — State Machine

**What:** Replaced simple boolean flags with a proper state machine using a `FighterState` enum.

**Why:** A fighter can only be doing one thing at a time — running, jumping, attacking, in hitstun, etc. A state machine makes the rules explicit: you can't double-jump while shielding, you can't attack while in hitstun, and so on. Each state owns its own logic inside a `switch` statement in `Fighter.tick()`.

**States added:** IDLE, RUN, JUMP, DOUBLE_JUMP, FALL, ATTACK, HITSTUN, SHIELD, DEAD, RESPAWN

---

## Stage 4 — Combat System

**What:** Hit detection, knockback physics, and the damage percentage system.

**Key decision:** Use Smash Bros-style **damage percentage** instead of a health bar.

In a traditional health bar game, you die when HP reaches zero. In this system, damage % is unbounded — it starts at 0% and increases with every hit. Higher % means the next hit sends you flying further. You only die by flying past the blast zone edges.

This creates a different kind of tension: even at high damage you're not dead yet, but one strong hit can end it. Players at 150% are constantly on the edge.

**Data-driven hitboxes:** All hit data (size, damage, knockback angle, knockback force) is defined as data in `characters.ts`, not hardcoded in logic. This means tuning a character's punch is a one-line change.

---

## Stage 5 — Input System

**What:** `InputHandler` class supporting keyboard for two players simultaneously, plus gamepads.

**Key decision:** Separate **held** state from **edge-triggered** state.

Some inputs need to fire once per button press (`jumpPressed`, `attackPressed`) while others need to fire every frame while held (`left`, `right`, `shield`). Mixing these up causes common bugs like holding jump and double-jumping immediately every time. The handler tracks both sets separately and the `flush()` call clears edge triggers each tick.

---

## Stage 6 — Stage & HUD

**What:** Four platforms (main ground + three floating), blast zones, and a HUD showing damage % and stocks.

**Stage design:** The platform layout is a classic Smash-style arrangement — wide main ground, two side platforms, one top platform.

**HUD detail:** Damage text changes colour at 50% (yellow) and 100% (orange) to give players a visual warning that they're in danger territory.

---

## Stage 7 — Scene Flow

**What:** Three scenes connected in sequence — Menu → Battle → Results.

Each Phaser scene is a self-contained game mode. Passing data between scenes (like the winner index) uses Phaser's scene data system.

**Bug fixed during iteration:** After adding a `matchOver` flag to stop the game loop when the match ends, restarting the game left `matchOver = true` from the previous match. The fix was resetting it in `create()`, which Phaser calls each time a scene starts. This is an example of a subtle **scene lifecycle bug** — the constructor runs once, but `create()` runs every restart.

---

## Stage 8 — Directional Attacks

**What:** Added up-tilt, down-tilt, and air attack as separate moves triggered by directional input + attack.

**How:** The attack input is now routed based on context:
- In the air → air attack (forward-low angle, good for chasing)
- Ground + up → up-tilt (launches straight up, combo starter)
- Ground + down → down-tilt (low poke, pops opponent up)
- Ground + neutral → jab (or charged jab)

This transforms the game from two moves per character to five distinct options, each with a different strategic purpose.

---

## Stage 9 — KO Feedback

**What:** A "KO!" text animation and screen flash when a fighter is blasted off-stage.

**Why this matters:** Before this, losing a stock was invisible — the character just respawned. Players had no idea what happened. Visual feedback makes the match readable.

**Implementation detail:** The match-ending KO uses a 1-second delay before transitioning to the Results scene, allowing the animation to play out. The game loop is stopped immediately via `matchOver = true` so inputs don't keep processing during the delay.

---

## Stage 10 — Character Select

**What:** A new scene between Menu and Battle where each player independently browses and locks in their character.

**Why now:** Before this, P1 was always Brawler and P2 was always Swift — hardcoded. Adding selection required:
1. A new `CharacterSelectScene`
2. Passing the selected character keys as data into `BattleScene`
3. Decoupling the fighter's display color from the character data (P1 is always blue, P2 is always red, regardless of character chosen)

**Architecture insight:** Because character data was already in a data-driven dictionary (`CHARACTERS`), adding this screen required almost no changes to the combat code — only the scene wiring.

---

## Stage 11 — Four New Characters

**What:** Added Phantom, Volt, Crusher, and Mirror — each with a mechanically distinct special move.

| Character | Archetype | What makes them unique |
|---|---|---|
| Phantom | Glass Cannon | Lightest character, hits hard, dies early |
| Volt | Zoner | Special fires a projectile that travels across the stage |
| Crusher | Grappler | Special is a close-range grab with fixed knockback regardless of % |
| Mirror | Counter | Special absorbs the next hit and reflects it back at 2× force |

**New systems required:**
- **Projectile class** (`Projectile.ts`) — tracks position, velocity, owner; checked for collisions each tick in BattleScene
- **COUNTER state** — `receiveHit()` checks if the fighter is in counter stance; if so, it stores the incoming hit as `pendingCounterHit` instead of applying damage. BattleScene reads this after the tick and applies a reflected hit to the attacker.

---

## Stage 12 — Charged Jab

**What:** Hold the attack button on the ground to charge a jab. Release to fire. The longer the hold (up to 1 second), the more damage and knockback.

**How it works:**
1. Pressing attack on the ground now enters a `CHARGING` state instead of immediately attacking
2. Each tick, `chargeFrames` increments — the character visually grows and brightens
3. Releasing the button (or reaching 60 frames / max charge) transitions to `CHARGED_ATTACK`
4. `getActiveHitboxes()` scales the damage and knockback based on `chargeFrames / MAX_CHARGE`:
   - Full charge: **2.5× damage**, **3× base knockback**

**Input system change required:** Added `attackReleased` (edge trigger, true for one frame when the button is lifted) to `PlayerInput` — the same approach used for `jumpPressed` and `attackPressed`.

---

## Stage 13 — Player Indicators (Shared Sprites)

**What:** Changed how the game shows which player controls which character.

**The problem:** The game has 6 characters and 2 players. Both players can pick any of the 6. The old approach tinted the entire character blue (P1) or red (P2) based on who picked them. That meant a red samurai would turn blue if P1 chose him — the character loses its identity.

**The decision:** Use a single set of sprites per character (6 total, not 12), and instead show a small colored down-arrow + "P1" / "P2" label floating above each character's head. This is the same system Super Smash Bros uses — every character looks like themselves, and you track your fighter by the colored tag above them.

**Why this is the better design:**

1. **Fewer assets** — 6 sprite sets instead of 12. Every new character added in the future only needs one design, not two color variants.
2. **Character identity is preserved** — A blue ice mage stays blue whether P1 or P2 picks her. The character design means something.
3. **Scales to more players** — If you ever added a 3rd or 4th player, you'd just add more indicator colors. With the tinting approach you'd need a new color variant per character per player.

**How it works in code:** The `Fighter` class draws a small downward-pointing triangle in the player's color (blue or red) directly above the character's head each frame. The player label ("P1" / "P2") sits above that. This is purely visual — it has no effect on game logic.

---

## What's Next

- Sprite graphics to replace the coloured rectangles
- Sound effects (hits, jumps, KO)
- Online multiplayer (the fixed timestep and saveState/restoreState make this possible)

---

*Built iteratively with [Claude Code](https://claude.ai/code) as an AI pair-programming assistant.*
