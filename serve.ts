// Leonida Trophy Guide — tiny static server for trying the guide locally.
// Serves app/ at its root on http://127.0.0.1:8080 (or $PORT). Standard
// library only; no build step, no network requests of its own.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), 'app');
const PORT = Number(process.env.PORT || 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const raw = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    const rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
    const path = resolve(APP_DIR, rel);
    if (!path.startsWith(APP_DIR + sep) && path !== APP_DIR) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const bytes = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Leonida Trophy Guide at http://127.0.0.1:${PORT}/`);
});
