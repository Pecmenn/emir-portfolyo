import Matter from 'matter-js';
import { useEffect, useRef, useState } from 'react';
import { ui } from '../content';
import { useLang } from '../lib/i18n';
import { reducedMotion } from '../lib/scroll';
import { Words } from './Reveal';

// Snack Pack'in 4. bölümü sayfada oynanır. Sahne, bölümün gerçek ekran görüntüsüdür; borular ve kumbara görüntüdeki
// yerlerine oturan görünmez fizik cisimleridir. Ziyaretçi sınırlı mürekkeple çizgi çizer, kurabiyeleri bırakır;
// kumbaraya girenler sayılır, yıldız çubuğu dolar. Fizik dünyası görüntünün doğal pikselleriyle (652×1160) kurulur,
// tuval her karede bu ölçekten ekrana çizilir. Dokunmatik ekranda sayfa kaydırması engellenmesin diye oyun
// önce "Oynamak için dokun" ile açılır.

const { Engine, Bodies, Body, Composite, Events } = Matter;

const W = 652;
const H = 1160;
const LEVEL = '/images/snack-pack/bolum/04.webp';
// Kurabiyeler asset sayfasından yuvarlak kesilir (merkezler doğal piksel, yarıçap 29)
const SHEET = '/images/snack-pack/04.webp';
const SPRITES: [number, number][] = [
  [108, 89], [195, 89], [280, 89], [505, 89], [586, 89], [665, 89],
  [145, 164], [232, 164], [319, 164], [462, 164], [549, 164], [639, 164],
];
const SPRITE_R = 29;

const TOTAL = 120;
const R = 11;
const INK = 650;
const LINE = 16;
const SPAWN_X = 326;
const SPAWN_Y = 128;
// Yıldız çubuğu ve üstündeki üç yıldız (çubuktaki konumları aynı zamanda yıldız eşikleri)
const BAR = { x: 209, y: 92, w: 248, h: 23 };
const STARS = [313.5, 380, 434].map((x) => ({ x, y: 100, at: (x - BAR.x) / BAR.w }));
// Sol üstteki oyun içi "yeniden başla" düğmesi ve üst ortadaki dökme oku (oyundaki gibi dokununca kurabiyeleri bırakır)
const RESTART = { x: 31, y: 61, w: 78, h: 77 };
const ARROW = { x: 280, y: 0, w: 92, h: 70 };
// Kumbara ve üstündeki ağız (iki kesik çizginin arası)
const PIG = { x: 321, y: 910, r: 62 };
const SLOT = { x: 320, y: 849, w: 66, h: 18 };
const PIG_CROP = { x: 250, y: 812, w: 145, h: 165 };
// Yalnızca geliştirmede: adrese ?fizik eklenince fizik cisimlerinin sınırları sahnenin üstüne çizilir
const DEBUG = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fizik');

type Phase = 'ready' | 'pouring' | 'done';
type Cookie = Matter.Body & { sprite: number };

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Sayaç yazıları oyunun yuvarlak harfli diline yakın bir yazı tipiyle çizilir
function loadFont() {
  const id = 'snack-font';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600&display=swap';
    document.head.appendChild(link);
  }
  return document.fonts?.load('600 24px Fredoka').catch(() => undefined);
}

