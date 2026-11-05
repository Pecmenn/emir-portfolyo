import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { TrailData, TrailLayer, TrailMotion, TrailStop } from '../content';
import { useLang } from '../lib/i18n';
import { reducedMotion, refreshSoon } from '../lib/scroll';
import { useMobile, useSceneFont } from './Scenes';

// Yürüyüş motoru: sayfa tek bir eşyükselti haritasıdır, kaydırmak o haritada yürümektir (bkz. Project.trail).
// Sahne motorundan (Scenes) farkı: içerik kaydırıldıkça ekrana uçmaz, haritanın üzerinde durur; kamera ona gider.
// Haritanın kendisi görsel dosyası değildir, yalnızca görünen yerler kod ile parça parça çizilir.
// Duraklar (stops) dünya koordinatına oturur; içerikleri durağın 1600×900 (telefonda 400×700) çalışma alanına yerleşir.
// Yol (way) çalışma alanı koordinatıyla verilir, duraklar arasına kendiliğinden kıvrımlı bir patika çizilir.
// Saat, mesafe, yükselti, çekim ve renkler durak içindeki [q, değer] anahtarlarıyla (tracks) tanımlanır.
// q: durak boyunca 0-1 ilerleme; durağa yaklaşırken eksi, çıkarken 1'in üstü.

const BOARD = { desk: [1600, 900], mobile: [400, 700] };
const HEADER = 68;
const HUD = { desk: 70, mobile: 58 };
const REST = [0, 0, 0, 1, 1];
const TILE = 640;
const CELL = 8;
const LEVEL = 0.043;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (t: number) => t * t * (3 - 2 * t);
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const local = (p: number, start = 0, end = 1) => clamp01((p - start) / Math.max(0.001, end - start));
const U = (n: number) => `calc(var(--u) * ${n})`;

const EASE: Record<string, (t: number) => number> = {
  out: (t) => 1 - (1 - t) ** 3,
  inout: smoother,
  linear: (t) => t,
  // Yerine otururken hafifçe taşar: pin düşmesi, tabela sallanması
  back: (t) => {
    const c = 2.05;
    const x = t - 1;
    return 1 + (c + 1) * x ** 3 + c * x ** 2;
  },
  // Mühür: hızlı iner, çok az geri sıçrar
  stamp: (t) => (t < 0.6 ? (t / 0.6) ** 2 : 1 + Math.sin(((t - 0.6) / 0.4) * Math.PI) * 0.05),
};

const fill = (v: number[] | undefined, base: number[]) => base.map((b, i) => v?.[i] ?? b);
const mix = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k);

function sample(m: TrailMotion, q: number, settled = false) {
  const to = fill(m.to, REST);
  if (settled || (reducedMotion && !m.scrub)) return to;
  const e = EASE[m.ease ?? 'out'];
  let v = mix(fill(m.from, to), to, e(local(q, m.start, m.end)));
  if (m.out) v = mix(v, fill(m.out.to, v), EASE.out(local(q, m.out.start, m.out.end)));
  return v;
}

function channels(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const css = (c: number[], a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;

// ---------- Arazi: tohumlu gürültü, küçük kareler üzerinde eşyükselti eğrileri ----------

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function terrainHeight(x: number, y: number) {
  let t = 0;
  let a = 0.55;
  let f = 1;
  const nx = x / 1180 + 3.1;
  const ny = y / 1180 + 7.7;
  for (let i = 0; i < 4; i++) {
    t += a * vnoise(nx * f, ny * f);
    f *= 2.03;
    a *= 0.42;
  }
  return t * 2.3;
}

// wx, wy dünya biriminde; k bir birimin kaç piksel olduğu
function contours(wx: number, wy: number, size: number, cell: number, level: number, k: number) {
  const n = Math.ceil(size / cell) + 1;
  const row = n + 1;
  const g = new Float32Array(row * row);
  for (let y = 0; y < row; y++) for (let x = 0; x < row; x++) g[y * row + x] = terrainHeight(wx + x * cell, wy + y * cell);
  const thin = new Path2D();
  const bold = new Path2D();
  const c = cell * k;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = g[y * row + x];
      const b = g[y * row + x + 1];
      const d = g[(y + 1) * row + x];
      const e = g[(y + 1) * row + x + 1];
      const lo = Math.min(a, b, d, e);
      const hi = Math.max(a, b, d, e);
      for (let m = Math.ceil(lo / level); m * level <= hi; m++) {
        const lv = m * level;
        const path = m % 5 === 0 ? bold : thin;
        const pts: number[] = [];
        if (a < lv !== b < lv) pts.push(x + (lv - a) / (b - a), y);
        if (b < lv !== e < lv) pts.push(x + 1, y + (lv - b) / (e - b));
        if (d < lv !== e < lv) pts.push(x + (lv - d) / (e - d), y + 1);
        if (a < lv !== d < lv) pts.push(x, y + (lv - a) / (d - a));
        if (pts.length >= 4) {
          path.moveTo(pts[0] * c, pts[1] * c);
          path.lineTo(pts[2] * c, pts[3] * c);
        }
        if (pts.length === 8) {
          path.moveTo(pts[4] * c, pts[5] * c);
          path.lineTo(pts[6] * c, pts[7] * c);
        }
      }
    }
  }
  return { thin, bold };
}

type Ink = { thin: string; bold: string; mark: string };
const DAY_INK: Ink = { thin: 'rgba(23,53,42,.11)', bold: 'rgba(23,53,42,.24)', mark: 'rgba(23,53,42,.42)' };
const NIGHT_INK: Ink = { thin: 'rgba(255,74,56,.24)', bold: 'rgba(255,74,56,.5)', mark: 'rgba(255,74,56,.6)' };

