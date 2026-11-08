import { refreshSoon } from './scroll';

// Anton'da Türkçe büyük harflerin noktası ve şapkası (İ Ü Ö Ğ Â) büyük harf yüksekliğinin üstüne, Ş ve Ç'nin çengeli ile
// virgül satır çizgisinin altına uzar. Başlık satırları sık dizildiği için üst satırın çengeli ya da alt satırın noktası
// komşu satırdaki harfe değebilir. Burada her büyük başlığın harfleri ölçülür: alt alta düşen iki harf arasında GAP kadar
// boşluk kalmıyorsa o başlığın satır aralığı gerektiği kadar açılır, sorunsuz başlıklara dokunulmaz. Metin (panel, dil),
// ekran genişliği ve sayfa değişince yeniden ölçülür. Maskelerin harfleri kesmemesi index.css'teki `.line-mask` kuralında.

const GAP = 0.05; // em
const SELECTOR = '.display, .font-display';

type Glyph = { x0: number; x1: number; top: number; bot: number; base: number; em: number };
type Style = { font: string; upper: boolean; lang: string; size: number; skip: boolean; shift: number };

const canvas = document.createElement('canvas').getContext('2d');
const metricCache = new Map<string, TextMetrics>();

function metrics(font: string, ch: string) {
  const key = `${font}|${ch}`;
  let m = metricCache.get(key);
  if (!m && canvas) {
    canvas.font = font;
    m = canvas.measureText(ch);
    metricCache.set(key, m);
  }
  return m;
}

// Beliriş sırasında satırları kaydıran dönüşümler (soft-line) ölçüme girmesin: harfin dönüşümsüz yeri kullanılır
function shiftWithin(node: Element, root: Element) {
  let y = 0;
  for (let e: Element | null = node; e && e !== root; e = e.parentElement) {
    const t = getComputedStyle(e).transform;
    if (t && t !== 'none') y += new DOMMatrixReadOnly(t).m42;
  }
  return y;
}

// Döndürülmüş ya da dikey yazılmış başlıkta harf kutuları eğik olur, ölçüm anlamsızlaşır
function rotated(el: Element) {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.writingMode.startsWith('vertical')) return true;
    if (cs.transform && cs.transform !== 'none') {
      const m = new DOMMatrixReadOnly(cs.transform);
      if (Math.abs(m.b) > 1e-3 || Math.abs(m.c) > 1e-3) return true;
    }
  }
  return false;
}

function glyphs(el: HTMLElement) {
  const out: Glyph[] = [];
  const styles = new Map<Element, Style>();
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    const p = text.parentElement;
    if (!p) continue;
    let s = styles.get(p);
    if (!s) {
      const cs = getComputedStyle(p);
      s = {
        font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        upper: cs.textTransform === 'uppercase',
        lang: p.closest('[lang]')?.getAttribute('lang') || 'tr',
        size: parseFloat(cs.fontSize),
        skip: cs.visibility === 'hidden' || !!p.closest('.sr-only'),
        shift: shiftWithin(p, el),
      };
      styles.set(p, s);
    }
    if (s.skip) continue;
    const str = text.data;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        i++;
        continue;
      }
      if (/\s/.test(str[i])) continue;
      const ch = s.upper ? str[i].toLocaleUpperCase(s.lang) : str[i];
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const rc = range.getClientRects()[0];
      if (!rc || !rc.width || !rc.height) continue;
      const m = metrics(s.font, ch);
      if (!m) continue;
      const sc = rc.height / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
      const base = rc.top + (m.fontBoundingBoxAscent - s.shift) * sc;
      out.push({
        x0: rc.left - m.actualBoundingBoxLeft * sc,
        x1: rc.left + m.actualBoundingBoxRight * sc,
        top: base - m.actualBoundingBoxAscent * sc,
        bot: base + m.actualBoundingBoxDescent * sc,
        base,
        em: s.size * sc,
      });
    }
  }
  return out;
}

// Başlığın ihtiyaç duyduğu ek satır aralığı (em)
function extraLeading(list: Glyph[]) {
  list.sort((a, b) => a.base - b.base);
  const lines: { base: number; em: number; gs: Glyph[] }[] = [];
  for (const g of list) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(g.base - last.base) < 0.3 * g.em) last.gs.push(g);
    else lines.push({ base: g.base, em: g.em, gs: [g] });
  }
  let extra = 0;
  for (let i = 0; i + 1 < lines.length; i++) {
    const up = lines[i];
    const down = lines[i + 1];
    let need = 0;
    for (const a of up.gs)
      for (const b of down.gs) {
        if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) <= 0) continue;
        need = Math.max(need, (a.bot - a.base + (b.base - b.top)) / up.em);
      }
    if (need) extra = Math.max(extra, need + GAP - (down.base - up.base) / up.em);
  }
  return extra;
}

function fit(el: HTMLElement) {
  const before = el.style.lineHeight;
  if (el.dataset.lead) {
    el.style.removeProperty('line-height');
    delete el.dataset.lead;
  }
  let next = '';
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
  // Tek satırlık başlıkta komşu satır yok
  if (cs.display !== 'none' && el.getClientRects().length && Number.isFinite(lh) && el.offsetHeight >= parseFloat(cs.lineHeight) * 1.6 && !rotated(el)) {
    const extra = extraLeading(glyphs(el));
    if (extra > 0.004) next = (lh + extra).toFixed(3);
  }
  if (next) {
    el.style.lineHeight = next;
    el.dataset.lead = '1';
  }
  return next !== before;
}

const outermost = (el: Element) => {
  let top = el;
  for (let e = el.parentElement?.closest(SELECTOR); e; e = e.parentElement?.closest(SELECTOR)) top = e;
  return top as HTMLElement;
};

const pending = new Set<HTMLElement>();
let everything = false;
let frame = 0;
let fontsReady = false;

function flush() {
  frame = 0;
  if (!fontsReady) return;
  const list = everything ? Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter((e) => !e.parentElement?.closest(SELECTOR)) : [...pending];
  everything = false;
  pending.clear();
  let changed = false;
  for (const el of list) if (el.isConnected && fit(el)) changed = true;
  // Başlık boyu değiştiyse kaydırma tetikleyicilerinin yeri de değişir
  if (changed) refreshSoon();
}

function schedule(el?: Element) {
  if (el) pending.add(outermost(el));
  else everything = true;
  if (!frame) frame = requestAnimationFrame(flush);
}

export function startLeadingFit() {
  document.fonts.ready.then(() => {
    fontsReady = true;
    schedule();
  });
  document.fonts.addEventListener('loadingdone', () => {
    metricCache.clear();
    schedule();
  });
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => schedule(), 120);
  });
  new MutationObserver((records) => {
    for (const r of records) {
      const target = r.target instanceof Element ? r.target : r.target.parentElement;
      const head = target?.closest(SELECTOR);
      if (head) {
        schedule(head);
        continue;
      }
      r.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.matches(SELECTOR)) schedule(n);
        else n.querySelectorAll(SELECTOR).forEach((e) => schedule(e));
      });
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
