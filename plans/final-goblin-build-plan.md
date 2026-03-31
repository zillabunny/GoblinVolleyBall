# Plan: Goblin Volleyball — Full Build

## Overview
Build a complete 2D side-view goblin volleyball game in Vanilla JS + HTML5 Canvas —
single-player first (Phases 1–5), multiplayer second (Phases 6–7), optional polish last (Phase 8).
No build step. No external libraries on the client. Open `client/index.html` directly in browser.
Requires Node.js ≥18 (native ES module support). Browser target: Chrome 61+, Firefox 67+, Safari 11+.

---

## Progress Tracker
| Phase | Status | Commit | Notes |
|-------|--------|--------|-------|
| 1 — Scaffold & Game Loop | ✅ Done | `5427a68` | 15 files, game loop running |
| 2 — Court & Ball Physics | ✅ Done | `49cb755` | 7/7 tests pass, ball bouncing |
| 3 — Player Movement & Input | ✅ Done | `91f7309` | keyboard input, net barrier, goblin sprites |
| 4 — Hit System & Scoring | ⬚ | | |
| 5 — AI Opponent & Mobile Controls | ⬚ | | |
| 6 — Multiplayer Server | ⬚ | | |
| 7 — Client Networking & Lobby | ⬚ | | |
| 8 — Polish & Deploy (optional) | ⬚ | | |

---

## Phase 1 — Scaffold & Game Loop

### Goal
Create all project files, a minimal `package.json`, a working 800×450 canvas with HiDPI
scaling, and a requestAnimationFrame game loop that calls `update(dt)` and `render()` each frame.

### Work Items
- [ ] Create minimal `package.json` with `"type": "module"` — no dependencies yet (ws added Phase 6)
- [ ] Create `client/index.html` — loads `main.js` as `<script type="module">`
- [ ] Create `client/main.js` — entry point: canvas setup, resize handler, game loop
- [ ] Create `client/game.js` — exports `Game` class with `update(dt)` and `state` getter (stub)
- [ ] Create `client/physics.js` — exports constants and `physicsStep(state, dt)` stub
- [ ] Create `client/renderer.js` — exports `Renderer` class with `draw(ctx, state)` stub
- [ ] Create `client/input.js` — exports `InputState` class with `bind()` stub
- [ ] Create `client/ai.js` — exports `AIController` class with `update()` stub
- [ ] Create `client/ui.js` — exports `UI` class with `draw(ctx, state)` stub
- [ ] Create `client/network.js` — exports `NetworkClient` class stub (Phase 7 only)
- [ ] Create `server/index.js`, `server/gameRoom.js`, `server/matchmaker.js`, `server/physics.js` — empty stubs with export markers
- [ ] Create `tests/physics.test.js` — empty test file
- [ ] Implement canvas HiDPI scaling and letterbox resize in `main.js`
- [ ] Implement requestAnimationFrame loop with dt calculation and 50ms cap
- [ ] Canvas renders a solid dark background — game loop confirmed running in browser

### Design & Constraints

**package.json (minimal):**
```json
{
  "name": "goblin-volleyball",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test tests/physics.test.js",
    "server": "node server/index.js"
  }
}
```
No `dependencies` yet. `ws` is added in Phase 6.

**Canvas setup and HiDPI scaling (main.js):**
```js
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
```

**Game loop (main.js):**
```js
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
```

**Physics pause rule (enforced in game.update):**
`physicsStep` is called ONLY when `state.phase === 'playing'`. During `'serving'`,
`'point_scored'`, and `'game_over'`, physics is frozen. This must be explicit in every
`game.update` implementation:
```js
update(dt) {
  this._handleInput(dt);
  if (this.state.phase === 'playing') {
    physicsStep(this.state, dt);
    this._checkScoring();
  } else {
    this._updatePhaseTimer(dt);
  }
}
```

