import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { recommend } from './assistant.mjs';

export function createDemoServer() {
  return createServer(async (request, response) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (request.method !== 'GET') { response.writeHead(405).end(); return; }
      if (url.pathname === '/') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(await readFile(new URL('./demo.html', import.meta.url))); return;
      }
      if (url.pathname !== '/recommendation') { response.writeHead(404).end(); return; }
      const entries = [...url.searchParams];
      if (entries.length !== 2 || new Set(entries.map(([key]) => key)).size !== 2) throw new Error('Invalid options');
      const result = await recommend(Object.fromEntries(entries));
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(result));
    } catch { response.writeHead(400).end('Choose a valid runtime and operation'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3001);
  createDemoServer().listen(port, '127.0.0.1', () => console.log(`Local fixture assistant: http://127.0.0.1:${port}`));
}