// Görünen harita parçalarını gerektikçe çizer, uzaktakileri atar
function makeTerrain(host: HTMLElement, u: number, ink: Ink, limit: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const tiles = new Map<string, { el: HTMLCanvasElement; ix: number; iy: number }>();
  const draw = (ix: number, iy: number) => {
    const el = document.createElement('canvas');
    const px = Math.ceil(TILE * u * dpr);
    el.width = px;
    el.height = px;
    // Tuval pikseli ekrana birebir oturur; parça sınırlarında çizgiler kırılmaz
    el.className = 'trail-tile';
    el.style.cssText = `position:absolute;left:${ix * TILE * u}px;top:${iy * TILE * u}px;width:${px / dpr}px;height:${px / dpr}px`;
    const ctx = el.getContext('2d');
    if (ctx) {
      const { thin, bold } = contours(ix * TILE, iy * TILE, TILE, CELL, LEVEL, u * dpr);
      ctx.lineCap = 'round';
      ctx.strokeStyle = ink.thin;
      ctx.lineWidth = 0.8 * dpr;
      ctx.stroke(thin);
      ctx.strokeStyle = ink.bold;
      ctx.lineWidth = 1.15 * dpr;
      ctx.stroke(bold);
      // Haritacı artısı ve koordinat: her iki parçada bir, parçanın ortasında
      if (ix % 2 === 0 && iy % 2 === 0) {
        const mid = px / 2;
        const arm = 11 * dpr;
        ctx.strokeStyle = ink.mark;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.moveTo(mid - arm, mid);
        ctx.lineTo(mid + arm, mid);
        ctx.moveTo(mid, mid - arm);
        ctx.lineTo(mid, mid + arm);
        ctx.stroke();
        ctx.fillStyle = ink.mark;
        ctx.font = `${10.5 * dpr}px "DM Mono", ui-monospace, monospace`;
        ctx.fillText(`36°${String(24 + iy / 2).padStart(2, '0')}′  30°${String(27 + ix / 2).padStart(2, '0')}′`, mid + 8 * dpr, mid - 7 * dpr);
      }
    }
    host.appendChild(el);
    tiles.set(`${ix},${iy}`, { el, ix, iy });
  };
  return {
    update(cx: number, cy: number, halfW: number, halfH: number, budget: number) {
      const miss: [number, number, number][] = [];
      const x0 = Math.floor((cx - halfW) / TILE);
      const x1 = Math.floor((cx + halfW) / TILE);
      const y0 = Math.floor((cy - halfH) / TILE);
      const y1 = Math.floor((cy + halfH) / TILE);
      for (let iy = y0; iy <= y1; iy++) {
        for (let ix = x0; ix <= x1; ix++) {
          if (tiles.has(`${ix},${iy}`)) continue;
          miss.push([ix, iy, ((ix + 0.5) * TILE - cx) ** 2 + ((iy + 0.5) * TILE - cy) ** 2]);
        }
      }
      miss.sort((a, b) => a[2] - b[2]);
      for (let i = 0; i < Math.min(budget, miss.length); i++) draw(miss[i][0], miss[i][1]);
      if (tiles.size > limit) {
        const far = [...tiles.entries()].sort(
          (a, b) => ((b[1].ix + 0.5) * TILE - cx) ** 2 + ((b[1].iy + 0.5) * TILE - cy) ** 2 - ((a[1].ix + 0.5) * TILE - cx) ** 2 - ((a[1].iy + 0.5) * TILE - cy) ** 2,
        );
        for (const [key, tile] of far.slice(0, tiles.size - limit)) {
          tile.el.remove();
          tiles.delete(key);
        }
      }
    },
    clear() {
      tiles.forEach((tile) => tile.el.remove());
      tiles.clear();
    },
  };
}

// ---------- Zaman çizelgesi ve rota ----------

type Span = { tStart: number; start: number; end: number; len: number };
type Key = { p: number; v: number[] };

function resolveStops(data: TrailData, mobile: boolean): TrailStop[] {
  return data.stops.map((s) => {
    const o = mobile && s.m ? { ...s, ...s.m } : s;
    const layers = s.layers
      .filter((L) => !(mobile && L.m?.hide))
      .map((L) => (mobile && L.m ? { ...L, ...L.m } : L));
    return { ...o, layers };
  });
}

function buildTiming(stops: TrailStop[]) {
  let cur = 0;
  const spans: Span[] = stops.map((s, i) => {
    const tStart = cur;
    const start = cur + (i ? (s.transit ?? 50) : 0);
    const len = s.length;
    cur = start + len;
    return { tStart, start, end: cur, len };
  });
  const tracks: Record<string, Key[]> = {};
  stops.forEach((s, i) => {
    for (const [name, keys] of Object.entries(s.tracks ?? {})) {
      const list = (tracks[name] ??= []);
      for (const [q, v] of keys) {
        list.push({ p: spans[i].start + Number(q) * spans[i].len, v: typeof v === 'string' ? channels(v) : [v as number] });
      }
    }
  });
  return { spans, total: cur, tracks };
}

function trackAt(keys: Key[] | undefined, pos: number): number[] {
  if (!keys?.length) return [0];
  if (pos <= keys[0].p) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    if (pos < keys[i + 1].p) return mix(keys[i].v, keys[i + 1].v, (pos - keys[i].p) / Math.max(0.001, keys[i + 1].p - keys[i].p));
  }
  return keys[keys.length - 1].v;
}

type Geo = { sw: number; sh: number; u: number; bw: number; bh: number; fx: number; fy: number; ah: number };
type Pose = { x: number; y: number; z: number; r: number; fy: number };

