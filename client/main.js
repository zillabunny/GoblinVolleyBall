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

  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    // Send local input to server every frame
    if (net.status === 'playing') {
      net.sendInput(game.getInputKeys());
    }
    game.tickInput();

    // Apply latest authoritative state from server
    if (net.latestState) {
      game.applyServerState(net.latestState);
      net.latestState = null;
    }

    renderer.draw(ctx, game.state);

    // Show network banner when not yet in a match, or when disrupted
    const showBanner = (net.status !== 'playing') ? net.status : null;
    ui.draw(ctx, game.state, showBanner);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
}
