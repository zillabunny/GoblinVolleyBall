import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepBall, physicsStep, GRAVITY, FLOOR_Y, BALL_RADIUS, CANVAS_W, CANVAS_H,
         RESTITUTION, BOUNCE_DAMP, NET_X, NET_W, NET_HEIGHT, HIT_RADIUS, HIT_POWER,
         HIT_MIN_DIST, PLAYER_W, PLAYER_H, PLAYER_SPEED }
  from '../client/physics.js';
import { checkWin, tryHit } from '../client/game.js';

test('gravity integration: vy increases by GRAVITY*dt after one step', () => {
  const b = { x: 400, y: 200, vx: 0, vy: 0 };
  const dt = 1 / 60;
  stepBall(b, dt);
  // vy should be approximately GRAVITY * dt (~20)
  assert.ok(b.vy > 0, 'vy should be positive (falling)');
  assert.ok(Math.abs(b.vy - GRAVITY * dt) < 1, `vy should be ~${GRAVITY * dt}, got ${b.vy}`);
});

test('floor bounce: ball at floor bounces upward with BOUNCE_DAMP', () => {
  const b = { x: 400, y: FLOOR_Y - BALL_RADIUS - 1, vx: 0, vy: 300 };
  stepBall(b, 1 / 60);
  assert.ok(b.vy < 0, 'vy should be negative after floor bounce');
  assert.ok(b.y <= FLOOR_Y - BALL_RADIUS, 'ball should be at or above floor boundary');
});

test('wall bounce left: ball at left wall bounces rightward', () => {
  const b = { x: BALL_RADIUS + 1, y: 200, vx: -200, vy: 0 };
  stepBall(b, 1 / 60);
  assert.ok(b.vx > 0, 'vx should be positive after left wall bounce');
});

test('wall bounce right: ball at right wall bounces leftward', () => {
  const b = { x: CANVAS_W - BALL_RADIUS - 1, y: 200, vx: 200, vy: 0 };
  stepBall(b, 1 / 60);
  assert.ok(b.vx < 0, 'vx should be negative after right wall bounce');
});

test('ceiling bounce: ball at ceiling bounces down with RESTITUTION, not full energy', () => {
  const initialVy = -300;
  const b = { x: 400, y: BALL_RADIUS + 1, vx: 0, vy: initialVy };
  stepBall(b, 1 / 60);
  assert.ok(b.vy > 0, 'vy should be positive after ceiling bounce (moving down)');
  assert.ok(b.vy < 300, 'vy should be less than 300 (energy lost via RESTITUTION)');
});

test('net collision: ball approaching net from left bounces back', () => {
  // Ball approaching net from left side, below net top
  const b = { x: NET_X - BALL_RADIUS - 1, y: FLOOR_Y - 50, vx: 200, vy: 0 };
  stepBall(b, 1 / 60);
  assert.ok(b.vx < 0, 'vx should be negative after bouncing off net from left');
});

test('frame-rate independence: single large step vs multiple small steps give close results', () => {
  const startX = 400;
  const startY = 200;
  const startVx = 100;
  const startVy = 0;

  // Ball A: one step with dt=1/20
  const ballA = { x: startX, y: startY, vx: startVx, vy: startVy };
  stepBall(ballA, 1 / 20);

  // Ball B: three steps with dt=1/60
  const ballB = { x: startX, y: startY, vx: startVx, vy: startVy };
  stepBall(ballB, 1 / 60);
  stepBall(ballB, 1 / 60);
  stepBall(ballB, 1 / 60);

  const dx = Math.abs(ballA.x - ballB.x);
  const dy = Math.abs(ballA.y - ballB.y);
  assert.ok(dx < 5, `x positions differ by ${dx}px, expected < 5px`);
  assert.ok(dy < 5, `y positions differ by ${dy}px, expected < 5px`);
});

// checkWin tests
test('checkWin: 11-0 returns 0', () => {
  assert.equal(checkWin([11, 0]), 0);
});

test('checkWin: 11-9 returns 0', () => {
  assert.equal(checkWin([11, 9]), 0);
});

test('checkWin: 10-10 returns -1 (no winner)', () => {
  assert.equal(checkWin([10, 10]), -1);
});

test('checkWin: 11-10 returns -1 (not win by 2)', () => {
  assert.equal(checkWin([11, 10]), -1);
});

test('checkWin: 13-11 returns 0', () => {
  assert.equal(checkWin([13, 11]), 0);
});

test('checkWin: 11-13 returns 1 (player 2 wins)', () => {
  assert.equal(checkWin([11, 13]), 1);
});

// tryHit touch-count rule tests
function makeState(overrides = {}) {
  return {
    phase: 'playing',
    score: [0, 0],
    touchSeq: 0,
    touchCount: 0,
    lastTouchPlayerIdx: -1,
    ballSide: 0,
    servePlayerIdx: 0,
    phaseTimer: 0,
    winner: -1,
    _lastServeSeq: -1,
    ...overrides,
  };
}

function makePlayer(x, y) {
  return { x, y, vx: 0, vy: 0, onGround: true, facing: 1, lastTouchSeq: -1 };
}

function makeHitInput() {
  return { hitPressed: true, left: false, right: false, jump: false, tick() {} };
}

function makeNoHitInput() {
  return { hitPressed: false, left: false, right: false, jump: false, tick() {} };
}

test('tryHit: same player cannot hit twice in a row', () => {
  const state = makeState();
  // Place player 0 at left side, ball just above player center
  const player = makePlayer(80, FLOOR_Y - PLAYER_H);
  const ball = { x: player.x + PLAYER_W / 2, y: player.y + PLAYER_H / 2 - 20, vx: 0, vy: 0 };
  const input = makeHitInput();

  tryHit(player, 0, input, ball, state);
  const seqAfterFirst = state.touchSeq;
  assert.equal(seqAfterFirst, 1, 'first hit should register');

  // Try to hit again with same player
  tryHit(player, 0, input, ball, state);
  assert.equal(state.touchSeq, 1, 'second consecutive hit by same player should be rejected');
});

test('tryHit: 4th touch on same side is rejected', () => {
  const state = makeState({ touchCount: 3, ballSide: 0, lastTouchPlayerIdx: 1 });
  // Player 0 on left side (ballSide 0), touchCount already at 3
  const player = makePlayer(80, FLOOR_Y - PLAYER_H);
  const ball = { x: player.x + PLAYER_W / 2, y: player.y + PLAYER_H / 2 - 20, vx: 0, vy: 0 };
  const input = makeHitInput();

  tryHit(player, 0, input, ball, state);
  assert.equal(state.touchSeq, 0, '4th touch on same side should be rejected');
});

test('tryHit: touchCount resets when ball crosses to other side', () => {
  const state = makeState({ touchCount: 2, ballSide: 0, lastTouchPlayerIdx: 1 });
  // Player 0 hits ball that is on right side (ballSide 1), different from state.ballSide 0
  const player = makePlayer(380, FLOOR_Y - PLAYER_H);
  // Ball is on right side of net (x > NET_X)
  const ball = { x: NET_X + 30, y: player.y + PLAYER_H / 2 - 20, vx: 0, vy: 0 };
  const input = makeHitInput();

  tryHit(player, 0, input, ball, state);
  assert.equal(state.touchSeq, 1, 'hit should register');
  assert.equal(state.touchCount, 1, 'touchCount should reset to 1 when ball crosses to other side');
  assert.equal(state.ballSide, 1, 'ballSide should update to new side');
});
