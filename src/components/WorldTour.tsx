import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Ambient } from '../content';
import { gsap, reducedMotion, ScrollTrigger } from '../lib/scroll';
import { COIN } from './WorldGate';

// Dünyalı sayfa: dünyası olan her bölüm (data-world-at) ekrana girince sayfa kabının rengi o dünyaya akar, yazılar ve
// üst menü koyu temaya geçer, ekranda o dünyanın renginde bir portal halkası açılır. Dünya boyunca o dünyanın objeleri
// üç derinlikte süzülür (arkada küçük ve yavaş, kenarlarda net, önde büyük ve hızlı); arkada dünyaya özel hafif bir
// ortam efekti oynar. Sağ üstteki oyun göstergesi toplanan altınları (bkz. WorldGate) ve gidilen mesafeyi gösterir.
// Bileşen sayfa kabının ilk çocuğudur (data-world-fx): efekt tuvali ve arka objeler içeriğin altında, ön objeler,
// halka ve gösterge üstünde durur.

export type TourWorld = { color: string; ambient: Ambient; icon?: string; props: string[] };

type Particle = { x: number; y: number; vx: number; vy: number; r: number; seed: number; fade: number };
type Layer = 'back' | 'mid' | 'front';
type Placed = { src: string; layer: Layer; left: number; top: number; depth: number; rot: number; spin: number; flip: boolean; seed: number };

const COUNT: Record<Ambient, number> = { none: 0, embers: 60, bubbles: 36, sand: 90, clouds: 9 };
// Katmanların sırası: arka ve kenar objeleri sık, öndekiler seyrek gelir
const ORDER: Layer[] = ['back', 'mid', 'front', 'back', 'mid', 'back', 'mid', 'front', 'back', 'mid'];
const STYLE: Record<Layer, string> = {
  back: 'w-[clamp(44px,5.5vw,100px)] opacity-55 blur-[1px]',
  mid: 'w-[clamp(64px,9vw,170px)]',
  front: 'w-[clamp(100px,14vw,260px)] opacity-90 blur-[2.5px] lg:z-[3]',
};
const DEPTH: Record<Layer, number> = { back: 0.55, mid: 1.05, front: 1.7 };

