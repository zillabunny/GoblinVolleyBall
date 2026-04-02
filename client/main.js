import { Game }          from './game.js';
import { Renderer }      from './renderer.js';
import { UI }            from './ui.js';
import { NetworkClient } from './network.js';
import { sfxJump, sfxHit, sfxBounce, sfxNetHit, sfxScore, sfxGameOver, sfxServe } from './audio.js';

const BASE_W = 800, BASE_H = 450;
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
let   _scale = 1;

function resize() {
  const dpr   = window.devicePixelRatio || 1;
  _scale       = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
  canvas.width  = BASE_W * dpr * _scale;
  canvas.height = BASE_H * dpr * _scale;
  canvas.style.width  = BASE_W * _scale + 'px';
  canvas.style.height = BASE_H * _scale + 'px';
  ctx.setTransform(dpr * _scale, 0, 0, dpr * _scale, 0, 0);
}
window.addEventListener('resize', resize);
resize();

export function getCSSScale() { return _scale; }

const game     = new Game();
const renderer = new Renderer();
const ui       = new UI();

game.bindTouch(canvas);

// ─── Sound event detection (works for both offline and online) ──────────────
const _sfx = {
  prevPhase: 'serving',
  prevTouchSeq: 0,
  prevOnGround: [true, true],
  prevBallY: 0,
  prevBallVx: 0,
};

function detectSounds(state) {
  // Jump — either player leaves the ground
  for (let i = 0; i < 2; i++) {
    if (_sfx.prevOnGround[i] && !state.players[i].onGround) sfxJump();
    _sfx.prevOnGround[i] = state.players[i].onGround;
  }

  // Hit — touchSeq incremented (someone hit the ball)
  if (state.touchSeq > _sfx.prevTouchSeq) {
    if (_sfx.prevPhase === 'serving') {
      sfxServe();
    } else {
      sfxHit();
    }
    _sfx.prevTouchSeq = state.touchSeq;
  }

  // Ball bounce — ball touches floor (y near floor and was higher last frame)
  if (state.phase === 'playing') {
    const ballAtFloor = state.ball.y >= 384 - 2; // FLOOR_Y - BALL_RADIUS approx
    const wasHigher = _sfx.prevBallY < 384 - 10;
    if (ballAtFloor && wasHigher) sfxBounce();

    // Net hit — ball vx sign flipped (net collision reverses horizontal velocity)
    if (_sfx.prevBallVx !== 0 && Math.sign(state.ball.vx) !== Math.sign(_sfx.prevBallVx)
        && Math.abs(state.ball.x - 400) < 30) {
      sfxNetHit();
    }
  }
  _sfx.prevBallY = state.ball.y;
  _sfx.prevBallVx = state.ball.vx;

  // Phase transitions
  if (state.phase !== _sfx.prevPhase) {
    if (state.phase === 'point_scored') sfxScore();
    if (state.phase === 'game_over') sfxGameOver();
    _sfx.prevPhase = state.phase;
  }
}

// ─── Lobby ───────────────────────────────────────────────────────────────────
const lobby = document.getElementById('lobby');

document.getElementById('btn-ai').addEventListener('click', () => {
  lobby.style.display = 'none';
  startOffline();
});

document.getElementById('btn-online').addEventListener('click', () => {
  lobby.style.display = 'none';
  startOnline();
});

// ─── Offline mode (vs AI) ────────────────────────────────────────────────────
function startOffline() {
  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    game.update(dt);
    detectSounds(game.state);
    renderer.draw(ctx, game.state);
    ui.draw(ctx, game.state);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
}

// ─── Online mode (vs Player) ─────────────────────────────────────────────────
function returnToLobby() {
  lobby.style.display = '';
  game.onlineMode = false;
  ui._onlineMode = false;
  game.reset();
}

function startOnline() {
  game.onlineMode = true;
  ui._onlineMode = true;

  const net = new NetworkClient();
  net.connect();

  // Fixed physics dt matches the server tick rate exactly — prevents drift accumulation
  const PHYSICS_DT = 1 / 60;

  // Send input only on STATE CHANGE (not every frame) so we never hit the rate limit
  // and hitPressed arrives as a single clean edge rather than a flood of repeated frames.
  let _lastSent   = null;
  let _prevStatus = net.status;

  function maybeSendInput() {
    const keys = game.getInputKeys();
    const statusJustBecamePlaying = _prevStatus !== 'playing' && net.status === 'playing';
    const changed = !_lastSent ||
      keys.left  !== _lastSent.left  ||
      keys.right !== _lastSent.right ||
      keys.jump  !== _lastSent.jump  ||
      keys.hit   !== _lastSent.hit;
    if (changed || statusJustBecamePlaying) {
      net.sendInput(keys);
      _lastSent = { ...keys };
    }
    _prevStatus = net.status;
  }

  // Click to return to lobby after game over
  function onCanvasClick() {
    if (game.state.phase === 'game_over' && game.onlineMode) {
      canvas.removeEventListener('click', onCanvasClick);
      net.disconnect();
      returnToLobby();
    }
  }
  canvas.addEventListener('click', onCanvasClick);

  let last = 0;
  let accumulator = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    // 1. Fixed-timestep accumulator: step prediction at exactly server tick rate.
    //    Prevents over-prediction on high-refresh monitors and timing-jitter stutter.
    if (net.status === 'playing' && net.playerIndex !== null) {
      accumulator += dt;
      while (accumulator >= PHYSICS_DT - 0.001) {
        game.predictLocalPlayer(PHYSICS_DT, net.playerIndex);
        accumulator -= PHYSICS_DT;
      }
      maybeSendInput();
    }
    game.tickInput();

    // 2. Apply latest server snapshot for ball, opponent, score, phase.
    //    Local player position is trusted from prediction (no lerp reconciliation).
    if (net.latestState && net.playerIndex !== null) {
      game.applyServerStateOnline(net.latestState, net.playerIndex);
      net.latestState = null;
    }

    detectSounds(game.state);
    renderer.draw(ctx, game.state);
    const showBanner = (net.status !== 'playing') ? net.status : null;
    ui.draw(ctx, game.state, showBanner);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
}
