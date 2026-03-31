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

export function stepPlayer(p, dt, isLeftPlayer) {
  p.vy += GRAVITY * dt;
  p.x  += p.vx * dt;
  p.y  += p.vy * dt;

  // Floor
  if (p.y + PLAYER_H >= FLOOR_Y) {
    p.y = FLOOR_Y - PLAYER_H;
    p.vy = 0;
    p.onGround = true;
  }
  // Ceiling
  if (p.y < 0) { p.y = 0; p.vy = 0; }

  // Net barrier — applies regardless of altitude (can't cross net at any height)
  if (isLeftPlayer) {
    const maxX = NET_X - NET_W / 2 - PLAYER_W;
    if (p.x > maxX) { p.x = maxX; p.vx = Math.min(p.vx, 0); }
    if (p.x < 0)    { p.x = 0;    p.vx = Math.max(p.vx, 0); }
  } else {
    const minX = NET_X + NET_W / 2;
    if (p.x < minX)                { p.x = minX;              p.vx = Math.max(p.vx, 0); }
    if (p.x + PLAYER_W > CANVAS_W) { p.x = CANVAS_W - PLAYER_W; p.vx = Math.min(p.vx, 0); }
  }
}

export function physicsStep(state, dt) {
  state.players.forEach((p, i) => stepPlayer(p, dt, i === 0));
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
