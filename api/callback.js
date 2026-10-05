// Panel girişi, 2. adım: GitHub'ın döndürdüğü kodu erişim anahtarıyla değiştirir ve sonucu panel penceresine iletir.
// Gizli anahtar Vercel ortam değişkeninden okunur (GITHUB_CLIENT_SECRET), tarayıcıya hiç gönderilmez.

async function exchange(code) {
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await res.json();
    if (data.access_token) return { status: 'success', payload: { token: data.access_token, provider: 'github' } };
    return { status: 'error', payload: { message: data.error_description || 'GitHub girişi tamamlanamadı.' } };
  } catch {
    return { status: 'error', payload: { message: 'GitHub ile bağlantı kurulamadı.' } };
  }
}

export default async function handler(req, res) {
  const { code, state } = req.query;
  const expected = req.cookies?.['admin-oauth-state'];
  res.setHeader('Set-Cookie', 'admin-oauth-state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  const result =
    typeof code === 'string' && typeof state === 'string' && state === expected
      ? await exchange(code)
      : { status: 'error', payload: { message: 'Giriş doğrulanamadı, lütfen tekrar deneyin.' } };

  // Panelin beklediği biçim: "authorization:github:success:{...}" veya "authorization:github:error:{...}"
  const message = `authorization:github:${result.status}:${JSON.stringify(result.payload)}`;
  const text = result.status === 'success' ? 'Giriş yapıldı, bu pencere kapanıyor…' : 'Giriş tamamlanamadı.';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(`<!doctype html>
<meta charset="utf-8">
<title>Panel girişi</title>
<body style="margin:0;height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F4F4F1;color:#0A0A0A">
<p>${text}</p>
<script>
  // Sonuç yalnızca aynı adreste açık olan panel penceresine gönderilir
  if (window.opener) window.opener.postMessage(${JSON.stringify(message).replace(/</g, '\\u003c')}, window.location.origin);
  setTimeout(function () { window.close(); }, 300);
</script>
</body>`);
}
