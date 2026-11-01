// Görselleri WebP'ye çevirir ve en fazla verilen genişliğe küçültür (tarayıcının kendi kodlayıcısıyla; ek paket gerekmez).
// Kullanım: node tools/webp.mjs <playwright-core yolu> <genişlik> <kalite 0-1> kaynak=hedef.webp[#kırpılacak oran] ...
// #2.164 gibi bir oran verilirse görsel üstten o en/boy oranında kırpılır (ör. uzun telefon ekran görüntüleri)
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, extname } from 'node:path';

const [pwPath, maxW, quality, ...pairs] = process.argv.slice(2);
const pw = await import(pathToFileURL(pwPath));
const { chromium } = pw.default ?? pw;
const browser = await chromium.launch();
const page = await browser.newPage();
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
for (const pair of pairs) {
  const [src, target] = pair.split('=');
  const [dst, ratio] = target.split('#');
  const data = `data:${mime[extname(src).toLowerCase()] ?? 'image/png'};base64,${readFileSync(src).toString('base64')}`;
  const out = await page.evaluate(
    async ({ data, maxW, quality, ratio }) => {
      const img = new Image();
      img.src = data;
      await img.decode();
      const scale = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      const srcH = ratio ? Math.min(img.naturalHeight, Math.round(img.naturalWidth * ratio)) : img.naturalHeight;
      c.height = Math.round(srcH * scale);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, c.width, c.height);
      return { url: c.toDataURL('image/webp', quality), w: c.width, h: c.height };
    },
    { data, maxW: Number(maxW), quality: Number(quality), ratio: ratio ? Number(ratio) : 0 },
  );
  mkdirSync(dirname(dst), { recursive: true });
  const buf = Buffer.from(out.url.split(',')[1], 'base64');
  writeFileSync(dst, buf);
  console.log(`${dst} ${out.w}x${out.h} ${Math.round(buf.length / 1024)}KB`);
}
await browser.close();
