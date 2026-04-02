/**
 * Integration tests for the Phase 6 WebSocket server.
 * Starts the server in-process, runs checks, then shuts down.
 *
 * Run: node tests/server.test.js
 */

import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { matchmaker } from '../server/matchmaker.js';

// ─── Mini test harness ───────────────────────────────────────────────────────
let passed = 0, failed = 0;
function ok(label, cond) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else       { console.error(`  ✗ ${label}`); failed++; }
}
function section(name) { console.log(`\n${name}`); }

// ─── In-process server ───────────────────────────────────────────────────────
const PORT = 29999;
const MAX_MSG_BYTES  = 1024;
const INPUT_RATE_MAX = 60;

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.inputWindowStart = Date.now();
  ws.inputCount = 0;
  matchmaker.addPlayer(ws);

  ws.on('message', (raw) => {
    if (raw.length > MAX_MSG_BYTES) { ws.close(); return; }
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'input') {
      const now = Date.now();
      if (now - ws.inputWindowStart > 1000) { ws.inputWindowStart = now; ws.inputCount = 0; }
      ws.inputCount++;
      if (ws.inputCount > INPUT_RATE_MAX) return;
      const room = ws._room;
      if (!room) return;
      const keys = msg.payload?.keys;
      if (!keys || typeof keys !== 'object') return;
      room.onInput(ws._playerIndex, keys);
    }
  });

  ws.on('close', () => {
    matchmaker.removePlayer(ws);
    if (ws._room) ws._room.onDisconnect(ws._playerIndex);
  });

  ws.on('error', () => {});
});

await new Promise(resolve => httpServer.listen(PORT, resolve));
console.log(`\nTest server listening on port ${PORT}`);

// ─── Helpers ────────────────────────────────────────────────────────────────

// Buffer all messages from the moment the connection opens — never miss one
function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    ws._buffer  = [];
    ws._waiters = [];
    ws.on('message', raw => {
      const msg = JSON.parse(raw);
      if (ws._waiters.length > 0) {
        ws._waiters.shift()(msg);
      } else {
        ws._buffer.push(msg);
      }
    });
    ws.on('open',  () => resolve(ws));
    ws.on('error', reject);
  });
}

function nextMsg(ws, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (ws._buffer.length > 0) { resolve(ws._buffer.shift()); return; }
    const t = setTimeout(() => reject(new Error('timeout waiting for message')), timeoutMs);
    ws._waiters.push(msg => { clearTimeout(t); resolve(msg); });
  });
}

function collectMsgs(ws, durationMs) {
  return new Promise(resolve => {
    const msgs = [];
    const waiter = msg => { msgs.push(msg); ws._waiters.push(waiter); };
    ws._waiters.push(waiter);
    setTimeout(() => {
      // Remove pending waiter
      const idx = ws._waiters.indexOf(waiter);
      if (idx !== -1) ws._waiters.splice(idx, 1);
      // Drain buffer too
      while (ws._buffer.length) msgs.push(ws._buffer.shift());
      resolve(msgs);
    }, durationMs);
  });
}

function send(ws, obj) { ws.send(JSON.stringify(obj)); }
const defaultKeys = { left: false, right: false, jump: false, hit: false };

// Find the server-side socket for a given client player index in a room
function serverSocket(room, playerIdx) {
  return room.players[playerIdx];
}

// ─── Test 1: Matchmaking ─────────────────────────────────────────────────────
section('1. Matchmaking');
const p1 = await connect();
const p2 = await connect();

const mf1 = await nextMsg(p1);
const mf2 = await nextMsg(p2);
ok('both clients receive match_found',   mf1.type === 'match_found' && mf2.type === 'match_found');
ok('player indices are 0 and 1',         [mf1.payload.playerIndex, mf2.payload.playerIndex].sort().join() === '0,1');
ok('same roomId',                        mf1.payload.roomId === mf2.payload.roomId);

const gs1 = await nextMsg(p1);
const gs2 = await nextMsg(p2);
ok('both clients receive game_start',    gs1.type === 'game_start' && gs2.type === 'game_start');
ok('game_start includes state',          !!gs1.payload.state);
ok('game_start includes playerIndex',    gs1.payload.playerIndex !== undefined);
ok('initial phase is serving',           gs1.payload.state.phase === 'serving');
ok('initial score is 0-0',              JSON.stringify(gs1.payload.state.score) === '[0,0]');

// Get the room reference from the server-side socket
const serverWs1 = [...wss.clients].find(c => c._playerIndex === 0);
const room = serverWs1?._room;
ok('room was created',                   !!room);

