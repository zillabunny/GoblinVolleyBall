# 🏐 Goblin Volleyball — Claude Code Build Plan

> A lean, completable plan. Single-player first, multiplayer second. Build the fun before everything else.

---

## Project Overview

| Attribute | Detail |
|-----------|--------|
| **Engine** | Vanilla JS + HTML5 Canvas |
| **Perspective** | 2D Side View (fixed camera) |
| **Theme** | Goblins — cave court, bone net, torches |
| **Multiplayer** | WebSocket (server-authoritative) — Phase 2 only |
| **Target** | Browser client + Node.js server |

---

## Project Structure

```
goblin-volleyball/
├── CLAUDE.md
├── client/
│   ├── index.html
│   ├── main.js          # Entry point, game loop
│   ├── game.js          # Game state, scoring, rules
│   ├── physics.js       # Ball + player physics
│   ├── renderer.js      # Canvas draw calls
│   ├── input.js         # Keyboard + touch input
│   ├── ai.js            # CPU opponent logic
│   ├── ui.js            # Score display, menus
│   └── network.js       # WebSocket client (Phase 2)
├── server/
│   ├── index.js         # WebSocket server entry
│   ├── gameRoom.js      # Room lifecycle
│   ├── matchmaker.js    # Queue + pair players
│   └── physics.js       # Authoritative physics (mirrors client)
└── tests/
    └── physics.test.js  # Unit tests for physicsStep()
```

---

## CLAUDE.md — Project Memory

Paste this as your `CLAUDE.md` file. It loads into every Claude Code session automatically.

```markdown
# Goblin Volleyball — Project Memory

## Tech Stack
- Client: Vanilla JS (ES modules), HTML5 Canvas
- Server: Node.js + `ws` package
- No build step — open client/index.html directly in browser

## Visual Style
- Rendering: 2D side view, fixed camera
- Court: cave stone floor, bone net, torch sconces on walls
- Players: simple goblin sprites — 4 states: idle, run, jump, hit
- Color palette: earthy greens, dark browns, orange torch glow
- Start with colored rectangles/circles; swap in sprites later

## Game Rules
- Rally scoring to 11, win by 2
- Max 3 touches per side; same player can't touch twice in a row
- Ball hitting the ground on your side = point for opponent
- Net collision: ball bounces back if it hits the net

## Physics (Arcade — not realistic)
- Ball: gravity constant + vx/vy integration each frame
- Goal: predictable arcs, forgiving hit windows, satisfying bounces
- All physics runs at 60Hz via requestAnimationFrame

## Controls
### Desktop
- Arrow keys or A/D → move
- W or Up → jump
- Space → hit

### Mobile
- Left 40% of screen: move left/right buttons
- Right 60%: jump + hit buttons
- Minimum touch target: 48px

## Canvas Sizing
- Base resolution: 800x450 (16:9)
- Scale to fit window, letterbox if needed
- HiDPI: multiply by devicePixelRatio, then ctx.scale(dpr, dpr)

## Multiplayer (Phase 2 only)
- Server is the ONLY authority on physics and game state
- Clients send input events only — never positions
- Server broadcasts state snapshots at 20Hz
- Use WebSocket (not WebRTC) — protects player IPs
- Message format: `{ type, seq, payload }`
- Server → Client types: state_snapshot, game_start, game_over, match_found, waiting, opponent_disconnected
- Client → Server types: input, ready, ping, rejoin
```

---

## Agents

Two agents only. Anything else adds overhead without value at this scope.

### `.claude/agents/game-builder.md`

```yaml
---
name: game-builder
description: >
  Use for all gameplay work — physics, rendering, input, AI, scoring, and UI.
  Invoked when building or modifying any client-side game logic.
tools: Read, Write, Edit, Bash
model: sonnet
---

You are building a 2D side-view goblin volleyball game in vanilla JS.

Before writing any code:
1. Read CLAUDE.md for conventions and physics constants
2. Check existing files for what's already implemented
3. State what you're about to build before you build it

Rules:
- One responsibility per file (physics.js only does physics, etc.)
- No magic numbers — use named constants at the top of each file
- dt-based movement everywhere — no frame-rate-dependent logic
- Test in browser after each significant change
```

### `.claude/agents/network-agent.md`

```yaml
---
name: network-agent
description: >
  Use for all Phase 2 multiplayer work — WebSocket server, matchmaking,
  room lifecycle, client prediction, and state interpolation.
  Do NOT invoke until Phase 1 is complete and fun.
tools: Read, Write, Edit, Bash
model: sonnet
---

You are building the multiplayer layer for a goblin volleyball game.

Before writing any code:
1. Read CLAUDE.md — especially the Multiplayer section
2. Read server/physics.js — your server physics must match it exactly
3. Confirm Phase 1 (single-player) is complete

Rules:
- Server owns all physics. Clients send inputs only.
- Rate-limit inputs server-side: max 60/sec per player
- Reject any message over 1KB immediately
- Disconnected players get 30s to reconnect before room closes
- Never deploy to Vercel/Netlify — WebSocket needs a persistent process
```

