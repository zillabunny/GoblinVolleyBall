/**
 * serve.js — combined static file server + WebSocket game server (dev mode)
 * Serves client/ files AND handles WebSocket connections on the same port,
 * so port-forwarding (VS Code, ngrok, etc.) works without extra config.
 * Usage: node scripts/serve.js   (or: npm start)
 */
import { createServer }  from 'node:http';
import { readFile }      from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { matchmaker }    from '../server/matchmaker.js';
import { getPort }       from './port.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '../client');
const PORT      = getPort();

const MAX_MSG_BYTES  = 1024;
const INPUT_RATE_MAX = 60;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

// ─── HTTP (static files) ─────────────────────────────────────────────────────
const httpServer = createServer(async (req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  const file = join(ROOT, url);

  if (!file.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  try {
    const data = await readFile(file);
    const ext  = extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});

// ─── WebSocket (game server) — same port ─────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.inputWindowStart = Date.now();
  ws.inputCount       = 0;

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

// ─── Start ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Goblin Volleyball running at http://localhost:${PORT}`);
  console.log(`WebSocket game server on the same port (ws://localhost:${PORT})`);
});
