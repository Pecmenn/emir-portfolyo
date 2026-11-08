// Kusur ekranları: tek kaynak. Site canlı telefonları ve Behance/Kusur/export.mjs aynı HTML'i kullanır.
// Her ekran { cls, html } döner; dış kabuk (.ks .ks-screen) burada değil, kullanan tarafta kurulur.
// Sahnenin kullandığı kancalar: data-clock (süre), data-press (basılan düğme), data-tick (işaretlenen satır),
// data-a / data-b (iki sürücünün harf harf dolan alanları), data-blink (dörtlü ışık).

const P = '/images/kusur/parca';
const F = '/images/kusur/foto';

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
  check: svg('<path d="M5 12.500l4.600 4.600L19 7.500" stroke-width="3"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.600"/>'),
  bell: svg('<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15zM10 21h4"/>'),
  chev: svg('<path d="M9.500 5.500l6.500 6.500-6.500 6.500"/>'),
  back: svg('<path d="M14.500 5.500L8 12l6.500 6.500"/>'),
  phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.600 2.800c.7-.4 1.600-.2 2 .5l1.900 3.200c.4.6.3 1.400-.2 1.900L8.800 9.900c1 2.200 3 4.200 5.300 5.300l1.500-1.500c.5-.5 1.300-.6 1.900-.2l3.200 1.900c.7.4.9 1.300.5 2l-1.300 2.300c-.5.9-1.500 1.400-2.500 1.300C9.700 19.900 4.100 14.300 3 6.600c-.1-1 .4-2 1.300-2.500z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7.500-7 7.500-12.500a7.500 7.500 0 0 0-15 0C4.500 15 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.500" r="2.800" fill="#fff"/></svg>',
  camera: svg('<path d="M3.500 8.500h4l1.500-2.500h6l1.500 2.500h4V19h-17z"/><circle cx="12" cy="13" r="3.500"/>'),
  doc: svg('<path d="M6 3h8l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>'),
  glove: svg('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 11h18M10 14.500h4"/>'),
  wrench: svg('<path d="M14.500 6.500a4 4 0 0 1 5-1l-2.500 2.500 1.500 1.500L21 7a4 4 0 0 1-5.300 5.200L8 20a2 2 0 0 1-3-3l7.700-7.700a4 4 0 0 1 1.800-2.800z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.500 21c.8-4 3.700-6 7.500-6s6.700 2 7.500 6"/>'),
  shield: svg('<path d="M12 3l7.500 3v5.500c0 4.700-3.100 8-7.500 9.500-4.400-1.500-7.500-4.800-7.500-9.500V6z"/><path d="M8.800 12l2.300 2.300 4.200-4.300"/>'),
  card: svg('<rect x="3" y="5.500" width="18" height="13" rx="2.500"/><circle cx="8.500" cy="11" r="2"/><path d="M6 15.500c.5-1 1.400-1.500 2.500-1.500s2 .5 2.500 1.500M14 10h4M14 14h4"/>'),
  qr: svg('<rect x="3.500" y="3.500" width="6.500" height="6.500" rx="1"/><rect x="14" y="3.500" width="6.500" height="6.500" rx="1"/><rect x="3.500" y="14" width="6.500" height="6.500" rx="1"/><path d="M14 14h3v3M20.500 14v6.500H14"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 6 .400l3-3a4 4 0 0 0-5.700-5.700L12 7"/><path d="M14 10a4 4 0 0 0-6-.400l-3 3a4 4 0 0 0 5.700 5.700L12 17"/>'),
  undo: svg('<path d="M8 6L4 10l4 4"/><path d="M4 10h10a5.500 5.500 0 0 1 0 11h-3"/>'),
  arrow: svg('<path d="M4 18c6 0 11-4 14-11M12.500 6.500H18.500V12.500"/>'),
  light: svg('<rect x="8" y="2.500" width="8" height="19" rx="3"/><circle cx="12" cy="7" r="1.200"/><circle cx="12" cy="12" r="1.200"/><circle cx="12" cy="17" r="1.200"/>'),
  tri: svg('<path d="M12 4l9 16H3z" stroke-width="2.600"/><path d="M12 10.500v4M12 17.200v.1" stroke-width="2.600"/>'),
  tri0: svg('<path d="M12 4l9 16H3z" stroke-width="3"/>'),
  sign: svg('<path d="M12 21v-8M6 3.500h12L12 13z"/>'),
  car: svg('<path d="M3.500 15.500v-3l2-5.500a2 2 0 0 1 2-1.300h9a2 2 0 0 1 2 1.300l2 5.500v3z"/><circle cx="7.500" cy="16" r="1.800"/><circle cx="16.500" cy="16" r="1.800"/>'),
  chat: svg('<path d="M4 5h16v11.500H10.500L6 20.500v-4H4z"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.700 5.700 6.300.8-4.600 4.300 1.200 6.200L12 17l-5.600 3 1.200-6.200L3 9.500l6.300-.8z"/></svg>',
  plus: svg('<path d="M12 5v14M5 12h14" stroke-width="2.600"/>'),
  bolt: svg('<path d="M13 2.500L5.500 13.500H11l-1 8 7.500-11H12z"/>'),
  ruhsat: svg('<rect x="4" y="3.500" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  gps: svg('<circle cx="12" cy="12" r="6.500"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3"/><circle cx="12" cy="12" r="1.800" fill="currentColor"/>'),
  nfc: svg('<path d="M6 8.500a7 7 0 0 1 0 7M9.500 6a11 11 0 0 1 0 12M13 3.500a15 15 0 0 1 0 17"/>'),
  signal: '<svg viewBox="0 0 74 13" fill="currentColor" aria-hidden="true"><rect x="0" y="9" width="3.200" height="4" rx="1"/><rect x="4.800" y="6.500" width="3.200" height="6.500" rx="1"/><rect x="9.600" y="3.500" width="3.200" height="9.500" rx="1"/><rect x="14.400" y="0" width="3.200" height="13" rx="1"/><path d="M31 3.200c2.600 0 5 1 6.700 2.700l1.300-1.400A11.600 11.600 0 0 0 31 1.200c-3.100 0-6 1.200-8 3.300l1.300 1.400A9.500 9.500 0 0 1 31 3.200zm0 4.200c1.500 0 2.800.6 3.800 1.500l1.300-1.400A7.300 7.300 0 0 0 31 5.400c-2 0-3.800.8-5.100 2.100l1.300 1.400c1-.9 2.300-1.500 3.800-1.500zm0 4.100 2.300-2.400a3.300 3.300 0 0 0-4.600 0z"/><rect x="46.500" y=".5" width="24" height="12" rx="3.500" fill="none" stroke="currentColor" opacity=".45"/><rect x="48" y="2" width="18" height="9" rx="2"/><path d="M72 4.500v4c.9-.3 1.500-1.100 1.500-2s-.6-1.700-1.500-2z" opacity=".5"/></svg>',
};

// Kuşbakışı araba (kroki şablonu). Burnu yukarı bakar; kullanan yer döndürür
export function car({ fill = '#2318D6', line = '#14107A', glass = '#F3F4F8', letter = '', letterColor = '#F3F4F8', rotateLetter = 0 } = {}) {
  return `<path d="M14 7Q30 1 46 7Q54 10 54 24L54 98Q54 112 44 115Q30 119 16 115Q6 112 6 98L6 24Q6 10 14 7Z" fill="${fill}" stroke="${line}" stroke-width="2.500"/>
  <path d="M6 42L1.500 40.500Q0 44 3 46.500L6 47ZM54 42L58.500 40.500Q60 44 57 46.500L54 47Z" fill="${line}"/>
  <path d="M13.500 37Q30 28.500 46.500 37L42.500 53Q30 48.500 17.500 53Z" fill="${glass}"/>
  <path d="M17.500 90Q30 94 42.500 90L46 102Q30 108 14 102Z" fill="${glass}" opacity=".78"/>
  <path d="M15 54L15 87M45 54L45 87" stroke="${glass}" stroke-width="1.800" opacity=".5"/>
  ${letter ? `<text x="30" y="79" transform="rotate(${rotateLetter} 30 71)" text-anchor="middle" font-family="'Atkinson Hyperlegible Next',sans-serif" font-weight="800" font-size="25" fill="${letterColor}">${letter}</text>` : ''}`;
}
export const CAR_A = { fill: '#2318D6', line: '#14107A', glass: '#F3F4F8', letter: 'A', letterColor: '#F3F4F8' };
export const CAR_B = { fill: '#FFC7D4', line: '#D4124E', glass: '#D4124E', letter: 'B', letterColor: '#D4124E' };

// İmzalar (el izi); sitede kaydırmayla çizilir
export const SIG_A = 'M8 62C22 22 34 12 38 20C42 30 26 68 28 72C31 76 44 46 54 44C62 44 52 66 60 66C70 66 76 42 84 44C90 46 80 64 90 64C102 64 110 38 120 40C128 42 116 64 128 62C150 58 170 34 196 34C206 36 176 56 164 62';
export const SIG_B = 'M12 26C14 48 12 70 8 86M10 56C24 44 38 40 46 42C40 56 34 70 40 72C50 74 62 40 70 40C64 58 68 70 82 54C92 42 100 26 106 18C102 40 96 66 102 72C112 64 120 50 134 46C146 44 138 66 150 62C166 56 186 48 204 50';

function sig(d, color, style = '') {
  return `<svg viewBox="0 0 220 100" style="display:block;overflow:visible;${style}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// Karekoda benzer, sabit desenli görsel (konsept ekranı için; okutulmaz)
function qr(size = 25) {
  const on = (x, y) => {
    const fin = (a, b) => {
      const dx = x - a;
      const dy = y - b;
      if (dx < -1 || dy < -1 || dx > 7 || dy > 7) return null;
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
      return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    };
    for (const [a, b] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      const f = fin(a, b);
      if (f !== null) return f;
    }
    return ((x * 7 + y * 13 + (x * y) % 5 + (x ^ y)) * 2654435761) % 7 < 3;
  };
  let d = '';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (on(x, y)) d += `M${x} ${y}h1v1h-1z`;
  return `<svg viewBox="-1 -1 ${size + 2} ${size + 2}" shape-rendering="crispEdges" style="display:block;width:100%" aria-hidden="true"><path d="${d}" fill="currentColor"/></svg>`;
}

export function logo(color = 'currentColor', size = 100) {
  return `<span class="ks-logo" style="font-size:${size}px;color:${color}"><span class="ks-k">k</span><span>usur</span></span>`;
}
const kOnly = (color, size) => `<span class="ks-logo" style="font-size:${size}px;color:${color}"><span class="ks-k">k</span></span>`;

function plate(text, size = 30) {
  return `<span class="ks-plate" style="font-size:${size}px"><i>TR</i><span>${text}</span></span>`;
}
function ring(size, pct, color, track, stroke, inner) {
  const r = 50 - stroke / 2;
  const c = 2 * Math.PI * r;
  return `<span class="ks-ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}"/></svg>${inner}</span>`;
}
const wave = '<span class="ks-wave"><i></i><i></i><i></i><i></i><i></i></span>';
const av = (who, size = 40, ring = '#fff') => `<img class="ks-av" src="${P}/av-${who}.webp" alt="" style="width:${size}px;height:${size}px;box-shadow:0 0 0 2px ${ring}">`;

function segs(n, total = 6, on = '', off = '') {
  return `<div class="ks-segs">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="${i < n ? (on ? `background:${on}` : '') : off ? `background:${off}` : ''}"></i>`).join('')}</div>`;
}
function crashbar(n, time) {
  return `<div class="ks-crashbar">${segs(n)}<span class="ks-elapsed" data-clock>${time}</span></div>`;
}
export function status(time = '18:14') {
  return `<div class="ks-status"><span>${time}</span>${I.signal}</div>`;
}

// Mahalle haritası: yapı adaları ve yollar; açık ya da gece teması
function map({ dark = false, w = 393, h = 200, label = 'Değirmenyolu Cd.', x = 0, y = 0, k = 1, label2 = 'Kozyatağı', lx = 26 } = {}) {
  const c = dark ? { base: '#100E45', block: '#1B1861', road: '#2E2B85', big: '#3A37A0', text: '#A7A8E8', soft: '#6E6FC4' } : { base: '#E7E8F5', block: '#D9DBF0', road: '#FFFFFF', big: '#FFFFFF', text: '#14107A', soft: '#7D7FB8' };
  let blocks = '';
  for (let cx = -160; cx < 620; cx += 66) {
    for (let cy = -160; cy < 460; cy += 50) {
      const bw = 56 - ((cx * 7 + cy * 3) % 3) * 4;
      blocks += `M${cx} ${cy}h${bw}v40h-${bw}z`;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:100%;background:${c.base}" aria-hidden="true">
    <g transform="translate(${x} ${y}) scale(${k}) rotate(-13 ${w / 2} ${h / 2})">
      <path d="${blocks}" fill="${c.block}"/>
      <g fill="none" stroke-linecap="round">
        <path d="M-260 118H700" stroke="${c.big}" stroke-width="27"/>
        <path d="M268 -260V560" stroke="${c.road}" stroke-width="17"/>
        <path d="M-40 -260V560M136 -260V560M-260 -2H700M-260 232H700" stroke="${c.road}" stroke-width="9"/>
      </g>
      <text x="${lx}" y="123.500" font-family="'Atkinson Hyperlegible Next',sans-serif" font-size="12.500" font-weight="700" fill="${c.text}">${label}</text>
      <text x="70" y="60" font-family="'Atkinson Hyperlegible Next',sans-serif" font-size="11" font-weight="700" fill="${c.soft}">${label2}</text>
    </g>
  </svg>`;
}

// Bir kazanın küçük krokisi (dosya kartlarında)
function miniKroki(kind = 'rear', size = 76, dark = false) {
  const blue = { ...CAR_A, letter: '' };
  const pink = { ...CAR_B, letter: '' };
  const pos = {
    rear: [[46, 44, 90], [20, 44, 90]],
    side: [[42, 34, 90], [40, 56, 90]],
    junction: [[54, 44, 90], [54, 18, 180]],
  }[kind];
  const line = dark ? 'rgba(243,244,248,.5)' : 'rgba(35,24,214,.4)';
  return `<svg viewBox="0 0 76 76" style="display:block;width:${size}px;height:${size}px" aria-hidden="true">
    <path d="M0 26H${kind === 'junction' ? 42 : 76}${kind === 'junction' ? 'M66 26H76M42 26V0M66 26V0' : ''}M0 66H76M0 46H76" fill="none" stroke="${line}" stroke-width="1.400" ${''}/>
    <g transform="translate(${pos[0][0]} ${pos[0][1]}) rotate(${pos[0][2]}) scale(.32) translate(-30 -60)">${car(blue)}</g>
    <g transform="translate(${pos[1][0]} ${pos[1][1]}) rotate(${pos[1][2]}) scale(.32) translate(-30 -60)">${car(pink)}</g>
  </svg>`;
}

export function getScreens(lang = 'tr') {
  const T = (tr, en) => (lang === 'en' ? en : tr);
  const P = (n) => (lang === 'en' ? `${n}%` : `%${n}`);

  const nav = (on) => `<div class="ks-nav">
    <span class="${on === 0 ? 'on' : ''}">${I.glove}${T('Torpido', 'Glovebox')}</span>
    <span class="${on === 1 ? 'on' : ''}">${I.doc}${T('Dosyalar', 'Claims')}</span>
    <div class="ks-fab"><b>${I.tri}</b><em>${T('Kaza oldu', 'Crash')}</em></div>
    <span class="${on === 2 ? 'on' : ''}">${I.wrench}${T('Servis', 'Garages')}</span>
    <span class="${on === 3 ? 'on' : ''}">${I.user}${T('Ben', 'Me')}</span>
  </div>`;

  return {
    // ─── Günlük ───────────────────────────────
    karsilama: {
      cls: 'ks-on-carbon',
      html: `<i class="ks-rosette" style="width:620px;height:620px;left:-110px;top:200px;opacity:.26"></i>${status('9:41')}
      <div class="ks-body">
        <div style="padding:30px 24px 0">${logo('#F3F4F8', 106)}
          <p class="ks-h3" style="margin-top:20px;font-size:30px;line-height:1.08;font-weight:800">${T('Kaza günü yanında.<br>Diğer günler torpido gözünde.', 'With you on crash day.<br>In the glovebox the rest of the year.')}</p>
        </div>
        <img src="${P}/arac.webp" alt="" style="position:absolute;left:-30px;top:262px;width:476px;filter:drop-shadow(0 30px 26px rgba(5,3,60,.55))">
        <div class="ks-abs" style="left:24px;top:490px;display:flex;gap:6px;flex-wrap:wrap;right:24px">
          <span class="ks-chip ks-chip--paper">${I.shield}${T('Tüm sigortalar', 'Every insurer')}</span>
          <span class="ks-chip ks-chip--paper">${I.ruhsat}${T('Ruhsat, poliçe, ehliyet', 'Registration, policy, licence')}</span>
        </div>
        <div class="ks-gap" style="position:relative;padding:0 20px 34px;display:grid;gap:10px">
          <div class="ks-btn ks-btn--paper">${T('Aracımı ekle', 'Add my car')}</div>
          <div class="ks-btn ks-btn--amber" style="height:60px">${I.tri}${T('Şimdi kaza oldu', 'I just crashed')}</div>
        </div>
      </div><i class="ks-home"></i>`,
    },
    ruhsat: {
      cls: 'ks-on-night',
      html: `${status('9:42')}<div class="ks-body">
        <div class="ks-pad" style="display:flex;align-items:center;justify-content:space-between"><span class="ks-round">${I.x}</span><span class="ks-chip ks-chip--glass">${I.bolt}${T('Flaş açık', 'Flash on')}</span></div>
        <p class="ks-h3" style="padding:14px 20px 0;font-size:27px">${T('Ruhsatını okut, gerisini biz yazalım.', 'Scan your registration. We’ll fill in the rest.')}</p>
        <div style="position:relative;margin:22px 26px 0;height:206px">
          <div class="ks-frame" style="inset:-12px"></div>
          <div style="position:absolute;inset:0;border-radius:12px;background:#FFE3E9;color:#14107A;overflow:hidden;transform:rotate(-1.200deg);box-shadow:0 22px 40px -18px #000">
            <i class="ks-gui ks-gui--pink"></i>
            <p style="position:relative;padding:11px 14px 0;font-size:11px;font-weight:800;color:#D4124E">${T('Araç Tescil Belgesi', 'Vehicle Registration')}</p>
            <div style="position:relative;padding:8px 14px;display:grid;gap:7px;font-size:12.500px;font-weight:700">
              <p style="display:inline-block;width:max-content;padding:2px 8px;box-shadow:0 0 0 2px #2318D6;border-radius:5px;background:rgba(35,24,214,.08)">34 KSR 206</p>
              <p style="display:inline-block;width:max-content;padding:2px 8px;box-shadow:0 0 0 2px #2318D6;border-radius:5px;background:rgba(35,24,214,.08)">${T('Hatchback, 1.4, 2021', 'Hatchback, 1.4, 2021')}</p>
              <p class="ks-num" style="display:inline-block;width:max-content;padding:2px 8px;box-shadow:0 0 0 2px #2318D6;border-radius:5px;background:rgba(35,24,214,.08)">VF1RJA00068420715</p>
              <p style="opacity:.5">Burcu Aksoy</p>
            </div>
          </div>
          <i style="position:absolute;left:-12px;right:-12px;top:118px;height:3px;background:#FF9500;box-shadow:0 0 22px 6px rgba(255,149,0,.7)"></i>
        </div>
        <div class="ks-sheet" style="margin-top:36px;display:flex;flex-direction:column;padding-bottom:30px">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="${P}/arac.webp" alt="" style="width:124px;margin:-6px -4px -2px -8px;filter:drop-shadow(0 8px 8px rgba(20,16,122,.3))">
            <div><p class="ks-h4">${T('Araç bulundu', 'Car found')}</p>${`<div style="margin-top:6px">${plate('34 KSR 206', 19)}</div>`}</div>
          </div>
          <div class="ks-row" style="border-top:1.5px solid var(--cizgi);margin-top:10px"><span class="ks-no">5</span><b>${T('Şasi numarası', 'Chassis number')}</b><span class="ks-chip" style="margin-left:auto">${I.check}${T('Okundu', 'Read')}</span></div>
          <div class="ks-row"><span class="ks-no">6</span><b>${T('Poliçe, TRAMER’den', 'Policy, from TRAMER')}</b><span class="ks-chip" style="margin-left:auto">${I.check}${T('Geldi', 'Found')}</span></div>
          <div class="ks-row" style="padding-bottom:8px;border-top:1.500px solid var(--cizgi)"><span class="ks-no" style="background:rgba(35,24,214,.12);color:#2318D6">+</span><b>${T('Muayene tarihi', 'Inspection date')}</b><span class="ks-chip ks-chip--pink" style="margin-left:auto">${T('14 Aralık', '14 December')}</span></div>
          <div class="ks-btn ks-gap">${T('Bu benim aracım', 'This is my car')}</div>
        </div>
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    torpido: {
      cls: '',
      html: `<div style="position:absolute;inset:0 0 auto;height:386px;background:linear-gradient(180deg,#2A1FE6,#2318D6 60%,#1B10BE);color:#F3F4F8;overflow:hidden"><i class="ks-gui"></i><i class="ks-rosette" style="width:420px;height:420px;left:90px;top:-40px;opacity:.22"></i></div>
      <div style="color:#F3F4F8">${status('9:41')}</div>
      <div class="ks-body">
        <div style="position:relative;display:flex;align-items:center;gap:10px;padding:8px 20px 0;color:#F3F4F8">
          ${av('burcu', 42, 'rgba(243,244,248,.9)')}
          <div><p style="font-size:13px;font-weight:700;opacity:.8">${T('Salı, 3 Kasım', 'Tuesday, 3 November')}</p><p class="ks-h4" style="font-size:20px">${T('Günaydın, Burcu', 'Morning, Burcu')}</p></div>
          <span class="ks-round" style="margin-left:auto;position:relative">${I.bell}<i style="position:absolute;right:9px;top:9px;width:9px;height:9px;border-radius:50%;background:#FFC7D4"></i></span>
        </div>
        <div style="position:relative;height:234px;color:#F3F4F8">
          <div style="position:absolute;left:20px;top:22px">
            <p class="ks-num" style="font-size:60px;font-weight:800;line-height:.95;letter-spacing:-.04em">412</p>
            <p style="font-size:14px;font-weight:700;line-height:1.15">${T('kazasız<br>gün', 'crash-free<br>days')}</p>
          </div>
          <img src="${P}/arac.webp" alt="" style="position:absolute;left:84px;top:12px;width:352px;filter:drop-shadow(0 22px 18px rgba(5,3,60,.6))">
          <div style="position:absolute;left:20px;top:146px">${plate('34 KSR 206', 23)}</div>
        </div>

        <div style="position:relative;margin:-20px 14px 0;height:204px">
          <div class="ks-doc--back ks-doc" style="left:22px;right:22px;top:0;background:#FFC7D4;color:#D4124E"><span>${T('Sürücü belgesi', 'Driving licence')}</span><span>B</span></div>
          <div class="ks-doc--back ks-doc" style="left:11px;right:11px;top:32px;background:#fff;color:#2318D6"><span>${T('Ruhsat', 'Registration')}</span><span class="ks-num">34 KSR 206</span></div>
          <div class="ks-doc" style="position:absolute;inset:66px 0 0;padding:14px 18px;display:flex;align-items:center;gap:14px;background:linear-gradient(120deg,#14107A,#1E17A6)">
            <i class="ks-gui" style="opacity:.24"></i>
            <div style="position:relative;flex:1">
              <p style="font-size:13px;font-weight:700;opacity:.82">${T('Trafik poliçesi', 'Traffic policy')}</p>
              <p class="ks-h3" style="margin-top:2px;font-size:23px">Akça Sigorta</p>
              <p class="ks-num" style="margin-top:12px;font-size:14px;font-weight:700;opacity:.9">0041 7782 3190</p>
            </div>
            ${ring(92, 212 / 365, '#FFC7D4', 'rgba(243,244,248,.2)', 9, `<span class="ks-num" style="position:relative;text-align:center;line-height:1"><b style="display:block;font-size:27px;font-weight:800;letter-spacing:-.03em">212</b><span style="font-size:11.500px;font-weight:700">${T('gün', 'days')}</span></span>`)}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 14px 0">
          <div class="ks-card" style="padding:12px 14px;display:flex;gap:10px;align-items:center">
            <span class="ks-sticker ks-num" style="width:54px;height:54px;font-size:15px">${T('ARA', 'DEC')}</span>
            <div><p class="ks-label">${T('Muayene', 'Inspection')}</p><p class="ks-h4 ks-num" style="margin-top:1px;color:#D4124E">${T('41 gün', '41 days')}</p></div>
          </div>
          <div class="ks-card" style="padding:12px 14px">
            <div style="display:flex;justify-content:space-between;align-items:baseline"><p class="ks-label">${T('Basamak', 'No-claims')}</p><p class="ks-h4 ks-num">6</p></div>
            <div class="ks-stairs" style="height:30px;margin-top:6px">${[6, 9, 12, 15, 18, 21, 26, 30].map((h, i) => `<i class="${i < 6 ? 'on' : ''}" style="height:${h}px"></i>`).join('')}</div>
          </div>
        </div>
        <div class="ks-card" style="margin:10px 14px 0;padding:10px 14px;border-radius:20px;display:flex;align-items:center;gap:11px;background:#14107A;color:#F3F4F8">
          <span class="ks-round" style="width:38px;height:38px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.100" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 15.500a4.500 4.500 0 0 1 .4-9A5.500 5.500 0 0 1 18 8a4 4 0 0 1-.5 7.500zM9 18.500l-1 2.500M13 18.500l-1 2.500M17 18.500l-1 2.500"/></svg></span>
          <p style="flex:1;font-size:15px;font-weight:700;line-height:1.18">${T('Akşama yağmur var. Takip mesafeni iki katına çıkar.', 'Rain tonight. Double your following distance.')}</p>
        </div>
        ${nav(0)}
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    police: {
      cls: '',
      html: `<div style="position:absolute;inset:0 0 auto;height:310px;background:linear-gradient(180deg,#1E17A6,#14107A);overflow:hidden"><i class="ks-gui" style="opacity:.26"></i></div>
      <div style="color:#F3F4F8">${status('9:42')}</div>
      <div class="ks-body">
        <div style="position:relative;display:flex;align-items:center;gap:10px;padding:6px 18px 0;color:#F3F4F8">
          <span class="ks-round">${I.back}</span>
          <div style="flex:1"><p style="font-size:13px;font-weight:700;opacity:.8">${T('Trafik poliçesi', 'Traffic policy')}</p><p class="ks-h4">Akça Sigorta</p></div>
          <span class="ks-chip ks-chip--paper">${I.shield}${T('Geçerli', 'Valid')}</span>
        </div>
        <div style="position:relative;display:grid;place-items:center;margin-top:10px;color:#F3F4F8">
          ${ring(166, 212 / 365, '#FFC7D4', 'rgba(243,244,248,.16)', 8, `<span class="ks-num" style="position:relative;text-align:center;line-height:1"><b style="display:block;font-size:60px;font-weight:800;letter-spacing:-.045em">212</b><span style="font-size:15px;font-weight:700">${T('gün kaldı', 'days left')}</span></span>`)}
        </div>
        <div class="ks-sheet" style="margin-top:16px;padding:20px 14px 0">
          <div class="ks-card" style="padding:13px 16px">
            <div style="display:flex;justify-content:space-between;align-items:baseline"><p class="ks-h4">${T('Hasarsızlık basamağın', 'Your no-claims step')}</p><p class="ks-num" style="font-size:30px;font-weight:800;color:#2318D6;letter-spacing:-.03em;line-height:1">6</p></div>
            <div style="position:relative">
              <div class="ks-stairs" style="height:66px;margin-top:24px">${[10, 18, 26, 34, 42, 50, 58, 66].map((h, i) => `<i class="${i < 6 ? 'on' : ''}" style="height:${h}px"></i>`).join('')}</div>
              <img src="${P}/arac.webp" alt="" style="position:absolute;left:56%;top:-10px;width:58px;margin-left:-29px;filter:drop-shadow(0 4px 3px rgba(20,16,122,.45))">
            </div>
            <p class="ks-small" style="margin-top:8px">${T('Kusursuz olduğun kazalar basamağını düşürmez.', 'Crashes that aren’t your fault leave your step alone.')}</p>
          </div>
          <div class="ks-card" style="margin-top:10px;padding:13px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center"><p class="ks-h4">${T('Yenileme teklifleri', 'Renewal offers')}</p><span class="ks-chip ks-chip--pink">${T('5 Haz’da biter', 'Ends 5 June')}</span></div>
            ${[['Akça', '8.420 ₺', 84, true], ['Liman', '9.150 ₺', 92, false]].map(([n, p, w, on]) => `<div style="display:flex;align-items:center;gap:10px;margin-top:9px"><span style="width:46px;font-size:14px;font-weight:700">${n}</span><span style="flex:1;height:12px;border-radius:6px;background:rgba(35,24,214,.08);overflow:hidden"><i style="display:block;height:100%;width:${w}%;background:${on ? '#2318D6' : 'rgba(35,24,214,.32)'};border-radius:6px"></i></span><span class="ks-num" style="font-size:14px;font-weight:800;width:64px;text-align:right">${p}</span></div>`).join('')}
            <div class="ks-btn" style="height:50px;margin-top:12px;font-size:16px;border-radius:17px">${T('Poliçemi yenile', 'Renew my policy')}</div>
          </div>
        </div>
        ${nav(0)}
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    dosyalar: {
      cls: '',
      html: `${status('11:06')}<div class="ks-body">
        <div class="ks-pad" style="display:flex;align-items:center;justify-content:space-between;padding-top:10px"><p class="ks-h2">${T('Dosyalar', 'Claims')}</p><span class="ks-round ks-round--ink">${I.plus}</span></div>
        <div style="display:flex;gap:7px;padding:10px 20px 0"><span class="ks-chip" style="background:#2318D6;color:#F3F4F8">${T('Tümü 3', 'All 3')}</span><span class="ks-chip">${T('Açık 1', 'Open 1')}</span><span class="ks-chip">${T('Kapalı 2', 'Closed 2')}</span></div>
        <div style="position:relative;margin:14px 14px 0;border-radius:26px;overflow:hidden;background:linear-gradient(140deg,#2A1FE6,#1B10BE);color:#F3F4F8;box-shadow:var(--golge-2);padding:16px 16px 14px">
          <i class="ks-gui"></i>
          <div style="position:relative;display:flex;gap:12px">
            <div style="flex:1;min-width:0">
              <span class="ks-chip ks-chip--amber" style="height:26px;font-size:12.500px;padding:0 10px">${T('Açık', 'Open')}</span>
              <p class="ks-h3" style="margin-top:9px;font-size:23px">${T('3 Kasım, Kozyatağı', '3 Nov, Kozyatağı')}</p>
              <p style="margin-top:3px;font-size:14px;opacity:.85">${T('Değirmenyolu Cd., 18.12', 'Değirmenyolu St., 18:12')}</p>
            </div>
            <div style="flex:none;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 10px 18px -10px #000">${miniKroki('rear', 88)}</div>
          </div>
          <div class="ks-bar" style="position:relative;margin-top:13px;background:rgba(243,244,248,.2)"><i style="width:100%;background:#FFC7D4"></i></div>
          <p style="position:relative;display:flex;justify-content:space-between;margin-top:5px;font-size:14px;font-weight:800"><span>A ${P(0)}</span><span>B ${P(100)}</span></p>
          <div style="position:relative;display:flex;align-items:center;gap:10px;margin-top:12px;padding:9px 12px;border-radius:16px;background:rgba(243,244,248,.13)">
            ${av('eksper', 36, 'rgba(243,244,248,.7)')}
            <div style="flex:1"><p style="font-size:14.500px;font-weight:800">${T('Eksper 10 Kasım, 10.00', 'Assessor on 10 Nov, 10:00')}</p><p style="font-size:13px;opacity:.82">Selin Demir</p></div>
            <span style="width:20px;height:20px">${I.chev}</span>
          </div>
        </div>
        <div style="margin:12px 14px 0;display:grid;gap:9px">
          ${[
            [T('18 Ağustos 2024', '18 August 2024'), 'Beşiktaş', `A ${P(50)}, B ${P(50)}`, T('12.300 ₺ ödendi', '₺12,300 paid'), 'side'],
            [T('2 Mart 2022', '2 March 2022'), 'Maltepe', `A ${P(100)}, B ${P(0)}`, T('Basamak düştü', 'Step dropped'), 'junction'],
          ]
            .map(([d, p, r, n, k]) => `<div class="ks-card" style="display:flex;align-items:center;gap:12px;padding:8px 14px 8px 8px;border-radius:20px"><div style="border-radius:13px;overflow:hidden;background:#F3F4F8;flex:none">${miniKroki(k, 60)}</div><div style="flex:1;min-width:0"><p class="ks-h4" style="font-size:16.500px">${d}</p><p class="ks-small">${p}, ${r}</p></div><span class="ks-chip" style="height:26px;font-size:12px;padding:0 9px;background:transparent;padding-right:0">${n}</span></div>`)
            .join('')}
        </div>
        <p class="ks-small" style="padding:12px 24px 0">${T('Kapanan dosyaların fotoğraf ve tutanakları burada kalır.', 'Photos and reports from closed claims stay here.')}</p>
        ${nav(1)}
      </div><i class="ks-home"></i>`,
    },
    servis: {
      cls: '',
      html: `<div style="position:absolute;inset:0 0 auto;height:408px">${map({ w: 393, h: 408, x: -30, y: 70, k: 1.15, lx: 150 })}
        ${[[96, 196, '1', true], [262, 148, '2', false], [300, 300, '3', false]].map(([l, t, n, on]) => `<span style="position:absolute;left:${l}px;top:${t}px;display:grid;place-items:center;width:40px;height:40px;border-radius:50% 50% 50% 6px;transform:rotate(-45deg);background:${on ? '#2318D6' : '#fff'};color:${on ? '#fff' : '#2318D6'};box-shadow:0 12px 18px -8px rgba(20,16,122,.8)"><b style="transform:rotate(45deg);font-size:16px;font-weight:800">${n}</b></span>`).join('')}
      </div>${status('10:30')}
      <div class="ks-body">
        <div class="ks-pad" style="position:relative;display:flex;align-items:center;gap:10px;padding-top:6px"><span class="ks-round ks-round--ink" style="background:#fff;box-shadow:var(--golge-1)">${I.back}</span><div class="ks-card" style="flex:1;height:44px;border-radius:22px;display:flex;align-items:center;padding:0 16px;font-size:15px;font-weight:700;color:var(--sis)">${T('Kaporta servisleri, Kadıköy', 'Body shops, Kadıköy')}</div></div>
        <div class="ks-sheet" style="position:absolute;left:0;right:0;bottom:0;top:320px;padding:22px 14px 0">
          <p class="ks-h3" style="padding:0 6px">${T('Yakındaki servisler', 'Garages nearby')}</p>
          ${[
            ['Kozyatağı Oto', '4,8', '1,2 km', T('Anlaşmalı', 'In network'), T('Yarın 09.00', 'Tomorrow 09:00'), true],
            ['Bostancı Kaporta', '4,6', '3,4 km', T('Anlaşmalı', 'In network'), T('Perşembe', 'Thursday'), false],
          ]
            .map(([n, r, d, c, w, on]) => `<div class="ks-card" style="margin-top:10px;padding:13px 14px;${on ? 'box-shadow:inset 0 0 0 2.500px #2318D6,var(--golge-1)' : ''}"><div style="display:flex;justify-content:space-between;align-items:center"><p class="ks-h4">${n}</p><span style="display:inline-flex;align-items:center;gap:4px;font-size:14.500px;font-weight:800;color:#D4124E"><i style="width:15px;height:15px;display:block">${I.star}</i>${r}</span></div><div style="display:flex;gap:6px;margin-top:8px"><span class="ks-chip" style="height:26px;font-size:12.500px;padding:0 9px">${d}</span><span class="ks-chip" style="height:26px;font-size:12.500px;padding:0 9px">${c}</span><span class="ks-chip ks-chip--pink" style="height:26px;font-size:12.500px;padding:0 9px">${w}</span></div></div>`)
            .join('')}
          <div class="ks-btn" style="margin-top:12px">${T('Kozyatağı Oto’yu seç', 'Choose Kozyatağı Oto')}</div>
        </div>
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },

    // ─── Kaza modu ────────────────────────────
    kilit: {
      cls: 'ks-on-night',
      html: `<div class="ks-cam" style="background-image:url(${F}/reflektor.webp);background-position:62% 50%;filter:saturate(1.1)"></div><div class="ks-abs" style="inset:0;background:linear-gradient(180deg,rgba(10,8,54,.55),rgba(10,8,54,.2) 40%,rgba(10,8,54,.72))"></div>
      <div class="ks-abs" style="left:50%;top:11px;width:206px;height:38px;margin-left:-103px;border-radius:20px;background:#000;display:flex;align-items:center;justify-content:space-between;padding:0 12px;color:#FF9500;z-index:45"><i style="width:21px;height:21px;display:block">${I.tri}</i><span class="ks-num" style="font-size:14px;font-weight:800" data-clock>00:04</span></div>
      <div style="color:#F3F4F8;position:relative;text-align:center;padding-top:88px">
        <p style="font-size:19px;font-weight:700">${T('Salı 3 Kasım', 'Tuesday 3 November')}</p>
        <p class="ks-num" style="font-size:88px;font-weight:800;letter-spacing:-.04em;line-height:1">18:12</p>
      </div>
      <div class="ks-abs" style="left:12px;right:12px;top:280px;border-radius:30px;padding:14px;background:rgba(243,244,248,.2);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);box-shadow:inset 0 0 0 1px rgba(243,244,248,.26);color:#F3F4F8">
        <div style="display:flex;gap:11px;align-items:center">
          <span style="display:grid;place-items:center;width:44px;height:44px;flex:none;border-radius:12px;background:#2318D6;overflow:hidden">${kOnly('#F3F4F8', 36)}</span>
          <div style="flex:1"><p style="font-size:13.500px;font-weight:700;opacity:.86">Kusur</p><p class="ks-h4" style="font-size:21px">${T('Sert duruş algılandı.', 'Hard stop detected.')}</p></div>
        </div>
        <p style="margin:10px 2px 0;font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1.04">${T('Kaza mı oldu?', 'Did you crash?')}</p>
        <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:8px;margin-top:14px">
          <div class="ks-btn ks-btn--amber" data-press style="height:88px;border-radius:26px;font-size:25px">${T('Evet, başlat', 'Yes, start')}</div>
          <div class="ks-btn" style="height:88px;border-radius:26px;font-size:21px;background:rgba(243,244,248,.2);box-shadow:none">${T('Hayır', 'No')}</div>
        </div>
      </div>
      <div class="ks-abs" style="left:34px;right:34px;bottom:30px;display:flex;justify-content:space-between;color:#F3F4F8"><span class="ks-round" style="width:50px;height:50px;background:rgba(10,8,54,.5)">${I.bolt}</span><span class="ks-round" style="width:50px;height:50px;background:rgba(10,8,54,.5)">${I.camera}</span></div>
      <i class="ks-home" style="color:#F3F4F8"></i>`,
    },
    yaralanan: {
      cls: 'ks-on-night',
      html: `<i class="ks-glow" data-blink></i>${status('18:12')}<div class="ks-body">
        ${crashbar(1, '00:08')}
        <div style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:14px 20px 0">
          <span class="ks-voice">${wave}${T('Sesli yönlendirme açık', 'Voice guidance on')}</span>
        </div>
        <div style="position:relative;padding:18px 20px 0;color:#FF9500">
          <h2 class="ks-h1" style="font-size:70px;line-height:.98">${T('Yaralanan var mı?', 'Is anyone hurt?')}</h2>
          <p class="ks-lead" style="margin-top:12px;color:#F3F4F8;font-size:21px">${T('Sen, yolcuların, karşı taraf.', 'You, your passengers, the other side.')}</p>
        </div>
        <div style="position:relative;margin:18px 14px 0;height:78px;border-radius:22px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(243,244,248,.14)">
          ${map({ dark: true, w: 365, h: 78, x: -90, y: -70, k: 1.1, label: '' })}
          <div class="ks-abs" style="inset:0;display:flex;align-items:center;gap:10px;padding:0 14px;background:linear-gradient(90deg,rgba(10,8,54,.86) 58%,rgba(10,8,54,0))">
            <span style="color:#FF9500;width:26px;height:26px;flex:none">${I.pin}</span>
            <div><p style="font-size:16.500px;font-weight:800;line-height:1.14">${T('Değirmenyolu Cd., Kozyatağı', 'Değirmenyolu St., Kozyatağı')}</p><p style="font-size:13.500px;opacity:.76">${T('Konum ve saat kaydedildi', 'Place and time saved')}</p></div>
          </div>
        </div>
        <div class="ks-crash-a">
          <div class="ks-btn ks-btn--amber ks-btn--crash" data-press>${T('Yok', 'No')}</div>
          <div class="ks-btn ks-btn--ghost ks-btn--crash" style="height:104px;font-size:38px;background:rgba(10,8,54,.4)"><span style="display:block;text-align:center;line-height:1">${T('Var', 'Yes')}<span style="display:block;font-size:14.500px;font-weight:700;letter-spacing:0;margin-top:5px;opacity:.8">${T('Hemen 112 aranır', 'Calls 112 straight away')}</span></span></div>
        </div>
      </div><i class="ks-home"></i>`,
    },
    acil: {
      cls: 'ks-on-amber',
      html: `${status('18:12')}<div class="ks-body">
        ${crashbar(1, '00:11')}
        <div style="padding:26px 20px 0">
          <h2 class="ks-h1" style="font-size:84px;line-height:.96">${T('Önce 112.', 'Call 112.')}</h2>
          <p style="margin-top:12px;font-size:23px;font-weight:700;line-height:1.16">${T('Form bekleyebilir. Yaralanma varsa tutanak tutulmaz, araçları oynatma.', 'The form can wait. With an injury there’s no driver report. Leave the cars where they are.')}</p>
        </div>
        <div style="margin:22px 14px 0;border-radius:26px;overflow:hidden;background:#0A0836;color:#F3F4F8;box-shadow:0 26px 40px -22px rgba(10,8,54,.9)">
          <div style="height:124px;position:relative">${map({ dark: true, w: 365, h: 124, x: -60, y: -48, k: 1.2, label: 'Değirmenyolu Cd.', lx: 70 })}
            <span class="ks-abs" style="left:50%;top:36px;margin-left:-20px;width:40px;height:40px;color:#FF9500;filter:drop-shadow(0 6px 6px #000)">${I.pin}</span>
          </div>
          <div style="padding:13px 16px 15px">
            <p style="font-size:14px;font-weight:700;opacity:.76">${T('Telefonda bunu oku:', 'Read this out on the phone:')}</p>
            <p class="ks-h3" style="margin-top:3px;font-size:25px">Değirmenyolu Caddesi, Kozyatağı, Kadıköy</p>
          </div>
        </div>
        <div class="ks-crash-a">
          <div style="position:relative">
            <i class="ks-abs" data-blink style="inset:-7px;border-radius:44px;box-shadow:0 0 0 3px #0A0836"></i>
            <div class="ks-btn ks-btn--crash" style="background:#0A0836;color:#FF9500;box-shadow:0 22px 34px -18px #0A0836">${I.phone}${T('112’yi ara', 'Call 112')}</div>
          </div>
        </div>
      </div><i class="ks-home"></i>`,
    },
    guvenlik: {
      cls: 'ks-on-night',
      html: `<i class="ks-glow" data-blink></i>${status('18:13')}<div class="ks-body">
        ${crashbar(2, '00:40')}
        <div style="position:relative;padding:18px 20px 0;color:#FF9500"><h2 class="ks-h1">${T('Önce güvenlik.', 'Safety first.')}</h2></div>
        <div style="position:relative;height:236px;margin:12px 0 0;overflow:hidden">
          <div class="ks-abs" style="inset:14px 0;background:#15124F;border-block:3px solid rgba(243,244,248,.28)"></div>
          <div class="ks-abs" style="left:0;right:0;top:50%;border-top:3px dashed rgba(243,244,248,.28)"></div>
          <img class="ks-abs" src="${P}/arac-ust.webp" alt="" style="width:112px;left:196px;top:-5px;transform:rotate(90deg);filter:drop-shadow(0 14px 12px #000)">
          ${[[148, 82], [148, 138], [352, 82], [352, 138]].map(([l, t]) => `<i class="ks-abs" data-blink style="left:${l}px;top:${t}px;width:16px;height:16px;border-radius:50%;background:#FF9500;box-shadow:0 0 26px 12px rgba(255,149,0,.62)"></i>`).join('')}
          <svg class="ks-abs" viewBox="0 0 40 40" style="left:24px;top:92px;width:54px" aria-hidden="true"><path d="M20 5L37 34H3Z" fill="rgba(255,149,0,.14)" stroke="#FF9500" stroke-width="5" stroke-linejoin="round"/></svg>
          <svg class="ks-abs" viewBox="0 0 76 8" style="left:80px;top:114px;width:66px" aria-hidden="true"><path d="M2 4H74" stroke="#FF9500" stroke-width="2.500" stroke-dasharray="5 6" stroke-linecap="round"/></svg>
        </div>
        <div class="ks-crash-a" style="gap:9px">
          <div class="ks-tick on"><i>${I.check}</i><span>${T('Dörtlüleri yaktım', 'Hazards on')}</span></div>
          <div class="ks-tick" data-tick><i>${I.check}</i><span>${T('Reflektörü koydum', 'Warning triangle out')}<span class="ks-tick-note">${T('Arabanın arkasına, görünür yere', 'Behind the car, where it can be seen')}</span></span></div>
          <div class="ks-btn ks-btn--amber ks-btn--big" data-press style="height:96px">${T('Trafikten uzaktayım', 'I’m clear of traffic')}</div>
        </div>
      </div><i class="ks-home"></i>`,
    },
    foto: {
      cls: 'ks-on-night',
      html: `<div class="ks-cam" style="background-image:url(${F}/tampon.webp);background-size:560px auto;background-position:47% 100%"></div>${status('18:14')}<div class="ks-body" style="z-index:3">
        ${crashbar(3, '02:06')}
        <div style="padding:14px 20px 0">
          <h2 class="ks-h2" style="font-size:42px;color:#FF9500">${T('Temas noktası', 'Point of contact')}</h2>
          <p class="ks-lead" style="margin-top:5px;font-size:18px">${T('Arabaları çekmeden, yakından.', 'Close up, before the cars move.')}</p>
        </div>
        <div class="ks-frame" style="left:44px;right:44px;top:146px;height:262px"></div>
        <div class="ks-abs" style="left:146px;top:246px;width:104px;height:104px;border-radius:18px;box-shadow:inset 0 0 0 3px #FFC7D4,0 0 0 400px rgba(10,8,54,0)"></div>
        <span class="ks-chip ks-abs" style="left:122px;top:358px;height:30px;background:#FFC7D4;color:#D4124E">${I.check}${T('Göçük algılandı', 'Dent detected')}</span>
        <div class="ks-abs" style="right:14px;top:96px;width:66px;height:100px;border-radius:16px;background:rgba(10,8,54,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(243,244,248,.18)">
          <img class="ks-abs" src="${P}/arac-ust.webp" alt="" style="left:21px;top:14px;width:24px">
          <svg class="ks-abs" viewBox="0 0 66 100" style="inset:0" aria-hidden="true"><path d="M33 68L14 96H52Z" fill="#FF9500" opacity=".85"/></svg>
        </div>
        <div class="ks-crash-a" style="padding-bottom:26px;gap:10px">
          <div class="ks-shots">
            <i style="background-image:url(${F}/burcu.webp);background-position:40% 60%"><u>${I.check}</u></i>
            <i class="now">${T('Temas', 'Contact')}</i>
            <i>${T('A plakası', 'Plate A')}</i>
            <i>${T('B plakası', 'Plate B')}</i>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 12px 0">
            <span class="ks-round" style="width:52px;height:52px;background:rgba(243,244,248,.14)">${I.bolt}</span>
            ${ring(96, 0.5, '#FF9500', 'rgba(243,244,248,.2)', 6, '<span style="position:relative;display:block;width:68px;height:68px;border-radius:50%;background:linear-gradient(180deg,#ffa722,#FF9500);box-shadow:inset 0 2px 0 rgba(255,255,255,.4)"></span>')}
            <span class="ks-chip ks-chip--paper ks-num" style="height:52px;width:52px;padding:0;justify-content:center;border-radius:50%;font-size:17px;font-weight:800">2/4</span>
          </div>
        </div>
      </div>`,
    },
    esles: {
      cls: 'ks-on-night',
      html: `<i class="ks-glow"></i>${status('18:17')}<div class="ks-body">
        ${crashbar(4, '05:10')}
        <div style="position:relative;padding:16px 20px 0;color:#FF9500"><h2 class="ks-h2" style="font-size:44px">${T('Bunu karşı sürücüye okut.', 'Have the other driver scan this.')}</h2></div>
        <div style="position:relative;margin:24px auto 0;width:280px;height:280px;display:grid;place-items:center">
          <i class="ks-pulse" style="inset:-26px;background:rgba(255,149,0,.16)"></i>
          <div style="position:relative;width:262px;padding:16px;border-radius:32px;background:#F3F4F8;color:#14107A;box-shadow:0 30px 50px -22px #000">
            ${qr()}
            <span class="ks-abs" style="left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;display:grid;place-items:center;border-radius:15px;background:#2318D6;box-shadow:0 0 0 5px #F3F4F8">${kOnly('#F3F4F8', 44)}</span>
          </div>
        </div>
        <div style="position:relative;display:flex;align-items:center;gap:11px;margin:26px 16px 0;padding:11px 14px;border-radius:22px;background:rgba(243,244,248,.08);box-shadow:inset 0 0 0 1px rgba(243,244,248,.14)">
          ${av('hakan', 44, '#FFC7D4')}
          <div style="flex:1"><p style="font-size:16px;font-weight:800">${T('Hakan Bey yaklaşıyor', 'Hakan is nearby')}</p><p style="font-size:13.500px;opacity:.76">${T('Uygulaması olmasa da tarayıcıda açılır', 'Opens in a browser, no app needed')}</p></div>
          <span style="width:26px;height:26px;color:#FFC7D4">${I.nfc}</span>
        </div>
        <div class="ks-crash-a">
          <div class="ks-btn ks-btn--ghost ks-btn--big" style="height:84px;font-size:22px">${I.link}${T('Bağlantı gönder', 'Send a link')}</div>
        </div>
      </div><i class="ks-home"></i>`,
    },
    tutanak: {
      cls: 'ks-on-carbon',
      html: `<i class="ks-gui"></i>${status('18:19')}<div class="ks-body">
        <div class="ks-crashbar">${segs(4, 6, '#F3F4F8')}<span class="ks-elapsed" data-clock style="color:#F3F4F8">06:48</span></div>
        <div style="position:relative;padding:12px 20px 0">
          <h2 class="ks-h2" style="font-size:36px">${T('Sekiz alan halloldu.', 'Eight fields sorted.')}</h2>
          <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:12px">
            ${Array.from({ length: 12 }, (_, i) => `<i class="ks-num" style="display:grid;place-items:center;height:28px;border-radius:7px;font-size:12px;font-weight:800;${i < 8 ? 'background:#F3F4F8;color:#2318D6' : 'background:rgba(255,199,212,.18);color:#FFC7D4;box-shadow:inset 0 0 0 1.500px #FFC7D4'}">${i + 1}</i>`).join('')}
          </div>
        </div>
        <div class="ks-sheet" style="margin-top:18px;padding:22px 0 72px;display:flex;flex-direction:column">
          <div class="ks-cursor" style="right:26px;top:232px">${'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3l16 7-7 2.500L10 20z"/></svg>'}<b>Hakan</b></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;padding:0 16px">
            <div style="display:flex;align-items:center;gap:8px;padding:0 12px 10px;color:#2318D6">${av('burcu', 30, '#2318D6')}<b style="font-size:15px;font-weight:800">A, Burcu</b></div>
            <div style="display:flex;align-items:center;gap:8px;padding:0 12px 10px;color:#D4124E">${av('hakan', 30, '#D4124E')}<b style="font-size:15px;font-weight:800">B, Hakan</b></div>
          </div>
          <div style="margin:0 16px;border-radius:18px;overflow:hidden;display:grid;gap:2px;background:#fff;box-shadow:var(--golge-1)">
            <div style="padding:9px 12px 10px;display:flex;align-items:center;gap:8px;background:#fff"><span class="ks-no">2</span><b style="font-size:15px;font-weight:700;line-height:1.14">${T('Değirmenyolu Cd., 3 Kasım, 18.12', 'Değirmenyolu St., 3 Nov, 18:12')}</b><span style="margin-left:auto;width:18px;height:18px;color:#2318D6;flex:none">${I.gps}</span></div>
            <div class="ks-col"><div><small>${I.card}${T('4 Sürücü', '4 Driver')}</small><b data-a="name">Burcu Aksoy</b></div><div><small>${I.card}${T('4 Sürücü', '4 Driver')}</small><b data-b="name">Hakan Yıldız</b></div></div>
            <div class="ks-col"><div><small>${I.ruhsat}${T('5 Plaka', '5 Plate')}</small><b class="ks-num" data-a="plate">34 KSR 206</b></div><div><small>${I.ruhsat}${T('5 Plaka', '5 Plate')}</small><b class="ks-num" data-b="plate">34 HKN 58</b></div></div>
            <div class="ks-col"><div><small>${I.shield}${T('6 Poliçe', '6 Policy')}</small><b class="ks-num" data-a="policy">0041 7782</b></div><div><small>${I.shield}${T('6 Poliçe', '6 Policy')}</small><b class="ks-num" data-b="policy">2206 1149</b></div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 16px 0">
            ${[[9, T('Darbe noktası', 'Impact point'), I.car], [10, T('Kroki', 'Sketch'), I.arrow], [11, T('Görüşün', 'Your view'), I.chat], [12, T('İmza', 'Signature'), I.sign]].map(([n, l, ic]) => `<div style="display:flex;align-items:center;gap:8px;height:50px;padding:0 11px;border-radius:15px;background:#fff;color:#D4124E;box-shadow:inset 0 0 0 1.500px rgba(212,18,78,.42);font-size:14.500px;font-weight:800"><span class="ks-no ks-no--pink">${n}</span>${l}</div>`).join('')}
          </div>
          <div class="ks-gap" style="padding:10px 16px 0"><div class="ks-btn" style="height:62px">${T('Krokiye geç', 'On to the sketch')}</div></div>
        </div>
        <div class="ks-peek" style="height:60px;padding-bottom:12px;z-index:30">${I.check.replace('<svg', '<svg width="20" height="20"')}${T('Hakan Bey aynı yaprağı görüyor', 'Hakan sees the same sheet')}</div>
      </div>`,
    },
    'tutanak-b': {
      cls: 'ks-on-copy',
      html: `<i class="ks-gui ks-gui--pink"></i>${status('18:19')}<div class="ks-body">
        <div class="ks-crashbar">${segs(4, 6, '#D4124E', 'rgba(212,18,78,.2)')}<span class="ks-elapsed" data-clock style="color:#D4124E">06:48</span></div>
        <div style="position:relative;padding:12px 20px 0">
          <h2 class="ks-h2" style="font-size:36px">${T('Kopyan burada.', 'Your copy is here.')}</h2>
          <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:12px">
            ${Array.from({ length: 12 }, (_, i) => `<i class="ks-num" style="display:grid;place-items:center;height:28px;border-radius:7px;font-size:12px;font-weight:800;${i < 8 ? 'background:#D4124E;color:#FFE3E9' : 'color:#D4124E;box-shadow:inset 0 0 0 1.500px #D4124E'}">${i + 1}</i>`).join('')}
          </div>
        </div>
        <div class="ks-sheet" style="margin-top:18px;padding:22px 0 30px;display:flex;flex-direction:column;background:#FFE3E9;color:#D4124E;--sis:rgba(160,10,58,.78)">
          <div style="display:grid;grid-template-columns:1fr 1fr;padding:0 16px">
            <div style="display:flex;align-items:center;gap:8px;padding:0 12px 10px">${av('burcu', 30, '#D4124E')}<b style="font-size:15px;font-weight:800">A, Burcu</b></div>
            <div style="display:flex;align-items:center;gap:8px;padding:0 12px 10px">${av('hakan', 30, '#D4124E')}<b style="font-size:15px;font-weight:800">B, ${T('Sen', 'You')}</b></div>
          </div>
          <div style="margin:0 16px;border-radius:18px;overflow:hidden;display:grid;gap:2px;background:#FFF5F7;box-shadow:0 14px 26px -16px rgba(212,18,78,.6)">
            <div style="padding:9px 12px 10px;display:flex;align-items:center;gap:8px;background:#FFF5F7"><span class="ks-no ks-no--pink">2</span><b style="font-size:15px;font-weight:700;line-height:1.14">${T('Değirmenyolu Cd., 3 Kasım, 18.12', 'Değirmenyolu St., 3 Nov, 18:12')}</b><span style="margin-left:auto;width:18px;height:18px;color:#D4124E;flex:none">${I.gps}</span></div>
            <div class="ks-col"><div style="color:#D4124E"><small>${I.card}${T('4 Sürücü', '4 Driver')}</small><b data-a="name">Burcu Aksoy</b></div><div><small>${I.card}${T('4 Sürücü', '4 Driver')}</small><b data-b="name">Hakan Yıldız</b></div></div>
            <div class="ks-col"><div style="color:#D4124E"><small>${I.ruhsat}${T('5 Plaka', '5 Plate')}</small><b class="ks-num" data-a="plate">34 KSR 206</b></div><div><small>${I.ruhsat}${T('5 Plaka', '5 Plate')}</small><b class="ks-num" data-b="plate">34 HKN 58</b></div></div>
            <div class="ks-col"><div style="color:#D4124E"><small>${I.shield}${T('6 Poliçe', '6 Policy')}</small><b class="ks-num" data-a="policy">0041 7782</b></div><div><small>${I.shield}${T('6 Poliçe', '6 Policy')}</small><b class="ks-num" data-b="policy">2206 1149</b></div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 16px 0">
            ${[[9, T('Darbe noktası', 'Impact point'), I.car], [10, T('Kroki', 'Sketch'), I.arrow], [11, T('Görüşün', 'Your view'), I.chat], [12, T('İmza', 'Signature'), I.sign]].map(([n, l, ic]) => `<div style="display:flex;align-items:center;gap:8px;height:50px;padding:0 11px;border-radius:15px;background:#fff;color:#D4124E;box-shadow:inset 0 0 0 1.500px rgba(212,18,78,.42);font-size:14.500px;font-weight:800"><span class="ks-no ks-no--pink">${n}</span>${l}</div>`).join('')}
          </div>
          <div style="padding:10px 16px 0" class="ks-gap"><div class="ks-btn" style="height:62px;background:#D4124E;box-shadow:0 12px 22px -12px rgba(212,18,78,.8)">${T('Krokiye geç', 'On to the sketch')}</div></div>
        </div>
      </div><i class="ks-home" style="color:#D4124E"></i>`,
    },
    darbe: {
      cls: 'ks-on-carbon',
      html: `<i class="ks-gui"></i>${status('18:20')}<div class="ks-body">
        <div class="ks-crashbar">${segs(5, 6, '#F3F4F8')}<span class="ks-elapsed" data-clock style="color:#F3F4F8">08:02</span></div>
        <div style="position:relative;padding:12px 20px 18px"><span class="ks-no" style="background:#F3F4F8;color:#2318D6">9</span><h2 class="ks-h2" style="margin-top:6px">${T('İlk darbe nereye geldi?', 'Where was the first hit?')}</h2></div>
        <div class="ks-sheet" style="padding:20px 14px 30px;display:flex;flex-direction:column">
          <div style="position:relative;flex:1;display:grid;place-items:center;min-height:360px">
            <svg class="ks-abs" viewBox="0 0 340 380" style="left:50%;top:50%;width:340px;margin:-190px 0 0 -170px" aria-hidden="true">
              <g fill="rgba(35,24,214,.07)" stroke="rgba(35,24,214,.22)" stroke-width="1.500">
                <path d="M104 8H236Q250 8 252 22L256 62H84L88 22Q90 8 104 8Z"/>
                <path d="M272 26Q320 36 328 96V150H270V76Z" /><path d="M68 26Q20 36 12 96V150H70V76Z"/>
                <path d="M270 162H328V228H270Z"/><path d="M70 162H12V228H70Z"/>
                <path d="M270 240H328V284Q320 344 272 354V304Z"/><path d="M70 240H12V284Q20 344 68 354V304Z"/>
              </g>
              <path d="M84 318H256L252 358Q250 372 236 372H104Q90 372 88 358Z" fill="#FFC7D4" stroke="#D4124E" stroke-width="2.500"/>
            </svg>
            <img src="${P}/arac-ust.webp" alt="" style="position:relative;width:146px;filter:drop-shadow(0 18px 14px rgba(20,16,122,.45))">
            <i class="ks-pulse" style="left:50%;bottom:30px;width:76px;height:76px;margin-left:-38px"></i>
            <i class="ks-abs" style="left:50%;bottom:58px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:#D4124E;box-shadow:0 0 0 4px #fff"></i>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span class="ks-chip ks-chip--pink">${T('Arka tampon', 'Rear bumper')}</span><span class="ks-hand" style="font-size:27px;color:#D4124E;transform:rotate(-3deg);margin-left:6px">${T('arkadan!', 'from behind!')}</span></div>
          <div class="ks-btn" style="margin-top:12px;height:70px;font-size:21px">${T('Burası', 'Right here')}</div>
        </div>
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    kroki: {
      cls: '',
      html: `<div class="ks-abs" style="inset:0 0 auto;height:492px">${map({ w: 393, h: 492, x: -60, y: 120, k: 1.28, label: 'Değirmenyolu Cd.', lx: 80 })}</div>
      <div style="color:#14107A">${status('18:21')}</div>
      <div class="ks-body">
        <div class="ks-crashbar">${segs(5, 6, '#2318D6', 'rgba(35,24,214,.18)')}<span class="ks-elapsed" data-clock style="color:#2318D6">09:14</span></div>
        <div style="position:relative;display:flex;align-items:center;gap:8px;padding:10px 16px 0"><span class="ks-no">10</span><p class="ks-h4" style="font-size:20px">${T('Nasıl oldu? Arabaları sürükle.', 'What happened? Drag the cars.')}</p></div>
        <svg class="ks-abs" viewBox="0 0 393 420" style="left:0;top:40px;width:393px;overflow:visible" aria-hidden="true">
          <path d="M36 268C70 262 96 264 132 262" fill="none" stroke="#D4124E" stroke-width="3" stroke-dasharray="7 7" stroke-linecap="round"/>
          <g transform="translate(250 245) rotate(77) scale(.82) translate(-30 -60)">${car(CAR_A)}</g>
          <g transform="translate(158 266) rotate(77) scale(.82) translate(-30 -60)">${car(CAR_B)}</g>
          <path d="M197 228l4 -13m5 15l10 -9m-5 19l13 -3" stroke="#D4124E" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <div class="ks-abs" style="right:12px;top:58px;display:grid;gap:4px;padding:6px;border-radius:20px;background:#fff;box-shadow:var(--golge-2)">
          ${[I.car, I.arrow, I.light, I.sign, I.undo].map((ic, i) => `<span style="display:grid;place-items:center;width:40px;height:40px;border-radius:14px;${i === 0 ? 'background:#2318D6;color:#fff' : 'color:#2318D6'}"><i style="display:block;width:22px;height:22px">${ic}</i></span>`).join('')}
        </div>
        <div class="ks-sheet" style="position:absolute;left:0;right:0;bottom:0;top:420px;padding:22px 16px 0;display:flex;flex-direction:column">
          <p class="ks-num" style="display:flex;justify-content:space-between;align-items:baseline;font-size:36px;font-weight:800;letter-spacing:-.03em;line-height:1"><span style="color:#2318D6">A ${P(0)}</span><span style="color:#D4124E">B ${P(100)}</span></p>
          <div class="ks-bar" style="margin-top:8px"><i class="b" style="width:100%"></i></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:12px"><span class="ks-no ks-no--pink">7</span><p style="font-size:19px;font-weight:800;letter-spacing:-.012em">${T('Öndeki araca arkadan çarpma', 'Hitting the car in front')}</p></div>
          <p class="ks-small" style="margin-top:5px">${T('Tahmini. Kesin oranı sigorta şirketleri belirler.', 'An estimate. The insurers set the final split.')}</p>
          <div style="display:flex;align-items:center;gap:0;margin-top:12px">${av('burcu', 30, '#2318D6')}<span style="margin-left:-6px">${av('hakan', 30, '#D4124E')}</span><span class="ks-small" style="margin-left:9px;font-weight:700">${T('İkiniz de bu krokiyi görüyorsunuz', 'You’re both seeing this sketch')}</span></div>
          <div class="ks-btn ks-gap" style="height:64px;margin-bottom:30px">${T('İkimiz de böyle gördük', 'We both saw it this way')}</div>
        </div>
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    oran: {
      cls: '',
      html: `<div class="ks-abs" style="inset:0 0 auto;height:166px;background:#2318D6;color:#F3F4F8;overflow:hidden;padding:68px 20px 0"><i class="ks-gui"></i>
          <div style="position:relative;display:flex;align-items:center;gap:10px">${av('burcu', 40, '#F3F4F8')}<p style="font-size:15px;font-weight:700;line-height:1.1">Burcu<br><span style="opacity:.8">${T('A sürücüsü', 'Driver A')}</span></p><p class="ks-num" style="margin-left:auto;font-size:60px;font-weight:800;letter-spacing:-.04em;line-height:1">${P(0)}</p></div>
        </div>
        <div class="ks-abs" style="left:0;right:0;top:166px;height:236px;background:#FFC7D4;color:#D4124E;overflow:hidden;padding:18px 20px 0"><i class="ks-gui ks-gui--pink"></i>
          <div style="position:relative;display:flex;align-items:center;gap:10px">${av('hakan', 40, '#D4124E')}<p style="font-size:15px;font-weight:700;line-height:1.1">Hakan Bey<br><span style="opacity:.8">${T('B sürücüsü', 'Driver B')}</span></p></div>
          <p class="ks-num" style="position:relative;margin-top:14px;font-size:126px;font-weight:800;letter-spacing:-.05em;line-height:1;text-align:right">${P(100)}</p>
        </div>
        <div style="color:#F3F4F8">${status('18:23')}</div>
        <div class="ks-sheet" style="position:absolute;left:0;right:0;top:392px;bottom:0;padding:22px 16px 0;display:flex;flex-direction:column">
          <div style="display:flex;align-items:center;gap:8px"><span class="ks-chip ks-chip--pink">${T('Tahmini oran', 'Estimated split')}</span><span class="ks-chip">${T('Asli kusur', 'Primary fault')}</span></div>
          <p class="ks-h3" style="margin-top:9px;font-size:24px">${T('Öndeki araca arkadan çarpma', 'Hitting the car in front')}</p>
          <p class="ks-small" style="margin-top:4px">${T('Kesin oranı sigorta şirketleri belirler, genellikle üç iş günü içinde.', 'The insurers set the final split, usually within three working days.')}</p>
          <p class="ks-label" style="margin-top:10px">${T('Tutanağa eklenecek kanıtlar', 'Evidence going on the report')}</p>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:6px">
            ${[`${F}/burcu.webp`, `${F}/tampon.webp`, `${F}/tampon.webp`, `${F}/burcu.webp`].map((s, i) => `<i style="aspect-ratio:1;border-radius:12px;background:url(${s}) ${[40, 60, 30, 80][i]}% ${[60, 40, 70, 70][i]}% / ${[180, 240, 300, 260][i]}%"></i>`).join('')}
            <i style="aspect-ratio:1;border-radius:12px;background:#fff;box-shadow:var(--golge-1);display:grid;place-items:center;overflow:hidden">${miniKroki('rear', 58)}</i>
          </div>
          <div class="ks-card" style="margin-top:9px;padding:8px 12px;border-radius:16px;display:flex;align-items:center;gap:8px;font-size:13.500px;font-weight:700">
            <span style="color:#2318D6;width:20px;height:20px">${I.check}</span>${T('Burcu onayladı', 'Burcu agreed')}<span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;color:#D4124E">${wave}${T('Hakan Bey okuyor', 'Hakan is reading')}</span>
          </div>
          <div class="ks-btn ks-gap" style="height:64px;margin-bottom:26px;font-size:20px;background:#14107A">${T('İkimiz de onaylıyoruz', 'We both agree')}</div>
        </div><i class="ks-home" style="color:#14107A"></i>`,
    },
    imza: {
      cls: '',
      html: `${status('18:25')}<div class="ks-body">
        <div class="ks-crashbar">${segs(6, 6, '#2318D6')}<span class="ks-elapsed" data-clock style="color:#2318D6">13:40</span></div>
        <div style="padding:14px 20px 0;display:flex;gap:12px;align-items:flex-start">
          <div style="flex:1"><span class="ks-no">12</span><h2 class="ks-h1" style="margin-top:6px;font-size:58px">${T('İmzala.', 'Sign here.')}</h2></div>
          <div style="position:relative;width:74px;height:96px;flex:none;border-radius:8px;background:#fff;box-shadow:var(--golge-2);transform:rotate(4deg);overflow:hidden;padding:8px">
            <i style="display:block;height:5px;width:70%;background:#2318D6;border-radius:2px"></i>
            ${[100, 84, 92, 70].map((w) => `<i style="display:block;height:3px;width:${w}%;background:rgba(35,24,214,.26);border-radius:2px;margin-top:5px"></i>`).join('')}
            <div style="margin-top:6px;height:26px;border-radius:4px;background:rgba(35,24,214,.08);display:grid;place-items:center;overflow:hidden">${miniKroki('rear', 26)}</div>
          </div>
        </div>
        <p class="ks-lead" style="padding:8px 20px 0;font-size:18px">${T('İkinci imza atılınca tutanak iki sigortaya birden gider.', 'Once the second signature lands, the report goes to both insurers.')}</p>
        <div class="ks-card" style="margin:16px 14px 0;height:276px;background:#fff;border-radius:22px">
          <i class="ks-rosette ks-rosette--blue" style="right:-30px;bottom:-30px;width:170px;height:170px"></i>
          <div class="ks-abs" style="left:18px;top:14px"><span class="ks-chip" style="height:26px;font-size:12.500px;padding:0 9px">${av('burcu', 18, 'transparent')}A, Burcu Aksoy</span></div>
          <svg class="ks-abs" viewBox="0 0 220 100" style="left:34px;top:64px;width:300px;overflow:visible" aria-hidden="true"><path data-sign d="${SIG_A}" fill="none" stroke="#2318D6" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="ks-abs" style="left:20px;right:20px;bottom:50px;height:2px;background:rgba(35,24,214,.28)"></div>
          <span class="ks-abs ks-hand" style="left:20px;bottom:54px;font-size:22px;color:#2318D6">x</span>
          <p class="ks-abs ks-small ks-num" style="left:20px;bottom:18px;font-size:13px">${T('3 Kasım 2026, 18.25, Değirmenyolu Cd.', '3 Nov 2026, 18:25, Değirmenyolu St.')}</p>
        </div>
        <div style="padding:12px 14px 0"><div class="ks-btn ks-btn--big" style="height:78px;font-size:23px">${T('Tutanağı gönder', 'Send the report')}</div></div>
        <div class="ks-peek" style="height:88px;align-items:flex-start;padding-top:18px;">
          ${av('hakan', 34, '#D4124E')}
          <span style="flex:1;line-height:1.14">${T('Hakan Bey imzaladı', 'Hakan has signed')}<br><span style="font-size:13px;font-weight:500">18.24</span></span>
          ${sig(SIG_B, '#D4124E', 'width:112px')}
        </div>
      </div>`,
    },
    gitti: {
      cls: 'ks-on-carbon',
      html: `<i class="ks-rosette" style="width:520px;height:520px;left:40px;top:430px;opacity:.2"></i>${status('18:26')}<div class="ks-body">
        <div style="position:relative;padding:24px 22px 0">
          <h2 class="ks-h1" style="font-size:66px;line-height:.98">${T('Geçmiş olsun.', 'Glad you’re okay.')}</h2>
          <p class="ks-lead" style="margin-top:10px;font-weight:700">${T('Tutanak iki sigortaya da gitti.', 'The report reached both insurers.')}</p>
        </div>
        <div class="ks-ticket" style="margin:20px 14px 0">
          <div style="padding:16px 18px 14px;display:flex;justify-content:space-between;align-items:flex-start">
            <div><p class="ks-label">${T('Tutanak no', 'Report no')}</p><p class="ks-h4 ks-num" style="font-size:20px">KT-2026-118204</p></div>
            <div style="text-align:right"><p class="ks-label">${T('Süre', 'Time')}</p><p class="ks-num" style="font-size:20px;font-weight:800;letter-spacing:-.015em;color:#2318D6">14:22</p></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 18px 14px">
            <div>${sig(SIG_A, '#2318D6', 'height:44px')}<p class="ks-small" style="margin-top:2px;color:#2318D6;font-weight:700">A, ${T('Akça Sigorta', 'Akça Sigorta')}</p></div>
            <div>${sig(SIG_B, '#D4124E', 'height:44px')}<p class="ks-small" style="margin-top:2px;color:#D4124E;font-weight:700">B, ${T('Liman Sigorta', 'Liman Sigorta')}</p></div>
          </div>
          <div class="cut"></div>
          <div style="padding:13px 18px 15px;display:grid;gap:10px">
            <div style="display:flex;gap:10px;align-items:center"><span class="ks-round ks-round--ink" style="width:34px;height:34px">${I.shield}</span><p style="font-size:15.500px;font-weight:700;line-height:1.16">${T('Kusur oranı üç iş günü içinde gelir', 'The fault split arrives within three working days')}</p></div>
            <div style="display:flex;gap:10px;align-items:center"><span class="ks-round ks-round--ink" style="width:34px;height:34px">${I.wrench}</span><p style="font-size:15.500px;font-weight:700;line-height:1.16">${T('Arabayı servise vermeden eksperi bekle', 'Wait for the assessor before any repairs')}</p></div>
          </div>
        </div>
        <img src="${P}/arac.webp" alt="" style="position:absolute;left:96px;bottom:60px;width:296px;filter:drop-shadow(0 18px 14px rgba(5,3,60,.6))">
        <div class="ks-gap" style="position:relative;padding:0 14px 32px"><div class="ks-btn ks-btn--paper" style="height:66px;font-size:20px">${T('Dosyamı aç', 'Open my claim')}</div></div>
      </div><i class="ks-home"></i>`,
    },

    // ─── Sonrası ──────────────────────────────
    dosya: {
      cls: '',
      html: `${status('10:24')}<div class="ks-body">
        <div class="ks-pad" style="display:flex;align-items:center;gap:10px;padding-top:4px">
          <span class="ks-round ks-round--ink">${I.back}</span>
          <div style="flex:1"><p class="ks-label">${T('3 Kasım, Kozyatağı', '3 Nov, Kozyatağı')}</p><p class="ks-h4" style="font-size:21px">${T('Dosyan eksperde', 'With the assessor')}</p></div>
          <div style="border-radius:14px;overflow:hidden;background:#fff;box-shadow:var(--golge-1)">${miniKroki('rear', 50)}</div>
        </div>
        <div class="ks-card" style="margin:12px 14px 0;padding:16px 12px 12px">
          <div class="ks-steps">
            <span class="ok"><i>${I.check}</i>${T('Tutanak', 'Report')}</span>
            <span class="ok"><i>${I.check}</i>${T('Kusur', 'Fault')}</span>
            <span class="now"><i></i>${T('Eksper', 'Assessor')}</span>
            <span><i></i>${T('Onarım', 'Repair')}</span>
            <span><i></i>${T('Ödeme', 'Payment')}</span>
          </div>
        </div>
        <div style="position:relative;margin:10px 14px 0;border-radius:24px;overflow:hidden;box-shadow:var(--golge-2);background:#14107A;color:#F3F4F8">
          <div style="height:108px;position:relative">${map({ w: 365, h: 108, x: -40, y: -46, k: 1.1, label: 'Değirmenyolu Cd.', lx: 60 })}<span class="ks-abs" style="left:58%;top:30px;width:36px;height:36px;color:#2318D6;filter:drop-shadow(0 5px 5px rgba(20,16,122,.6))">${I.pin}</span></div>
          <div style="display:flex;align-items:center;gap:10px;padding:12px 14px 13px">
            ${av('eksper', 46, 'rgba(243,244,248,.8)')}
            <div style="flex:1;min-width:0"><p class="ks-h4" style="font-size:17.500px">${T('Salı 10 Kasım, 10.00', 'Tue 10 Nov, 10:00')}</p><p style="font-size:13.500px;opacity:.82">${T('Selin Demir, sigorta eksperi', 'Selin Demir, assessor')}</p></div>
            <span class="ks-round" style="width:40px;height:40px">${I.chat}</span><span class="ks-round" style="width:40px;height:40px;background:#F3F4F8;color:#14107A">${I.phone}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 14px 0">
          <div class="ks-card" style="padding:12px 14px"><p class="ks-label">${T('Kusur oranı', 'Fault split')}</p><p class="ks-num" style="margin-top:4px;font-size:15px;font-weight:800;display:flex;justify-content:space-between"><span style="color:#2318D6">A ${P(0)}</span><span style="color:#D4124E">B ${P(100)}</span></p><div class="ks-bar" style="height:9px;margin-top:6px"><i class="b" style="width:100%"></i></div></div>
          <div class="ks-card" style="padding:12px 14px"><p class="ks-label">${T('Onarım tahmini', 'Repair estimate')}</p><p class="ks-num" style="margin-top:3px;font-size:22px;font-weight:800;letter-spacing:-.025em">24.600 ₺</p><p class="ks-small" style="font-size:12.500px">${T('Karşı sigorta öder', 'Other insurer pays')}</p></div>
        </div>
        <div class="ks-card" style="margin:10px 14px 0;padding:10px 14px;display:flex;align-items:center;gap:10px"><span class="ks-round ks-round--ink" style="width:38px;height:38px">${I.wrench}</span><div style="flex:1"><p class="ks-h4" style="font-size:16px">Kozyatağı Oto</p><p class="ks-small" style="font-size:13px">${T('Seçtiğin servis, 1,2 km', 'Your garage, 1.2 km away')}</p></div><span style="display:inline-flex;align-items:center;gap:4px;font-size:14.500px;font-weight:800;color:#D4124E"><i style="width:15px;height:15px;display:block">${I.star}</i>4,8</span></div>
        <div class="ks-card" style="margin:10px 14px 0;padding:10px 14px;display:flex;align-items:center;gap:10px;background:#FFC7D4;color:#D4124E;box-shadow:0 14px 24px -16px rgba(212,18,78,.8)">
          <span class="ks-num" style="font-size:23px;font-weight:800;letter-spacing:-.025em;white-space:nowrap">18.400 ₺</span><span style="line-height:1.12;font-size:14px;font-weight:700">${T('değer kaybını da isteyebilirsin', 'in lost value is yours to claim')}</span><span style="margin-left:auto;width:20px;height:20px;flex:none">${I.chev}</span>
        </div>
        ${nav(1)}
      </div><i class="ks-home"></i>`,
    },
    deger: {
      cls: 'ks-on-carbon',
      html: `<i class="ks-gui"></i>${status('10:25')}<div class="ks-body">
        <div class="ks-pad" style="position:relative;display:flex;align-items:center;gap:10px;padding-top:4px"><span class="ks-round">${I.back}</span><span class="ks-chip ks-chip--paper" style="margin-left:auto">${T('Tahmini', 'Estimate')}</span></div>
        <div style="position:relative;padding:12px 20px 0">
          <p class="ks-h3" style="font-size:27px">${T('Aracın değer kaybetti. Bunu da isteyebilirsin.', 'Your car lost value. You can claim that too.')}</p>
          <p class="ks-num" style="margin-top:12px;font-size:70px;font-weight:800;letter-spacing:-.045em;line-height:1">18.400 ₺</p>
        </div>
        <div style="position:relative;margin-top:12px;height:176px">
          <svg viewBox="0 0 393 176" style="display:block;width:100%;height:100%" aria-hidden="true">
            <defs><linearGradient id="ksdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F4F8" stop-opacity=".32"/><stop offset="1" stop-color="#F3F4F8" stop-opacity="0"/></linearGradient></defs>
            <path d="M0 34C60 40 120 44 178 50L214 96C270 104 330 112 393 120V176H0Z" fill="url(#ksdg)"/>
            <path d="M0 34C60 40 120 44 178 50L214 96C270 104 330 112 393 120" fill="none" stroke="#F3F4F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M214 96C270 76 330 78 393 84" fill="none" stroke="#FFC7D4" stroke-width="2.500" stroke-dasharray="6 7" stroke-linecap="round"/>
            <path d="M196 8V176" stroke="#F3F4F8" stroke-width="1.500" stroke-dasharray="3 5" opacity=".6"/>
            <circle cx="214" cy="96" r="7" fill="#FFC7D4" stroke="#2318D6" stroke-width="3"/>
            <g font-family="'Atkinson Hyperlegible Next',sans-serif" font-size="13" font-weight="700" fill="#F3F4F8"><text x="202" y="20">${T('Kaza', 'Crash')}</text><text x="20" y="168" opacity=".78">${T('Haz', 'Jun')}</text><text x="350" y="168" opacity=".78">${T('Oca', 'Jan')}</text></g>
          </svg>
          <span class="ks-abs ks-hand" style="right:18px;top:40px;font-size:21px;color:#FFC7D4;transform:rotate(-3deg)">${T('kazasız olsaydı', 'without the crash')}</span>
        </div>
        <div class="ks-sheet" style="padding:22px 16px 30px;display:flex;flex-direction:column;margin-top:-2px">
          <div style="display:flex;align-items:center;gap:10px">${av('hakan', 38, '#D4124E')}<div><p class="ks-label">${T('Kimden', 'From')}</p><p class="ks-h4">${T('Hakan Bey’in sigortası', 'Hakan’s insurer')}</p></div></div>
          <p style="margin-top:10px;font-size:15px;line-height:1.28">${T('Kazada kusursuz ya da daha az kusurlu olan taraf talep edebilir. Eksper raporuyla birlikte hesaplanır.', 'The driver with no fault, or less of it, can claim. It’s calculated with the assessor’s report.')}</p>
          <div style="display:grid;gap:7px;margin-top:12px">
            ${[[T('Araç yaşı', 'Car age'), T('5 yıl', '5 years'), 46], [T('Kilometre', 'Mileage'), '62.000 km', 58], [T('Hasar tutarı', 'Damage'), '24.600 ₺', 72]].map(([k, v, w]) => `<div style="display:flex;align-items:center;gap:9px;font-size:13.500px;font-weight:700"><span style="width:82px">${k}</span><span style="flex:1;height:9px;border-radius:5px;background:rgba(35,24,214,.1);overflow:hidden"><i style="display:block;height:100%;width:${w}%;background:#2318D6;border-radius:5px"></i></span><span class="ks-num" style="width:72px;text-align:right">${v}</span></div>`).join('')}
          </div>
          <div class="ks-btn ks-gap" style="height:62px;font-size:20px">${T('Başvuruyu başlat', 'Start the claim')}</div>
        </div>
      </div><i class="ks-home" style="color:#14107A"></i>`,
    },
  };
}

export const SCREEN_NAMES = ['karsilama', 'ruhsat', 'torpido', 'police', 'dosyalar', 'servis', 'kilit', 'yaralanan', 'acil', 'guvenlik', 'foto', 'esles', 'tutanak', 'tutanak-b', 'darbe', 'kroki', 'oran', 'imza', 'gitti', 'dosya', 'deger'];