function buildRoute(stops: TrailStop[], spans: Span[], geo: Geo, mobile: boolean) {
  const { u, bw, bh } = geo;
  const origin = stops.map((s) => ({ x: ((s.at?.[0] ?? 0) - bw / 2) * u, y: ((s.at?.[1] ?? 0) - bh / 2) * u }));

  // Yol düğümleri: her durağın way noktaları, kaydırmadaki yerleriyle birlikte
  const nodes: { x: number; y: number; pos: number; stop: number }[] = [];
  stops.forEach((s, i) => {
    const way = s.way ?? [];
    way.forEach((w, j) => {
      const q = w[2] ?? (way.length > 1 ? j / (way.length - 1) : 0);
      nodes.push({ x: origin[i].x + w[0] * u, y: origin[i].y + w[1] * u, pos: spans[i].start + q * spans[i].len, stop: i });
    });
  });

  // Düğümler arası kıvrımlı patika (Catmull-Rom üstüne küçük sapmalar)
  const xs: number[] = [];
  const ys: number[] = [];
  const nodeAt: number[] = [];
  for (let k = 0; k < nodes.length - 1; k++) {
    const a = nodes[k];
    const b = nodes[k + 1];
    const p0 = nodes[Math.max(0, k - 1)];
    const p3 = nodes[Math.min(nodes.length - 1, k + 2)];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const m = Math.max(2, Math.ceil(dist / (11 * u)));
    const cross = a.stop !== b.stop;
    const amp = Math.min((cross ? (mobile ? 26 : 96) : mobile ? 7 : 16) * u, dist * 0.09);
    const nx = -(b.y - a.y) / Math.max(1, dist);
    const ny = (b.x - a.x) / Math.max(1, dist);
    nodeAt.push(xs.length);
    for (let j = 0; j < m; j++) {
      const t = j / m;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (v0: number, v1: number, v2: number, v3: number) =>
        0.5 * (2 * v1 + (v2 - v0) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (3 * v1 - v0 - 3 * v2 + v3) * t3);
      const w = amp * Math.sin(t * Math.PI) * (Math.sin(t * Math.PI * 3 + k * 1.7) * 0.62 + Math.sin(t * Math.PI * 7 + k * 2.9) * 0.38);
      xs.push(cr(p0.x, a.x, b.x, p3.x) + nx * w);
      ys.push(cr(p0.y, a.y, b.y, p3.y) + ny * w);
    }
  }
  const lastNode = nodes[nodes.length - 1];
  nodeAt.push(xs.length);
  xs.push(lastNode.x);
  ys.push(lastNode.y);

  const cum = new Float32Array(xs.length);
  for (let i = 1; i < xs.length; i++) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  let str = '';
  const offs = new Uint32Array(xs.length);
  for (let i = 0; i < xs.length; i++) {
    str += `${xs[i].toFixed(1)},${ys[i].toFixed(1)} `;
    offs[i] = str.length;
  }

  const hiker = (pos: number) => {
    let k = 0;
    while (k < nodes.length - 2 && pos > nodes[k + 1].pos) k++;
    const a = nodes[k];
    const b = nodes[k + 1];
    let f = local(pos, a.pos, b.pos);
    if (a.stop !== b.stop) f = reducedMotion ? (f < 0.5 ? 0 : 1) : smoother(f);
    const target = lerp(cum[nodeAt[k]], cum[nodeAt[k + 1]], f);
    let lo = nodeAt[k];
    let hi = nodeAt[k + 1];
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= target) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo];
    const g = seg > 0 ? (target - cum[lo]) / seg : 0;
    return { x: lerp(xs[lo], xs[hi], g), y: lerp(ys[lo], ys[hi], g), index: lo };
  };

  // Rotanın tamamı: son durakta kamera buna göre geri çekilir
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bounds = { minX, maxX, minY, maxY };

  const cams = stops.map((s, i) => {
    if (s.fit) {
      const top = (s.fitTop ?? 260) * u;
      const pad = (mobile ? 90 : 170) * u;
      const availH = geo.ah - top;
      const z = Math.min(geo.sw / (maxX - minX + pad * 2), availH / (maxY - minY + pad * 2));
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z, fy: HEADER + top + availH / 2, dx: 0, dy: 0, fit: true };
    }
    const x = (s.at?.[0] ?? 0) * u;
    const y = (s.at?.[1] ?? 0) * u;
    const next = stops[i + 1];
    let dx = 0;
    let dy = 0;
    if (next?.at && !reducedMotion) {
      const d = Math.hypot(next.at[0] - (s.at?.[0] ?? 0), next.at[1] - (s.at?.[1] ?? 0));
      const drift = (mobile ? 22 : 46) * u;
      dx = ((next.at[0] - (s.at?.[0] ?? 0)) / d) * drift;
      dy = ((next.at[1] - (s.at?.[1] ?? 0)) / d) * drift;
    }
    return { x, y, z: s.zoom ?? 1, fy: geo.fy, dx, dy, fit: false };
  });

  const pose = (k: number, q: number): Pose => {
    const c = cams[k];
    return { x: c.x + c.dx * (q - 0.5), y: c.y + c.dy * (q - 0.5), z: c.z, r: 0, fy: c.fy };
  };
  const camera = (pos: number): Pose & { k: number } => {
    let k = 0;
    while (k < stops.length - 1 && pos > spans[k].end) k++;
    const s = spans[k];
    if (k === 0 || pos >= s.start) return { ...pose(k, clamp01((pos - s.start) / s.len)), k };
    const t = (pos - s.tStart) / (s.start - s.tStart);
    const e = reducedMotion ? (t < 0.5 ? 0 : 1) : smoother(t);
    const a = pose(k - 1, 1);
    const b = pose(k, 0);
    const dip = reducedMotion || cams[k].fit ? 0 : 0.14 * Math.sin(Math.PI * t);
    return {
      x: lerp(a.x, b.x, e),
      y: lerp(a.y, b.y, e),
      z: a.z * (b.z / a.z) ** e * (1 - dip),
      r: reducedMotion ? 0 : (stops[k].turn ?? 0) * Math.sin(Math.PI * t),
      fy: lerp(a.fy, b.fy, e),
      k,
    };
  };

  return { origin, camera, hiker, str, offs, xs, ys, bounds };
}

// ---------- Bileşen ----------

type Item = {
  L: TrailLayer;
  el: HTMLElement;
  motion?: TrailMotion;
  chars: HTMLElement[];
  ticks: HTMLElement[];
  fillBar: HTMLElement | null;
  shown: number;
  count: string;
};