// ─── Test 2: State snapshots at ~60Hz ────────────────────────────────────────
section('2. State snapshots (~60Hz)');
const snapshots = (await collectMsgs(p1, 1000)).filter(m => m.type === 'state_snapshot');
ok(`snapshot count in 1s (got ${snapshots.length}, want 45–75)`, snapshots.length >= 45 && snapshots.length <= 75);
ok('snapshot has seq',                   snapshots[0]?.payload?.seq !== undefined);
ok('snapshot has ts',                    snapshots[0]?.payload?.ts  !== undefined);
ok('snapshot has state',                 !!snapshots[0]?.payload?.state);
ok('seq increments monotonically',       snapshots.length > 1 && snapshots[1].payload.seq > snapshots[0].payload.seq);

// ─── Test 3: Input messages ───────────────────────────────────────────────────
section('3. Input handling');
send(p1, { type: 'input', payload: { keys: { ...defaultKeys, right: true } } });
send(p2, { type: 'input', payload: { keys: { ...defaultKeys, left:  true } } });
await new Promise(r => setTimeout(r, 200));
const afterInput = (await collectMsgs(p1, 300)).filter(m => m.type === 'state_snapshot');
ok('server still alive after inputs',    afterInput.length > 0);

// ─── Test 4: hitPressed reconstruction ───────────────────────────────────────
section('4. hitPressed reconstruction');
if (room) {
  // Reset prevHit to known state
  room._prevHit[0] = false;
  room.onInput(0, { ...defaultKeys, hit: true });
  ok('first hit=true → hitPressed=true',   room._inputs[0].hitPressed === true);
  room.onInput(0, { ...defaultKeys, hit: true });
  ok('held hit=true → preserves unconsumed hitPressed', room._inputs[0].hitPressed === true);
  room.onInput(0, { ...defaultKeys, hit: false });
  room.onInput(0, { ...defaultKeys, hit: true });
  ok('hit after release → hitPressed=true', room._inputs[0].hitPressed === true);
  // Clean up
  room._prevHit[0] = false;
  room._inputs[0]  = { ...defaultKeys };
} else {
  ok('room accessible for hitPressed test', false);
  ok('room accessible for hitPressed test', false);
  ok('room accessible for hitPressed test', false);
}

// ─── Test 5: Rate limiting ────────────────────────────────────────────────────
section('5. Rate limiting (>60 inputs/sec)');
if (room) {
  const sw = serverSocket(room, 0); // server-side socket for player 0
  sw.inputWindowStart = Date.now();
  sw.inputCount = 0;
  // Send 80 inputs — first 60 processed, remainder silently dropped
  for (let i = 0; i < 80; i++) {
    send(p1, { type: 'input', payload: { keys: defaultKeys } });
  }
  await new Promise(r => setTimeout(r, 200));
  // inputCount reflects ALL received messages; drop logic fires when count > 60
  ok(`all 80 messages received by server (got ${sw.inputCount})`, sw.inputCount === 80);
  ok('connection still open after burst', sw.readyState === WebSocket.OPEN);
  // Verify server still processes messages after the burst (window resets)
  sw.inputWindowStart = Date.now() - 1001; // force window reset on next message
  send(p1, { type: 'input', payload: { keys: defaultKeys } });
  await new Promise(r => setTimeout(r, 100));
  ok('rate limit window resets after 1s', sw.inputCount === 1);
} else {
  ok('room accessible for rate limit test', false);
  ok('room accessible for rate limit test', false);
}

// ─── Test 6: Oversized message closes connection ──────────────────────────────
section('6. Oversized message (>1KB) closes connection');
const p3 = await connect();
const p4 = await connect();
await nextMsg(p3); await nextMsg(p4); // match_found
await nextMsg(p3); await nextMsg(p4); // game_start
const p3closed = new Promise(resolve => p3.once('close', resolve));
p3.send('x'.repeat(1025));
const result = await Promise.race([p3closed, new Promise(r => setTimeout(() => r('timeout'), 1500))]);
ok('oversized message closes the connection', result !== 'timeout');
p4.close();

// ─── Test 7: Disconnect notification ─────────────────────────────────────────
section('7. Disconnect handling');
const p5 = await connect();
const p6 = await connect();
await nextMsg(p5); await nextMsg(p6); // match_found
await nextMsg(p5); await nextMsg(p6); // game_start
p5.close();
const discMsgs = await collectMsgs(p6, 1000);
const disc = discMsgs.find(m => m.type === 'opponent_disconnected');
ok('remaining client receives opponent_disconnected', !!disc);
ok('reconnectWindow === 30',             disc?.payload?.reconnectWindow === 30);
p6.close();

// ─── Cleanup & results ────────────────────────────────────────────────────────
p1.close();
p2.close();
await new Promise(r => setTimeout(r, 300));
httpServer.close();

console.log(`\n${'─'.repeat(40)}`);
console.log(`Tests: ${passed + failed} | ✓ Passed: ${passed} | ✗ Failed: ${failed}`);
if (failed > 0) process.exit(1);
