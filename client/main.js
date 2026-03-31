import { Game }         from './game.js';
import { Renderer }     from './renderer.js';
import { UI }           from './ui.js';

const BASE_W = 800, BASE_H = 450;
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
let   _scale = 1;  // CSS scale factor — needed by touch code in Phase 5

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

export function getCSSScale() { return _scale; }  // used by input.js in Phase 5

const game     = new Game();
const renderer = new Renderer();
const ui       = new UI();

let last = 0;
function loop(ts) {
  const dt = Math.min((ts - last) / 1000, 0.05); // cap at 50ms prevents spiral-of-death
  last = ts;
  game.update(dt);
  renderer.draw(ctx, game.state);
  ui.draw(ctx, game.state);
  requestAnimationFrame(loop);
}
requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
