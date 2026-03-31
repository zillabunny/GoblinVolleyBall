# Subagent: Explore `a49dddb5` — 2026-03-31 11:54

*Parent session: `71b2327b`*

---
**User:**
> You are a plan reviewer. Your job is to check the following plan for completeness, correctness, and feasibility so that `/run-plan` can execute it successfully.
> 
> Read these two files:
> 1. `/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md` — the plan to review
> 2. `/tmp/draft-plan-research-final-goblin-build-plan.md` — research context
> 
> Also read:
> - `/workspaces/GoblinVolleyball/CLAUDE.md` — project constraints
> - `/workspaces/GoblinVolleyball/scripts/port.js` — to understand the port setup
> 
> Check for:
> 1. Are all work items specific enough to implement without guessing?
> 2. Do acceptance criteria cover every work item?
> 3. Are dependencies correct and complete?
> 4. Is the phase ordering optimal? (shared infrastructure first?)
> 5. Are there missing phases? (tests? documentation? integration?)
> 6. Is the scope realistic per phase? (not too big, not too small)
> 7. Does the plan respect all constraints from CLAUDE.md (no build step, no external client libs, etc.)?
> 8. Are formulas and algorithms correct and consistent?
> 9. Will `/run-plan` be able to parse phases and status from this format?
> 10. Are physics constants used consistently throughout?
> 11. Is there anything in CLAUDE.md that the plan contradicts or ignores?
> 
> Return a numbered list of specific, actionable findings. For each finding, state the phase affected and what exactly needs to change. Do NOT give vague concerns — be precise. If something is fine, skip it.

I'll review the plan by reading the necessary files and checking against the criteria you've outlined.

● `Read(/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`
  ⎿  **Error:** File content (11545 tokens) exceeds maximum allowed tokens (10000). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.

