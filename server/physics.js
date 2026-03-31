// server/physics.js — mirrors client/physics.js verbatim; kept in sync manually.
// Also includes applyInput, tryHit, checkWin, resetPositions from client/game.js.

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

// ---------------------------------------------------------------------------
// Copied from client/game.js — kept in sync manually
// ---------------------------------------------------------------------------

export function applyInput(player, input) {
  if (input.left)       { player.vx = -PLAYER_SPEED; player.facing = -1; }
  else if (input.right) { player.vx =  PLAYER_SPEED; player.facing =  1; }
  else                  { player.vx = 0; }

  if (input.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}

export function tryHit(player, playerIdx, input, ball, state) {
  if (!input.hitPressed) return;

  const pcx  = player.x + PLAYER_W / 2;
  const pcy  = player.y + PLAYER_H / 2;
  const dist = Math.hypot(ball.x - pcx, ball.y - pcy);

  if (dist > HIT_RADIUS)   return;
  if (dist < HIT_MIN_DIST) return;

  if (state.lastTouchPlayerIdx === playerIdx) return;
  const newBallSide = ball.x < NET_X ? 0 : 1;
  if (newBallSide === state.ballSide) {
    if (state.touchCount >= 3) return;
    state.touchCount++;
  } else {
    state.touchCount = 1;
    state.ballSide   = newBallSide;
  }
  state.lastTouchPlayerIdx = playerIdx;
  state.touchSeq++;

  const relX = ball.x - pcx;
  const relY = ball.y - pcy;
  const len  = Math.hypot(relX, relY);
  const forwardSign = playerIdx === 0 ? 1 : -1;
  ball.vx = (relX / len) * HIT_POWER;
  ball.vy = Math.min((relY / len) * HIT_POWER, -200);
  // Guarantee forward momentum — bumps and sets always travel toward the opponent
  const MIN_FORWARD = 250;
  if (ball.vx * forwardSign < MIN_FORWARD) {
    ball.vx = forwardSign * MIN_FORWARD;
  }
}

export function checkWin(score) {
  for (let i = 0; i < 2; i++) {
    if (score[i] >= 11 && score[i] - score[1 - i] >= 2) return i;
  }
  return -1;
}

export function resetPositions(state) {
  const sx = state.servePlayerIdx === 0 ? 200 : 600;
  state.ball = { x: sx, y: 200, vx: 0, vy: 0 };
  state.players[0] = { x: 80,  y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1,  lastTouchSeq: -1 };
  state.players[1] = { x: 680, y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: -1, lastTouchSeq: -1 };
  state.touchCount         = 0;
  state.lastTouchPlayerIdx = -1;
  state.ballSide           = state.servePlayerIdx;
  state._lastServeSeq      = state.touchSeq;
  state.phase              = 'serving';
}

// ---------------------------------------------------------------------------
// physicsStep — server entry point called by GameRoom each tick
// inputs: [{ left, right, jump, hit, hitPressed }, { ... }]
// ---------------------------------------------------------------------------
export function physicsStep(state, dt, inputs) {
  if (state.phase === 'playing') {
    applyInput(state.players[0], inputs[0]);
    applyInput(state.players[1], inputs[1]);
    stepPlayer(state.players[0], dt, true);
    stepPlayer(state.players[1], dt, false);
    stepBall(state.ball, dt);
    applyPlayerBallCollision(state.ball, state.players);
    tryHit(state.players[0], 0, inputs[0], state.ball, state);
    tryHit(state.players[1], 1, inputs[1], state.ball, state);
  } else if (state.phase === 'serving') {
    // Step players but hold ball above serve player's head
    applyInput(state.players[0], inputs[0]);
    applyInput(state.players[1], inputs[1]);
    stepPlayer(state.players[0], dt, true);
    stepPlayer(state.players[1], dt, false);
    const sp = state.players[state.servePlayerIdx];
    const sideSign = state.servePlayerIdx === 0 ? 1 : -1;
    state.ball.x = sp.x + PLAYER_W / 2 + 30 * sideSign;
    state.ball.y = sp.y - BALL_RADIUS - 5;
    state.ball.vx = 0;
    state.ball.vy = 0;
    tryHit(state.players[0], 0, inputs[0], state.ball, state);
    tryHit(state.players[1], 1, inputs[1], state.ball, state);
    if (state.touchSeq > state._lastServeSeq) {
      state._lastServeSeq = state.touchSeq;
      state.phase = 'playing';
    }
  } else if (state.phase === 'point_scored') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) resetPositions(state);
  }
  // game_over: physics frozen
}