**Module architecture:**
- `main.js` owns the loop, passes `dt` to `game.update(dt)`
- `game.js` owns all mutable state; calls `physicsStep` and reads `InputState`
- `renderer.js` is pure — reads state, draws, never mutates
- `ui.js` is pure — draws HUD, overlays; never mutates state
- `input.js` owns event listeners; exposes live `InputState` booleans
- `physics.js` is pure — exports constants and stateless `physicsStep`

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Goblin Volleyball</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#111; display:flex; justify-content:center; align-items:center;
           width:100vw; height:100vh; overflow:hidden; }
    canvas { display:block; image-rendering:pixelated; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

### Acceptance Criteria
- [ ] `client/index.html` opens in browser, shows a dark rectangle, no console errors
- [ ] Resizing the browser maintains 16:9 aspect ratio (letterboxed)
- [ ] On a HiDPI display (devicePixelRatio > 1) canvas is crisp, not blurry
- [ ] `game.update(dt)` and `renderer.draw(ctx, state)` are called each frame
- [ ] dt is capped at 50ms (verify with `console.log(dt)` and alt-tab away for 5s)

### Dependencies
None — this is the foundation.

---

## Phase 2 — Court & Ball Physics

### Goal
Define all physics constants, implement ball simulation (gravity, bouncing), and draw the
goblin-themed court.

### Work Items
- [ ] Define all constants in `physics.js` (see Design section)
- [ ] Add ball state to `GameState` in `game.js`
- [ ] Implement `physicsStep(state, dt)` — gravity + position integration for ball
- [ ] Implement ball↔floor bounce with BOUNCE_DAMP
- [ ] Implement ball↔left-wall and right-wall bounce with RESTITUTION
- [ ] Implement ball↔ceiling bounce with RESTITUTION (not full-energy, not zero)
- [ ] Implement ball↔net collision with sub-step correction to prevent tunneling
- [ ] Draw court background, floor, and torch sconces in `renderer.js`
- [ ] Draw bone net in `renderer.js`
- [ ] Draw ball in `renderer.js` (yellow-green circle)
- [ ] Wire `physicsStep` into `game.update` (only when `phase === 'playing'`)
- [ ] Write `tests/physics.test.js` unit tests for physicsStep

### Design & Constraints

**All physics constants (physics.js) — export individually:**
```js
export const CANVAS_W      = 800;   // px — game coordinate width
export const CANVAS_H      = 450;   // px — game coordinate height
export const GRAVITY       = 1200;  // px/s²
export const JUMP_FORCE    = -600;  // px/s (negative = up)
export const PLAYER_SPEED  = 300;   // px/s
export const BALL_RADIUS   = 16;    // px
export const PLAYER_W      = 40;    // px
export const PLAYER_H      = 60;    // px
export const NET_X         = 400;   // px — center of canvas
export const NET_W         = 8;     // px — total net width
export const NET_HEIGHT    = 150;   // px from floor
export const FLOOR_Y       = 400;   // px from top
export const HIT_RADIUS    = 60;    // px — proximity for hit
export const HIT_POWER     = 700;   // px/s — launch speed
export const BOUNCE_DAMP   = 0.75;  // floor energy retention
export const RESTITUTION   = 0.85;  // wall/net/ceiling energy retention
export const HIT_MIN_DIST  = 8;     // px — minimum distance to register a hit
```

**physicsStep(state, dt) — ball only (players handled separately in Phase 3):**
```js
export function physicsStep(state, dt) {
  stepBall(state.ball, dt);
}

// stepBall is a named export — server/physics.js calls it directly
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
```

**Net collision — sub-step to prevent tunneling:**
At HIT_POWER=700 px/s and dt=16ms, max ball travel = 11.2px per frame. NET_W=8px, so a fast
ball moving perpendicular to the net can technically tunnel through. Use a sub-step check:
```js
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
```
This pushes the ball out of the net rect rather than relying on exact crossing detection,
which handles both tunneling and normal collisions.

**Court rendering (renderer.js):**
- Background fill: `#1a0f0a`
- Floor: `#3d2b1f` rect from FLOOR_Y to 450, plus `#5a3e2b` 3px top border
- Net: `#d4c4a0` rect at (NET_X - NET_W/2, FLOOR_Y - NET_HEIGHT, NET_W, NET_HEIGHT)
- Torch bodies: `#5a3e2b` rect at x=30,y=60 and x=762,y=60, w=16, h=40
- Torch flame: `#ff6b1a` circle r=10 at x=38,y=58 and x=770,y=58; inner `#ffe066` r=5
- Torch glow: radial gradient from `rgba(255,107,26,0.25)` at r=0 → transparent at r=70

**Ball rendering (renderer.js):**
- Filled circle at (ball.x, ball.y), radius BALL_RADIUS, fill `#e8d44d`
- 2px stroke `#b8a030` for depth

**Test framework — Node.js built-in (no install required):**
```js
import { test } from 'node:test';
import assert  from 'node:assert/strict';
// Import all constants you need — this list grows as more phases add tests
import { stepBall, physicsStep, GRAVITY, FLOOR_Y, BALL_RADIUS, CANVAS_W, CANVAS_H,
         RESTITUTION, BOUNCE_DAMP, NET_X, NET_W, NET_HEIGHT, HIT_RADIUS, HIT_POWER,
         HIT_MIN_DIST, PLAYER_W, PLAYER_H, PLAYER_SPEED }
  from '../client/physics.js';
```
Run: `npm test` (which runs `node --test tests/physics.test.js`)

### Acceptance Criteria
- [ ] Browser shows: dark cave background, brown floor, bone net, two torches with glow
- [ ] Ball spawned at (400, 100) with vx=200, vy=0 arcs rightward under gravity and bounces
- [ ] Ball bounces off all four walls without escaping canvas
- [ ] Ball bounces back from net when approaching from either side
- [ ] Ball bouncing on ceiling loses energy (doesn't bounce to same height)
- [ ] **Frame-rate independence test (manual):** Ball released from (400,50) with no velocity.
  After 3 seconds, position must match within ±5px regardless of frame rate. Verify at 60fps
  and by artificially capping dt to simulate 20fps. `physicsStep` called once with dt=0.05 must
  produce the same result as 3 calls with dt=0.0167.
- [ ] `npm test` passes: gravity integration, floor bounce (vy reflects and attenuates),
  wall bounce (vx reflects), ceiling bounce (vy reflects with RESTITUTION, not full energy)

### Dependencies
Phase 1 must be complete.

---

## Phase 3 — Player Movement & Keyboard Input

### Goal
Add a goblin player on the left side, wire keyboard input (A/D/W/Space and arrow keys),
implement movement with arcade physics, and enforce court boundaries and net collision.

### Work Items
- [ ] Define player state shape in `game.js` (see Design)
- [ ] Implement player horizontal movement with PLAYER_SPEED and dt
- [ ] Implement player jump: JUMP_FORCE applied only when `onGround`
- [ ] Implement gravity on player and ground detection
- [ ] Implement player↔floor clamping
- [ ] Implement player boundary clamping (left player stays in left half)
- [ ] Implement net as hard barrier for players (horizontal clamping in air AND on ground)
- [ ] Wire `InputState` keyboard listeners in `input.js`
- [ ] Apply input to player in `game.update` before calling `physicsStep`
- [ ] Extend `physicsStep` to update player position/velocity (in addition to ball)
- [ ] Draw player in `renderer.js` — green rectangle with eyes

### Design & Constraints

**Player state shape (initial values for player 1):**
```js
{
  x: 80,                        // left edge
  y: FLOOR_Y - PLAYER_H,        // standing on floor
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,                    // 1=right, -1=left
  lastTouchSeq: -1              // used in Phase 4 for touch-count rule
}
```
Player 2 initial position: `{ x: 680, y: FLOOR_Y - PLAYER_H, ... }`

**Input application — define as a named exported function `applyInput(player, input)` in `game.js`.
This function is reused by Phase 5 (AI), Phase 6 (server), and Phase 7 (multiplayer). Exporting it
allows server/physics.js to import and call it with the same logic:**
```js
// game.js (or a shared helpers module imported by both game.js and server/physics.js)
export function applyInput(player, input) {
  if (input.left)       { player.vx = -PLAYER_SPEED; player.facing = -1; }
  else if (input.right) { player.vx =  PLAYER_SPEED; player.facing =  1; }
  else                  { player.vx = 0; }

  if (input.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}
```

**physicsStep extension — player integration (add to physicsStep per player in `state.players`):**
```js
function stepPlayer(p, dt, isLeftPlayer) {
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
    // Left player: x right-edge cannot exceed netLeft
    const maxX = NET_X - NET_W / 2 - PLAYER_W;
    if (p.x > maxX) { p.x = maxX; p.vx = Math.min(p.vx, 0); }
    if (p.x < 0)    { p.x = 0;    p.vx = Math.max(p.vx, 0); }
  } else {
    // Right player: x left-edge cannot go below netRight
    const minX = NET_X + NET_W / 2;
    if (p.x < minX)                 { p.x = minX;                     p.vx = Math.max(p.vx, 0); }
    if (p.x + PLAYER_W > CANVAS_W) { p.x = CANVAS_W - PLAYER_W; p.vx = Math.min(p.vx, 0); }
  }
}
```
The net barrier applies in the air as well. Goblins cannot jump over the net.

**InputState (input.js):**
```js
export class InputState {
  constructor() {
    this.left = false; this.right = false;
    this.jump = false; this.hit   = false;
    this._hitPrev        = false;  // for one-shot detection (used in Phase 4)
    this._hitJustPressed = false;  // explicit flag for touch events (Phase 5)
  }

  get hitPressed() {
    // True on the frame hit transitions false→true (keyboard edge) OR on touch press
    return (this.hit && !this._hitPrev) || this._hitJustPressed;
  }

  tick() {
    // MUST be called exactly once per frame, AFTER all reads of hitPressed.
    // In game.update: read hitPressed first (via tryHit), then call input.tick().
    this._hitPrev        = this.hit;
    this._hitJustPressed = false;   // consume the touch-triggered one-shot
  }

  bind() {
    window.addEventListener('keydown', e => this._onKey(e, true));
    window.addEventListener('keyup',   e => this._onKey(e, false));
  }

  _onKey(e, down) {
    switch (e.code) {
      case 'ArrowLeft':  case 'KeyA': this.left  = down; break;
      case 'ArrowRight': case 'KeyD': this.right = down; break;
      case 'ArrowUp':    case 'KeyW': this.jump  = down; break;
      case 'Space':                   this.hit   = down; break;
    }
    if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
  }
}
```

**Player rendering (renderer.js):**
- Player 1: `#4a7c3f` (goblin green) filled rect at (p.x, p.y, PLAYER_W, PLAYER_H)
- Player 2: `#7c3f4a` (goblin red)
- Eyes: two white 4px circles at (+8, +14) and (+28, +14) relative to player top-left
- Pupils: 2px black, offset 2px toward `facing` direction

### Acceptance Criteria
- [ ] Player spawns at x=80, standing on floor
- [ ] A/ArrowLeft moves left, D/ArrowRight moves right; stop when key released
- [ ] W/ArrowUp jumps; cannot double-jump (only from ground)
- [ ] Player cannot cross the net — clamped at `NET_X - NET_W/2 - PLAYER_W` in both air and ground
- [ ] Player cannot leave left wall (x ≥ 0)
- [ ] Player returns to ground under gravity after jump
- [ ] Player 2 rectangle visible on right side (no input yet — static)
- [ ] No frame-rate-dependent movement: same distance traveled per second at 30fps vs 60fps

### Dependencies
Phase 2 must be complete.

---

## Phase 4 — Hit System & Scoring

### Goal
Implement the hit mechanic with one-shot detection, ball launch vector, touch counting rules,
rally scoring to 11 (win by 2), serving state, win screen, and score/position reset.

### Work Items
- [ ] Implement `tryHit(player, playerIdx, input, state)` — one-shot, proximity, launch
- [ ] Implement ball launch vector formula with minimum-distance guard
- [ ] Implement touch counting: max 3 per side, no same player twice in a row
- [ ] Implement `ballSide` tracking from `ball.x` (not player index)
- [ ] Implement `'serving'` phase: serve player holds ball, launches on hit key press
- [ ] Implement point scoring: ball hits floor → opponent scores; transition to `'point_scored'`
- [ ] Implement win condition: 11+, win by 2
- [ ] Implement `resetPositions(state)` — reset after point, alternate serve
- [ ] Specify who serves after a won match (`game.reset()`)
- [ ] Draw score in `ui.js`
- [ ] Draw win screen in `ui.js` (overlay + restart prompt)
- [ ] Handle `R` key to restart match (in `game.js`)
- [ ] Write unit tests for touch-count rule, scoring, win condition, `checkWin()`

### Design & Constraints

**GameState additions:**
```js
{
  phase: 'serving',       // 'serving' | 'playing' | 'point_scored' | 'game_over'
  score: [0, 0],          // [player1, player2]
  touchSeq: 0,            // increments on every hit (used as lastTouchSeq comparison)
  touchCount: 0,          // touches this rally on current side
  lastTouchPlayerIdx: -1, // 0 | 1 | -1 (none)
  ballSide: 0,            // 0=left, 1=right — always derived from ball.x, set on each hit
  servePlayerIdx: 0,      // who serves next
  phaseTimer: 0,          // countdown during 'point_scored' (1.5s)
  winner: -1,             // 0 | 1 when game_over
}
```

**One-shot hit detection — uses `input.hitPressed` (not `input.hit`):**
```js
function tryHit(player, playerIdx, input, ball, state) {
  if (!input.hitPressed) return;         // one-shot: only fires on key-down transition

  const pcx  = player.x + PLAYER_W / 2;
  const pcy  = player.y + PLAYER_H / 2;
  const dist = Math.hypot(ball.x - pcx, ball.y - pcy);

  if (dist > HIT_RADIUS)    return;      // out of range
  if (dist < HIT_MIN_DIST)  return;      // ball inside player body — reject to avoid zero-vector

  // Touch counting rule
  if (state.lastTouchPlayerIdx === playerIdx) return; // same player can't hit twice in a row
  const newBallSide = ball.x < NET_X ? 0 : 1;         // side is determined by ball.x, not player
  if (newBallSide === state.ballSide) {
    if (state.touchCount >= 3) return;   // 4th touch on same side — rejected
    state.touchCount++;
  } else {
    state.touchCount = 1;
    state.ballSide   = newBallSide;
  }
  state.lastTouchPlayerIdx = playerIdx;
  state.touchSeq++;

  // Launch vector — from player center toward ball, with upward floor
  const relX = ball.x - pcx;
  const relY = ball.y - pcy;
  const len  = Math.hypot(relX, relY); // >= HIT_MIN_DIST so never zero
  ball.vx = (relX / len) * HIT_POWER;
  ball.vy = Math.min((relY / len) * HIT_POWER, -150); // always at least -150 upward
}
```

**Edge case — ball below player:** When `relY > 0` (ball below player center),
`(relY/len)*HIT_POWER` is positive (downward). The `Math.min(..., -150)` clamp overrides
this to -150, so the ball still launches upward. Expected behavior is documented.

**Serving phase logic (handled in `_updatePhaseTimer`):**
```js
case 'serving':
  // Ball is held fixed above serve player's head
  const sp = state.players[state.servePlayerIdx];
  state.ball.x  = sp.x + PLAYER_W / 2;
  state.ball.y  = sp.y - BALL_RADIUS - 5;
  state.ball.vx = 0; state.ball.vy = 0;
  // Player launches ball by pressing hit key
  // tryHit is called normally during 'serving' phase too
  // When tryHit fires, ball.vx/vy are set — transition to 'playing'
  if (state.touchSeq > state._lastServeSeq) {
    state._lastServeSeq = state.touchSeq;
    state.phase = 'playing';
  }
  break;
```
Initialize `state._lastServeSeq = -1` so the first hit transitions from serving to playing.

**Point scoring — checked in game.update after physicsStep:**
```js
if (state.phase === 'playing' && state.ball.y + BALL_RADIUS >= FLOOR_Y) {
  const scorer = state.ball.x < NET_X ? 1 : 0; // ball lands left → player 2 scores
  state.score[scorer]++;
  const w = checkWin(state.score);
  if (w >= 0) {
    state.phase  = 'game_over';
    state.winner = w;
  } else {
    state.phase      = 'point_scored';
    state.phaseTimer = 1.5;
    state.servePlayerIdx = scorer; // loser of rally serves next (point winner is scorer, so other player serves? Actually: scorer serves after getting the point in rally scoring. Award the serve to the scorer.)
    // Convention: scorer serves next (standard volleyball rally scoring rule)
  }
}
```

**After point (1.5s timer expires):**
```js
case 'point_scored':
  state.phaseTimer -= dt;
  if (state.phaseTimer <= 0) resetPositions(state);
  break;
```

**Win condition:**
```js
function checkWin(score) {
  for (let i = 0; i < 2; i++) {
    if (score[i] >= 11 && score[i] - score[1 - i] >= 2) return i;
  }
  return -1;
}
```

**resetPositions:**
```js
function resetPositions(state) {
  const sx = state.servePlayerIdx === 0 ? 200 : 600;
  state.ball = { x: sx, y: 200, vx: 0, vy: 0 };
  state.players[0] = { x: 80,  y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1, lastTouchSeq: -1 };
  state.players[1] = { x: 680, y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true, facing: -1, lastTouchSeq: -1 };
  state.touchCount          = 0;
  state.lastTouchPlayerIdx  = -1;
  state.ballSide            = state.servePlayerIdx;
  state._lastServeSeq       = state.touchSeq;
  state.phase               = 'serving';
}
```

**game.reset() — called on R key for new match:**
```js
reset() {
  this.state.score          = [0, 0];
  this.state.winner         = -1;
  this.state.servePlayerIdx = 0;   // player 1 always serves first in new match
  this.state.touchSeq       = 0;
  this.state._lastServeSeq  = -1;
  resetPositions(this.state);
}
```

**Score display (ui.js):**
- P1 score: centered at (200, 40), white, `bold 32px monospace`
- P2 score: centered at (600, 40)
- Phase label: dim gray text at (400, 20) showing phase name when not 'playing'

**Win screen:** Semi-transparent `rgba(0,0,0,0.6)` overlay. `"GOBLIN 1 WINS!"` / `"GOBLIN 2 WINS!"`
in `bold 48px monospace`, goblin-green `#4aff4a`. Below: `"Press R to restart"` in white 24px.
R key triggers `game.reset()`.

### Acceptance Criteria
- [ ] Space (one-shot) when within HIT_RADIUS of ball launches ball away from player center
- [ ] Holding Space does not fire multiple hits — only fires once per key-press
- [ ] Ball with relY > 0 (ball below player) still launches upward (vy ≤ -150)
- [ ] Ball exactly at player center (dist < HIT_MIN_DIST) — hit is rejected, no launch
- [ ] 4th touch on same side rejected; same player cannot hit twice in a row
- [ ] `ballSide` correctly updates based on ball.x, not player position
- [ ] Ball touching floor on left → player 2 scores; right → player 1 scores
- [ ] Win triggers at 11-0, 11-9; does NOT trigger at 10-10, 11-10
- [ ] Win triggers at 13-11 (win by 2 after deuce)
- [ ] Win screen displays correct winner, R key resets match
- [ ] During 'point_scored' phase (1.5s), physics is frozen
- [ ] During 'serving' phase, ball is held above serve player's head until hit
- [ ] `npm test` passes: `checkWin` tests (11-0 win, 11-9 win, 10-10 no win, 11-10 no win, 13-11 win), touch-count rule

### Dependencies
Phase 3 must be complete.

---

## Phase 5 — AI Opponent & Mobile Controls

### Goal
Add a CPU goblin on the right side with configurable difficulty, then add touch input so the
game is playable on mobile. Complete single-player game gate.

### Work Items

**AI Opponent:**
- [ ] Implement `AIController` class in `ai.js`
- [ ] AI moves horizontally toward predicted ball intercept with reaction delay and error
- [ ] AI jumps only when ball is high AND moving toward AI's side
- [ ] AI hits when within HIT_RADIUS using `tryHit` same as human
- [ ] Export `AI_PARAMS` object for tuning in one place
- [ ] Wire `AIController.update()` into `game.update` as input source for player 2
- [ ] Document the input return value applies to player 2 via same movement code as player 1

**Mobile Controls:**
- [ ] Export `TOUCH_BUTTONS` layout from `ui.js`
- [ ] Draw touch buttons in `renderer.js` only on touch devices
- [ ] Wire touchstart/touchend/touchcancel in `input.js` using fresh `getBoundingClientRect()`
- [ ] Fix touch coordinate transform to use canvas physical pixels vs CSS pixels

### Design & Constraints

**AI parameters (ai.js) — all in one object for easy tuning:**
```js
export const AI_PARAMS = {
  speedFactor:    0.85,   // fraction of PLAYER_SPEED (reduce to make AI slower)
  reactionDelay:  0.12,   // seconds before AI updates its target x
  errorRange:     18,     // px — random offset on target (increase to make AI miss more)
  jumpThreshold:  FLOOR_Y - 180, // ball.y below this triggers jump consideration
  hitThreshold:   HIT_RADIUS,    // same reach as player (no unfair advantage)
  ballVelMinJump: 50,     // px/s — ball must be moving toward AI to trigger jump
};
```

**AIController.update(dt, player2, ball, state) — returns InputState-compatible object:**
```js
export class AIController {
  constructor() {
    this._timer       = 0;
    this._targetX     = 400;
    this._wasInRange  = false;  // for one-shot hit detection (edge trigger)
  }

  update(dt, player, ball, state) {
    const input = { left: false, right: false, jump: false, hit: false,
                    hitPressed: false, _hitPrev: false };

    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer   = AI_PARAMS.reactionDelay;
      const error   = (Math.random() * 2 - 1) * AI_PARAMS.errorRange;
      // Target: position player center under ball
      this._targetX = Math.max(NET_X + NET_W / 2,
                      Math.min(800 - PLAYER_W, ball.x - PLAYER_W / 2 + error));
    }

    // Horizontal movement
    const dx = this._targetX - player.x;
    if (Math.abs(dx) > 4) {
      input.left  = dx < 0;
      input.right = dx > 0;
    }

    // Jump: ball must be high AND moving toward AI (positive vx = moving right = toward AI)
    if (ball.x > NET_X &&
        ball.y < AI_PARAMS.jumpThreshold &&
        ball.vx >= AI_PARAMS.ballVelMinJump &&
        player.onGround) {
      input.jump = true;
    }

    // Hit: one-shot edge trigger — hitPressed only fires on first frame AI enters range
    const pcx     = player.x + PLAYER_W / 2;
    const pcy     = player.y + PLAYER_H / 2;
    const dist    = Math.hypot(ball.x - pcx, ball.y - pcy);
    const inRange = dist <= AI_PARAMS.hitThreshold && dist >= HIT_MIN_DIST;
    input.hitPressed   = inRange && !this._wasInRange; // edge: false→true transition only
    input.hit          = inRange;
    this._wasInRange   = inRange;

    return input;
  }
}
```

**Wiring in game.update:**
```js
// Player 1 uses InputState from keyboard
const p1Input = this._input;
// Player 2 uses AIController in single-player mode
const p2Input = this._ai.update(dt, state.players[1], state.ball, state);

// Apply movement to each player using the SAME movement code
applyInput(state.players[0], p1Input);
applyInput(state.players[1], p2Input);

// Apply hits
tryHit(state.players[0], 0, p1Input, state.ball, state);
tryHit(state.players[1], 1, p2Input, state.ball, state);

// tick input to advance _hitPrev
this._input.tick();
```
`applyInput(player, input)` is the same velocity-setting code from Phase 3, extracted
to a standalone function.

**Tuning gate:** If the AI is too easy or too hard after implementing:
- Increase `errorRange` (more misses) or `speedFactor` (slower) to make easier
- Decrease `errorRange` or `reactionDelay` to make harder
- `jumpThreshold` and `ballVelMinJump` control how aggressively AI attacks high balls

**Touch button layout (ui.js) — positioned to avoid player spawn areas:**
```js
export const TOUCH_BUTTONS = {
  left:  { x: 10,  y: 290, w: 90, h: 90, label: '◀' },
  right: { x: 110, y: 290, w: 90, h: 90, label: '▶' },
  jump:  { x: 600, y: 200, w: 90, h: 90, label: '▲' },
  hit:   { x: 700, y: 290, w: 90, h: 90, label: '●' },
};
```
Buttons are in game-space (800×450) coordinates.
- Left/right: y=290 (above FLOOR_Y=400, below player center at y=370); x=10-200 clears player 1 spawn at x=80
- Jump: x=600, y=200 — mid-right area, clear of player 2 spawn (x=680, y=340)
- Hit: x=700, y=290 — bottom-right; overlaps player 2 area slightly but is the natural thumb zone
- Player 2 spawn is x=680-720, y=340-400. Jump at x=600-690 y=200-290 does not overlap.

**Touch coordinate transform — correct HiDPI formula:**
```js
// In input.js bindTouch(canvas):
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect   = canvas.getBoundingClientRect(); // fresh rect every touch (handles resize)
  // scaleX converts CSS pixels → game-space. Use rect.width (CSS px) and CANVAS_W (game px).
  // devicePixelRatio is already baked into canvas.width and ctx.setTransform — do NOT use it here.
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  for (const touch of e.changedTouches) {
    const gx = (touch.clientX - rect.left) * scaleX;
    const gy = (touch.clientY - rect.top)  * scaleY;
    for (const [key, btn] of Object.entries(TOUCH_BUTTONS)) {
      if (gx >= btn.x && gx <= btn.x + btn.w &&
          gy >= btn.y && gy <= btn.y + btn.h) {
        this[key] = true;
        if (key === 'hit') this._hitJustPressed = true; // reliable one-shot for touch
      }
    }
  }
}, { passive: false });
```
Using `rect.width` (CSS pixels) and `BASE_W / rect.width` gives the correct transform because
the canvas `ctx` is already set up to map game coordinates (0–800) to CSS pixel coordinates.
The `devicePixelRatio` is baked into `canvas.width` (physical pixels) and `ctx.setTransform`,
but touch events use CSS pixels, so `rect.width` → game-space is the right conversion.
`getBoundingClientRect()` is called fresh in each handler, so window resize is implicitly handled.

**Touch buttons render only on touch devices:**
```js
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  // draw touch buttons
}
```

### Acceptance Criteria
- [ ] AI goblin moves toward ball and attempts hits
- [ ] AI does not jump when ball is moving away from it (vx < ballVelMinJump)
- [ ] AI does not gain unfair proximity advantage (hitThreshold === HIT_RADIUS)
- [ ] A full match against the AI can be won and lost
- [ ] AI does not get stuck at net or wall
- [ ] Touch buttons render only on touch devices, not on desktop
- [ ] All four touch buttons function correctly (left/right movement, jump, hit)
- [ ] Touch buttons minimum 48px in screen pixels on a 390px-wide phone viewport
- [ ] **Single-player completion gate:** A full 11-point match against the AI is playable and
  fun. If the AI is too easy or too hard, tune `AI_PARAMS` (errorRange, speedFactor,
  reactionDelay) until balance feels right before proceeding to Phase 6.

### Dependencies
Phase 4 must be complete.

---

## Phase 6 — Multiplayer Server

### Goal
Build the Node.js WebSocket server: matchmaking, server-authoritative physics, 20Hz state
snapshots, input rate-limiting, and disconnect/reconnect handling.

### Work Items
- [ ] `npm install ws` — add to package.json as dependency
- [ ] Implement `server/index.js` — WebSocket server, message routing, input rate limiting
- [ ] Implement `server/matchmaker.js` — queue players, pair into rooms
- [ ] Implement `server/gameRoom.js` — 60Hz physics tick, 20Hz snapshot broadcast, disconnect handling
- [ ] Implement `server/physics.js` — mirrors client physics; `physicsStep(state, dt, inputs)` accepts inputs array
- [ ] Input rate limiting: max 60 messages/sec per connection (fixed window, documented tradeoff)
- [ ] Message size rejection: drop connections sending > 1KB messages
- [ ] Game room pause on disconnect, 30s reconnect window (wall-clock), game_over on timeout
- [ ] All message types from protocol implemented

### Design & Constraints

**Node.js ≥18 required.** This gives native ES modules (`"type":"module"`) and `crypto.randomUUID()`.

**Port resolution (server/index.js):**
```js
// Use PORT env var if set (e.g., Fly.io injects it), otherwise fall back to scripts/port.js
let PORT;
if (process.env.PORT) {
  PORT = parseInt(process.env.PORT, 10);
} else {
  const { getPort } = await import('../scripts/port.js');
  PORT = getPort();
}
```

**Single-player vs. multiplayer modes:**
- In single-player (Phases 1–5), `game.js` uses `AIController` for player 2. No server involved.
- In multiplayer (Phase 7), `AIController` is replaced by `NetworkClient`. The server runs
  authoritative physics applying real inputs from both clients. There is no AI on the server.
- The server `gameRoom.js` always treats both slots as remote players.

**server/physics.js signature — takes inputs array:**
```js
// server/physics.js — copy constants verbatim from client/physics.js
// NOTE: after Phase 5 tuning, synchronize AI_PARAMS-tuned physics constants
// between client/physics.js and server/physics.js. They must match exactly.

export function physicsStep(state, dt, inputs) {
  // inputs: [{ left, right, jump, hit, hitPressed }, { ... }]
  // hitPressed is computed by gameRoom.js before calling physicsStep (see below).
  // 1. Apply movement from inputs to each player
  applyInput(state.players[0], inputs[0]);
  applyInput(state.players[1], inputs[1]);
  // 2. Integrate player physics
  stepPlayer(state.players[0], dt, true);
  stepPlayer(state.players[1], dt, false);
  // 3. Integrate ball physics (calls the exported stepBall from client/physics.js copy)
  stepBall(state.ball, dt);
  // 4. Apply hits from inputs
  tryHit(state.players[0], 0, inputs[0], state.ball, state);
  tryHit(state.players[1], 1, inputs[1], state.ball, state);
}
```
`applyInput`, `stepPlayer`, `stepBall`, `tryHit` are internal helpers duplicated from client.
Do not import cross-process — copy the implementations and keep them in sync.

**CRITICAL: server-side `hitPressed` reconstruction.**
The client sends `{ keys: { left, right, jump, hit } }` — there is no `hitPressed` in the
message. The server must reconstruct `hitPressed` by tracking the previous `hit` state per
player, just like `InputState._hitPrev` on the client. This must be done in `gameRoom.js`
before passing inputs to `physicsStep`:

```js
// In GameRoom constructor:
this._prevHit = [false, false];

// In the message handler when type === 'input':
onInput(playerIdx, keys) {
  const hitPressed          = keys.hit && !this._prevHit[playerIdx];
  this._prevHit[playerIdx]  = keys.hit;
  this._inputs[playerIdx]   = { ...keys, hitPressed };
}
```
Without this, `tryHit` checks `if (!input.hitPressed) return` and every hit is silently rejected.

**Input rate limiting — fixed window, 60 inputs/sec:**
```js
// Fixed window (resets every 1000ms). Allows burst of 60 at window end + 60 at start of
// next = 120 in ~1ms window. This is acceptable for a game (not a financial API).
// Sliding window adds complexity not warranted here.
if (now - ws.inputWindowStart > 1000) {
  ws.inputWindowStart = now; ws.inputCount = 0;
}
ws.inputCount++;
if (ws.inputCount > 60) return; // silently drop
```

**Message seq field — purpose:** Client increments a global `seq` counter per message (all
types). Server can use it to detect duplicate retransmits: if the same `seq` is seen twice
from the same connection, the second is ignored. In practice, WebSocket over TCP rarely
duplicates — `seq` is included for debugging and future-proofing, not strict deduplication.

**Disconnect handling (gameRoom.js):**
```js
onDisconnect(playerIdx) {
  this._disconnectedAt[playerIdx] = Date.now();
  this._paused = true;  // freeze physics ticks while waiting
  this._broadcastExcept(playerIdx, { type: 'opponent_disconnected',
                                      payload: { reconnectWindow: 30 } });
  this._reconnectTimer = setTimeout(() => {
    if (this._disconnectedAt[playerIdx] !== null) { // still disconnected
      const winner = 1 - playerIdx;
      this._broadcast({ type: 'game_over', payload: { winner, score: this.state.score } });
      this.close();
    }
  }, 30_000);
}

onReconnect(playerIdx, ws) {
  clearTimeout(this._reconnectTimer);
  this._disconnectedAt[playerIdx] = null;
  this._paused = false;
  this.players[playerIdx] = ws;
  ws.send(JSON.stringify({ type: 'game_start', payload: { state: this.state,
                           playerIndex: playerIdx, roomId: this.id } }));
}
```

**State snapshot broadcast at 20Hz (gameRoom.js):**
```js
const TICK_HZ     = 60;
const SNAPSHOT_HZ = 20;
const TICK_MS     = 1000 / TICK_HZ;

this._tickInterval = setInterval(() => {
  if (this._paused) return;
  const dt = TICK_MS / 1000;
  physicsStep(this.state, dt, this._inputs);
  this._checkScoring();
  this._snapshotTick++;
  if (this._snapshotTick % (TICK_HZ / SNAPSHOT_HZ) === 0) {
    this._broadcast({ type: 'state_snapshot',
                      payload: { seq: ++this._seq, ts: Date.now(), state: this.state } });
  }
}, TICK_MS);
```

### Acceptance Criteria
- [ ] `npm run server` starts without errors
- [ ] Two WebSocket clients connect and are matched into a room
- [ ] Server sends `match_found` then `game_start` to both clients
- [ ] Server broadcasts `state_snapshot` at ~20Hz (verify with logged timestamps)
- [ ] Sending >60 inputs/sec from one client: excess inputs silently dropped (server state unaffected)
- [ ] Sending a message >1KB: connection is terminated
- [ ] One client disconnects: remaining client receives `opponent_disconnected` within 1s
- [ ] Physics is paused during disconnect window (game state freezes)
- [ ] Reconnecting within 30s resumes the match
- [ ] No reconnect within 30s: remaining client receives `game_over` with winner

### Dependencies
Phase 5 must be complete. Constants in `server/physics.js` must match tuned values in `client/physics.js`.

---

## Phase 7 — Client Networking & Lobby

### Goal
Wire the client to the server: send inputs, receive state snapshots with interpolation,
and display a goblin-themed lobby for all connection states.

### Work Items
- [ ] Implement `NetworkClient` in `client/network.js` — connect, send, receive
- [ ] Add lobby state machine to `game.js`: `offline → connecting → waiting → matched → in_game → game_over`
- [ ] Implement mode branching: multiplayer uses `NetworkClient`, single-player uses `AIController`
- [ ] Send `input` messages on each game tick when in `in_game` state
- [ ] Implement `SnapshotBuffer` — ring buffer of last 3 snapshots with interpolation
- [ ] Implement local player prediction with server reconciliation
- [ ] Draw lobby UI in `ui.js` for each lobby state
- [ ] Add "Multiplayer" button to main menu / initial state

### Design & Constraints

**Multiplayer mode branching (game.js):**
```js
// game.js tracks which mode it's in
this._mode = 'singleplayer'; // 'singleplayer' | 'multiplayer'

update(dt) {
  if (this._mode === 'singleplayer') {
    // player 2 from AI
    const p2Input = this._ai.update(dt, state.players[1], state.ball, state);
    applyInput(state.players[1], p2Input);
    tryHit(state.players[1], 1, p2Input, state.ball, state);
  } else {
    // player 2 position comes from server snapshots (applied via SnapshotBuffer)
    // do NOT run AI in multiplayer mode
    this._network.sendInput(this._input);
  }
  // Player 1 always from keyboard
  applyInput(state.players[0], this._input);
  tryHit(state.players[0], 0, this._input, state.ball, state);
  // ...
}
```

**NetworkClient (client/network.js):**
```js
export class NetworkClient {
  constructor() {
    this.ws        = null;
    this._seq      = 0;
    this.onMessage = null;
  }

  connect() {
    const url = window.GOBLIN_SERVER_URL || 'ws://localhost:3000';
    this.ws = new WebSocket(url);
    this.ws.onopen    = () => this._send({ type: 'ready', seq: ++this._seq });
    this.ws.onmessage = e  => this.onMessage?.(JSON.parse(e.data));
    this.ws.onclose   = () => this.onMessage?.({ type: '_disconnected' });
  }

  sendInput(input) {
    this._send({ type: 'input', seq: ++this._seq,
                 payload: { keys: { left: input.left, right: input.right,
                                    jump: input.jump, hit: input.hit } } });
  }

  _send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
```

**SnapshotBuffer — last 3 snapshots, interpolated with 100ms render delay:**
```js
class SnapshotBuffer {
  constructor() { this._buf = []; } // [{ts, state}, ...]

  push(snapshot) {
    this._buf.push(snapshot);
    if (this._buf.length > 3) this._buf.shift(); // drop oldest
    // Out-of-order: sort by ts to handle jitter
    this._buf.sort((a, b) => a.ts - b.ts);
  }

  getInterpolated(now) {
    const renderTs = now - 100; // 100ms render delay for jitter smoothing
    if (this._buf.length < 2) return this._buf[0]?.state ?? null; // not enough data, use latest
    // Find the two snapshots straddling renderTs
    for (let i = 1; i < this._buf.length; i++) {
      if (this._buf[i].ts >= renderTs) {
        const t0 = this._buf[i - 1], t1 = this._buf[i];
        const alpha = Math.max(0, Math.min(1, (renderTs - t0.ts) / (t1.ts - t0.ts)));
        return interpolateState(t0.state, t1.state, alpha);
      }
    }
    return this._buf[this._buf.length - 1].state; // renderTs is ahead of all snapshots
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function interpolateState(s0, s1, alpha) {
  // Only interpolate remote player position (player 2 for client 1, player 1 for client 2)
  // Ball position is also interpolated
  return {
    ...s1, // use s1 for all fields (scores, phase, etc.)
    players: s1.players.map((p1, i) => ({
      ...p1,
      x: lerp(s0.players[i].x, p1.x, alpha),
      y: lerp(s0.players[i].y, p1.y, alpha),
    })),
    ball: {
      ...s1.ball,
      x: lerp(s0.ball.x, s1.ball.x, alpha),
      y: lerp(s0.ball.y, s1.ball.y, alpha),
    },
  };
}
```

**Note on clock skew:** Client and server clocks may drift. If `renderTs` is consistently
outside the buffer window (no snapshots to interpolate), fall back to the latest snapshot
with no interpolation. This is visible as occasional snap but avoids the buffer underrun case.
A future improvement would track `serverTs - clientTs` offset using pong messages.

**Local player reconciliation (blend, not snap for small diffs):**
```js
// After receiving a snapshot, reconcile local player prediction
const serverX = snapshot.players[localPlayerIdx].x;
const diff    = Math.abs(state.players[localPlayerIdx].x - serverX);
if (diff > 50) {
  state.players[localPlayerIdx].x = serverX; // hard snap for large desync
} else {
  // dt-adjusted blend for small corrections — converges in ~0.2s at 60fps
  const blendFactor = 1 - Math.exp(-5 * dt); // ~0.08 per frame at 60fps
  state.players[localPlayerIdx].x = lerp(state.players[localPlayerIdx].x, serverX, blendFactor);
}
```

**Lobby UI states (ui.js):**
- `connecting`: dim overlay, `"Connecting to server…"` pulsing (alpha sine wave)
- `waiting`: `"Seeking a Goblin Opponent…"` + queue position text if available
- `matched`: `"OPPONENT FOUND!"` in goblin-green, 2s fanfare, then transitions to `in_game`
- `opponent_disconnected`: `"Opponent fled! Waiting… (Ns)"` with wall-clock countdown
- `game_over` (multiplayer): `"GOBLIN N WINS!"` + `"Play Again?"` button

### Acceptance Criteria
- [ ] Clicking "Multiplayer" transitions through `connecting → waiting` states with correct UI
- [ ] Two tabs matched: both show `matched` fanfare then begin playing
- [ ] Local player input is applied immediately (no input lag)
- [ ] Remote player position is smoothly interpolated (no jitter on LAN)
- [ ] AI is NOT running in multiplayer mode (player 2 position is server-authoritative only)
- [ ] Closing one tab: other tab shows disconnect countdown UI
- [ ] Reconnecting within 30s: game resumes from saved state
- [ ] After 30s: `game_over` screen shown with winner
- [ ] Single-player mode unaffected (AI still works when not in multiplayer)

### Dependencies
Phase 6 must be complete and `npm run server` running on the correct port.

---

## Phase 8 — Polish & Deploy (optional)

### Goal
Add goblin sprite art, procedural sound effects via Web Audio API, particle effects, and
deploy to Fly.io for public play.

### Work Items

**Sprites:**
- [ ] Create `client/sprites/goblin.png` — horizontal spritesheet, 160×48px, 5 frames × 32px wide:
  frame 0=idle, 1–2=run (2 frames), 3=jump, 4=hit
- [ ] Replace rectangle player rendering with `ctx.drawImage(sheet, srcX, 0, 32, 48, p.x, p.y, PLAYER_W, PLAYER_H)`
- [ ] Animate: advance frame index every 8 update ticks for run/idle; single frame for jump/hit
- [ ] Player 2 sprite: use `ctx.save(); ctx.scale(-1,1); ctx.drawImage(...); ctx.restore()` with mirrored x

**Sound (Web Audio API — zero file dependencies):**
- [ ] Create `client/audio.js` — `AudioManager` class
- [ ] `AudioManager.init()` called on first user gesture (click/keypress) to create `AudioContext`
- [ ] Hit sound: sawtooth oscillator, 220→110Hz over 0.08s, gain 0.3→0
- [ ] Score sound: two sine blips: 440Hz 0.1s then 660Hz 0.1s
- [ ] Bounce sound: triangle oscillator, 80Hz, 0.05s gain decay
- [ ] `AudioManager.play(type)` called from `game.js` on hit, score, and bounce events

**Particles:**
- [ ] Add `state.particles` array: `[{ x, y, vx, vy, life, maxLife, color }, ...]`
- [ ] `emitHit(x, y)`: 12 particles, vx/vy ±(Math.random()*400-200) px/s, life=0.4s, color `#4aff4a`
- [ ] `emitScore(x, y)`: 20 particles burst upward (vy -200 to -600), life=0.7s, color `#ffe066`
- [ ] Update particles in `physicsStep` (always, regardless of game phase): apply gravity, age, remove dead
- [ ] Render particles: filled circle r=3, `alpha = life/maxLife`

**Deploy:**
- [ ] Create `Dockerfile`:
  ```dockerfile
  FROM node:20-slim
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY server/ ./server/
  COPY scripts/ ./scripts/
  EXPOSE 3000
  ENV PORT=3000
  CMD ["node", "server/index.js"]
  ```
- [ ] Create `fly.toml`: app name, `internal_port = 3000`, `min_machines_running = 1`
  (prevents cold-start WebSocket failures)
- [ ] Update `client/index.html` for production:
  `<script>window.GOBLIN_SERVER_URL = 'wss://YOUR_APP.fly.dev';</script>` before `main.js`
- [ ] Deploy: `fly deploy`

### Acceptance Criteria
- [ ] Goblin sprites render for idle, run, jump, hit states
- [ ] Player 2 sprite is horizontally mirrored
- [ ] Hit/score/bounce sounds play (no audio files — verify with Network tab showing no audio requests)
- [ ] Particles burst on hit and score, fade to transparent, do not accumulate unboundedly
- [ ] `fly deploy` succeeds and game reachable at Fly.io URL
- [ ] Two clients on different networks complete a multiplayer match via Fly.io

### Dependencies
Phase 7 must be complete. `fly` CLI authenticated (`fly auth login`). Node.js ≥18 confirmed.

---

## Plan Quality

**Drafting process:** /draft-plan with 2 rounds of adversarial review (Reviewer + Devil's Advocate)
**Convergence:** Converged at Round 2 — no new substantive issues found after Round 2 fixes
**Remaining concerns:** None blocking. Acknowledged limitations:
- Net tunneling: sub-step push-out correction added; residual risk low given speed caps
- Clock skew in interpolation: documented; fallback to latest snapshot on buffer underrun
- Fixed-window rate limiting: documented tradeoff vs. sliding window
- Physics constants in client vs. server require manual sync after Phase 5 tuning
- `tick()` ordering in game.update is load-bearing (hitPressed consumed before tick called) — documented

### Round History
| Round | Reviewer Findings | Devil's Advocate Findings | Resolved |
|-------|-------------------|---------------------------|----------|
| 1 | 17 issues | 22 issues | 39/39 |
| 2 | 5 issues | 5 issues | 10/10 — converged |