export default function Trail({ data, font }: { data: TrailData; font?: string }) {
  const mobile = useMobile();
  useSceneFont(font);
  const { t, lang } = useLang();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mapPlane = useRef<HTMLDivElement>(null);
  const dayMap = useRef<HTMLDivElement>(null);
  const nightMap = useRef<HTMLDivElement>(null);
  const overview = useRef<HTMLCanvasElement>(null);
  const trailG = useRef<SVGGElement>(null);
  const walked = useRef<SVGPolylineElement>(null);
  const ghost = useRef<SVGPolylineElement>(null);
  const marker = useRef<SVGGElement>(null);
  const contentPlane = useRef<HTMLDivElement>(null);
  const topPlane = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const hudClock = useRef<HTMLSpanElement>(null);
  const hudKm = useRef<HTMLSpanElement>(null);
  const hudAlt = useRef<HTMLSpanElement>(null);
  const hudBars = useRef<(HTMLSpanElement | null)[]>([]);
  const hudFill = useRef<HTMLDivElement>(null);
  const flags = useRef<(HTMLDivElement | null)[]>([]);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const stopEls = useRef<Record<string, HTMLDivElement | null>>({});
  const terrain = useRef<{ day: ReturnType<typeof makeTerrain>; night: ReturnType<typeof makeTerrain> } | null>(null);
  const pointer = useRef({ x: 0, y: 0, on: false, ox: 0, oy: 0 });

  const [geo, setGeo] = useState<Geo | null>(null);
  const [bw, bh] = mobile ? BOARD.mobile : BOARD.desk;
  const hudH = mobile ? HUD.mobile : HUD.desk;

  const stops = useMemo(() => resolveStops(data, mobile), [data, mobile]);
  const timing = useMemo(() => buildTiming(stops), [stops]);
  const route = useMemo(() => (geo ? buildRoute(stops, timing.spans, geo, mobile) : null), [stops, timing, geo, mobile]);

  // Yükselti profili: alttaki şeritteki ilerleme çizgisi
  const profile = useMemo(() => {
    const keys = timing.tracks.alt ?? [];
    if (keys.length < 2) return '';
    const vals = keys.map((k) => k.v[0]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pt = (k: Key) => `${((k.p / timing.total) * 1000).toFixed(1)},${(92 - ((k.v[0] - lo) / Math.max(1, hi - lo)) * 84).toFixed(1)}`;
    return `M0,92 L${keys.map(pt).join(' L')} L1000,${pt(keys[keys.length - 1]).split(',')[1]}`;
  }, [timing]);

  useEffect(() => {
    refreshSoon();
  }, [mobile, timing.total]);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      const ah = sh - HEADER - hudH;
      const u = Math.min(sw / bw, ah / bh);
      setGeo((old) => (old && old.sw === sw && old.sh === sh && old.bw === bw ? old : { sw, sh, u, bw, bh, fx: sw / 2, fy: HEADER + ah / 2, ah }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bw, bh, hudH]);

  // Harita: ölçü değişince baştan çizilir. Genel bakış için rotanın tamamını gösteren tek parça boşta hazırlanır
  useEffect(() => {
    if (!geo || !route || !dayMap.current || !nightMap.current) return;
    const limit = mobile ? 24 : 56;
    terrain.current = {
      day: makeTerrain(dayMap.current, geo.u, DAY_INK, limit),
      night: makeTerrain(nightMap.current, geo.u, NIGHT_INK, limit),
    };
    const cv = overview.current;
    const { minX, maxX, minY, maxY } = route.bounds;
    const paint = () => {
      if (!cv) return;
      const u = geo.u;
      const m = 2600 * u;
      const x = minX - m;
      const y = minY - m;
      const w = maxX - minX + m * 2;
      const h = maxY - minY + m * 2;
      const k = Math.min(2200 / w, 2200 / h);
      cv.width = Math.round(w * k);
      cv.height = Math.round(h * k);
      cv.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const { thin, bold } = contours(x / u, y / u, Math.max(w, h) / u, 34, LEVEL * 2, u * k);
      ctx.lineCap = 'round';
      ctx.strokeStyle = DAY_INK.thin;
      ctx.lineWidth = 0.8;
      ctx.stroke(thin);
      ctx.strokeStyle = DAY_INK.bold;
      ctx.lineWidth = 1;
      ctx.stroke(bold);
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(paint) : window.setTimeout(paint, 900);
    const made = terrain.current;
    return () => {
      if (!idle) window.clearTimeout(id);
      made.day.clear();
      made.night.clear();
    };
  }, [geo, route, mobile]);

  // Kaydırma döngüsü
  useEffect(() => {
    if (!geo || !route) return;
    const { u, sw, sh } = geo;
    const { spans, total, tracks } = timing;
    const { body } = document;
    const base = (getComputedStyle(body).backgroundColor.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const last = stops.length - 1;
    const clearR = (mobile ? 215 : 400) * u;
    const softR = (mobile ? 370 : 660) * u;

    const items: Item[][] = stops.map((s, si) =>
      s.layers.map((L, li) => {
        const el = refs.current[`${si}-${li}`] as HTMLElement;
        let motion = L.motion;
        // Açılış fotoğrafı: bütün ekranı kaplayarak başlar, küçülüp haritaya yerleşir
        if (L.cover && L.motion && L.box) {
          const [x, y, w] = L.box;
          const h = L.width && L.height ? (w * L.height) / L.width : w;
          const c = route.camera(spans[si].start);
          const sx = geo.fx + (route.origin[si].x + (x + w / 2) * u - c.x);
          const sy = c.fy + (route.origin[si].y + (y + h / 2) * u - c.y);
          const s0 = Math.max(sw / (w * u), sh / (h * u)) * 1.03;
          motion = { ...L.motion, from: [(sw / 2 - sx) / u, (sh / 2 - sy) / u, 0, s0, 1] };
        }
        return {
          L,
          el,
          motion,
          chars: el ? Array.from(el.querySelectorAll<HTMLElement>('[data-c]')) : [],
          ticks: el ? Array.from(el.querySelectorAll<HTMLElement>('[data-tick]')) : [],
          fillBar: el ? el.querySelector<HTMLElement>('[data-fill]') : null,
          shown: -1,
          count: '',
        };
      }),
    );

    const apply = (it: Item, q: number, settled = false) => {
      const { L, el, motion } = it;
      if (!el) return;
      if (motion) {
        const [x, y, r, s, o] = sample(motion, q, settled);
        el.style.transform = `translate3d(${x * u}px, ${y * u}px, 0) rotate(${r}deg) scale(${s})`;
        el.style.opacity = String(clamp01(o));
      }
      if (L.clip) {
        const { type, from = 0, to = 100, start, end, at } = L.clip;
        const v = settled || (reducedMotion && !motion?.scrub) ? to : lerp(from, to, smooth(local(q, start, end)));
        if (type === 'x') el.style.clipPath = `inset(-20% ${100 - v}% -20% -20%)`;
        else if (type === 'xr') el.style.clipPath = `inset(-20% -20% -20% ${v}%)`;
        else el.style.clipPath = `circle(${v}% at ${at?.[0] ?? 50}% ${at?.[1] ?? 50}%)`;
      }
      if (L.kind === 'typed') {
        const [a = 0, b = 1] = L.at ?? [];
        const n = settled ? it.chars.length : Math.round(local(q, a, b) * it.chars.length);
        if (n !== it.shown) {
          it.chars.forEach((c, i) => {
            c.style.opacity = i < n ? '1' : '0';
            c.classList.toggle('is-caret', i === n - 1 && n < it.chars.length);
          });
          it.shown = n;
        }
      } else if (L.kind === 'ticker') {
        const at = L.at ?? [];
        it.ticks.forEach((tick, i) => tick.classList.toggle('is-on', (i === 0 || q >= at[i]) && (i === at.length - 1 || q < at[i + 1])));
      } else if (L.kind === 'count') {
        const [a = 0, b = 1] = L.at ?? [];
        const text = `${Math.round(lerp(L.from ?? 0, L.to ?? 0, local(q, a, b)))}${L.unit ?? ''}`;
        if (text !== it.count) {
          (el.firstElementChild ?? el).textContent = text;
          it.count = text;
        }
      } else if (L.kind === 'bar') {
        const [a = 0, b = 1] = L.at ?? [];
        if (it.fillBar) it.fillBar.style.transform = `scaleX(${local(q, a, b)})`;
      } else if (L.at) {
        const [a = -0.25, b = 9] = L.at;
        el.classList.toggle('is-in', settled || (q >= a && q < b));
      }
    };

    const setDisplay = (i: number, on: boolean) => {
      for (const plane of ['c', 't', 'f']) {
        const el = stopEls.current[`${plane}${i}`];
        if (el) el.style.display = on ? '' : 'none';
      }
    };

    let raf = 0;
    let lastPos = NaN;
    let lastK = -1;
    let overviewOn = false;
    let toneCss = '';
    let inkCss = '';
    let trailCss = '';
    let clock = '';
    let km = '';
    let alt = '';
    let bars = -1;
    let budget = mobile ? 10 : 24;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = root.current?.getBoundingClientRect();
      if (!r || r.bottom < -sh * 0.5 || r.top > window.innerHeight * 1.5) return;
      const pos = (-r.top / Math.max(1, r.height - sh)) * total;
      const cl = Math.max(0, Math.min(total, pos));
      const p = pointer.current;
      p.ox = lerp(p.ox, p.on ? p.x : 0, 0.06);
      p.oy = lerp(p.oy, p.on ? p.y : 0, 0.06);
      const cam = route.camera(cl);
      const k = cam.k;

      // Harita parçaları kamera dursa da bitene kadar çizilir
      const night = trackAt(tracks.night, cl)[0];
      const nightBefore = trackAt(tracks.night, cl - 60)[0];
      const nightAfter = trackAt(tracks.night, cl + 60)[0];
      const needDay = Math.min(night, nightBefore, nightAfter) < 1;
      const needNight = Math.max(night, nightBefore, nightAfter) > 0;
      const halfW = (sw / 2 / (u * cam.z)) * 1.2 + TILE * 0.35;
      const halfH = (sh / 2 / (u * cam.z)) * 1.2 + TILE * 0.35;
      if (terrain.current) {
        if (!needDay) terrain.current.day.clear();
        if (!needNight) terrain.current.night.clear();
        if (cam.z > 0.55) {
          if (needDay) terrain.current.day.update(cam.x / u, cam.y / u, halfW, halfH, budget);
          if (needNight) terrain.current.night.update(cam.x / u, cam.y / u, halfW, halfH, budget);
          budget = mobile ? 1 : 2;
        }
      }

      const beamOn = trackAt(tracks.beam, cl)[0];
      if (pos === lastPos && !(beamOn > 0 && (Math.abs(p.ox - p.x) > 0.5 || Math.abs(p.oy - p.y) > 0.5))) return;
      lastPos = pos;

      // Kamera
      const cos = Math.cos((cam.r * Math.PI) / 180) * cam.z;
      const sin = Math.sin((cam.r * Math.PI) / 180) * cam.z;
      const tx = geo.fx - (cos * cam.x - sin * cam.y);
      const ty = cam.fy - (sin * cam.x + cos * cam.y);
      const matrix = `matrix(${cos},${sin},${-sin},${cos},${tx},${ty})`;
      if (mapPlane.current) mapPlane.current.style.transform = matrix;
      if (contentPlane.current) contentPlane.current.style.transform = matrix;
      if (topPlane.current) topPlane.current.style.transform = matrix;
      trailG.current?.setAttribute('transform', `matrix(${cos} ${sin} ${-sin} ${cos} ${tx} ${ty})`);

      // Zemin ve harita tonu
      let tone = trackAt(tracks.tone, cl);
      if (r.top > 0) tone = mix(base, tone, smooth(clamp01(1 - r.top / sh)));
      if (r.bottom < sh) tone = mix(tone, base, smooth(clamp01(1 - r.bottom / sh)));
      const nextTone = css(tone);
      if (nextTone !== toneCss) {
        body.style.backgroundColor = toneCss = nextTone;
        if (hud.current) hud.current.style.backgroundColor = css(tone, 0.9);
      }
      if (dayMap.current) dayMap.current.style.opacity = String((1 - night) * clamp01((cam.z - 0.55) / 0.15));
      if (nightMap.current) nightMap.current.style.opacity = String(night);
      if (overview.current) overview.current.style.opacity = String(1 - clamp01((cam.z - 0.5) / 0.25));

      // Yol ve yürüyen nokta
      const h = route.hiker(cl);
      if (walked.current) {
        walked.current.setAttribute('points', `${route.str.slice(0, route.offs[h.index])}${h.x.toFixed(1)},${h.y.toFixed(1)}`);
        walked.current.setAttribute('stroke-opacity', String(trackAt(tracks.fade, cl)[0]));
        // Genel bakışta çizgi kaybolmasın
        const thick = Math.max(1, 0.42 / cam.z);
        walked.current.setAttribute('stroke-width', String(5 * u * thick));
        walked.current.setAttribute('stroke-dasharray', `${14 * u * thick} ${11 * u * thick}`);
        const nextTrail = css(trackAt(tracks.trail, cl));
        if (nextTrail !== trailCss) walked.current.setAttribute('stroke', (trailCss = nextTrail));
      }
      marker.current?.setAttribute('transform', `translate(${h.x} ${h.y}) scale(${1 / cam.z})`);
      const hx = tx + cos * h.x - sin * h.y;
      const hy = ty + sin * h.x + cos * h.y;
      if (tag.current) {
        tag.current.style.transform = `translate3d(${hx + 14}px, ${hy - 34}px, 0)`;
        tag.current.style.opacity = String(trackAt(tracks.tag, cl)[0]);
      }

      // Kafa lambası: karanlık örtünün deliği yürüyenin üstünde (fareyle biraz oynar). Örtü ekran boyundadır ve her karede
      // yeniden çizilir; büyük bir katmanı ölçeklemek ekran kartı belleğini bitirir, diğer katmanlar yarım çizilir
      if (beam.current) {
        if (beamOn <= 0.001) beam.current.style.display = 'none';
        else {
          const iris = trackAt(tracks.iris, cl)[0];
          const c = clearR * iris;
          const f = softR * iris;
          beam.current.style.display = '';
          beam.current.style.opacity = String(beamOn);
          beam.current.style.background = `radial-gradient(circle at ${(hx + p.ox).toFixed(1)}px ${(hy + p.oy).toFixed(1)}px, rgba(255,74,56,.05) 0, rgba(14,9,8,0) ${c.toFixed(1)}px, rgba(14,9,8,.8) ${((c + f) / 2).toFixed(1)}px, #0E0908 ${f.toFixed(1)}px)`;
        }
      }

      // Durum şeridi
      const ink = css(trackAt(tracks.ink, cl));
      if (hud.current) {
        hud.current.style.opacity = String(trackAt(tracks.hud, cl)[0]);
        if (ink !== inkCss) {
          hud.current.style.color = ink;
          if (ghost.current) ghost.current.setAttribute('stroke', ink);
          inkCss = ink;
        }
      }
      const mins = Math.round(trackAt(tracks.clock, cl)[0]) % 1440;
      const nextClock = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      if (nextClock !== clock && hudClock.current) hudClock.current.textContent = clock = nextClock;
      const kmVal = trackAt(tracks.km, cl)[0].toFixed(1);
      const nextKm = `${lang === 'tr' ? kmVal.replace('.', ',') : kmVal} km`;
      if (nextKm !== km && hudKm.current) hudKm.current.textContent = km = nextKm;
      const nextAlt = `+${Math.round(trackAt(tracks.alt, cl)[0])} m`;
      if (nextAlt !== alt && hudAlt.current) hudAlt.current.textContent = alt = nextAlt;
      const nextBars = Math.round(trackAt(tracks.sig, cl)[0]);
      if (nextBars !== bars) {
        hudBars.current.forEach((b, i) => {
          if (b) b.style.opacity = i < nextBars ? '1' : '0.2';
        });
        bars = nextBars;
      }
      if (hudFill.current) hudFill.current.style.clipPath = `inset(-20% ${100 - (cl / total) * 100}% -20% 0)`;

      // Son durak: rotanın tamamı görünür, geçilen duraklardan yalnızca işaretli parçalar kalır
      const wantOverview = k === last;
      if (wantOverview !== overviewOn) {
        overviewOn = wantOverview;
        items.forEach((list, i) => {
          if (i === last) return;
          list.forEach((it) => {
            if (!it.el) return;
            it.el.style.visibility = !overviewOn || it.L.keep ? '' : 'hidden';
            if (overviewOn && it.L.keep) apply(it, 1, true);
          });
        });
        lastK = -1;
      }
      if (k !== lastK) {
        stops.forEach((_, i) => setDisplay(i, overviewOn ? true : Math.abs(i - k) <= 2));
        lastK = k;
      }

      for (let i = Math.max(0, k - 2); i <= Math.min(last, k + 2); i++) {
        if (overviewOn && i !== last) continue;
        const q = (pos - spans[i].start) / spans[i].len;
        for (const it of items[i]) apply(it, q);
      }

      // Genel bakış etiketleri
      if (overviewOn) {
        const q = (pos - spans[last].start) / spans[last].len;
        const o = local(q, 0.02, 0.34);
        flags.current.forEach((f, i) => {
          if (!f) return;
          const st = stops[i];
          const w = st.way?.[0];
          if (!w || !st.flag) return;
          const fxp = route.origin[i].x + w[0] * u;
          const fyp = route.origin[i].y + w[1] * u;
          f.style.opacity = String(o);
          f.style.transform = `translate3d(${tx + cos * fxp - sin * fyp}px, ${ty + sin * fxp + cos * fyp}px, 0)`;
        });
      } else {
        flags.current.forEach((f) => {
          if (f && f.style.opacity !== '0') f.style.opacity = '0';
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      body.style.backgroundColor = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, route, stops, timing, lang, mobile]);

  const onPointer = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    const room = (geo?.u ?? 1) * 170;
    const p = pointer.current;
    p.on = true;
    p.x = Math.max(-room, Math.min(room, ((e.clientX - rect.left) / rect.width - 0.5) * 2 * room));
    p.y = Math.max(-room, Math.min(room, ((e.clientY - rect.top) / rect.height - 0.5) * 2 * room));
  };

  return (
    <section ref={root} className="relative" style={{ height: `${timing.total + 100}vh` }} aria-label={t(data.label)}>
      <div ref={stage} onPointerMove={onPointer} className="trail-stage sticky top-0 h-[100svh] overflow-hidden">
        {geo && route && (
          <div style={{ ['--u' as string]: `${geo.u}px` } as CSSProperties} className="absolute inset-0">
            {/* Harita */}
            <div ref={mapPlane} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ zIndex: 1 }}>
              <canvas ref={overview} />
              <div ref={dayMap} className="absolute left-0 top-0" />
              <div ref={nightMap} className="absolute left-0 top-0" style={{ opacity: 0 }} />
            </div>

            {/* Yol: ekran boyunda tek bir çizim, kamera dönüşümü içeride */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 2 }} aria-hidden>
              <g ref={trailG}>
                <polyline ref={ghost} points={route.str} fill="none" stroke="#17352A" strokeOpacity={0.3} strokeWidth={3.2 * geo.u} strokeLinecap="round" strokeDasharray={`${0.1} ${13 * geo.u}`} />
                <polyline ref={walked} fill="none" stroke="#E03A2A" strokeLinecap="round" />
                <g ref={marker}>
                  <circle className="trail-pulse" r={9} fill="#E03A2A" opacity={0.35} />
                  <circle r={7} fill="#E03A2A" stroke="#FBF8F1" strokeWidth={2.5} />
                </g>
              </g>
            </svg>

            {/* İçerik: haritanın üstünde, kamerayla birlikte */}
            <div ref={contentPlane} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ zIndex: 3 }}>
              {stops.map((s, si) => (
                <div key={si} ref={(el) => (stopEls.current[`c${si}`] = el)} className="absolute" style={{ left: route.origin[si].x, top: route.origin[si].y, width: geo.bw * geo.u, height: geo.bh * geo.u, display: si > 2 ? 'none' : undefined }}>
                  {s.layers.map((L, li) => (!L.plane ? <Layer key={li} L={L} setRef={(el) => (refs.current[`${si}-${li}`] = el)} /> : null))}
                </div>
              ))}
            </div>

            {/* Kafa lambası örtüsü */}
            <div ref={beam} className="pointer-events-none absolute inset-0" style={{ zIndex: 4, display: 'none' }} />

            {/* Lambanın üstünde kalanlar: gece yazıları karanlıkta da okunur */}
            <div ref={topPlane} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ zIndex: 5 }}>
              {stops.map((s, si) => (
                <div key={si} ref={(el) => (stopEls.current[`t${si}`] = el)} className="absolute" style={{ left: route.origin[si].x, top: route.origin[si].y, width: geo.bw * geo.u, height: geo.bh * geo.u, display: si > 2 ? 'none' : undefined }}>
                  {s.layers.map((L, li) => (L.plane === 'top' ? <Layer key={li} L={L} setRef={(el) => (refs.current[`${si}-${li}`] = el)} /> : null))}
                </div>
              ))}
            </div>

            {/* Ekrana sabit olanlar: kamera hareketinden etkilenmez */}
            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 6 }}>
              {stops.map((s, si) => (
                <div
                  key={si}
                  ref={(el) => (stopEls.current[`f${si}`] = el)}
                  className="absolute"
                  style={{
                    left: (geo.sw - geo.bw * geo.u) / 2,
                    top: HEADER + (geo.ah - geo.bh * geo.u) / 2,
                    width: geo.bw * geo.u,
                    height: geo.bh * geo.u,
                    display: si > 2 ? 'none' : undefined,
                  }}
                >
                  {s.layers.map((L, li) => (L.plane === 'fixed' ? <Layer key={li} L={L} setRef={(el) => (refs.current[`${si}-${li}`] = el)} /> : null))}
                </div>
              ))}
            </div>

            {/* Yürüyenin adı */}
            <div ref={tag} className="trail-tag pointer-events-none absolute left-0 top-0" style={{ zIndex: 7, opacity: 0 }}>
              {data.hud.hiker}
            </div>

            {/* Genel bakış etiketleri */}
            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 7 }} aria-hidden={mobile}>
              {stops.map((s, si) =>
                s.flag && s.way?.length ? (
                  <div key={si} ref={(el) => (flags.current[si] = el)} className="trail-flag absolute left-0 top-0" style={{ opacity: 0 }}>
                    <span className="trail-flag-dot" />
                    {!mobile && <span className="trail-flag-text">{t(s.flag)}</span>}
                  </div>
                ) : null,
              )}
            </div>

            {/* Durum şeridi: saat, mesafe, yükselti, çekim ve yükselti profili */}
            <div ref={hud} className="trail-hud absolute inset-x-0 bottom-0" style={{ zIndex: 8, height: hudH, opacity: 0 }}>
              <div className="trail-hud-cell">
                <span className="trail-hud-label">{t(data.hud.clock)}</span>
                <span ref={hudClock} className="trail-hud-value" />
              </div>
              <div className="trail-hud-cell">
                <span className="trail-hud-label">{t(data.hud.dist)}</span>
                <span ref={hudKm} className="trail-hud-value" />
              </div>
              <div className="trail-hud-cell">
                <span className="trail-hud-label">{t(data.hud.alt)}</span>
                <span ref={hudAlt} className="trail-hud-value" />
              </div>
              <div className="trail-hud-profile" aria-hidden>
                <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-30">
                  <path d={profile} fill="none" stroke="currentColor" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                </svg>
                <div ref={hudFill} className="absolute inset-0">
                  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    <path d={`${profile} L1000,100 L0,100 Z`} fill="currentColor" fillOpacity={0.16} />
                    <path d={profile} fill="none" stroke="currentColor" strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
              <div className="trail-hud-cell trail-hud-signal">
                <span className="trail-hud-label">{t(data.hud.signal)}</span>
                <span className="trail-bars" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} ref={(el) => (hudBars.current[i] = el)} style={{ height: `${35 + i * 21}%` }} />
                  ))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Layer({ L, setRef }: { L: TrailLayer; setRef: (el: HTMLDivElement | null) => void }) {
  const [x = 0, y = 0, w = 0, h] = L.box ?? [];
  let height = h;
  if (L.kind === 'photo' && h == null && L.width && L.height) height = (w * L.height) / L.width;
  if (L.kind === 'screen' && h == null) height = (w * 852) / 393;

  const style: CSSProperties = L.full
    ? { position: 'absolute', inset: '-100vh -100vw', zIndex: L.z }
    : {
        position: 'absolute',
        left: U(x),
        top: U(y),
        width: U(w),
        height: height != null ? U(height) : undefined,
        zIndex: L.z,
      };
  style.transformOrigin = L.origin ? `${L.origin[0]}% ${L.origin[1]}%` : '50% 50%';
  if (L.motion) style.willChange = 'transform, opacity';
  if (L.motion && reducedMotion) style.opacity = fill(L.motion.to, REST)[4];
  if (L.align === 'center') style.textAlign = 'center';
  if (L.radius) {
    style.borderRadius = U(L.radius);
    style.overflow = 'hidden';
  }
  return (
    <div ref={setRef} style={style} className={!L.at ? undefined : L.kind === 'text' ? 'trail-layer' : L.kind === 'label' || L.kind === 'svg' ? 'trail-soft' : undefined}>
      <Body L={L} w={w} />
    </div>
  );
}

