import { physicsStep, stepPlayer, FLOOR_Y, PLAYER_H, PLAYER_W, BALL_RADIUS,
         HIT_RADIUS, HIT_MIN_DIST, HIT_POWER, NET_X, PLAYER_SPEED, JUMP_FORCE } from './physics.js';
import { InputState } from './input.js';
import { AIController } from './ai.js';

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

function resetPositions(state) {
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

export class Game {
  constructor() {
    this._state = {
      phase: 'serving',
      score: [0, 0],
      touchSeq: 0,
      touchCount: 0,
      lastTouchPlayerIdx: -1,
      ballSide: 0,
      servePlayerIdx: 0,
      phaseTimer: 0,
      winner: -1,
      _lastServeSeq: 0,
      ball: { x: 200, y: 200, vx: 0, vy: 0 },
      players: [
        { x: 80,  y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing:  1, lastTouchSeq: -1 },
        { x: 680, y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: -1, lastTouchSeq: -1 },
      ],
    };
    this._input = new InputState();
    this._input.bind();
    this._ai = new AIController();
    this.onlineMode = false;

    window.addEventListener('keydown', e => {
      if (e.code === 'KeyR' && this._state.phase === 'game_over' && !this.onlineMode) this.reset();
    });
  }

  get state() {
    return this._state;
  }

  // Returns raw boolean keys for the current frame (used by online mode to send to server)
  getInputKeys() {
    return {
      left:  this._input.left,
      right: this._input.right,
      jump:  this._input.jump,
      hit:   this._input.hit,
    };
  }

  // Advance one-shot input flags without running a full update (online mode)
  tickInput() {
    this._input.tick();
  }

  // Replace local state with authoritative server snapshot
  applyServerState(serverState) {
    Object.assign(this._state, serverState);
  }

  reset() {
    this._state.score         = [0, 0];
    this._state.winner        = -1;
    this._state.servePlayerIdx = 0;
    this._state.touchSeq      = 0;
    this._state._lastServeSeq = -1;
    resetPositions(this._state);
  }

  bindTouch(canvas) {
    this._input.bindTouch(canvas);
  }

  update(dt) {
    const state = this._state;

    // 1. Get AI input for player 2
    const p2Input = this._ai.update(dt, state.players[1], state.ball, state);

    // 2. Apply human input to player 1, AI input to player 2
    applyInput(state.players[0], this._input);
    applyInput(state.players[1], p2Input);

    // 3. Phase-specific logic
    if (state.phase === 'playing') {
      physicsStep(state, dt);
      // Try hit for both players
      tryHit(state.players[0], 0, this._input, state.ball, state);
      tryHit(state.players[1], 1, p2Input, state.ball, state);
      // Score check
      if (state.ball.y + BALL_RADIUS >= FLOOR_Y) {
        const scorer = state.ball.x < NET_X ? 1 : 0;
        state.score[scorer]++;
        const w = checkWin(state.score);
        if (w >= 0) {
          state.phase  = 'game_over';
          state.winner = w;
        } else {
          state.phase      = 'point_scored';
          state.phaseTimer = 1.5;
          state.servePlayerIdx = scorer;
        }
      }
    } else if (state.phase === 'serving') {
      // Hold ball above serve player's head; step players but not ball
      state.players.forEach((p, i) => stepPlayer(p, dt, i === 0));
      const sp = state.players[state.servePlayerIdx];
      const sideSign = state.servePlayerIdx === 0 ? 1 : -1;
      state.ball.x = sp.x + PLAYER_W / 2 + 30 * sideSign;
      state.ball.y = sp.y - BALL_RADIUS - 5;
      state.ball.vx = 0; state.ball.vy = 0;
      tryHit(state.players[0], 0, this._input, state.ball, state);
      tryHit(state.players[1], 1, p2Input, state.ball, state);
      if (state.touchSeq > state._lastServeSeq) {
        state._lastServeSeq = state.touchSeq;
        state.phase = 'playing';
      }
    } else if (state.phase === 'point_scored') {
      state.phaseTimer -= dt;
      if (state.phaseTimer <= 0) resetPositions(state);
    }
    // game_over: do nothing, wait for R key

    // 4. Consume input one-shot
    this._input.tick();
  }
}
