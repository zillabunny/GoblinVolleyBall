import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepBall, physicsStep, GRAVITY, FLOOR_Y, BALL_RADIUS, CANVAS_W, CANVAS_H,
         RESTITUTION, BOUNCE_DAMP, NET_X, NET_W, NET_HEIGHT, HIT_RADIUS, HIT_POWER,
         HIT_MIN_DIST, PLAYER_W, PLAYER_H, PLAYER_SPEED }
  from '../client/physics.js';

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
