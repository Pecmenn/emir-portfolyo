// Panel girişi, 1. adım: GitHub OAuth onay sayfasına yönlendirir.
// İstemci kimliği Vercel ortam değişkeninden okunur (GITHUB_CLIENT_ID).
import { randomBytes } from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('Panel girişi henüz ayarlanmadı: GITHUB_CLIENT_ID tanımlı değil.');
    return;
  }

  // Dönüşte isteğin bu pencereden başladığını doğrulamak için tek kullanımlık anahtar
  const state = randomBytes(16).toString('hex');
  const host = req.headers['x-forwarded-host'] || req.headers.host;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `https://${host}/api/callback`);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set('state', state);

  res.setHeader('Set-Cookie', `admin-oauth-state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.redirect(302, url.toString());
}
