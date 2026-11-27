import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const mime = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp':'image/webp', '.json':'application/json; charset=utf-8', '.mp4': 'video/mp4', '.webm':'video/webm', '.woff2':'font/woff2' };

export async function serveLibrary({ port = 0, root = base, allowReplay = false } = {}) {
  const windows = new Map();
  const server = createServer(async (request, response) => {
    const open = request.url.match(/^\/open-archived-site\/([a-z][a-z0-9-]{0,69})$/);
    if (open && request.method==='POST') {
      const expected='127.0.0.1:'+server.address().port;
      if(!allowReplay||request.headers.host!==expected||request.headers.origin!=='http://'+expected||request.headers['x-reference-replay']!=='1'){
        response.writeHead(403).end();return;
      }
      const id=open[1];
      const archive=resolve(root,'blueprints/reference-components/private-reference/website-replays',id);
      try{if(!(await stat(resolve(archive,'archive.json'))).isFile()) throw Error();}
      catch{response.writeHead(404).end();return;}
      if(windows.has(id)){response.writeHead(202).end();return;}
      const child=spawn(process.execPath,[resolve(root,'scripts/replay-ui.mjs'),'open',archive],{
        cwd:root,stdio:'ignore',windowsHide:true
      });
      windows.set(id,child);
      child.once('exit',()=>windows.delete(id));
      child.once('error',()=>{windows.delete(id);if(!response.headersSent)response.writeHead(503).end();});
      child.once('spawn',()=>response.writeHead(202).end());
      return;
    }
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const route = pathname === '/' ? '/blueprints/reference-components/index.html' : pathname;
      const file = resolve(root, '.' + route);
      const type = mime[extname(file)];
      const allowed = ['blueprints', 'references', 'media/preview-loops'].some(prefix => file.startsWith(resolve(root, prefix) + sep));
      if (!allowed || !type) { response.writeHead(404).end(); return; }
      const { size } = await stat(file);
      const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
      const start = range ? Number(range[1]) : 0;
      const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end) { response.writeHead(416, { 'Content-Range': 'bytes */' + size }).end(); return; }
      if (range) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size;
      headers['Content-Length'] = end - start + 1;
      response.writeHead(range ? 206 : 200, headers);
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = createReadStream(file, { start, end });
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch {
      if (!response.headersSent) response.writeHead(404).end();
      else response.destroy();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const origin = 'http://127.0.0.1:' + server.address().port;
  return { origin, url: origin + '/blueprints/reference-components/index.html',
    close: () => new Promise(resolve => server.close(resolve)) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = process.argv[2] ? Number(process.argv[2]) : 63845;
  const server = await serveLibrary({ port,allowReplay:true });
  console.log(server.url);
}