---

## Slash Commands

### `.claude/commands/start.md`

```markdown
---
name: start
description: Start the game in browser (no server needed for Phase 1)
---

Open client/index.html in the default browser.
If it doesn't exist yet, invoke @game-builder to create the project scaffold first.
```

### `.claude/commands/run-qa.md`

```markdown
---
name: run-qa
description: Quick static analysis pass on client/ and server/
---

Scan all files in client/ and server/ for:
- Frame-rate-dependent logic (magic numbers in movement, not using dt)
- Physics running on client during Phase 2 (server must own physics)
- Missing input validation in server message handlers
- Canvas draw calls outside renderer.js
- console.log statements left in production paths

Return a numbered list with file:line references. Fix anything critical immediately.
```

### `.claude/commands/start-server.md`

```markdown
---
name: start-server
description: Start the Phase 2 WebSocket server in dev mode
---

Run `node server/index.js`.
If server/index.js doesn't exist, invoke @network-agent to build it first.
Confirm a WebSocket connection succeeds and a `waiting` message is received.
```

---

## Build Phases

### Phase 1 — Single Player (Week 1)

Build this completely before touching any server code.

**Step 1: Scaffold**
```
> "Read the build plan. Scaffold the full project structure with empty files and 
  a working canvas that shows a 800x450 gray rectangle in the browser."
```

**Step 2: Court + Ball**
```
> "Draw the court: stone floor, bone net in the center, torch sconces on walls. 
  Add a ball with gravity and bouncing off the floor and walls."
```

**Step 3: Player Movement**
```
> "Add a goblin player on the left side. Arrow keys move left/right, W jumps. 
  Player stays on the ground, can't pass through the net."
```

**Step 4: Hit System**
```
> "Add hit detection: when player is near the ball and presses Space, 
  launch the ball in a direction based on player position relative to ball."
```

**Step 5: Scoring**
```
> "When the ball hits the ground, award a point to the opposite side. 
  Show the score. Reset positions after each point. First to 11 wins."
```

**Step 6: AI Opponent**
```
> "Add a CPU goblin on the right side. It tracks the ball, moves toward it, 
  jumps when ball is high, and hits it back. Make it beatable but not trivial."
```

**Step 7: Mobile Controls**
```
> "Add touch controls. Left 40% of screen: move buttons. Right 60%: jump + hit. 
  Test that all controls feel responsive on mobile."
```

**✅ Phase 1 complete when:** You can play a full match against the AI and it's actually fun.

---

### Phase 2 — Multiplayer (Week 2–3)

Do not start this until Phase 1 feels good.

**Step 1: Server foundation**
```
> "Build the WebSocket server per CLAUDE.md. Matchmaker queues players 
  and pairs them into rooms. Server runs authoritative physics."
```

**Step 2: Client networking**
```
> "Wire the client to the server. Send input events only. 
  Render state snapshots from server. Interpolate remote player movement."
```

**Step 3: Connection UI**
```
> "Add a lobby state machine: connecting → waiting → matched → in_game → game_over. 
  Show appropriate goblin-themed UI at each state."
```

**Step 4: Disconnect handling**
```
> "Handle opponent disconnect: pause game, show reconnect countdown (30s). 
  If they reconnect, resume. If timeout, award match to remaining player."
```

**Step 5: QA pass**
```
> /run-qa
```

**✅ Phase 2 complete when:** Two browser tabs can play a full match including disconnect/reconnect.

---

### Phase 3 — Polish (if time permits)

Only after both phases are solid.

- Sprite art (replace rectangles with goblin sprites)
- Sound effects via Web Audio API (procedural — no file deps)
- Particle effects on hit/score
- Deploy to Fly.io

**Deploy note:** Use Fly.io, not Vercel or Netlify. WebSocket servers need persistent processes — serverless kills idle connections.

---

## Physics Constants (starter values)

```js
const GRAVITY      = 1200;  // px/s²
const JUMP_FORCE   = -600;  // px/s (negative = up)
const PLAYER_SPEED = 300;   // px/s
const BALL_RADIUS  = 16;    // px
const PLAYER_W     = 40;    // px
const PLAYER_H     = 60;    // px
const NET_HEIGHT   = 150;   // px from floor
const HIT_RADIUS   = 60;    // px — how close to register a hit
const HIT_POWER    = 700;   // px/s — launch speed on hit
```

Tune these in Phase 1 until the game feels good before locking them.

---

## Key Principles

**Build the fun first.** If hitting the ball doesn't feel satisfying in Phase 1, nothing in Phase 2 matters.

**No frame-rate-dependent logic.** All movement uses `dt` (delta time in seconds). Test at both 30fps and 120fps — behavior should be identical.

**Server authority is non-negotiable in Phase 2.** Server runs physics. Clients send inputs only. This prevents cheating and keeps player IPs private.

**Start ugly.** Colored rectangles and circles are fine. Swap in art after gameplay is proven.

**One file per concern.** physics.js does physics. renderer.js does drawing. Nothing else.
