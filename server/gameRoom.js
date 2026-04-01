// server/gameRoom.js — authoritative game room: 60Hz physics, 60Hz snapshots
import { physicsStep, checkWin, resetPositions, FLOOR_Y, BALL_RADIUS, NET_X, PLAYER_H } from './physics.js';

const TICK_HZ     = 60;
const SNAPSHOT_HZ = 60;
const TICK_MS     = 1000 / TICK_HZ;

function defaultInput() {
  return { left: false, right: false, jump: false, hit: false, hitPressed: false };
}

function initialState() {
  return {
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
}

export class GameRoom {
  constructor(roomId, ws0, ws1) {
    this.id      = roomId;
    this.players = [ws0, ws1];
    this.state   = initialState();

    this._inputs        = [defaultInput(), defaultInput()];
    this._prevHit       = [false, false];
    this._paused        = false;
    this._disconnectedAt = [null, null];
    this._reconnectTimer = null;
    this._snapshotTick  = 0;
    this._seq           = 0;

    // Send match_found then game_start to both players
    for (let i = 0; i < 2; i++) {
      this._send(i, { type: 'match_found', payload: { roomId: this.id, playerIndex: i } });
      this._send(i, { type: 'game_start',  payload: { state: this.state, playerIndex: i, roomId: this.id } });
    }

    this._tickInterval = setInterval(() => {
      if (this._paused) return;
      const dt = TICK_MS / 1000;
      physicsStep(this.state, dt, this._inputs);
      this._checkScoring();
      // Clear one-shot flags so a held Space key doesn't re-fire every tick
      this._inputs[0].hitPressed = false;
      this._inputs[1].hitPressed = false;
      this._snapshotTick++;
      if (this._snapshotTick % (TICK_HZ / SNAPSHOT_HZ) === 0) {
        this._broadcast({
          type: 'state_snapshot',
          payload: { seq: ++this._seq, ts: Date.now(), state: this.state },
        });
      }
    }, TICK_MS);
  }

  // Reconstruct hitPressed from delta, store input for next tick
  onInput(playerIdx, keys) {
    const hitPressed           = keys.hit && !this._prevHit[playerIdx];
    this._prevHit[playerIdx]   = keys.hit;
    this._inputs[playerIdx]    = { ...keys, hitPressed };
  }

  _checkScoring() {
    if (this.state.phase !== 'playing') return;
    if (this.state.ball.y + BALL_RADIUS >= FLOOR_Y) {
      const scorer = this.state.ball.x < NET_X ? 1 : 0;
      this.state.score[scorer]++;
      const w = checkWin(this.state.score);
      if (w >= 0) {
        this.state.phase  = 'game_over';
        this.state.winner = w;
        this._broadcast({ type: 'game_over', payload: { winner: w, score: this.state.score } });
      } else {
        this.state.phase         = 'point_scored';
        this.state.phaseTimer    = 1.5;
        this.state.servePlayerIdx = scorer;
      }
    }
  }

  onDisconnect(playerIdx) {
    this._disconnectedAt[playerIdx] = Date.now();
    this._paused = true;
    this._broadcastExcept(playerIdx, { type: 'opponent_disconnected', payload: { reconnectWindow: 30 } });
    this._reconnectTimer = setTimeout(() => {
      if (this._disconnectedAt[playerIdx] !== null) {
        // Still disconnected — opponent wins
        const winner = 1 - playerIdx;
        this._broadcast({ type: 'game_over', payload: { winner, score: this.state.score } });
        this.close();
      }
    }, 30_000);
  }

  onReconnect(playerIdx, ws) {
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer          = null;
    this._disconnectedAt[playerIdx] = null;
    this._paused                  = false;
    this.players[playerIdx]       = ws;
    this._send(playerIdx, {
      type: 'game_start',
      payload: { state: this.state, playerIndex: playerIdx, roomId: this.id },
    });
  }

  _send(playerIdx, msg) {
    const ws = this.players[playerIdx];
    if (ws && ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(msg));
    }
  }

  _broadcast(msg) {
    const str = JSON.stringify(msg);
    for (const ws of this.players) {
      if (ws && ws.readyState === 1) ws.send(str);
    }
  }

  _broadcastExcept(idx, msg) {
    const str = JSON.stringify(msg);
    for (let i = 0; i < this.players.length; i++) {
      if (i === idx) continue;
      const ws = this.players[i];
      if (ws && ws.readyState === 1) ws.send(str);
    }
  }

  close() {
    clearInterval(this._tickInterval);
    clearTimeout(this._reconnectTimer);
    for (const ws of this.players) {
      if (ws && ws.readyState === 1) ws.close();
    }
  }
}
