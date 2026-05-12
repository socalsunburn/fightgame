export const enum FighterState {
  IDLE         = 'IDLE',
  RUN          = 'RUN',
  JUMP         = 'JUMP',
  DOUBLE_JUMP  = 'DOUBLE_JUMP',
  FALL         = 'FALL',
  ATTACK         = 'ATTACK',        // jab (ground, neutral)
  CHARGING       = 'CHARGING',      // holding attack on ground — charge accumulates
  CHARGED_ATTACK = 'CHARGED_ATTACK',// released charge — scaled damage/knockback
  UP_TILT        = 'UP_TILT',       // up + attack on ground
  DOWN_TILT      = 'DOWN_TILT',     // down + attack on ground
  AIR_ATTACK     = 'AIR_ATTACK',    // attack while airborne
  SPECIAL        = 'SPECIAL',
  COUNTER        = 'COUNTER',       // counter-stance; reflects the next hit received
  HITSTUN      = 'HITSTUN',
  SHIELD       = 'SHIELD',
  DEAD         = 'DEAD',
  RESPAWN      = 'RESPAWN',
}
