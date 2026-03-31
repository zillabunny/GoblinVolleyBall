// server/index.js — WebSocket server entry point
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { matchmaker } from './matchmaker.js';

// ---------------------------------------------------------------------------
// Port resolution: PORT env var (e.g., Fly.io) → scripts/port.js + 1
// ---------------------------------------------------------------------------
let PORT;
if (process.env.PORT) {
  PORT = parseInt(process.env.PORT, 10);
} else {
  const { getPort } = await import('../scripts/port.js');
  PORT = getPort() + 1; // dev server is on getPort(); WS server is +1
}

const MAX_MSG_BYTES  = 1024; // 1 KB — reject larger messages
const INPUT_RATE_MAX = 60;   // max input messages per 1-second window

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Goblin Volleyball WS server');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  // Rate-limiting state (fixed 1s window)
  ws.inputWindowStart = Date.now();
  ws.inputCount       = 0;

  console.log(`[ws] Client connected (${wss.clients.size} total)`);

  matchmaker.addPlayer(ws);

  ws.on('message', (raw) => {
    // 1. Size guard
    if (raw.length > MAX_MSG_BYTES) {
      console.warn('[ws] Oversized message — dropping connection');
      ws.close();
      return;
    }

    // 2. Parse JSON
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return; // ignore malformed
    }

    if (!msg || typeof msg.type !== 'string') return;

    // 3. Route by type
    if (msg.type === 'input') {
      // Input rate limiting — fixed window
      const now = Date.now();
      if (now - ws.inputWindowStart > 1000) {
        ws.inputWindowStart = now;
        ws.inputCount = 0;
      }
      ws.inputCount++;
      if (ws.inputCount > INPUT_RATE_MAX) return; // silently drop

      const room = ws._room;
      if (!room) return;
      const keys = msg.payload?.keys;
      if (!keys || typeof keys !== 'object') return;
      room.onInput(ws._playerIndex, keys);
    }
    // Future message types can be routed here
  });

  ws.on('close', () => {
    console.log(`[ws] Client disconnected`);
    // If still in matchmaking queue, remove
    matchmaker.removePlayer(ws);
    // If in a room, notify room
    if (ws._room) {
      ws._room.onDisconnect(ws._playerIndex);
    }
  });

  ws.on('error', (err) => {
    console.error('[ws] Socket error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] Goblin Volleyball WS server listening on port ${PORT}`);
});
