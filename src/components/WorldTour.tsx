import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Ambient } from '../content';
import { gsap, reducedMotion, ScrollTrigger } from '../lib/scroll';

// Dünyalı sayfa: dünyası olan her bölüm (data-world-at) ekrana girince sayfa kabının rengi o dünyaya akar, yazılar ve
// üst menü koyu temaya geçer, ekranda o dünyanın renginde bir portal halkası açılır. Kenarda sayfadaki ilerlemeyi
// gösteren yol arkadaşı (karakter ve o dünyanın kaykayı) iner; arkada dünyaya özel hafif bir ortam efekti oynar.
// Bileşen sayfa kabının ilk çocuğudur (data-world-fx); efekt tuvali içeriğin altında, halka ve yol arkadaşı üstünde durur.

export type TourWorld = { color: string; accent: string; ambient: Ambient };

type Particle = { x: number; y: number; vx: number; vy: number; r: number; seed: number; fade: number };

const COUNT: Record<Ambient, number> = { none: 0, embers: 60, bubbles: 36, sand: 90, clouds: 9 };

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
    const flicker = 0.55 + Math.sin(t * 0.008 + p.seed) * 0.35;
    ctx.globalAlpha = flicker * p.fade;
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

export default function WorldTour({ host, worlds, rider, base }: { host: RefObject<HTMLDivElement>; worlds: TourWorld[]; rider?: string; base?: string }) {
  const [active, setActive] = useState(-1);
  const [inside, setInside] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(-1);
  const insideRef = useRef(false);
  const ambientRef = useRef<Ambient>('none');
  activeRef.current = active;
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
    const marks = Array.from(el.querySelectorAll<HTMLElement>('[data-world-at]')).sort((a, b) => Number(a.dataset.worldAt) - Number(b.dataset.worldAt));
    if (!marks.length) return;
    const triggers = marks.map((mark, i) =>
      ScrollTrigger.create({
        trigger: mark,
        start: i === 0 ? 'top bottom+=50%' : 'top 70%',
        onEnter: () => setActive(i),
        onLeaveBack: () => setActive(i - 1),
      }),
    );
    // Yol arkadaşı ilk dünyadan sayfa kabının sonuna kadar iner
    triggers.push(
      ScrollTrigger.create({
        trigger: marks[0],
        start: 'top 70%',
        endTrigger: el,
        end: 'bottom bottom',
        onToggle: (self) => setInside(self.isActive),
        onUpdate: (self) => {
          const rail = railRef.current;
          if (!rail || !riderRef.current) return;
          const travel = rail.clientHeight - riderRef.current.offsetHeight;
          gsap.set(riderRef.current, { y: self.progress * travel });
          if (fillRef.current) gsap.set(fillRef.current, { scaleY: self.progress });
          if (!reducedMotion && tiltRef.current) gsap.to(tiltRef.current, { rotate: gsap.utils.clamp(-18, 18, self.getVelocity() / 120), duration: 0.4, overwrite: true });
        },
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [host, worlds.length]);

  // Portal halkası ve kaykay değişimi (ilk dünyaya geçişte portalı açılış bloğu zaten açmıştır)
  const prev = useRef(-1);
  useEffect(() => {
    const from = prev.current;
    prev.current = active;
    if (reducedMotion || active < 0) return;
    if (boardRef.current) gsap.fromTo(boardRef.current, { rotate: -360, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)' });
    if (from < 0 || !ringRef.current) return;
    const size = Math.hypot(window.innerWidth, window.innerHeight) * 2;
    gsap.fromTo(
      ringRef.current,
      { width: size, height: size, scale: 0, opacity: 1, borderColor: worlds[active].color, boxShadow: `0 0 60px 20px ${worlds[active].color}, inset 0 0 60px 20px rgba(255,255,255,0.55)` },
      { scale: 1, opacity: 0, duration: 1.2, ease: 'power2.out' },
    );
  }, [active, worlds]);

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
        leaving.parts.forEach((p) => (p.fade = Math.max(0, p.fade - 0.03)));
        leaving.parts.forEach((p) => drawParticle(ctx, leaving!.kind, p, t));
        if (leaving.parts.every((p) => p.fade <= 0)) leaving = null;
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

  // Yol arkadaşının hafif zıplaması
  const headRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (reducedMotion || !headRef.current) return;
    const tween = gsap.to(headRef.current, { y: -5, duration: 0.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    return () => {
      tween.kill();
    };
  }, [rider]);

  const world = worlds[Math.max(0, active)];

  return (
    <div data-world-fx aria-hidden className="contents">
      {!reducedMotion && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />}
      <div className="pointer-events-none fixed inset-0 z-[55] grid place-items-center overflow-hidden">
        <div ref={ringRef} className="shrink-0 rounded-full border-[clamp(6px,0.8vw,14px)] border-solid opacity-0" />
      </div>
      {/* Yol arkadaşı: sağ kenarda ince bir ray, üstünde inen karakter ve o dünyanın kaykayı. Telefonda içeriği
          olabildiğince az örtsün diye daha küçük ve kenara daha yakındır */}
      <div
        ref={railRef}
        className={`pointer-events-none fixed bottom-[10vh] right-1 top-[16vh] z-[55] w-[2.1rem] transition-opacity duration-500 sm:right-[clamp(0.5rem,1.6vw,2rem)] sm:w-[clamp(2.75rem,4.2vw,4.5rem)] ${inside ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-paper/20" />
        <div ref={fillRef} className="absolute inset-y-0 left-1/2 w-[2px] origin-top -translate-x-1/2 scale-y-0 bg-paper/70" />
        <div ref={riderRef} className="absolute inset-x-0 top-0">
          <div ref={tiltRef} className="relative">
            {rider && <img ref={headRef} src={rider} alt="" className="relative z-[1] mx-auto w-[78%] drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" />}
            {/* Kaykay görselleri dik durur; yatay görünsün diye döndürülür */}
            <div ref={boardRef} className="relative -mt-[34%] h-[1.1em] text-[2.1rem] sm:text-[clamp(2.75rem,4.2vw,4.5rem)]">
              {world?.accent && (
                <img src={world.accent} alt="" className="absolute left-1/2 top-1/2 h-[1em] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90 drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
