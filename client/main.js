import { Game }          from './game.js';
import { Renderer }      from './renderer.js';
import { UI }            from './ui.js';
import { NetworkClient } from './network.js';

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
    renderer.draw(ctx, game.state);
    ui.draw(ctx, game.state);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
}

// ─── Online mode (vs Player) ─────────────────────────────────────────────────
function startOnline() {
  game.onlineMode = true;

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

  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);  // keep rAF dt for render timing
    last = ts;

    // 1. Predict local player with FIXED dt (same as server) — keeps positions in sync
    if (net.status === 'playing' && net.playerIndex !== null) {
      game.predictLocalPlayer(PHYSICS_DT, net.playerIndex);
      maybeSendInput();
    }
    game.tickInput();

    // 2. Apply server snapshot: ball, opponent, score, phase.
    //    Reconciles any drift in local player position toward server ground truth.
    if (net.latestState && net.playerIndex !== null) {
      game.applyServerStateOnline(net.latestState, net.playerIndex);
      net.latestState = null;
    }

    renderer.draw(ctx, game.state);
    const showBanner = (net.status !== 'playing') ? net.status : null;
    ui.draw(ctx, game.state, showBanner);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
}
