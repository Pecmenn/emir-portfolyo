// Yalnızca geliştirme sunucusunda çalışan yerel kayıt ucu: panel localhost'ta açıkken
// içeriği GitHub yerine doğrudan proje dosyalarından okur ve dosyalara yazar.
// Her kayıt yerel bir git commit'i olarak birikir; push edilmez.
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import type { Connect } from 'vite';

const ALLOWED = ['src/content/', 'public/images/', 'public/videos/', 'public/cv/'];

// Yalnızca içerik ve medya klasörlerine yazılabilir; proje dışına çıkan yollar reddedilir
function safePath(root: string, path: string) {
  const full = resolve(root, path);
  const rel = relative(root, full).replace(/\\/g, '/');
  if (rel.startsWith('..') || !ALLOWED.some((dir) => rel.startsWith(dir))) throw new Error(`İzin verilmeyen yol: ${path}`);
  return full;
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((ok, fail) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
    req.on('error', fail);
  });
}

function git(root: string, args: string[]) {
  return new Promise<void>((ok) => execFile('git', args, { cwd: root }, () => ok()));
}

type Change = { path: string; text?: string; base64?: string; delete?: boolean };

export function localAdminMiddleware(root: string): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/__local-admin/')) return next();
    const url = new URL(req.url, 'http://localhost');
    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
    };
    try {
      if (url.pathname === '/__local-admin/file') {
        return send(200, JSON.parse(await readFile(safePath(root, url.searchParams.get('path') ?? ''), 'utf8')));
      }
      if (url.pathname === '/__local-admin/dir') {
        const dir = url.searchParams.get('path') ?? '';
        const names = await readdir(safePath(root, dir));
        return send(
          200,
          names.map((name) => ({ name, path: `${dir}/${name}`, type: 'file' })),
        );
      }
      if (url.pathname === '/__local-admin/commit' && req.method === 'POST') {
        const { changes, message } = JSON.parse(await readBody(req)) as { changes: Change[]; message: string };
        const touched: string[] = [];
        for (const c of changes) {
          const full = safePath(root, c.path);
          if (c.delete) await rm(full, { force: true });
          else {
            await mkdir(dirname(full), { recursive: true });
            await writeFile(full, c.base64 !== undefined ? Buffer.from(c.base64, 'base64') : c.text ?? '');
          }
          touched.push(c.path);
        }
        // Kaydı yerel bir commit olarak biriktir (push edilmez)
        await git(root, ['add', '-A', '--', ...touched]);
        await git(root, ['commit', '-m', `${message} (yerel)`, '--', ...touched]);
        return send(200, { ok: true });
      }
      return send(404, { message: 'Bulunamadı' });
    } catch (err) {
      return send(400, { message: err instanceof Error ? err.message : 'Hata' });
    }
  };
}
