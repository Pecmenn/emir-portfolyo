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

    // Yalnızca panelin kendi sayfasından gelen istekler kabul edilir. Geliştirme sunucusu açıkken ziyaret edilen
    // başka bir site (ya da localhost'taki başka bir port) tarayıcı üzerinden bu uca yazamaz; yerel adrese
    // yönlendirilmiş yabancı bir alan adı da kullanılamaz. Kayıt yalnızca JSON gövdeyle gelir: başka sitelerin
    // ön kontrolsüz gönderebildiği düz metin ve form istekleri reddedilir.
    const host = req.headers.host ?? '';
    const origin = req.headers.origin;
    const fetchSite = req.headers['sec-fetch-site'];
    const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const sameOrigin = (!origin || origin === `http://${host}`) && (!fetchSite || fetchSite === 'same-origin' || fetchSite === 'none');
    if (!localHost || !sameOrigin) return send(403, { message: 'Yerel panel yalnızca kendi sayfasından kullanılabilir' });
    if (req.method === 'POST' && !(req.headers['content-type'] ?? '').startsWith('application/json')) {
      return send(415, { message: 'Kayıt isteği JSON olmalı' });
    }

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
        // Boş liste "git add -A" ile çalışma klasöründeki her şeyi commit'lerdi
        if (!Array.isArray(changes) || changes.length === 0) throw new Error('Kaydedilecek değişiklik yok');
        if (typeof message !== 'string' || !message.trim()) throw new Error('Kayıt mesajı eksik');
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