// Sıraya bağlı sabit sahte rastgele sayı (0–1): objeler her çizimde aynı yere düşer
function seeded(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function spawn(kind: Ambient, w: number, h: number, initial: boolean): Particle {
  const rnd = Math.random;
  const seed = rnd() * 1000;
  if (kind === 'embers') return { x: rnd() * w, y: initial ? rnd() * h : h + 10, vx: (rnd() - 0.5) * 0.4, vy: -(0.5 + rnd() * 1.3), r: 1.2 + rnd() * 2.4, seed, fade: 1 };
  if (kind === 'bubbles') return { x: rnd() * w, y: initial ? rnd() * h : h + 12, vx: 0, vy: -(0.35 + rnd() * 0.9), r: 3 + rnd() * 8, seed, fade: 1 };
  if (kind === 'sand') return { x: initial ? rnd() * w : -10, y: rnd() * h, vx: 1.4 + rnd() * 2.2, vy: 0.2 + rnd() * 0.6, r: 0.8 + rnd() * 1.4, seed, fade: 1 };
  return { x: initial ? rnd() * w : -200, y: rnd() * h, vx: 0.12 + rnd() * 0.3, vy: 0, r: 70 + rnd() * 110, seed, fade: 1 };
}

function drawParticle(ctx: CanvasRenderingContext2D, kind: Ambient, p: Particle, t: number) {
  if (kind === 'embers') {
    ctx.globalAlpha = (0.55 + Math.sin(t * 0.008 + p.seed) * 0.35) * p.fade;
    ctx.fillStyle = 'rgba(255, 170, 60, 0.35)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bubbles') {
    ctx.globalAlpha = 0.5 * p.fade;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.35 * p.fade;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'sand') {
    ctx.globalAlpha = 0.55 * p.fade;
    ctx.fillStyle = '#ffe2b0';
    ctx.fillRect(p.x, p.y, p.r * 2.2, p.r);
  } else if (kind === 'clouds') {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, `rgba(255,255,255,${0.16 * p.fade})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * 1.6, p.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function WorldTour({ host, worlds, base }: { host: RefObject<HTMLDivElement>; worlds: TourWorld[]; base?: string }) {
  const [active, setActive] = useState(-1);
  const [inside, setInside] = useState(false);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [coins, setCoins] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const coinRef = useRef<HTMLImageElement>(null);
  const insideRef = useRef(false);
  const moveRef = useRef<() => void>(() => {});
  const ambientRef = useRef<Ambient>('none');
  insideRef.current = inside;
  ambientRef.current = active >= 0 ? worlds[active]?.ambient ?? 'none' : 'none';

  // Dünya değişimi: sayfa kabının rengi, yazı rengi ve menü teması
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const world = worlds[active];
    el.style.backgroundColor = world ? world.color : base ?? '';
    el.style.color = world ? '#F4F4F1' : '';
    if (world) el.dataset.theme = 'dark';
    else delete el.dataset.theme;
  }, [active, worlds, base, host]);

  // Bölümler ekrana girdikçe etkin dünya değişir. İlk dünya, önündeki açılış (yolculuk) bloğu ekranı kaplarken
  // erkenden etkinleşir; böylece açılış bittiğinde altından zaten o dünyanın rengi çıkar
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const marks = () => Array.from(el.querySelectorAll<HTMLElement>('[data-world-at]')).sort((a, b) => Number(a.dataset.worldAt) - Number(b.dataset.worldAt));
    const list = marks();
    if (!list.length) return;

    // Sahne objeleri her dünyanın kendi aralığına (bölüm başından bir sonraki dünyanın başına) dağıtılır
    const layout = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const ms = marks();
      const narrow = window.innerWidth < 1024;
      const next: Placed[] = [];
      ms.forEach((m, i) => {
        const props = worlds[i]?.props ?? [];
        if (!props.length) return;
        const start = m.getBoundingClientRect().top + window.scrollY - top;
        const end = i + 1 < ms.length ? ms[i + 1].getBoundingClientRect().top + window.scrollY - top : el.offsetHeight;
        const count = Math.max(4, Math.round((end - start) / (narrow ? 520 : 380)));
        for (let k = 0; k < count; k++) {
          const r = (q: number) => seeded(i * 97 + k, q);
          // Telefonda öndeki objeler içeriği örtmesin diye kenar katmanında kalır
          const layer: Layer = narrow && ORDER[k % ORDER.length] === 'front' ? 'mid' : ORDER[k % ORDER.length];
          // Başlıklar ve metinler solda olduğu için öndeki büyük objeler yalnızca sağ kenardan geçer
          const right = k % 2 === 1;
          const person = props[(k + i) % props.length].includes('karakter');
          const left =
            layer === 'back' ? 4 + r(1) * 88 : layer === 'front' ? 90 + r(1) * 6 : right ? 87 + r(1) * 8 : r(1) * 8;
          next.push({
            src: props[(k + i) % props.length],
            layer,
            left,
            top: start + ((k + 0.25 + r(2) * 0.5) * (end - start)) / count,
            depth: DEPTH[layer],
            // Karakterler neredeyse dik kalır; diğer objeler ekrandan geçerken hafifçe döner
            rot: (r(3) - 0.5) * (person ? 14 : 50),
            spin: (r(4) - 0.5) * (person ? 0.008 : 0.06),
            flip: r(5) > 0.5,
            seed: r(6) * 6,
          });
        }
      });
      setPlaced(next);
    };
    layout();

    const triggers = list.map((mark, i) =>
      ScrollTrigger.create({
        trigger: mark,
        start: i === 0 ? 'top bottom+=50%' : 'top 70%',
        onEnter: () => setActive(i),
        onLeaveBack: () => setActive(i - 1),
      }),
    );
    // Dünyalar boyunca: göstergenin görünürlüğü, mesafe ve objelerin derinliğe göre kayması
    triggers.push(
      ScrollTrigger.create({
        trigger: list[0],
        start: 'top 70%',
        endTrigger: el,
        end: 'bottom bottom',
        onToggle: (self) => setInside(self.isActive),
        onUpdate: (self) => {
          if (meterRef.current) meterRef.current.textContent = `${Math.round(self.progress * 2400).toLocaleString('tr-TR')} m`;
        },
      }),
    );
    const move = () => {
      const scene = sceneRef.current;
      if (!scene || reducedMotion) return;
      const top = el.getBoundingClientRect().top;
      const mid = window.innerHeight / 2;
      scene.querySelectorAll<HTMLElement>('[data-prop]').forEach((p) => {
        const y = Number(p.dataset.top);
        const depth = Number(p.dataset.depth);
        const delta = top + y - mid;
        const rot = Number(p.dataset.rot) + delta * Number(p.dataset.spin);
        p.style.transform = `translate3d(0, ${delta * (depth - 1) * 0.6}px, 0) rotate(${rot}deg) scaleX(${p.dataset.flip === '1' ? -1 : 1})`;
      });
    };
    moveRef.current = move;
    triggers.push(ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: move }));
    ScrollTrigger.addEventListener('refresh', layout);
    return () => {
      triggers.forEach((t) => t.kill());
      ScrollTrigger.removeEventListener('refresh', layout);
    };
  }, [host, worlds]);

  // Yerleşim değişince objeler kaydırmayı beklemeden doğru derinliğe taşınır
  useLayoutEffect(() => {
    moveRef.current();
  }, [placed]);

  // Portal halkası (ilk dünyaya geçişte portalı açılış bloğu zaten açmıştır)
  const prev = useRef(-1);
  useEffect(() => {
    const from = prev.current;
    prev.current = active;
    if (reducedMotion || active < 0 || from < 0 || !ringRef.current) return;
    const size = Math.hypot(window.innerWidth, window.innerHeight) * 2;
    gsap.fromTo(
      ringRef.current,
      { width: size, height: size, scale: 0, opacity: 1, borderColor: worlds[active].color, boxShadow: `0 0 60px 20px ${worlds[active].color}, inset 0 0 60px 20px rgba(255,255,255,0.55)` },
      { scale: 1, opacity: 0, duration: 1.2, ease: 'power2.out' },
    );
  }, [active, worlds]);

  // Toplanan altın göstergeye uçar ve sayaç artar
  useEffect(() => {
    const onCoin = (e: Event) => {
      const { x, y, delta } = (e as CustomEvent<{ x: number; y: number; delta: number }>).detail;
      setCoins((c) => Math.max(0, c + delta));
      const target = coinRef.current;
      if (delta < 0 || reducedMotion || !target) return;
      const t = target.getBoundingClientRect();
      const fly = document.createElement('img');
      fly.src = COIN;
      fly.alt = '';
      Object.assign(fly.style, { position: 'fixed', left: `${x - 18}px`, top: `${y - 18}px`, width: '36px', zIndex: '60', pointerEvents: 'none' });
      document.body.appendChild(fly);
      gsap.to(fly, {
        x: t.left + t.width / 2 - x,
        y: t.top + t.height / 2 - y,
        scale: 0.55,
        duration: 0.65,
        ease: 'power2.in',
        onComplete: () => {
          fly.remove();
          gsap.fromTo(target, { scale: 1.45 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
        },
      });
    };
    window.addEventListener('world:coin', onCoin);
    return () => window.removeEventListener('world:coin', onCoin);
  }, []);

  // Ortam efekti: tek tuval, yalnızca sayfa kabındayken ve sekme görünürken çizilir
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    let kind: Ambient = 'none';
    let parts: Particle[] = [];
    // Dünya değişince eski parçacıklar söner, yenileri ekranın her yerinde birden başlar
    let leaving: { kind: Ambient; parts: Particle[] } | null = null;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const want = insideRef.current ? ambientRef.current : 'none';
      if (want !== kind) {
        leaving = { kind, parts };
        kind = want;
        parts = Array.from({ length: COUNT[kind] }, () => spawn(kind, w, h, true));
        parts.forEach((p) => (p.fade = 0));
      }
      ctx.clearRect(0, 0, w, h);
      if (leaving) {
        const l = leaving;
        l.parts.forEach((p) => (p.fade = Math.max(0, p.fade - 0.03)));
        l.parts.forEach((p) => drawParticle(ctx, l.kind, p, t));
        if (l.parts.every((p) => p.fade <= 0)) leaving = null;
      }
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.fade = Math.min(1, p.fade + 0.02);
        p.x += p.vx + (kind === 'bubbles' ? Math.sin(t * 0.002 + p.seed) * 0.4 : kind === 'embers' ? Math.sin(t * 0.003 + p.seed) * 0.25 : 0);
        p.y += p.vy;
        if (p.y < -30 || p.x > w + 220 || p.y > h + 30) parts[i] = spawn(kind, w, h, false);
        drawParticle(ctx, kind, parts[i], t);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const world = worlds[Math.max(0, active)];

  return (
    <div data-world-fx aria-hidden className="contents">
      {!reducedMotion && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />}
      {/* Sahne objeleri sayfa kabının içinde, bulundukları dünyanın yüksekliğinde durur */}
      <div ref={sceneRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {placed.map((p, i) => (
          <div
            key={`${p.src}-${i}`}
            data-prop
            data-top={p.top}
            data-depth={p.depth}
            data-rot={p.rot}
            data-spin={p.spin}
            data-flip={p.flip ? '1' : '0'}
            className={`absolute will-change-transform ${STYLE[p.layer]}`}
            style={{ left: `${p.left}%`, top: p.top, transform: `rotate(${p.rot}deg)` }}
          >
            <img
              src={p.src}
              alt=""
              draggable={false}
              loading="lazy"
              className="w-full select-none drop-shadow-[0_18px_22px_rgba(0,0,0,0.3)] motion-safe:animate-[world-float_7s_ease-in-out_infinite]"
              style={{ animationDelay: `-${p.seed}s` }}
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none fixed inset-0 z-[55] grid place-items-center overflow-hidden">
        <div ref={ringRef} className="shrink-0 rounded-full border-[clamp(6px,0.8vw,14px)] border-solid opacity-0" />
      </div>
      {/* Oyun göstergesi: toplanan altınlar, etkin dünyanın simgesi ve gidilen mesafe */}
      <div
        className={`pointer-events-none fixed right-3 top-[4.6rem] z-[56] flex items-center gap-2 transition-opacity duration-500 sm:right-6 sm:top-[5.2rem] ${inside ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-2 rounded-full bg-ink/55 py-1.5 pl-1.5 pr-3.5 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <img ref={coinRef} src={COIN} alt="" className="h-7 w-7" />
          <span className="display min-w-[2ch] text-lg tabular-nums">{String(coins).padStart(2, '0')}</span>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-ink/55 py-1.5 pl-2 pr-3.5 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md sm:flex">
          {world?.icon && <img src={world.icon} alt="" className="h-6 w-auto" />}
          <span ref={meterRef} className="display text-lg tabular-nums">
            0 m
          </span>
        </div>
      </div>
    </div>
  );
}