export default function SnackPackGame({ title, text }: { title: string; text: string }) {
  const { t, lang } = useLang();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  // Fareyle oyun hemen açıktır; dokunmatik ekranda önce dokunularak açılır
  const [active, setActive] = useState(!touch);
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState({ collected: 0, stars: 0 });
  const [drawn, setDrawn] = useState(false);
  const [inkOut, setInkOut] = useState(false);
  const api = useRef<{ release: () => void; restart: () => void } | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext('2d')!;
    let disposed = false;
    let level: HTMLImageElement | null = null;
    let sprites: HTMLCanvasElement[] = [];

    const engine = Engine.create({ gravity: { x: 0, y: 1 } });
    const world = engine.world;
    const solid = { isStatic: true, friction: 0.02, restitution: 0.1 };
    Composite.add(world, [
      Bodies.rectangle(326, 348, 93, 24, { ...solid, angle: 0.234, chamfer: { radius: 10 } }),
      // Çikolatalı boru biraz daha tutucudur
      Bodies.rectangle(453.8, 488, 188, 26, { ...solid, friction: 0.25, angle: -0.255, chamfer: { radius: 10 } }),
      Bodies.rectangle(133.25, 554.25, 28.5, 186.5, { ...solid, chamfer: { radius: 10 } }),
      Bodies.rectangle(211.5, 633.25, 185, 28.5, { ...solid, chamfer: { radius: 10 } }),
      Bodies.circle(PIG.x, PIG.y, PIG.r, { ...solid, restitution: 0.3 }),
      Bodies.rectangle(-20, H / 2, 40, H * 2, solid),
      Bodies.rectangle(W + 20, H / 2, 40, H * 2, solid),
    ]);
    const slot = Bodies.rectangle(SLOT.x, SLOT.y, SLOT.w, SLOT.h, { isStatic: true, isSensor: true });
    Composite.add(world, slot);

    // Oyun durumu karelerde okunduğu için React durumundan ayrı tutulur
    const game = {
      phase: 'ready' as Phase,
      cookies: [] as Cookie[],
      lines: [] as Matter.Body[],
      strokes: [] as { x: number; y: number }[][],
      ink: INK,
      spawned: 0,
      collected: 0,
      spawnClock: 0,
      // Son kurabiye döküldükten sonra geçen ve hiçbir kurabiyenin kıpırdamadığı kare sayısı
      afterSpawn: 0,
      idle: 0,
      pigPop: 0,
      starPop: [0, 0, 0],
      earned: 0,
    };

    const finish = () => {
      game.phase = 'done';
      setPhase('done');
      setResult({ collected: game.collected, stars: game.earned });
    };

    Events.on(engine, 'collisionStart', (e) => {
      for (const { bodyA, bodyB } of e.pairs) {
        const cookie = (bodyA === slot ? bodyB : bodyB === slot ? bodyA : null) as Cookie | null;
        if (!cookie || !game.cookies.includes(cookie)) continue;
        Composite.remove(world, cookie);
        game.cookies = game.cookies.filter((c) => c !== cookie);
        game.collected += 1;
        game.pigPop = 1;
        const earned = STARS.filter((s) => game.collected / TOTAL >= s.at).length;
        if (earned > game.earned) {
          game.starPop[earned - 1] = 1;
          game.earned = earned;
        }
      }
    });

    const release = () => {
      if (game.phase !== 'ready') return;
      game.phase = 'pouring';
      setPhase('pouring');
    };

    const restart = () => {
      Composite.remove(world, [...game.cookies, ...game.lines]);
      Object.assign(game, { phase: 'ready', cookies: [], lines: [], strokes: [], ink: INK, spawned: 0, collected: 0, spawnClock: 0, afterSpawn: 0, idle: 0, earned: 0, starPop: [0, 0, 0] });
      setPhase('ready');
      setDrawn(false);
      setInkOut(false);
    };
    api.current = { release, restart };

    // Çizim: noktalar arası her parça ince, ucu yuvarlatılmış bir duvar olur; uzunluğu mürekkepten düşer
    let stroke: { x: number; y: number }[] | null = null;
    const toWorld = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    const inRect = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) =>
      p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    const onDown = (e: PointerEvent) => {
      if (!activeRef.current) return;
      const p = toWorld(e);
      if (inRect(p, RESTART)) return restart();
      if (inRect(p, ARROW)) return release();
      if (p.y < 150 || p.y > 1090 || game.ink <= 0 || game.phase === 'done') return;
      canvas.setPointerCapture(e.pointerId);
      stroke = [p];
      game.strokes.push(stroke);
      setDrawn(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!stroke) return;
      const p = toWorld(e);
      const last = stroke[stroke.length - 1];
      let dx = p.x - last.x;
      let dy = p.y - last.y;
      let len = Math.hypot(dx, dy);
      if (len < 8) return;
      if (len > game.ink) {
        dx *= game.ink / len;
        dy *= game.ink / len;
        len = game.ink;
      }
      const next = { x: last.x + dx, y: last.y + dy };
      const seg = Bodies.rectangle((last.x + next.x) / 2, (last.y + next.y) / 2, len + LINE, LINE, {
        isStatic: true,
        friction: 0.01,
        angle: Math.atan2(dy, dx),
        chamfer: { radius: LINE / 2 - 0.5 },
      });
      Composite.add(world, seg);
      game.lines.push(seg);
      stroke.push(next);
      game.ink = Math.max(0, game.ink - len);
      if (game.ink <= 0) {
        stroke = null;
        setInkOut(true);
      }
    };
    const onUp = () => {
      stroke = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // Tuval, sahnenin ekrandaki boyutuna ve ekran yoğunluğuna göre ölçülür
    let scale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = stage.clientWidth;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round((w * H) / W * dpr);
      scale = (w / W) * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    const counter = (value: string, x: number, y: number, size: number) => {
      ctx.font = `600 ${size}px Fredoka, ui-rounded, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = 'rgba(70, 25, 5, 0.45)';
      ctx.strokeText(value, x, y + 1.5);
      ctx.fillStyle = '#fff';
      ctx.fillText(value, x, y);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!level) return;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(level, 0, 0, W, H);

      // Yıldız çubuğu: kumbaraya giren oran kadar dolar, yıldızlar dolgunun üstüne yeniden çizilir
      const progress = Math.min(1, game.collected / TOTAL);
      if (progress > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgb(214, 112, 40)';
        ctx.beginPath();
        ctx.roundRect(BAR.x, BAR.y, BAR.w * progress, BAR.h, BAR.h / 2);
        ctx.fill();
        ctx.restore();
      }
      STARS.forEach((s, i) => {
        const pop = game.starPop[i];
        const k = 1 + (i < game.earned ? 0.08 : 0) + pop * 0.35;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(k, k);
        starPath(ctx, 0, 0, 26, 13);
        // Kazanılan yıldızın altına altın rengi bir parıltı çizilir; kırpmadan önce, yoksa gölge de kırpılırdı
        if (i < game.earned) {
          ctx.save();
          ctx.shadowColor = 'rgba(255, 205, 80, 0.95)';
          ctx.shadowBlur = 16 + pop * 24;
          ctx.fillStyle = 'rgb(255, 214, 110)';
          ctx.fill();
          ctx.restore();
        }
        ctx.clip();
        ctx.drawImage(level!, s.x - 28, s.y - 28, 56, 56, -28, -28, 56, 56);
        ctx.restore();
        if (pop > 0) game.starPop[i] = Math.max(0, pop - 0.04);
      });

      // Mürekkep yüzdesi ve kumbara sayacı: görüntüdeki sabit yazılar yandaki boş zeminle örtülüp yeniden yazılır
      ctx.drawImage(level, 126, 136, 72, 26, 126, 106, 72, 26);
      counter(`%${Math.ceil((game.ink / INK) * 100)}`, 161, 119, 22);
      ctx.drawImage(level, 150, 972, 118, 36, 268, 972, 118, 36);
      counter(`${game.collected}/${TOTAL}`, 326, 990, 34);

      // Kumbara her kurabiyede hafifçe zıplar (büyüyerek; küçülürse alttaki sabit görüntü görünürdü)
      if (game.pigPop > 0) {
        const k = 1 + Math.sin(game.pigPop * Math.PI) * 0.1;
        const ox = PIG.x;
        const oy = PIG_CROP.y + PIG_CROP.h;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(k, k);
        ctx.drawImage(level, PIG_CROP.x, PIG_CROP.y, PIG_CROP.w, PIG_CROP.h, PIG_CROP.x - ox, PIG_CROP.y - oy, PIG_CROP.w, PIG_CROP.h);
        ctx.restore();
        game.pigPop = Math.max(0, game.pigPop - (reducedMotion ? 1 : 0.08));
      }

      // Çizgiler: çikolata rengi, içinde açık bir parıltı
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [width, color] of [
        [LINE + 2, '#4a2309'],
        [LINE - 6, '#9a5a28'],
      ] as const) {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        for (const s of game.strokes) {
          if (s.length < 2) continue;
          ctx.beginPath();
          ctx.moveTo(s[0].x, s[0].y);
          for (const p of s.slice(1)) ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      // Kurabiyeler; kumbarayı ıskalayıp yere düşenler solarak kaybolur
      for (const c of game.cookies) {
        const fade = Math.min(1, Math.max(0, (1010 - c.position.y) / 120));
        if (fade <= 0) continue;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(c.position.x, c.position.y);
        ctx.rotate(c.angle);
        ctx.drawImage(sprites[c.sprite], -R - 1, -R - 1, (R + 1) * 2, (R + 1) * 2);
        ctx.restore();
      }

      if (DEBUG) {
        ctx.lineWidth = 2;
        for (const b of Composite.allBodies(world)) {
          if (game.cookies.includes(b as Cookie)) continue;
          ctx.strokeStyle = b.isSensor ? '#0f0' : '#0ff';
          ctx.beginPath();
          b.vertices.forEach((v) => ctx.lineTo(v.x, v.y));
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const step = () => {
      if (game.phase === 'pouring' && game.spawned < TOTAL) {
        game.spawnClock += 1;
        if (game.spawnClock % 4 === 0) {
          const c = Bodies.circle(SPAWN_X + (Math.random() - 0.5) * 10, SPAWN_Y, R, {
            friction: 0.02,
            frictionAir: 0.01,
            restitution: 0.05,
            density: 0.002,
          }) as Cookie;
          c.sprite = Math.floor(Math.random() * SPRITES.length);
          Body.setVelocity(c, { x: (Math.random() - 0.5) * 0.4, y: 1 });
          Body.setAngularVelocity(c, (Math.random() - 0.5) * 0.2);
          Composite.add(world, c);
          game.cookies.push(c);
          game.spawned += 1;
        }
      }
      Engine.update(engine, 1000 / 60);
      const gone = game.cookies.filter((c) => c.position.y > 1030 || c.position.x < -40 || c.position.x > W + 40);
      if (gone.length) {
        Composite.remove(world, gone);
        game.cookies = game.cookies.filter((c) => !gone.includes(c));
      }
      // Bölüm, kurabiyeler bitince ya da kalanlar bir yere takılıp durulunca (ör. L borunun köşesinde) biter
      if (game.phase === 'pouring' && game.spawned >= TOTAL) {
        game.afterSpawn += 1;
        // Yığında duran kurabiyeler hafifçe titrediği için küçük hızlar hareket sayılmaz
        game.idle = game.cookies.some((c) => c.speed > 0.6) ? 0 : game.idle + 1;
        if (game.cookies.length === 0 || game.idle > 40 || game.afterSpawn > 60 * 5) finish();
      }
    };

    // Döngü yalnızca sahne ekrandayken çalışır
    let visible = false;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      step();
      draw();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(stage);

    Promise.all([loadImage(LEVEL), loadImage(SHEET), loadFont()])
      .then(([lvl, sheet]) => {
        if (disposed) return;
        level = lvl;
        // Her kurabiye bir kez yuvarlak kesilip küçük bir tuvale alınır; karelerde yalnızca bu tuval çizilir
        sprites = SPRITES.map(([x, y]) => {
          const c = document.createElement('canvas');
          c.width = c.height = 64;
          const g = c.getContext('2d')!;
          g.beginPath();
          g.arc(32, 32, 31, 0, Math.PI * 2);
          g.clip();
          g.drawImage(sheet, x - SPRITE_R, y - SPRITE_R, SPRITE_R * 2, SPRITE_R * 2, 0, 0, 64, 64);
          return c;
        });
        draw();
        raf = requestAnimationFrame(loop);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      Events.off(engine, 'collisionStart');
      Composite.clear(world, false);
      Engine.clear(engine);
      api.current = null;
    };
  }, []);

  const resultText = t(ui.game.result).replace('{n}', String(result.collected)).replace('{total}', String(TOTAL));

  return (
    <section className="gutter grid items-center gap-[4vh] py-[8vh] lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-4 lg:row-start-1 lg:self-end">
        {title.trim() && <Words key={`h-${lang}`} as="h2" text={title} className="display text-[clamp(2rem,3.4vw,5rem)] leading-[1.02]" />}
        {text.trim() && <Words key={`p-${lang}`} text={text} className="mt-[2vh] max-w-md text-[clamp(1rem,1.1vw,1.5rem)] font-medium leading-snug opacity-75" />}
      </div>

      <div className="flex justify-center lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
        {/* Köşe yuvarlaklığı görüntüdeki telefon çerçevesine uyar (yaklaşık 75 px: genişliğin %11,5'i, yüksekliğin %6,5'i) */}
        <div
          ref={stageRef}
          // Telefonda sahne, altındaki düğmelerle birlikte tek ekrana sığacak kadar kısa tutulur
          className="relative aspect-[652/1160] h-[min(70svh,46rem)] max-w-full lg:h-[min(82svh,46rem)] overflow-hidden rounded-[11.5%/6.5%] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)]"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t(ui.game.stage)}
            className={`absolute inset-0 h-full w-full select-none ${active ? 'cursor-crosshair' : ''}`}
            style={{ touchAction: active ? 'none' : 'pan-y' }}
          />
          {active && phase === 'ready' && (!drawn || inkOut) && (
            <p className="pointer-events-none absolute inset-x-0 top-[17%] flex justify-center">
              <span className="rounded-full bg-ink/75 px-4 py-2 text-sm font-semibold text-paper backdrop-blur-sm">
                {t(inkOut ? ui.game.noInk : ui.game.hint)}
              </span>
            </p>
          )}
          {phase === 'done' && (
            <div className="absolute inset-0 grid place-items-center bg-ink/45 p-6 backdrop-blur-[2px]">
              <div className="rounded-3xl bg-paper px-7 py-6 text-center text-ink shadow-xl">
                <p aria-hidden className="text-3xl tracking-widest">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < result.stars ? 'text-accent' : 'text-ink/15'}>
                      ★
                    </span>
                  ))}
                </p>
                <p className="mt-2 font-semibold">{resultText}</p>
                <button type="button" onClick={() => api.current?.restart()} className="pill mt-4 min-h-11 border-ink bg-ink px-5 py-2.5 text-paper hover:bg-transparent hover:text-ink">
                  {t(ui.game.again)}
                </button>
              </div>
            </div>
          )}
          {!active && (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="absolute inset-0 grid place-items-center bg-ink/35 backdrop-blur-[1px]"
            >
              <span className="pill min-h-11 border-paper bg-paper px-5 py-2.5 text-base font-semibold text-ink">{t(ui.game.tap)}</span>
            </button>
          )}
          {active && touch && (
            <button
              type="button"
              onClick={() => setActive(false)}
              aria-label={t(ui.game.exit)}
              className="absolute right-[4%] top-[3.2%] grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-lg text-paper"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 max-lg:justify-center lg:col-span-4 lg:row-start-2 lg:self-start">
        <button
          type="button"
          onClick={() => {
            setActive(true);
            api.current?.release();
          }}
          disabled={phase !== 'ready'}
          className="pill min-h-11 border-ink bg-ink px-5 py-2.5 text-base text-paper hover:bg-transparent hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          {t(ui.game.release)} <span aria-hidden>↓</span>
        </button>
        <button type="button" onClick={() => api.current?.restart()} className="pill min-h-11 border-ink px-5 py-2.5 text-base hover:bg-ink hover:text-paper">
          {t(ui.game.restart)}
        </button>
      </div>
    </section>
  );
}
