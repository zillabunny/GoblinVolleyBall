export const CANVAS_W      = 800;
export const CANVAS_H      = 450;
export const GRAVITY       = 1200;
export const JUMP_FORCE    = -600;
export const PLAYER_SPEED  = 300;
export const BALL_RADIUS   = 16;
export const PLAYER_W      = 40;
export const PLAYER_H      = 60;
export const NET_X         = 400;
export const NET_W         = 8;
export const NET_HEIGHT    = 150;
export const FLOOR_Y       = 400;
export const HIT_RADIUS    = 60;
export const HIT_POWER     = 700;
export const BOUNCE_DAMP   = 0.75;
export const RESTITUTION   = 0.85;
export const HIT_MIN_DIST  = 8;

export function physicsStep(state, dt) {
  stepBall(state.ball, dt);
}

export function stepBall(b, dt) {
  b.vy += GRAVITY * dt;
  b.x  += b.vx * dt;
  b.y  += b.vy * dt;

  // Floor
  if (b.y + BALL_RADIUS >= FLOOR_Y) {
    b.y  = FLOOR_Y - BALL_RADIUS;
    b.vy = -Math.abs(b.vy) * BOUNCE_DAMP;
  }
  // Ceiling
  if (b.y - BALL_RADIUS <= 0) {
    b.y  = BALL_RADIUS;
    b.vy = Math.abs(b.vy) * RESTITUTION;
  }
  // Left wall
  if (b.x - BALL_RADIUS <= 0) {
    b.x  = BALL_RADIUS;
    b.vx = Math.abs(b.vx) * RESTITUTION;
  }
  // Right wall
  if (b.x + BALL_RADIUS >= CANVAS_W) {
    b.x  = CANVAS_W - BALL_RADIUS;
    b.vx = -Math.abs(b.vx) * RESTITUTION;
  }
  // Net — with sub-step correction
  applyNetCollision(b);
}

function applyNetCollision(b) {
  const netLeft  = NET_X - NET_W / 2;
  const netRight = NET_X + NET_W / 2;
  const netTop   = FLOOR_Y - NET_HEIGHT;
  // Only apply if ball is within the net's vertical span
  if (b.y + BALL_RADIUS < netTop) return;

  if (b.x + BALL_RADIUS > netLeft && b.x - BALL_RADIUS < netRight) {
    // Push out of net and reverse horizontal velocity
    if (b.vx > 0) {
      b.x  = netLeft - BALL_RADIUS;
    } else {
      b.x  = netRight + BALL_RADIUS;
    }
    b.vx = -b.vx * RESTITUTION;
  }
}