<details>
<summary>● `Read(/tmp/draft-plan-research-final-goblin-build-plan.md)`</summary>
<pre><code>1	# Research Summary — Goblin Volleyball Final Build Plan
2	
3	## What Exists Today
4	- `/workspaces/GoblinVolleyball/goblin-volleyball-build-plan.md` — original build plan (prompt-script style, not `/run-plan`-compatible)
5	- `/workspaces/GoblinVolleyball/CLAUDE.md` — agent reference with rules, no game code yet
6	- `/workspaces/GoblinVolleyball/scripts/` — briefing.cjs, port.js, test-all.js (harness utilities)
7	- **No game code exists yet** — this is a greenfield project
8	
9	## What Needs to Be Built
10	1. Full single-player goblin volleyball game (Vanilla JS + HTML5 Canvas)
11	2. WebSocket multiplayer layer (Phase 2)
12	3. Optional polish (Phase 3 — sprites, sounds, deploy)
13	
14	## Technical Constraints (from CLAUDE.md + build plan)
15	- **No build step** — open `client/index.html` directly in browser (ES modules via `&lt;script type="module"&gt;`)
16	- **No external libraries** — Vanilla JS only for client; `ws` package allowed for server
17	- **No frame-rate-dependent logic** — all movement uses `dt` (delta-time in seconds)
18	- **Canvas**: 800×450 base resolution, 16:9, letterbox scaling, HiDPI via devicePixelRatio
19	- **Physics runs at 60Hz** via requestAnimationFrame
20	- **Deployment**: Fly.io only (NOT Vercel/Netlify — WebSocket needs persistent process)
21	- **Server authority in Phase 2**: clients send inputs only, server broadcasts snapshots at 20Hz
22	
23	## Physics Constants (locked from build plan)
24	```js
25	const GRAVITY      = 1200;  // px/s²
26	const JUMP_FORCE   = -600;  // px/s (negative = up)
27	const PLAYER_SPEED = 300;   // px/s
28	const BALL_RADIUS  = 16;    // px
29	const PLAYER_W     = 40;    // px
30	const PLAYER_H     = 60;    // px
31	const NET_HEIGHT   = 150;   // px from floor
32	const HIT_RADIUS   = 60;    // px — proximity threshold
33	const HIT_POWER    = 700;   // px/s — ball launch speed
34	```
35	Note: These are starter values. Tuning is expected during Phase 1 testing.
36	
37	## Game Rules (from build plan)
38	- Rally scoring to 11, win by 2
39	- Max 3 touches per side; same player can't touch twice in a row
40	- Ball hits ground on your side = point for opponent
41	- Net collision: ball bounces back
42	
43	## Controls
44	- **Desktop**: Arrow keys or A/D to move, W/Up to jump, Space to hit
45	- **Mobile**: Left 40% = move buttons (left/right), Right 60% = jump + hit (min 48px touch targets)
46	
47	## File Structure (from build plan)
48	```
49	client/index.html, main.js, game.js, physics.js, renderer.js, input.js, ai.js, ui.js, network.js
50	server/index.js, gameRoom.js, matchmaker.js, physics.js
51	tests/physics.test.js
52	```
53	
54	## Multiplayer Protocol (from build plan)
55	- Message format: `{ type, seq, payload }`
56	- Server → Client: state_snapshot, game_start, game_over, match_found, waiting, opponent_disconnected
57	- Client → Server: input, ready, ping, rejoin
58	- Input rate-limit: max 60/sec per player; reject messages over 1KB
59	- Disconnect: 30s reconnect window before room closes
60	
61	## Agents Defined (from build plan)
62	- `game-builder` — client-side work (physics, rendering, input, AI, scoring)
63	- `network-agent` — Phase 2 multiplayer only
64	
65	## Open Questions / Risks
66	1. **Hit direction formula not specified** — plan says "based on player position relative to ball" but doesn't specify the exact vector calculation
67	2. **AI difficulty knobs** — "beatable but not trivial" is vague; needs reaction time + error parameters
68	3. **Touch event handling** — no specific event model described (touchstart/touchend/touchmove)
69	4. **State interpolation** — plan mentions it but doesn't specify linear vs. buffer-based
70	5. **Game loop architecture** — how main.js orchestrates game.js, physics.js, renderer.js not fully specified
71	6. **Test runner** — test-all.js exists but test framework not specified; physics.test.js format unknown
72	7. **Sprite format** — "swap in sprites later" but no format (spritesheet vs individual frames)
73	
74	## Plan Quality Opportunities vs. Original
75	- Original plan uses "Week 1/2/3" time estimates — need to remove (use scope instead)
76	- Original plan is prompt-script style — needs conversion to `/run-plan` phase format
77	- Original plan lacks explicit acceptance criteria per step
78	- Original plan lacks the hit direction vector formula
79	- Original plan lacks AI behavioral spec (reaction time, error %, speed %)
80	- Original plan Phase 1 Step 6 (AI) comes before mobile controls — this ordering is good (test gameplay first)
81	

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/CLAUDE.md)`</summary>
<pre><code>1	# GoblinVolleyball -- Agent Reference
2	
3	## Architecture
4	
5	&lt;!-- TODO: fill in when known --&gt;
6	
7	## Dev Server
8	
9	&lt;!-- TODO: fill in when known --&gt;
10	&lt;!-- Example: npm start --&gt;
11	
12	The port is determined automatically by `scripts/port.js`: **8080** for the main repo (`/workspaces/GoblinVolleyball`), a **deterministic unique port** for each worktree (derived from the project root path). Run `node scripts/port.js` to see your port. Override with `DEV_PORT=NNNN` env var if needed.
13	
14	**NEVER use `kill -9`, `killall`, `pkill`, or `fuser -k` to stop processes.** These can kill container-critical processes or disrupt other sessions' dev servers and E2E tests. If a port is busy, check what's on it with `lsof -i :&lt;port&gt;` and ask the user to stop it manually.
15	
16	**Auth gate:** The app requires a password. For automated browser testing, bypass it:
17	```js
18	&lt;!-- TODO: fill in when known --&gt;
19	```
20	Then reload the page.
21	
22	## Tests
23	
24	```bash
25	# TODO: fill in when known -- unit tests only (fast, use while working)
26	# TODO: fill in when known -- ALL suites (use before committing)
27	```
28	
29	**TODO: fill in full test command — must pass before every commit.** When reporting test
30	results, always state the COMMAND you ran and list EACH suite with its result.
31	If a suite was skipped, say so explicitly with the reason.
32	Never say just "all tests pass" -- specify which suites actually ran and the
33	command that ran them.
34	
35	**NEVER weaken tests to make them pass.** Do not loosen tolerances, widen mismatch thresholds, skip assertions, or remove test cases to avoid failures. When a test fails, always find the root cause. Fix the code that's broken -- not the test. Only alter a test if the test itself is genuinely wrong (e.g., testing the wrong expected value). Weakened tests will be caught in review and the change will be rejected.
36	
37	**NEVER modify the working tree to check if a failure is pre-existing.** No `git stash &amp;&amp; &lt;test-cmd&gt; &amp;&amp; git stash pop`, no `git checkout &lt;old-commit&gt;`, no temporary worktrees for comparison. These workflows are fragile -- context compaction between the modification and the restore will lose your changes. Past failure: an agent stashed changes, checked out a prior commit to verify a test failure was pre-existing, hit compaction, and never restored the working tree. If you touched code and tests fail, fix them. If you only touched content (markdown, images, etc.), don't run tests at all.
38	
39	**NEVER thrash on a failing fix.** If you attempt a fix, run tests, and the same test fails again, STOP. Do not try a third approach to the same problem -- you are guessing and will keep guessing wrong. Report: (1) what you tried, (2) what failed both times, (3) why you think it's failing. Let the user decide the next step. This applies to all retry loops: fix+verify cycles, test failures after cherry-pick, and any "fix -&gt; test -&gt; still fails" pattern. Two attempts at the same error is the maximum.
40	
41	**Capture test output to a file, never pipe.** Always run tests with:
42	`&lt;full-test-cmd&gt; &gt; test-output.txt 2&gt;&amp;1` -- then read the file to
43	inspect failures. Never pipe through `| tail`, `| head`, `| grep` -- it
44	loses output and forces re-runs.
45	
46	**Pre-existing test failures.** If a test fails in code you didn't touch,
47	verify with `git log` that the test/source predates your changes. You may
48	file a GitHub issue with the error output and mark the test `it.skip('name
49	// #NNN')`. Never skip tests you wrote or modified.
50	
51	**NEVER defer the hard parts of a plan.** When implementing a plan, finish all of it -- do not split work into phases and then stop after the easy phase, reframing the remaining work as "next steps" or "future phases." If the plan says to do X, do X. Stopping partway and declaring victory on the easy part undermines progress and the entire project. If you genuinely cannot finish in one session, be explicit that the work is incomplete, not that it's a planned future phase.
52	
53	**Optimize for correctness, not speed.** Follow instructions exactly, including every intermediate verification step. Never skip verification to "save time" -- skipped steps mean the user has to re-verify, which saves nothing. Never stub methods, return bogus values, or simplify implementations to get something working faster. Never reframe the task to make it easier. Review agents will find shortcuts, so cutting corners gains nothing. When the user says "after each step, verify" -- verify after each step, not once at the end.
54	
55	### Test files
56	
57	&lt;!-- TODO: fill in when known --&gt;
58	
59	## Playwright CLI (Browser Automation)
60	
61	This environment uses `playwright-cli` for browser automation. Run `playwright-cli --help` for available commands.
62	
63	### Screenshots
64	
65	Use `playwright-cli screenshot` without `--filename` so files save to the configured output directory (`.playwright/output/`). Then rename the file to something descriptive. Using `--filename` bypasses the output directory and saves to the working directory instead.
66	
67	### Manual Testing Philosophy
68	
69	When told to "test manually", "test in the browser", or "verify with playwright-cli", use **real mouse/keyboard events** (`click`, `mousemove`, `mousedown`, `mouseup`, `type`, `press`, `drag`) -- never `page.evaluate()` or `eval` to call JS APIs that simulate user actions.
70	
71	- **Real events only:** Use real mouse/keyboard interactions for all user-facing operations.
72	- **`eval`/JS is only for setup and assertions:** Auth bypass, reading state for verification, querying DOM attributes. Never for simulating clicks, drags, or keypresses.
73	
74	## Worktree Rules
75	
76	Worktrees (`isolation: "worktree"`) exist to keep agent work **isolated and reviewable**. Respect that isolation:
77	
78	- **NEVER apply worktree changes to main without explicit user approval.** Do not `git apply`, `git merge`, copy files, or otherwise move worktree changes into the main working directory unless the user says to. This is the whole point of using worktrees.
79	- **NEVER remove worktrees that contain changes.** The user may want to review, cherry-pick, or discard them individually. Only clean up worktrees the user has approved or explicitly told you to remove.
80	- **Verify EACH worktree before removing.** Never batch-remove worktrees without checking each one. The fastest check: does `&lt;worktree&gt;/.landed` exist with `status: full`? If yes, it's safe -- all commits are on main and logs were extracted. If no `.landed` marker: verify manually with (1) `git log main..&lt;branch&gt;`, (2) `git status` in the worktree, (3) is it a long-running branch? Named/long-running worktrees are NOT sprint artifacts -- do not remove them. Present results and let the user approve.
81	- **ALWAYS write a `.landed` marker when worktree work is cherry-picked to main.** Without this marker, worktrees pile up because cleanup tools can't tell which are safe to remove. Write it immediately after successful cherry-pick:
82	  ```bash
83	  cat &gt; "&lt;worktree-path&gt;/.landed" &lt;&lt;LANDED
84	  status: full
85	  date: $(TZ=UTC date -Iseconds)
86	  source: &lt;skill-name&gt;
87	  commits: &lt;list of cherry-picked hashes&gt;
88	  LANDED
89	  ```
90	  If only some commits were cherry-picked (others skipped due to conflicts), use `status: partial`. If you used a worktree and finished without landing, still write a marker with `status: not-landed` so cleanup knows the agent is done.
91	- **After agents finish:** present a summary of what each worktree changed, then **ask** which ones the user wants merged. Let the user drive.
92	- **Keep worktree changes separate from main.** The main working directory may have its own uncommitted changes. Mixing agent patches in without asking makes clean commits harder and defeats the isolation benefit.
93	
94	## Git Rules
95	
96	**Do NOT push to remote unless explicitly told to.** Commit freely when asked, but never `git push` without the user saying "push", "push it", or similar. This applies even when the user says "commit and push" for one task -- it does not carry over to future tasks.
97	
98	**NEVER revert, discard, or "clean up" changes you didn't make.** If you see uncommitted changes from other agents or sessions, leave them alone. Do not run `git checkout -- &lt;file&gt;`, `git restore`, or any other command that discards working tree changes unless the user explicitly asks you to. Unrelated changes in the working tree are not yours to touch -- ask the user what they want to do with them.
99	
100	**Protect untracked files before git operations.** Before `git stash`, `git cherry-pick`, `git merge`, or any operation that modifies the working tree: (1) run `git status -s | grep '^??'` to inventory untracked files, (2) if any exist, use `git stash -u` (not `git stash`) or save them to a temp location first. Untracked files are not in git and cannot be recovered if lost.
101	
102	**Never use `git checkout &lt;commit&gt; -- &lt;file&gt;` for investigation.** To view old file versions, use `git show &lt;commit&gt;:&lt;file&gt;` or `git diff &lt;commit1&gt; &lt;commit2&gt; -- &lt;file&gt;` -- these are read-only and don't modify the working tree. `git checkout &lt;commit&gt; -- &lt;file&gt;` silently overwrites working tree AND stages the change, which easily gets swept into the next commit.
103	
104	**Never use `--no-verify` to bypass pre-commit hooks.** Hooks exist for safety -- fix the hook failure, don't bypass it.
105	
106	### Constructing commits -- feature-complete, not session-based
107	
108	A commit must include **all files the feature needs** and **no unrelated files**. Do NOT rely on memory of "what I changed this session" -- context compaction creates artificial session boundaries that split work on a single feature across multiple contexts.
109	
110	**Mandatory process before staging:**
111	
112	1. `git status -s` -- see ALL uncommitted changes
113	2. For every changed/untracked file, decide: related to this commit or not?
114	3. **Trace dependencies**: for every file being committed, check its imports. If it imports an uncommitted file, that file must be included. Recurse.
115	4. **Search broadly**: `git status -s | grep -i &lt;keyword&gt;` for the feature name. Check tests, plans, styles, examples -- not just `src/`.
116	5. Verify: `git diff --cached --stat` before committing. Review the list.
117	
118	**Common mistakes to avoid:**
119	- Committing `A.js` which imports `B.js` without committing `B.js`
120	- Committing a module but not its tests, styles, or config changes
121	- Missing files that were added in a prior compacted session (they show as untracked `??`, easy to overlook)
122	- Including unrelated changes that happened to be in the working tree
123	- Staging/unstaging shuffles (`git reset`, `git stash`) to separate changes -- these risk losing work. **If a file has a mix of related and unrelated changes, warn the user and ask what to do** -- do not attempt to split it yourself
124	
125	**Enumerate before guessing.** Before building test models, constructing
126	URLs, or creating files from scratch, check what already exists: `ls` the
127	directory, `grep` for the term, read the relevant file. Agents consistently
128	skip this step and guess instead of looking.
129	

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/scripts/port.js)`</summary>
<pre><code>1	/**
2	 * port.js -- deterministic dev-server port for the current project root.
3	 *
4	 * Main repo ({{MAIN_REPO_PATH}}) -&gt; 8080 (backward compatible).
5	 * Worktrees -&gt; stable port in 9000-60000 derived from the project root path.
6	 * DEV_PORT env var overrides everything.
7	 *
8	 * Usage:
9	 *   import { getPort } from './scripts/port.js';   // as module
10	 *   node scripts/port.js                            // prints port to stdout
11	 */
12	import { createHash } from 'node:crypto';
13	import { resolve, dirname } from 'node:path';
14	import { fileURLToPath } from 'node:url';
15	
16	const __filename = fileURLToPath(import.meta.url);
17	const PROJECT_ROOT = resolve(dirname(__filename), '..');
18	
19	const MAIN_REPO = '{{MAIN_REPO_PATH}}';
20	const DEFAULT_PORT = 8080;
21	const RANGE_START = 9000;
22	const RANGE_SIZE = 51000; // 9000-60000
23	
24	export function getPort() {
25	  if (process.env.DEV_PORT) return parseInt(process.env.DEV_PORT, 10);
26	
27	  // Main repo gets the default port
28	  if (MAIN_REPO !== '{{MAIN_REPO_' + 'PATH}}' &amp;&amp; PROJECT_ROOT === MAIN_REPO) return DEFAULT_PORT;
29	
30	  // Worktrees get a deterministic port from their path
31	  const hash = createHash('md5').update(PROJECT_ROOT).digest();
32	  return RANGE_START + (hash.readUInt16BE(0) % RANGE_SIZE);
33	}
34	
35	// CLI mode: node scripts/port.js
36	if (resolve(process.argv[1] || '') === __filename) {
37	  console.log(getPort());
38	}
39	

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

Now let me read the full plan file in sections:

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`</summary>
<pre><code>1	# Plan: Goblin Volleyball — Full Build
2	
3	## Overview
4	Build a complete 2D side-view goblin volleyball game in Vanilla JS + HTML5 Canvas —
5	single-player first (Phases 1–5), multiplayer second (Phases 6–7), optional polish last (Phase 8).
6	No build step. No external libraries on the client. Open `client/index.html` directly in browser.
7	
8	---
9	
10	## Progress Tracker
11	| Phase | Status | Commit | Notes |
12	|-------|--------|--------|-------|
13	| 1 — Scaffold &amp; Game Loop | ⬚ | | |
14	| 2 — Court &amp; Ball Physics | ⬚ | | |
15	| 3 — Player Movement &amp; Input | ⬚ | | |
16	| 4 — Hit System &amp; Scoring | ⬚ | | |
17	| 5 — AI Opponent &amp; Mobile Controls | ⬚ | | |
18	| 6 — Multiplayer Server | ⬚ | | |
19	| 7 — Client Networking &amp; Lobby | ⬚ | | |
20	| 8 — Polish &amp; Deploy (optional) | ⬚ | | |
21	
22	---
23	
24	## Phase 1 — Scaffold &amp; Game Loop
25	
26	### Goal
27	Create all project files, wire a working 800×450 canvas with HiDPI scaling, and run a
28	requestAnimationFrame game loop that calls update(dt) and render() each frame.
29	
30	### Work Items
31	- [ ] Create `client/index.html` — loads `main.js` as `&lt;script type="module"&gt;`
32	- [ ] Create `client/main.js` — entry point: sets up canvas, starts game loop
33	- [ ] Create `client/game.js` — exports `GameState` class (empty stub)
34	- [ ] Create `client/physics.js` — exports physics constants and `physicsStep()` stub
35	- [ ] Create `client/renderer.js` — exports `Renderer` class with `draw()` stub
36	- [ ] Create `client/input.js` — exports `InputState` class stub
37	- [ ] Create `client/ai.js` — exports `AIController` class stub
38	- [ ] Create `client/ui.js` — exports `UI` class stub
39	- [ ] Create `client/network.js` — exports `NetworkClient` class stub (Phase 2 only)
40	- [ ] Create `server/index.js`, `server/gameRoom.js`, `server/matchmaker.js`, `server/physics.js` — empty stubs
41	- [ ] Create `tests/physics.test.js` — empty test file
42	- [ ] Implement canvas setup with HiDPI scaling in `main.js`
43	- [ ] Implement requestAnimationFrame game loop with dt calculation
44	- [ ] Implement letterbox scaling (canvas fills window, preserving 16:9)
45	- [ ] Canvas renders a solid dark background — game loop running visible in browser
46	
47	### Design &amp; Constraints
48	
49	**Canvas setup (main.js):**
50	```js
51	const BASE_W = 800, BASE_H = 450;
52	const canvas = document.getElementById('game');
53	const ctx = canvas.getContext('2d');
54	
55	function resize() {
56	  const dpr = window.devicePixelRatio || 1;
57	  const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
58	  canvas.width  = BASE_W * dpr * scale;
59	  canvas.height = BASE_H * dpr * scale;
60	  canvas.style.width  = BASE_W * scale + 'px';
61	  canvas.style.height = BASE_H * scale + 'px';
62	  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
63	}
64	window.addEventListener('resize', resize);
65	resize();
66	```
67	
68	**Game loop (main.js):**
69	```js
70	let last = 0;
71	function loop(ts) {
72	  const dt = Math.min((ts - last) / 1000, 0.05); // cap dt at 50ms
73	  last = ts;
74	  game.update(dt);
75	  renderer.draw(ctx, game.state);
76	  requestAnimationFrame(loop);
77	}
78	requestAnimationFrame(loop);
79	```
80	
81	**Module architecture:** `main.js` owns the loop and passes `dt` to `game.update(dt)`.
82	`game.js` owns all game state and calls `physics.physicsStep(state, dt)` internally.
83	`renderer.js` is pure — it reads state and draws, never mutates state.
84	`input.js` exposes a live `InputState` object (booleans updated by event listeners).
85	`game.js` reads `InputState` on each update tick.
86	
87	**No magic numbers.** All constants go in `physics.js` at top level.
88	
89	**index.html boilerplate:**
90	```html
91	&lt;!DOCTYPE html&gt;
92	&lt;html lang="en"&gt;
93	&lt;head&gt;
94	  &lt;meta charset="UTF-8"&gt;
95	  &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
96	  &lt;title&gt;Goblin Volleyball&lt;/title&gt;
97	  &lt;style&gt;
98	    * { margin:0; padding:0; box-sizing:border-box; }
99	    body { background:#111; display:flex; justify-content:center; align-items:center;
100	           width:100vw; height:100vh; overflow:hidden; }
101	    canvas { display:block; image-rendering:pixelated; }
102	  &lt;/style&gt;
103	&lt;/head&gt;
104	&lt;body&gt;
105	  &lt;canvas id="game"&gt;&lt;/canvas&gt;
106	  &lt;script type="module" src="main.js"&gt;&lt;/script&gt;
107	&lt;/body&gt;
108	&lt;/html&gt;
109	```
110	
111	### Acceptance Criteria
112	- [ ] Opening `client/index.html` in a browser shows a dark rectangle filling the window
113	- [ ] Resizing the browser window maintains 16:9 aspect ratio without distortion
114	- [ ] Browser console shows no errors
115	- [ ] On a HiDPI display (devicePixelRatio &gt; 1) the canvas is crisp, not blurry
116	- [ ] Game loop tick rate is stable (no dt spikes &gt; 50ms visible in console)
117	
118	### Dependencies
119	None — this is the foundation.
120	
121	---
122	
123	## Phase 2 — Court &amp; Ball Physics
124	
125	### Goal
126	Draw the goblin-themed court (cave floor, bone net, torch sconces) and simulate a ball
127	with arcade physics: gravity, bouncing off floor/walls/net, and net-collision reversal.
128	
129	### Work Items
130	- [ ] Define all physics constants in `physics.js`
131	- [ ] Implement `physicsStep(state, dt)` — updates ball position/velocity each frame
132	- [ ] Implement ball↔floor bounce (reflect vy, attenuate slightly)
133	- [ ] Implement ball↔left-wall and ball↔right-wall bounce (reflect vx)
134	- [ ] Implement ball↔net collision (reflect vx when ball crosses net midline)
135	- [ ] Implement ball↔ceiling bounce (reflect vy)
136	- [ ] Draw court in `renderer.js`: cave stone floor, side walls, torch sconces
137	- [ ] Draw bone net in `renderer.js`
138	- [ ] Draw ball in `renderer.js` (filled circle, radius BALL_RADIUS)
139	- [ ] Wire ball state into `GameState` (position, velocity, radius)
140	- [ ] Wire `physicsStep` call into `game.update(dt)`
141	- [ ] Write unit tests for physicsStep in `tests/physics.test.js`
142	
143	### Design &amp; Constraints
144	
145	**Physics constants (physics.js):**
146	```js
147	export const GRAVITY       = 1200;  // px/s²
148	export const JUMP_FORCE    = -600;  // px/s
149	export const PLAYER_SPEED  = 300;   // px/s
150	export const BALL_RADIUS   = 16;    // px
151	export const PLAYER_W      = 40;    // px
152	export const PLAYER_H      = 60;    // px
153	export const NET_X         = 400;   // px from left (center of canvas)
154	export const NET_W         = 8;     // px — net half-width on each side
155	export const NET_HEIGHT    = 150;   // px from floor
156	export const FLOOR_Y       = 400;   // px from top (canvas is 450px tall)
157	export const HIT_RADIUS    = 60;    // px proximity for hit
158	export const HIT_POWER     = 700;   // px/s launch speed
159	export const BOUNCE_DAMP   = 0.75;  // velocity retained on floor bounce
160	export const RESTITUTION   = 0.85;  // wall/net bounce coefficient
161	```
162	
163	**physicsStep signature:**
164	```js
165	export function physicsStep(state, dt) {
166	  // state.ball: { x, y, vx, vy }
167	  // Mutates state.ball in place. Does NOT handle players here.
168	}
169	```
170	
171	**Ball integration:**
172	```js
173	state.ball.vy += GRAVITY * dt;
174	state.ball.x  += state.ball.vx * dt;
175	state.ball.y  += state.ball.vy * dt;
176	```
177	
178	**Floor bounce** (bottom of ball hits FLOOR_Y):
179	```js
180	if (state.ball.y + BALL_RADIUS &gt;= FLOOR_Y) {
181	  state.ball.y  = FLOOR_Y - BALL_RADIUS;
182	  state.ball.vy = -Math.abs(state.ball.vy) * BOUNCE_DAMP;
183	}
184	```
185	
186	**Wall bounces** (left wall at x=0, right wall at x=800):
187	```js
188	if (state.ball.x - BALL_RADIUS &lt;= 0) {
189	  state.ball.x  = BALL_RADIUS;
190	  state.ball.vx = Math.abs(state.ball.vx) * RESTITUTION;
191	}
192	if (state.ball.x + BALL_RADIUS &gt;= 800) {
193	  state.ball.x  = 800 - BALL_RADIUS;
194	  state.ball.vx = -Math.abs(state.ball.vx) * RESTITUTION;
195	}
196	```
197	
198	**Net collision** — ball bounces back when it collides with the net rectangle:
199	```js
200	const netLeft  = NET_X - NET_W / 2;

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

Let me continue reading the plan:

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`</summary>
<pre><code>200	const netLeft  = NET_X - NET_W / 2;
201	const netRight = NET_X + NET_W / 2;
202	const netTop   = FLOOR_Y - NET_HEIGHT;
203	if (state.ball.x + BALL_RADIUS &gt; netLeft &amp;&amp;
204	    state.ball.x - BALL_RADIUS &lt; netRight &amp;&amp;
205	    state.ball.y + BALL_RADIUS &gt; netTop) {
206	  // Determine which side of net ball came from
207	  if (state.ball.vx &gt; 0) {
208	    state.ball.x  = netLeft - BALL_RADIUS;
209	  } else {
210	    state.ball.x  = netRight + BALL_RADIUS;
211	  }
212	  state.ball.vx = -state.ball.vx * RESTITUTION;
213	}
214	```
215	
216	**Ceiling bounce** (y=0):
217	```js
218	if (state.ball.y - BALL_RADIUS &lt;= 0) {
219	  state.ball.y  = BALL_RADIUS;
220	  state.ball.vy = Math.abs(state.ball.vy);
221	}
222	```
223	
224	**Court rendering (renderer.js):**
225	- Background fill: `#1a0f0a` (dark cave brown)
226	- Floor: `#3d2b1f` filled rect from y=FLOOR_Y to canvas bottom, with a lighter `#5a3e2b` 3px top border
227	- Net: `#d4c4a0` (bone white) filled rect from (NET_X - NET_W/2, FLOOR_Y - NET_HEIGHT) with height NET_HEIGHT
228	- Torch sconces: orange `#ff6b1a` filled circle (radius 10) at x=40,y=80 and x=760,y=80; inner `#ffe066` radius 5
229	- Torch glow: radial gradient, `rgba(255, 107, 26, 0.3)` at r=0 → transparent at r=60
230	
231	**Ball rendering (renderer.js):**
232	- Filled circle at (ball.x, ball.y), radius BALL_RADIUS, color `#e8d44d` (yellow-green goblin ball)
233	
234	**Test framework:** Use Node.js built-in `node:test` (no install required):
235	```js
236	import { test } from 'node:test';
237	import assert from 'node:assert/strict';
238	import { physicsStep, GRAVITY, FLOOR_Y, BALL_RADIUS } from '../client/physics.js';
239	```
240	Run tests with: `node --test tests/physics.test.js`
241	
242	### Acceptance Criteria
243	- [ ] Browser shows court: dark cave background, brown floor, bone-colored net, two torches with glow
244	- [ ] Ball spawned at center (400, 100) with vx=200, vy=0 arcs rightward under gravity
245	- [ ] Ball bounces off floor, left wall, right wall without escaping canvas
246	- [ ] Ball bounces back from net when approaching from either side
247	- [ ] `node --test tests/physics.test.js` passes: gravity integration correct, floor bounce reflects vy, wall bounces reflect vx
248	- [ ] Ball behavior identical at 30fps and 60fps (no frame-rate dependence)
249	
250	### Dependencies
251	Phase 1 must be complete.
252	
253	---
254	
255	## Phase 3 — Player Movement &amp; Keyboard Input
256	
257	### Goal
258	Add a goblin player on the left side, wire keyboard input, implement movement/jumping with
259	proper physics, and add desktop touch controls to `input.js`.
260	
261	### Work Items
262	- [ ] Define player state shape in `game.js`
263	- [ ] Implement player horizontal movement (left/right) with dt-based speed
264	- [ ] Implement player jump with JUMP_FORCE, gravity, and ground detection
265	- [ ] Implement player↔floor collision (can't go below FLOOR_Y)
266	- [ ] Implement player↔wall collision (can't leave court)
267	- [ ] Implement player↔net collision (can't cross the net)
268	- [ ] Wire keyboard input in `input.js` (keydown/keyup listeners on `window`)
269	- [ ] Apply player input in `game.update(dt)` via InputState
270	- [ ] Draw player in `renderer.js` (filled rectangle, goblin green)
271	- [ ] Add player position-constraint enforcement in `physicsStep` or `game.update`
272	
273	### Design &amp; Constraints
274	
275	**Player state shape (game.js):**
276	```js
277	{
278	  x: 80,          // left edge of player rect
279	  y: FLOOR_Y - PLAYER_H,  // top of player (standing on floor)
280	  vx: 0,
281	  vy: 0,
282	  onGround: true,
283	  facing: 1,      // 1 = right, -1 = left
284	  lastTouchSeq: -1  // used for touch-count rule in Phase 4
285	}
286	```
287	
288	**Player movement (applied in game.update before physicsStep):**
289	```js
290	// Horizontal
291	if (input.left)  player.vx = -PLAYER_SPEED;
292	else if (input.right) player.vx = PLAYER_SPEED;
293	else player.vx = 0;
294	
295	// Jump — only from ground
296	if (input.jump &amp;&amp; player.onGround) {
297	  player.vy = JUMP_FORCE;
298	  player.onGround = false;
299	}
300	```
301	
302	**Player physics integration (in physicsStep, per-player):**
303	```js
304	player.vy += GRAVITY * dt;
305	player.x  += player.vx * dt;
306	player.y  += player.vy * dt;
307	
308	// Floor
309	if (player.y + PLAYER_H &gt;= FLOOR_Y) {
310	  player.y = FLOOR_Y - PLAYER_H;
311	  player.vy = 0;
312	  player.onGround = true;
313	}
314	
315	// Left wall (player 1 stays in left half: x &gt;= 0, x + PLAYER_W &lt;= NET_X - NET_W/2)
316	player.x = Math.max(0, Math.min(NET_X - NET_W / 2 - PLAYER_W, player.x));
317	
318	// Ceiling
319	if (player.y &lt; 0) { player.y = 0; player.vy = 0; }
320	```
321	
322	Player 2 (AI/remote) mirrors: stays in right half `(NET_X + NET_W/2) &lt;= x &lt;= 800 - PLAYER_W`.
323	
324	**InputState (input.js):**
325	```js
326	export class InputState {
327	  constructor() {
328	    this.left = false; this.right = false;
329	    this.jump = false; this.hit   = false;
330	  }
331	  bind() {
332	    window.addEventListener('keydown', e =&gt; this._onKey(e, true));
333	    window.addEventListener('keyup',   e =&gt; this._onKey(e, false));
334	  }
335	  _onKey(e, down) {
336	    switch (e.code) {
337	      case 'ArrowLeft':  case 'KeyA': this.left  = down; break;
338	      case 'ArrowRight': case 'KeyD': this.right = down; break;
339	      case 'ArrowUp':    case 'KeyW': this.jump  = down; break;
340	      case 'Space':                   this.hit   = down; break;
341	    }
342	    // Prevent page scroll on arrow/space
343	    if (['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code)) e.preventDefault();
344	  }
345	}
346	```
347	
348	**Player rendering (renderer.js):**
349	- Player 1: filled rect at (player.x, player.y, PLAYER_W, PLAYER_H), color `#4a7c3f` (goblin green)
350	- Player 2: color `#7c3f4a` (goblin red/enemy)
351	- Eyes: two white 4px circles at (player.x+8, player.y+14) and (player.x+28, player.y+14)
352	- Pupils: two black 2px circles offset toward facing direction
353	
354	### Acceptance Criteria
355	- [ ] Player spawns at x=80, standing on the floor
356	- [ ] Arrow Left/A moves player left; Arrow Right/D moves player right
357	- [ ] W/Arrow Up jumps; player cannot double-jump (only from ground)
358	- [ ] Player cannot cross the net
359	- [ ] Player cannot leave the court (clamped to left half: x range 0..NET_X-NET_W/2-PLAYER_W)
360	- [ ] Player falls back to ground under gravity after jumping
361	- [ ] No frame-rate-dependent movement (test at 30fps and 60fps: same travel distance per second)
362	
363	### Dependencies
364	Phase 2 must be complete.
365	
366	---
367	
368	## Phase 4 — Hit System &amp; Scoring
369	
370	### Goal
371	Implement the hit mechanic (Space bar launches ball when near player), touch counting rule,
372	rally scoring to 11 (win by 2), score display, win screen, and serve/reset after each point.
373	
374	### Work Items
375	- [ ] Implement hit detection — proximity check + Space input
376	- [ ] Implement ball launch vector formula
377	- [ ] Implement touch counting: max 3 per side, no same player twice in a row
378	- [ ] Implement point scoring: ball hits floor → opponent scores
379	- [ ] Implement win condition: 11 points, win by 2
380	- [ ] Implement serve/reset: positions reset after each point; serve alternates
381	- [ ] Draw score display in `ui.js` (each player's score, centered above their half)
382	- [ ] Draw win screen in `ui.js` (overlay with winner text and restart prompt)
383	- [ ] Wire game states: `serving`, `playing`, `point_scored`, `game_over`
384	- [ ] Write unit tests for scoring logic and touch-count rule
385	
386	### Design &amp; Constraints
387	
388	**GameState additions (game.js):**
389	```js
390	{
391	  phase: 'serving',     // 'serving' | 'playing' | 'point_scored' | 'game_over'
392	  score: [0, 0],        // [player1, player2]
393	  touchCount: 0,        // touches this rally on current side (reset on side change)
394	  lastTouchPlayer: -1,  // 0 = player1, 1 = player2; -1 = none
395	  ballSide: 0,          // 0 = left side, 1 = right side
396	  servePlayer: 0,       // who serves next
397	  pointDelay: 0,        // countdown timer after point scored before reset
398	}
399	```

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

Let me continue reading:

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`</summary>
<pre><code>400	
401	**Hit detection — called in game.update for each player:**
402	```js
403	function tryHit(player, playerIdx, ball, state, input) {
404	  if (!input.hit) return;
405	  const pcx = player.x + PLAYER_W / 2;
406	  const pcy = player.y + PLAYER_H / 2;
407	  const dist = Math.hypot(ball.x - pcx, ball.y - pcy);
408	  if (dist &gt; HIT_RADIUS) return;
409	
410	  // Touch counting rule
411	  const newSide = playerIdx &lt; 1 ? 0 : 1;    // 0 = left team, 1 = right team
412	  if (state.lastTouchPlayer === playerIdx) return; // same player can't hit twice in a row
413	  if (newSide === state.ballSide) {
414	    if (state.touchCount &gt;= 3) return;        // max 3 touches
415	    state.touchCount++;
416	  } else {
417	    state.touchCount = 1;
418	    state.ballSide   = newSide;
419	  }
420	  state.lastTouchPlayer = playerIdx;
421	
422	  // Launch vector
423	  const relX = ball.x - pcx;
424	  const relY = ball.y - pcy;
425	  const len  = Math.hypot(relX, relY) || 1;
426	  ball.vx = (relX / len) * HIT_POWER;
427	  ball.vy = Math.min((relY / len) * HIT_POWER, -150); // always at least slight upward
428	}
429	```
430	
431	**Point scoring — checked in game.update after physicsStep:**
432	```js
433	if (state.phase === 'playing' &amp;&amp; ball.y + BALL_RADIUS &gt;= FLOOR_Y) {
434	  // Ball side at floor determines who scores
435	  const scorer = ball.x &lt; NET_X ? 1 : 0; // left floor → right player scores
436	  state.score[scorer]++;
437	  state.phase      = 'point_scored';
438	  state.pointDelay = 1.5; // seconds
439	}
440	```
441	
442	**Win condition:**
443	```js
444	function checkWin(score) {
445	  if (score[0] &gt;= 11 &amp;&amp; score[0] - score[1] &gt;= 2) return 0;
446	  if (score[1] &gt;= 11 &amp;&amp; score[1] - score[0] &gt;= 2) return 1;
447	  return -1;
448	}
449	```
450	
451	**Serve/reset positions:**
452	```js
453	function resetPositions(state) {
454	  state.ball = { x: state.servePlayer === 0 ? 200 : 600, y: 200, vx: 0, vy: 0 };
455	  state.players[0] = { x: 80,  y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true };
456	  state.players[1] = { x: 680, y: FLOOR_Y - PLAYER_H, vx: 0, vy: 0, onGround: true };
457	  state.touchCount = 0;
458	  state.lastTouchPlayer = -1;
459	  state.ballSide = state.servePlayer;
460	  state.phase = 'serving';
461	}
462	```
463	
464	**Score display (ui.js):** `draw(ctx, state)` method:
465	- Player 1 score: centered at x=200, y=40, white text, font `bold 32px monospace`
466	- Player 2 score: centered at x=600, y=40
467	- Current game phase shown as dim text at top-center if not 'playing'
468	
469	**Win screen:** semi-transparent black overlay, "GOBLIN [1/2] WINS!" in large goblin-green text,
470	"Press R to restart" below. On `R` keydown → `game.reset()`.
471	
472	### Acceptance Criteria
473	- [ ] Pressing Space when player is within HIT_RADIUS of ball launches ball in direction from player center to ball
474	- [ ] Ball always has at least a slight upward component after a hit (never launched straight down)
475	- [ ] 4th touch on same side is rejected — ball is not launched
476	- [ ] Same player cannot hit twice in a row
477	- [ ] Ball landing on left floor awards point to player 2; right floor awards point to player 1
478	- [ ] Score increments correctly and displays on screen
479	- [ ] Win condition: reaching 11+ and leading by 2 triggers win screen
480	- [ ] `node --test tests/physics.test.js` passes: touch-count rule, scoring, win condition tests
481	- [ ] Pressing R on the win screen resets scores and starts a new match
482	
483	### Dependencies
484	Phase 3 must be complete.
485	
486	---
487	
488	## Phase 5 — AI Opponent &amp; Mobile Controls
489	
490	### Goal
491	Add a CPU goblin on the right side that makes the single-player game fun, then add a
492	touch-input overlay so the game is playable on mobile.
493	
494	### Work Items
495	
496	**AI Opponent:**
497	- [ ] Implement `AIController` class in `ai.js`
498	- [ ] AI tracks ball horizontally with position error
499	- [ ] AI jumps when ball reaches a threshold height
500	- [ ] AI hits ball when within HIT_RADIUS
501	- [ ] AI has configurable reaction delay and speed multiplier
502	- [ ] Wire `AIController` into `game.update` as player 2's input source
503	
504	**Mobile Controls:**
505	- [ ] Add touch button definitions in `ui.js` (left/right/jump/hit zones)
506	- [ ] Render touch buttons in `renderer.js` (semi-transparent overlays, min 48px targets)
507	- [ ] Wire `touchstart`/`touchend`/`touchcancel` events in `input.js`
508	- [ ] Touch buttons map to the same `InputState` booleans as keyboard
509	
510	### Design &amp; Constraints
511	
512	**AI constants (ai.js):**
513	```js
514	const AI_SPEED_FACTOR    = 0.85;   // fraction of PLAYER_SPEED the AI can reach
515	const AI_REACTION_DELAY  = 0.12;   // seconds before AI responds to ball direction change
516	const AI_ERROR_RANGE     = 18;     // px — random offset added to target x
517	const AI_JUMP_THRESHOLD  = FLOOR_Y - 180;  // ball.y below this → AI considers jumping
518	const AI_HIT_THRESHOLD   = HIT_RADIUS * 0.9;  // slightly inside hit zone to be reliable
519	```
520	
521	**AIController algorithm (ai.js):**
522	```js
523	export class AIController {
524	  constructor() {
525	    this._errorOffset = 0;
526	    this._reactionTimer = 0;
527	    this._targetX = 0;
528	  }
529	
530	  update(dt, player, ball, state) {
531	    // Only active on right side
532	    this._reactionTimer -= dt;
533	    if (this._reactionTimer &lt;= 0) {
534	      this._reactionTimer = AI_REACTION_DELAY;
535	      // Target: center of player under ball with small random error
536	      this._targetX = ball.x - PLAYER_W / 2 +
537	        (Math.random() * 2 - 1) * AI_ERROR_RANGE;
538	      // Clamp to right half
539	      this._targetX = Math.max(NET_X + NET_W / 2,
540	                       Math.min(800 - PLAYER_W, this._targetX));
541	    }
542	
543	    const pcx = player.x + PLAYER_W / 2;
544	    const dx  = this._targetX - player.x;
545	    const speed = PLAYER_SPEED * AI_SPEED_FACTOR;
546	
547	    // Horizontal movement
548	    const input = { left: false, right: false, jump: false, hit: false };
549	    if (Math.abs(dx) &gt; 4) {
550	      input.left  = dx &lt; 0;
551	      input.right = dx &gt; 0;
552	    }
553	
554	    // Jump when ball is high and on AI's side
555	    if (ball.x &gt; NET_X &amp;&amp; ball.y &lt; AI_JUMP_THRESHOLD &amp;&amp; player.onGround) {
556	      input.jump = true;
557	    }
558	
559	    // Hit when in range
560	    const dist = Math.hypot(ball.x - pcx, ball.y - (player.y + PLAYER_H / 2));
561	    if (dist &lt;= AI_HIT_THRESHOLD) {
562	      input.hit = true;
563	    }
564	
565	    return input;  // game.update reads this instead of InputState for player 2
566	  }
567	}
568	```
569	
570	**Touch button layout (ui.js):**
571	```js
572	// All values in game-space (800×450) pixels
573	export const TOUCH_BUTTONS = {
574	  left:  { x: 10,  y: 330, w: 100, h: 100, label: '◀' },
575	  right: { x: 120, y: 330, w: 100, h: 100, label: '▶' },
576	  jump:  { x: 580, y: 280, w: 100, h: 100, label: '▲' },
577	  hit:   { x: 690, y: 330, w: 100, h: 100, label: '●' },
578	};
579	```
580	Render only when `'ontouchstart' in window`. Draw semi-transparent dark rounded-rect with
581	white label text.
582	
583	**Touch wiring (input.js):**
584	```js
585	bindTouch(canvas) {
586	  const onTouch = (e, down) =&gt; {
587	    e.preventDefault();
588	    for (const touch of e.changedTouches) {
589	      const rect  = canvas.getBoundingClientRect();
590	      const scaleX = 800 / rect.width;
591	      const scaleY = 450 / rect.height;
592	      const gx = (touch.clientX - rect.left) * scaleX;
593	      const gy = (touch.clientY - rect.top)  * scaleY;
594	      for (const [key, btn] of Object.entries(TOUCH_BUTTONS)) {
595	        if (gx &gt;= btn.x &amp;&amp; gx &lt;= btn.x + btn.w &amp;&amp;
596	            gy &gt;= btn.y &amp;&amp; gy &lt;= btn.y + btn.h) {
597	          this[key] = down;
598	        }
599	      }
600	    }
601	  };
602	  canvas.addEventListener('touchstart',  e =&gt; onTouch(e, true),  { passive: false });
603	  canvas.addEventListener('touchend',    e =&gt; onTouch(e, false), { passive: false });
604	  canvas.addEventListener('touchcancel', e =&gt; onTouch(e, false), { passive: false });
605	}
606	```
607	
608	### Acceptance Criteria
609	- [ ] AI goblin moves toward ball and can complete a full rally
610	- [ ] AI is beatable in a ~3-5 minute match (not a pushover, not unbeatable)
611	- [ ] AI does not get stuck at the net or wall
612	- [ ] Touch buttons appear only on touch-capable devices
613	- [ ] All four buttons (left, right, jump, hit) function correctly on mobile
614	- [ ] Touch targets are at least 48px in rendered screen pixels
615	- [ ] A full single-player match can be completed on a mobile device
616	- [ ] **Phase 1 completion gate:** A full match against the AI is fun to play. If not, tune
617	  `AI_SPEED_FACTOR`, `AI_ERROR_RANGE`, and `AI_REACTION_DELAY` before proceeding.
618	
619	### Dependencies
620	Phase 4 must be complete.
621	
622	---
623	
624	## Phase 6 — Multiplayer Server
625	
626	### Goal
627	Build the Node.js WebSocket server: matchmaker queue, game rooms with server-authoritative
628	physics, state snapshots at 20Hz, input rate-limiting, and disconnect/reconnect handling.
629	
630	### Work Items
631	- [ ] `npm init` in project root; add `ws` as only dependency; create `package.json`
632	- [ ] Implement `server/index.js` — WebSocket server on configurable port (default 3000)
633	- [ ] Implement `server/matchmaker.js` — queue players, pair into rooms
634	- [ ] Implement `server/gameRoom.js` — room lifecycle, game loop, snapshot broadcast
635	- [ ] Implement `server/physics.js` — mirrors `client/physics.js` exactly (shared constants)
636	- [ ] Input rate limiting (max 60 messages/sec per client)
637	- [ ] Message size rejection (drop any message &gt; 1KB)
638	- [ ] Disconnect handling: pause game, 30s reconnect window, award match if timeout
639	- [ ] All message types implemented (see protocol below)
640	
641	### Design &amp; Constraints
642	
643	**Server startup (server/index.js):**
644	```js
645	import { WebSocketServer } from 'ws';
646	import { Matchmaker } from './matchmaker.js';
647	
648	const PORT = process.env.PORT || 3000;
649	const wss  = new WebSocketServer({ port: PORT });

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

Let me continue reading the rest of the plan:

<details>
<summary>● `Read(/workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`</summary>
<pre><code>650	const mm   = new Matchmaker();
651	
652	wss.on('connection', ws =&gt; {
653	  // assign a uuid to this connection
654	  const id = crypto.randomUUID();
655	  ws.playerId = id;
656	  ws.lastInputTime = 0;
657	  ws.inputCount = 0;
658	  ws.inputWindowStart = Date.now();
659	  mm.enqueue(ws);
660	  ws.on('message', raw =&gt; handleMessage(ws, raw));
661	  ws.on('close',   ()  =&gt; mm.disconnect(id));
662	});
663	```
664	
665	**Message protocol:**
666	```js
667	// All messages: JSON.stringify({ type, seq, payload })
668	// Client → Server types:
669	//   input:  { keys: { left, right, jump, hit } }
670	//   ready:  {}
671	//   ping:   { clientTs: Date.now() }
672	//   rejoin: { roomId, playerId }
673	//
674	// Server → Client types:
675	//   waiting:              { position: N }   // queue position
676	//   match_found:          { roomId, playerIndex: 0|1 }
677	//   game_start:           { state: &lt;full GameState&gt; }
678	//   state_snapshot:       { seq, ts, state: &lt;full GameState&gt; }
679	//   game_over:            { winner: 0|1, score: [N, N] }
680	//   opponent_disconnected:{ reconnectWindow: 30 }
681	//   pong:                 { clientTs, serverTs: Date.now() }
682	```
683	
684	**Input rate limiting (handleMessage):**
685	```js
686	function handleMessage(ws, raw) {
687	  if (raw.length &gt; 1024) { ws.terminate(); return; }
688	  const now = Date.now();
689	  if (now - ws.inputWindowStart &gt; 1000) {
690	    ws.inputWindowStart = now; ws.inputCount = 0;
691	  }
692	  ws.inputCount++;
693	  if (ws.inputCount &gt; 60) return; // silently drop
694	  const msg = JSON.parse(raw);
695	  // route by msg.type
696	}
697	```
698	
699	**Game room loop (server/gameRoom.js):**
700	```js
701	// Physics at 60Hz, snapshots at 20Hz
702	const TICK_MS     = 1000 / 60;
703	const SNAPSHOT_MS = 1000 / 20;
704	
705	class GameRoom {
706	  constructor(players) {
707	    this.players   = players;  // array of ws connections
708	    this.state     = createInitialState();
709	    this.inputs    = [{ left:false,right:false,jump:false,hit:false }, {...}];
710	    this.seq       = 0;
711	    this._lastTick = Date.now();
712	    this._snapshotAccum = 0;
713	    this._interval = setInterval(() =&gt; this._tick(), TICK_MS);
714	  }
715	
716	  _tick() {
717	    const now = Date.now();
718	    const dt  = Math.min((now - this._lastTick) / 1000, 0.05);
719	    this._lastTick = now;
720	    physicsStep(this.state, dt, this.inputs);
721	    this._checkScoring();
722	    this._snapshotAccum += dt;
723	    if (this._snapshotAccum &gt;= 1 / 20) {
724	      this._snapshotAccum = 0;
725	      this._broadcast({ type: 'state_snapshot', seq: ++this.seq,
726	                        ts: Date.now(), state: this.state });
727	    }
728	  }
729	}
730	```
731	
732	**Server physics (server/physics.js):**
733	Must export the same `physicsStep(state, dt, inputs)` as the client but accepting an
734	`inputs` array `[p1Input, p2Input]` to apply player movement before integrating.
735	Copy constants verbatim from `client/physics.js` — do not import cross-process.
736	
737	**Disconnect handling:**
738	```js
739	// On ws 'close': mark player as disconnected, broadcast opponent_disconnected
740	// Start a 30s timer; if player rejoins (sends 'rejoin' with matching roomId+playerId),
741	// resume room. If timer fires, award match to remaining player, broadcast game_over.
742	```
743	
744	**Port:** Read from `scripts/port.js` for consistency with the harness (`node scripts/port.js`).
745	
746	### Acceptance Criteria
747	- [ ] `node server/index.js` starts without errors
748	- [ ] Two browser clients can connect and be matched into a room
749	- [ ] Server sends `match_found` then `game_start` to both clients
750	- [ ] Server broadcasts `state_snapshot` at ~20Hz (verify with timestamp logging)
751	- [ ] Sending &gt;60 inputs/sec from a single client: excess inputs are silently dropped
752	- [ ] Sending a message &gt; 1KB terminates the offending connection
753	- [ ] Closing one tab: remaining client receives `opponent_disconnected` within 1s
754	- [ ] Reconnecting within 30s resumes the match
755	- [ ] Not reconnecting within 30s: remaining client receives `game_over` with winner
756	
757	### Dependencies
758	Phase 5 must be complete (server physics must match client physics which is tuned in Phase 5).
759	
760	---
761	
762	## Phase 7 — Client Networking &amp; Lobby
763	
764	### Goal
765	Wire the client to the server: send inputs as events, receive and apply state snapshots,
766	interpolate remote player movement, and show a goblin-themed lobby UI for each connection state.
767	
768	### Work Items
769	- [ ] Implement `NetworkClient` class in `client/network.js`
770	- [ ] Implement lobby state machine in `game.js`: `offline → connecting → waiting → matched → in_game → game_over`
771	- [ ] Send `input` messages on each game tick when connected
772	- [ ] Receive `state_snapshot` and apply to game state with interpolation
773	- [ ] Receive `game_over`, `opponent_disconnected` and handle in game state
774	- [ ] Implement linear interpolation for remote player position
775	- [ ] Draw lobby UI states in `ui.js` (connecting spinner, waiting queue, opponent found fanfare, disconnect countdown)
776	- [ ] Add "Multiplayer" button to main menu that triggers `NetworkClient.connect()`
777	- [ ] Update `renderer.js` to show network debug info in dev mode (latency, seq delta)
778	
779	### Design &amp; Constraints
780	
781	**NetworkClient (client/network.js):**
782	```js
783	export class NetworkClient {
784	  constructor(url) {
785	    this.url  = url;
786	    this.ws   = null;
787	    this.seq  = 0;
788	    this.onMessage = null; // set by game.js
789	  }
790	
791	  connect() {
792	    this.ws = new WebSocket(this.url);
793	    this.ws.onopen    = () =&gt; this._send({ type: 'ready' });
794	    this.ws.onmessage = e  =&gt; this.onMessage?.(JSON.parse(e.data));
795	    this.ws.onclose   = () =&gt; this.onMessage?.({ type: '_disconnected' });
796	  }
797	
798	  sendInput(keys) {
799	    this._send({ type: 'input', seq: ++this.seq, payload: { keys } });
800	  }
801	
802	  _send(msg) {
803	    if (this.ws?.readyState === WebSocket.OPEN)
804	      this.ws.send(JSON.stringify(msg));
805	  }
806	}
807	```
808	
809	**Server URL:** `ws://localhost:3000` in dev. Read from `window.GOBLIN_SERVER_URL` if defined
810	(allows override via `&lt;script&gt;window.GOBLIN_SERVER_URL = '...'&lt;/script&gt;` in index.html for prod).
811	
812	**State snapshot application:**
813	Maintain a `snapshotBuffer` of the last 3 snapshots (ring buffer).
814	On each render frame, interpolate between the two most recent snapshots based on
815	`renderTimestamp = now - 100ms` (100ms render delay smooths jitter):
816	```js
817	// Find snapshots straddling renderTimestamp
818	const t0 = buffer[i-1], t1 = buffer[i];
819	const alpha = (renderTimestamp - t0.ts) / (t1.ts - t0.ts);
820	// Lerp remote player position only (local player uses predicted state)
821	remotePlayer.x = lerp(t0.state.players[remoteIdx].x, t1.state.players[remoteIdx].x, alpha);
822	remotePlayer.y = lerp(t0.state.players[remoteIdx].y, t1.state.players[remoteIdx].y, alpha);
823	```
824	`lerp(a, b, t) = a + (b - a) * Math.max(0, Math.min(1, t))`
825	
826	**In multiplayer mode:** local player is predicted client-side (apply inputs immediately).
827	Server's authoritative position for local player is applied with a snap threshold:
828	if server position differs from client prediction by &gt; 50px, snap to server position.
829	Otherwise, blend: `local.x = lerp(local.x, server.x, 0.2)` per frame.
830	
831	**Lobby UI states (ui.js):**
832	- `connecting`: dim overlay + "Connecting to server…" pulsing text
833	- `waiting`: "Seeking a Goblin Opponent…" + queue position if &gt; 1
834	- `matched`: "OPPONENT FOUND!" in goblin-green, 2s fanfare then fades into game
835	- `opponent_disconnected`: "Opponent fled! Reconnecting… (30s)" with countdown
836	- `game_over` (multiplayer): winner announcement + "Play Again?" button
837	
838	### Acceptance Criteria
839	- [ ] Clicking "Multiplayer" connects to server and transitions through lobby states correctly
840	- [ ] Two tabs matched together: both receive game_start and gameplay begins
841	- [ ] Local player input is applied immediately (no perceptible input lag)
842	- [ ] Remote player movement is smooth (no jitter on a LAN connection)
843	- [ ] Closing one tab: remaining player sees disconnect countdown UI
844	- [ ] Reconnecting second tab within 30s: game resumes from current state
845	- [ ] After 30s disconnect, game_over screen shown with winner
846	
847	### Dependencies
848	Phase 6 must be complete and server running on localhost:3000.
849	
850	---
851	
852	## Phase 8 — Polish &amp; Deploy (optional)
853	
854	### Goal
855	Add goblin sprite art, procedural sound effects, particle effects on hit/score, and deploy
856	to Fly.io so the game is publicly playable.
857	
858	### Work Items
859	
860	**Sprites:**
861	- [ ] Draw goblin spritesheet (4 states × 4 frames): idle, run, jump, hit — in `client/sprites/`
862	  using an `&lt;img&gt;` element loaded at startup
863	- [ ] Replace rectangle player rendering in `renderer.js` with `ctx.drawImage(spritesheet, srcX, srcY, 32, 48, player.x, player.y, PLAYER_W, PLAYER_H)`
864	- [ ] Animate: advance frame index every 8 game ticks for run/idle; single frame for jump/hit
865	
866	**Sounds (Web Audio API — no audio files):**
867	- [ ] Implement `AudioManager` in a new `client/audio.js`
868	- [ ] Hit sound: short oscillator burst (sawtooth, 220Hz → 110Hz over 0.08s, gain 0.3 → 0)
869	- [ ] Score sound: two-tone ascending blip (sine, 440Hz then 660Hz, 0.1s each)
870	- [ ] Bounce sound: low thud (triangle, 80Hz, 0.05s decay)
871	- [ ] All sounds created via `AudioContext.createOscillator()` — zero file dependencies
872	
873	**Particles:**
874	- [ ] Implement a simple particle pool in `game.js`: array of `{ x, y, vx, vy, life, maxLife, color }`
875	- [ ] Emit 12 particles on hit: random vx/vy ±200px/s, lifetime 0.4s, goblin-green to transparent
876	- [ ] Emit 20 particles on score: burst upward from ball landing point, orange/yellow
877	- [ ] Render particles in `renderer.js` as small filled circles, alpha = life/maxLife
878	
879	**Deploy to Fly.io:**
880	- [ ] Create `Dockerfile`: FROM node:20-slim, COPY server/, RUN npm ci, EXPOSE 3000, CMD node server/index.js
881	- [ ] Create `fly.toml`: app name, region, internal port 3000, min_machines_running = 1
882	- [ ] Update `client/index.html` for prod: set `window.GOBLIN_SERVER_URL = 'wss://YOUR_APP.fly.dev'`
883	- [ ] Deploy with `fly deploy`
884	
885	### Design &amp; Constraints
886	- **No audio files** — all sounds via Web Audio API oscillators. AudioContext must be created
887	  (or resumed) from a user gesture (click/keypress) to satisfy browser autoplay policy.
888	- **Sprite format**: single horizontal spritesheet PNG, 128×48px (4 frames × 32px wide, 1 row × 48px tall).
889	  Frame order: idle(0), run(1-2), jump(3), hit(4). Player 2 uses `ctx.scale(-1,1)` flip.
890	- **Fly.io minimum machines = 1**: prevents cold-start WebSocket failures.
891	
892	### Acceptance Criteria
893	- [ ] Goblin sprites render correctly for idle, run, jump, and hit states
894	- [ ] Player 2 sprite is horizontally mirrored
895	- [ ] Hit, score, and bounce sounds play without audio file dependencies
896	- [ ] Particles burst on hit and score events, fade correctly
897	- [ ] `fly deploy` succeeds and the game is reachable at the Fly.io URL
898	- [ ] Two browser tabs on different networks can complete a full multiplayer match via Fly.io
899	
900	### Dependencies
901	Phase 7 must be complete. Fly.io account and `fly` CLI must be authenticated.
902	
903	---
904	
905	## Plan Quality
906	
907	**Drafting process:** /draft-plan with adversarial review
908	**Convergence:** See Round History below
909	**Remaining concerns:** See round notes
910	
911	### Round History
912	| Round | Reviewer Findings | Devil's Advocate Findings | Resolved |
913	|-------|-------------------|---------------------------|----------|
914	| 1 | TBD | TBD | TBD |
915	

&lt;system-reminder&gt;
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
&lt;/system-reminder&gt;</code></pre>
</details>
<br>

Now let me check for any additional content in the plan:

● `Bash(wc -l /workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md)`
  ⎿  914 /workspaces/GoblinVolleyball/plans/final-goblin-build-plan.md

Now let me check if there's a project structure to verify the file layout:

<details>
<summary>● `Bash(ls -la /workspaces/GoblinVolleyball/ 2&gt;&amp;1 | head -30)`</summary>
<pre><code>total 36
drwxrwxrwx 1 root   root    4096 Mar 31 15:51 .
drwxr-xr-x 3 root   root    4096 Mar 31 15:31 ..
drwxrwxrwx 1 root   root    4096 Mar 31 15:54 .claude
drwxrwxrwx 1 root   root    4096 Mar 31 15:22 .devcontainer
drwxr-xr-x 1 vscode vscode  4096 Mar 31 15:46 .git
-rw-r--r-- 1 vscode vscode   359 Mar 31 15:46 .gitignore
drwxr-xr-x 1 vscode vscode  4096 Mar 31 15:33 .playwright
-rw-r--r-- 1 vscode vscode 10848 Mar 31 15:42 CLAUDE.md
-rwxrwxrwx 1 root   root    5695 Mar 31 15:22 README.md
-rw-r--r-- 1 vscode vscode 10242 Mar 31 15:36 goblin-volleyball-build-plan.md
drwxr-xr-x 1 vscode vscode  4096 Mar 31 15:54 plans
drwxr-xr-x 1 vscode vscode  4096 Mar 31 15:42 scripts</code></pre>
</details>
<br>

Let me verify the structure of what files should exist according to the plan:

<details>
<summary>● `Bash(ls -la /workspaces/GoblinVolleyball/scripts/)`</summary>
<pre><code>total 68
drwxr-xr-x 1 vscode vscode  4096 Mar 31 15:42 .
drwxrwxrwx 1 root   root    4096 Mar 31 15:51 ..
-rw-r--r-- 1 vscode vscode 57257 Mar 31 15:42 briefing.cjs
-rw-r--r-- 1 vscode vscode  1334 Mar 31 15:42 port.js
-rw-r--r-- 1 vscode vscode  5212 Mar 31 15:42 test-all.js</code></pre>
</details>
<br>

Now I'll compile my comprehensive review of the plan:

## PLAN REVIEW: Goblin Volleyball Final Build Plan

Based on my thorough analysis of the plan against CLAUDE.md constraints, the research context, and `/run-plan` execution requirements, here are my findings:

### Critical Findings

1. **Phase 1: Missing git initialization and package.json details**  
   The plan does not specify creating a `package.json` until Phase 6 (Multiplayer Server). However, ES modules require proper project structure. Work item should clarify: Does Phase 1 also initialize `npm init` with `type: "module"`? Or does the project start with a manually-written minimal `package.json`? The research notes assume this exists, but Phase 1 doesn't explicitly create it. **Action:** Add explicit work item in Phase 1 to "Create minimal `package.json` with `"type": "module"` for ES modules support (ws dependency added in Phase 6)."

2. **Phase 2: Acceptance criterion has frame-rate dependency claim that contradicts tests**  
   Acceptance criterion states "Ball behavior identical at 30fps and 60fps (no frame-rate dependence)" but the test methodology is not specified. CLAUDE.md emphasizes no frame-rate-dependent logic, yet there's no test in `physics.test.js` outlined to verify this. **Action:** Add explicit acceptance criterion sub-item: "Unit test verifies `physicsStep` produces identical final ball position for same distance traveled, regardless of dt values (e.g., one 0.033s step vs. three 0.011s steps)."

3. **Phase 3: Player collision with net is under-specified**  
   The design section shows left-side clamping: `player.x = Math.max(0, Math.min(NET_X - NET_W / 2 - PLAYER_W, player.x))` but this clamping is after physics integration. If a player jumps and their center moves past the net, this hard clamp could cause visible snapping. **Action:** Clarify: Does the net have a collision box that stops midair movement, or is it only a floor-level barrier? If midair crossing is allowed (ball-only), state it explicitly.

4. **Phase 4: Hit direction formula is vague on edge cases**  
   The formula `ball.vy = Math.min((relY / len) * HIT_POWER, -150)` clamps minimum upward velocity. But if the ball is below the player (relY > 0, the relative vector points downward), `(relY / len) * HIT_POWER` is positive, and the clamp forces it to -150, which is correct. However, the design section doesn't explain this edge case behavior in the acceptance criteria. **Action:** Add acceptance criterion: "Hitting a ball directly below the player launches it upward (minimum vy = -150px/s), not downward."

5. **Phase 4: Win-by-2 logic only documented as pseudocode, not unit tests**  
   Acceptance criterion 7 says tests must pass but the actual test assertions are not written in the plan. The pseudocode exists (`checkWin(score)`) but Phase 2's test section only mentions gravity + bounce. **Action:** Add to Phase 4 acceptance criteria: "Unit tests in `tests/physics.test.js` verify: (a) 11-0 score triggers win, (b) 11-9 does NOT trigger win, (c) 13-11 triggers win (win by 2)."

6. **Phase 5: AI acceptance criteria use vague fitness metrics**  
   "Beatable in a ~3-5 minute match (not a pushover, not unbeatable)" is subjective. The **completion gate** says "A full match against the AI is fun to play" — this is a taste judgment, not an objective test. There's no automated acceptance test. **Action:** Replace vague criterion with: "Completing 5 consecutive AI matches: win >= 2, lose >= 1, no match longer than 10 minutes or shorter than 2 minutes (indicates imbalance). If not achieved, tune AI constants per tuning guide in Phase 5 notes."

7. **Phase 6: Server startup does not specify port discovery mechanism**  
   The plan says "Read from `scripts/port.js` for consistency" but doesn't show the actual import. `port.js` exports `getPort()` function, not a CLI output suitable for `process.env.PORT`. **Action:** Phase 6 should clarify: Server reads `process.env.PORT` (set by deployment config) OR calls `import { getPort } from '../scripts/port.js'` to use the same deterministic port as the dev harness. Document the choice.

8. **Phase 6: Multiplayer physics server doesn't handle AI opponent**  
   Phase 5 adds AI locally; Phase 6 moves to server-authoritative physics. But the plan doesn't say: Does player 2 remain AI-controlled locally in multiplayer, or is the server running two real players? The `physicsStep(state, dt, inputs)` signature accepts `inputs` but doesn't specify source. **Action:** Clarify in Phase 6: "In multiplayer matches, both players are remote (no AI). Server physics applies inputs from both clients to shared authoritative state. AI remains active only in single-player modes, run client-side on player 2."

9. **Phase 6: Server disconnect timeout is wall-clock time, not game-time**  
   Design says "30s reconnect window" using `Date.now()` but game ticks at 60Hz (16.7ms per tick). The spec doesn't clarify: If server pauses the game room while waiting for reconnect, how is game time handled? Should server clock advance during pause, or stay frozen? **Action:** Add: "During disconnect window: game room is paused, `physicsStep` is not called, 30s countdown uses wall-clock time via `Date.now()`, not game ticks."

10. **Phase 7: Interpolation buffer size and smoothing assumptions are under-tested**  
    The plan says "maintain a `snapshotBuffer` of the last 3 snapshots" and render with 100ms delay, but doesn't specify: (a) What happens if snapshots arrive faster than 100ms apart? (b) What happens if a snapshot is missed? (c) Is the 100ms delay suitable for all frame rates? **Action:** Add acceptance criterion: "Unit test: manually queued snapshots spaced 50ms apart are interpolated smoothly; verify linear interpolation formula produces expected intermediate positions."

11. **Phase 7: "Snap threshold" blending logic has no acceptance test**  
    Design says "if server position differs by > 50px, snap; else blend at 0.2". No test verifies this threshold triggers correctly. **Action:** Add: "Unit test: local prediction 60px ahead of server → snap to server. Local prediction 40px ahead → blend at 0.2 per frame until within threshold."

12. **Phase 8: Dockerfile and Fly.io config assume Node.js, but plan never specifies server runtime**  
    Phase 8 says `FROM node:20-slim` and `npm ci`, but earlier phases don't confirm Node.js version compatibility with `ws` package and `import`/`export` syntax. **Action:** Add Phase 6 pre-requirement: "Project requires Node.js ≥18 (supports ES modules natively). Dockerfile specifies node:20-slim."

13. **Constant synchronization risk between client and server**  
    Phase 2 exports constants from `physics.js`; Phase 6 says server must "copy constants verbatim — do not import cross-process". This creates divergence risk if a tuning constant is changed in one place. **Action:** Add Phase 6 note: "After Phase 5 tuning, synchronize `server/physics.js` constants with `client/physics.js` exactly. Consider adding a CI check (future) to fail if constants differ."

14. **Phase 1-5 acceptance criteria do not specify browser compatibility testing**  
    Plan assumes modern ES modules and Canvas support but doesn't mention testing in Chrome, Firefox, Safari. CLAUDE.md doesn't specify browser support policy. **Action:** (Minor) Add note: "All phases assume modern browser with ES modules support (Chrome 61+, Firefox 67+, Safari 11+). No IE support required."

15. **Phase 5: Touch button scaling ignores HiDPI displays**  
    `input.js` calculates touch coordinates by scaling from `canvas.getBoundingClientRect()` but doesn't account for `devicePixelRatio`. On a 2x HiDPI display, the touch hit boxes may be misaligned. **Action:** Fix in Phase 5 design: Calculate `scaleX = canvas.width / rect.width` (uses internal pixel size) instead of `800 / rect.width` (uses CSS size).

---

### Format & Execution Issues

16. **Progress tracker table uses emoji ⬚ but plan parser expects text like "pending"**  
    The table shows `| Phase | Status | Commit | Notes |` with `⬚` (empty square) as status. The `/run-plan` skill likely expects `pending`, `in_progress`, or `completed` as status values. **Action:** Update Progress Tracker to use text statuses: `| Phase | Status | Commit | Notes |` with `pending` instead of `⬚`.

17. **Plan contains "Plan Quality" section with placeholder table (Round History)**  
    The "Round History" table shows `| TBD | TBD | TBD | TBD |`. This is incomplete and suggests the plan was not finalized through the `/draft-plan` adversarial review process mentioned. **Action:** Either remove the "Plan Quality" section or fill in actual review round results from the research/drafting process.

---

### Scope & Dependency Issues

18. **Phase ordering is good (shared infrastructure first)** ✓  
   Canvas setup → Physics → Player controls → Hitting → AI → Server → Networking → Polish. No dependencies are inverted.

19. **All work items are specific enough to implement** ✓  
   Each phase lists discrete, measurable sub-items with code snippets.

20. **Constraints from CLAUDE.md are respected** ✓  
   - No build step (ES modules via `<script type="module">`)
   - No external client libraries (Vanilla JS only)
   - `ws` allowed for server (Phase 6)
   - Canvas rendering specified
   - No deployment to Vercel/Netlify (Fly.io in Phase 8)
   - Deterministic port from `scripts/port.js`

---

### Summary Table

| # | Phase(s) | Issue | Severity | Action |
|---|----------|-------|----------|--------|
| 1 | 1 | Missing `package.json` setup with ES modules | Medium | Add explicit work item to Phase 1 |
| 2 | 2 | Frame-rate independence test not specified | Medium | Add unit test details to acceptance criteria |
| 3 | 3 | Net collision physics under-specified | Medium | Clarify if net blocks midair movement or floor-only |
| 4 | 4 | Hit direction edge cases not documented | Low | Add clarification to acceptance criteria |
| 5 | 4 | Win-by-2 unit tests not written | Medium | Add test assertions to Phase 4 acceptance criteria |
| 6 | 5 | AI fitness metrics are subjective (fun, balance) | Medium | Replace with objective automated test criteria |
| 7 | 6 | Server port discovery mechanism unclear | Medium | Document if using env var or `getPort()` function |
| 8 | 6 | Server physics doesn't clarify AI vs. multiplayer mode | Medium | Specify AI is client-side only in multiplayer |
| 9 | 6 | Disconnect pause behavior not specified (wall-clock vs. game-time) | Low | Clarify game room pauses during 30s reconnect window |
| 10 | 7 | Interpolation buffer edge cases not tested | Low | Add unit tests for snapshot arrival rates |
| 11 | 7 | Snap-threshold blending has no acceptance test | Low | Add unit test for threshold triggering |
| 12 | 8 | Node.js version not specified | Low | Specify Node.js ≥18, document in Phase 6 pre-req |
| 13 | 6,8 | Server/client constant divergence risk | Low | Add note about synchronizing tuning constants |
| 14 | 1-5 | Browser compatibility not specified | Low | Add note about modern browser requirements |
| 15 | 5 | HiDPI touch scaling ignores devicePixelRatio | Medium | Fix touch hit box calculation in Phase 5 design |
| 16 | Metadata | Progress tracker uses emoji instead of text status | Medium | Update status column to use `pending` text |
| 17 | Metadata | "Plan Quality" section is incomplete (TBD) | Low | Complete or remove placeholder review table |
