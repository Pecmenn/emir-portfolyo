// Yeşil ekranlı sahne HTML'lerinden (Portfolyo-* / sahneler / fin-*.html) ekran yerleşimini çıkarır:
// fotoğrafın görüntü boyutu, her ekranın perspektif matrisi (matrix3d) ve ekran maskesi (parmaklar önde kalsın diye).
// Maskeleri PNG olarak kaydeder, yerleşimi JSON olarak yazdırır.
// Kullanım: node tools/sahne-cikar.mjs <fin-*.html> <maske klasörü> <maske url öneki>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

const [file, outDir, urlPrefix] = process.argv.slice(2);
const html = readFileSync(file, 'utf8');
const name = basename(file, '.html').replace(/^fin-/, '');
const [, w, h] = html.match(/body\{width:(\d+)px;height:(\d+)px/);
mkdirSync(outDir, { recursive: true });
const screens = [];
const re = /<div class="scr" style="-webkit-mask:url\((data:image\/png;base64,[^)]+)\)[^"]*">\s*<div class="ui" style="width:(\d+)px;height:(\d+)px;transform:(matrix3d\([^)]+\))"><img src="[^"]*\/([^/"]+)"/g;
let m;
let i = 0;
while ((m = re.exec(html))) {
  const [, data, uw, uh, matrix, img] = m;
  const mask = `${name}-maske-${i}.png`;
  writeFileSync(`${outDir}/${mask}`, Buffer.from(data.split(',')[1], 'base64'));
  screens.push({ mask: `${urlPrefix}/${mask}`, w: Number(uw), h: Number(uh), matrix, image: img });
  i++;
}
console.log(JSON.stringify({ name, width: Number(w), height: Number(h), screens }));
