/**
 * serve.js — minimal static file server for client/
 * Serves files from the client/ directory over HTTP so ES modules work.
 * Usage: node scripts/serve.js
 */
import { createServer } from 'node:http';
import { readFile }     from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPort }       from './port.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '../client');
const PORT      = getPort();

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

createServer(async (req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  const file = join(ROOT, url);

  // Safety: don't escape ROOT
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
}).listen(PORT, () => {
  console.log(`Goblin Volleyball running at http://localhost:${PORT}`);
});