const FRAUNCES = '"Fraunces", Georgia, serif';
const MONO = '"DM Mono", ui-monospace, monospace';
const SANS = '"Instrument Sans", system-ui, sans-serif';

function Body({ L, w }: { L: TrailLayer; w: number }) {
  const { t, lang } = useLang();
  const src = L.src?.replace('{lang}', lang);

  switch (L.kind) {
    case 'photo':
      return (
        <img
          src={src}
          alt=""
          draggable={false}
          loading="lazy"
          className="block h-full w-full object-cover"
          style={{ filter: L.filter, ...(L.print ? { border: `${w * 0.024}px solid transparent`, boxSizing: 'border-box' } : {}), borderRadius: L.print ? undefined : 'inherit' }}
        />
      );
    case 'screen':
      return (
        <img
          src={src}
          alt=""
          draggable={false}
          loading="lazy"
          className="block h-full w-full"
          style={{ borderRadius: U(w * 0.135), boxShadow: L.glow ? `0 0 ${U(w * 0.5)} ${U(-w * 0.12)} ${L.glow}, 0 0 0 1px rgba(255,74,56,.28)` : '0 40px 70px -32px rgba(10,20,14,.6), 0 0 0 1px rgba(23,53,42,.12)' }}
        />
      );
    case 'text':
      return (
        <div style={{ color: L.ink }}>
          {L.kicker && t(L.kicker) && (
            <p key={`k-${lang}`} className="trail-kicker" style={{ fontSize: U(L.kickerSize ?? 17), color: L.accent }}>
              {t(L.kicker)}
            </p>
          )}
          {L.title && t(L.title) && (
            <h2 className="trail-title" style={{ fontSize: U(L.size ?? 96), marginTop: L.kicker ? U(L.size ? L.size * 0.16 : 16) : 0, color: L.color }}>
              {t(L.title)
                .split('\n')
                .map((line, i) => (
                  <span key={`${lang}-${i}`} className="tl">
                    <span>{line}</span>
                  </span>
                ))}
            </h2>
          )}
          {L.text && t(L.text) && (
            <p key={`t-${lang}`} className="trail-body" style={{ fontSize: U(L.textSize ?? 21), marginTop: L.title ? U(22) : 0 }}>
              {t(L.text)}
            </p>
          )}
        </div>
      );
    case 'svg':
      return <div className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: L.svg ?? '' }} />;
    case 'note':
      return (
        <div className="trail-note" style={{ padding: U(16), borderRadius: U(6), fontFamily: SANS }}>
          <p className="flex justify-between" style={{ fontFamily: MONO, fontSize: U(12.5), opacity: 0.62, gap: U(10) }}>
            <span>{L.name}</span>
            {L.label && <span>{t(L.label)}</span>}
          </p>
          {L.title && <p style={{ fontFamily: FRAUNCES, fontWeight: 600, fontSize: U(L.size ?? 22), lineHeight: 1.15, marginTop: U(7), letterSpacing: '-0.012em' }}>{t(L.title)}</p>}
          {L.text && <p style={{ fontSize: U(15), lineHeight: 1.35, marginTop: U(5), opacity: 0.78 }}>{t(L.text)}</p>}
        </div>
      );
    case 'label':
      return (
        <p className="flex items-baseline" style={{ fontFamily: MONO, fontSize: U(L.size ?? 15), lineHeight: 1.4, color: L.color, gap: U(9), justifyContent: L.align === 'center' ? 'center' : undefined }}>
          {L.dot && <span className="inline-block shrink-0 rounded-full" style={{ width: U(11), height: U(11), background: L.dot, boxShadow: `0 0 0 ${U(3)} rgba(251,248,241,.9)` }} />}
          <span key={lang}>{L.text ? t(L.text) : ''}</span>
        </p>
      );
    case 'fact':
      return (
        <div className="flex items-center" style={{ gap: U(12), padding: U(13), borderRadius: U(12), background: '#FBF8F1', color: '#17352A', boxShadow: '0 18px 30px -22px rgba(10,20,14,.55)', fontFamily: SANS }}>
          <span
            className="block shrink-0"
            style={{
              width: U(30),
              height: U(24),
              background: L.state === 'none' ? 'transparent' : 'linear-gradient(#FFFDF8 0 50%, #E03A2A 50% 100%)',
              opacity: L.state === 'faded' ? 0.4 : 1,
              boxShadow: L.state === 'none' ? 'inset 0 0 0 1.5px rgba(23,53,42,.4)' : 'inset 0 0 0 1px rgba(23,53,42,.14)',
            }}
          />
          <span className="min-w-0">
            <span className="block" style={{ fontSize: U(16), fontWeight: 600, lineHeight: 1.15 }}>
              {L.label ? t(L.label) : ''}
            </span>
            <span className="block" style={{ fontFamily: MONO, fontSize: U(12), opacity: 0.66, marginTop: U(3) }}>
              {L.text ? t(L.text) : ''}
            </span>
          </span>
        </div>
      );
    case 'stamp':
      return (
        <div
          style={{
            color: L.color,
            border: `${U(4)} solid currentColor`,
            outline: `${U(1.5)} solid currentColor`,
            outlineOffset: U(-11),
            borderRadius: U(10),
            padding: `${U(22)} ${U(26)}`,
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: MONO, fontSize: U(L.textSize ?? 17), letterSpacing: '0.04em' }}>{L.label ? t(L.label) : ''}</p>
          <p style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: U(L.size ?? 66), lineHeight: 1.05, letterSpacing: '-0.01em', marginTop: U(4) }}>{L.title ? t(L.title) : ''}</p>
        </div>
      );
    case 'sign':
      return (
        <div
          className="flex h-full w-full flex-col justify-center"
          style={{
            background: L.color,
            color: L.ink,
            paddingLeft: U(w * 0.075),
            clipPath: 'polygon(0 0, 89% 0, 100% 50%, 89% 100%, 0 100%)',
          }}
        >
          <p style={{ fontFamily: FRAUNCES, fontWeight: 600, fontSize: U(L.size ?? 30), lineHeight: 1.1, letterSpacing: '-0.01em' }}>{L.label ? t(L.label) : ''}</p>
          <p style={{ fontFamily: MONO, fontSize: U(L.textSize ?? 14), opacity: 0.74, marginTop: U(3) }}>{L.value}</p>
        </div>
      );
    case 'font':
      return (
        <div style={{ color: L.color }}>
          <p style={{ fontFamily: `"${L.font}", serif`, fontWeight: L.weight ?? 600, fontSize: U(L.size ?? 42), lineHeight: 1.1, letterSpacing: '-0.015em' }}>{L.name}</p>
          <p style={{ fontFamily: MONO, fontSize: U(13), opacity: 0.68, marginTop: U(5) }}>{L.label ? t(L.label) : ''}</p>
        </div>
      );
    case 'frame':
      return (
        <div className="relative h-full w-full" style={{ color: L.color, border: `${U(2)} dashed currentColor`, borderRadius: U(8) }}>
          {[
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ].map(([a, b]) => (
            <span key={`${a}${b}`} className="absolute" style={{ width: U(12), height: U(12), background: 'currentColor', left: a ? undefined : U(-7), right: a ? U(-7) : undefined, top: b ? undefined : U(-7), bottom: b ? U(-7) : undefined }} />
          ))}
          <p className="absolute" style={{ left: U(20), top: U(-30), fontFamily: MONO, fontSize: U(14) }}>
            {L.label ? t(L.label) : ''}
          </p>
        </div>
      );
    case 'shade':
      return <div className="h-full w-full" style={{ background: `linear-gradient(90deg, transparent 0%, ${L.color} 22%)` }} />;
    case 'scrim':
      return <div className="absolute inset-0" style={{ background: L.color }} />;
    case 'typed':
      return (
        <p key={lang} className="trail-typed" style={{ fontFamily: FRAUNCES, fontWeight: L.weight ?? 500, fontSize: U(L.size ?? 34), lineHeight: 1.2, letterSpacing: '-0.012em', color: L.color }}>
          {Array.from(L.text ? t(L.text) : '').map((c, i) => (
            <span key={i} data-c style={{ opacity: 0 }}>
              {c}
            </span>
          ))}
        </p>
      );
    case 'ticker':
      return (
        <div className="relative h-full w-full" style={{ color: L.color }}>
          {(L.values ?? []).map((v, i) => (
            <p key={`${lang}-${i}`} data-tick className="trail-tick" style={{ fontFamily: L.font === 'mono' ? MONO : FRAUNCES, fontWeight: L.font === 'mono' ? 400 : 600, fontSize: U(L.size ?? 96), lineHeight: 1.05, letterSpacing: L.font === 'mono' ? 0 : '-0.022em' }}>
              {t(v)}
            </p>
          ))}
        </div>
      );
    case 'count':
      return <p className="whitespace-nowrap" style={{ fontFamily: L.font === 'mono' ? MONO : FRAUNCES, fontWeight: L.font === 'mono' ? 400 : 600, fontSize: U(L.size ?? 96), lineHeight: 1, letterSpacing: L.font === 'mono' ? 0 : '-0.03em', color: L.color, textAlign: L.align === 'right' ? 'right' : undefined }} />;
    case 'bar':
      return (
        <div className="relative h-full w-full overflow-hidden rounded-full" style={{ background: L.ink ?? 'rgba(23,53,42,.14)' }}>
          <span data-fill className="absolute inset-0 origin-left" style={{ background: L.color, transform: 'scaleX(0)' }} />
        </div>
      );
    default:
      return null;
  }
}
