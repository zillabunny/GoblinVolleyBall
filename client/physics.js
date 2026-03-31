export const CANVAS_W      = 800;
export const CANVAS_H      = 450;
export const GRAVITY       = 900;   // reduced for bigger arcs and more hang time
export const JUMP_FORCE    = -650;  // stronger jump to reach high balls
export const PLAYER_SPEED  = 300;
export const BALL_RADIUS   = 16;
export const PLAYER_W      = 40;
export const PLAYER_H      = 60;
export const NET_X         = 400;
export const NET_W         = 8;
export const NET_HEIGHT    = 150;
export const FLOOR_Y       = 400;
export const HIT_RADIUS    = 60;
export const HIT_POWER     = 750;   // slightly more punch
export const BOUNCE_DAMP   = 0.60;  // floor kills more energy — keeps ball in play
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
  applyPlayerBallCollision(state.ball, state.players);
}

function applyPlayerBallCollision(b, players) {
  for (const p of players) {
    // Find closest point on player AABB to ball center
    const nearX = Math.max(p.x, Math.min(b.x, p.x + PLAYER_W));
    const nearY = Math.max(p.y, Math.min(b.y, p.y + PLAYER_H));
    const dx = b.x - nearX;
    const dy = b.y - nearY;
    const dist = Math.hypot(dx, dy);
    if (dist >= BALL_RADIUS) continue;

    // Push ball out along collision normal
    if (dist < 0.001) {
      // Ball center is inside rect — push straight up
      b.y = p.y - BALL_RADIUS;
      b.vy = -Math.abs(b.vy) * RESTITUTION;
      continue;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    b.x += nx * (BALL_RADIUS - dist);
    b.y += ny * (BALL_RADIUS - dist);
    // Reflect velocity along normal (only if approaching)
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) {
      b.vx -= 2 * dot * nx * RESTITUTION;
      b.vy -= 2 * dot * ny * RESTITUTION;
      const forwardSign = p.x < NET_X ? 1 : -1;
      // Head/top bounce: always bounce forward toward net
      if (ny < -0.5) {
        if (b.vx * forwardSign < 250) {
          b.vx = forwardSign * 250;
        }
      }
      // Front-face top-half hit (blocking): pop ball upward so it clears the net
      const isFrontFace = nx * forwardSign > 0.3;
      const isTopHalf   = nearY < p.y + PLAYER_H * 0.55;
      if (isFrontFace && isTopHalf) {
        b.vy = Math.min(b.vy, -200);
      }
    }
  }
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
