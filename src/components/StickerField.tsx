import Matter from 'matter-js';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { play, projects, projectTitles, type Sticker } from '../content';
import { useLang } from '../lib/i18n';
import { reducedMotion } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Projelerden kesilmiş parçalar sayfanın üstünden düşer, birbirine çarparak yığılır. Fareyle tutulup fırlatılabilir;
// sürüklemeden tıklanan parça projesini açar. Dokunmatik ekranda sayfa kaydırması engellenmesin diye sürükleme yoktur:
// dokunulan parça zıplar ve projesinin adı görünür. Parçalar DOM'da durur, konumları fizik motorundan her karede kopyalanır.

const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

const cover = Object.fromEntries(projects.map((p) => [p.slug, p.cover]));
const WALL = 400;

type Item = Sticker & { w: number; hh: number };

// Sıraya bağlı sabit sahte rastgele sayı (0–1)
function seeded(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Parçaların boyutu ekran genişliğine göre ölçeklenir (1440 px'te 0,85)
const scaleFor = (w: number) => Math.max(0.55, Math.min(0.95, (w / 1440) * 0.85));

// textRef: açılıştaki metnin tamamı, keepClearRef: kapanmaması gereken açıklama ve düğmeler
export default function StickerField({
  stickers,
  hostRef,
  textRef,
  keepClearRef,
  onFirstDrag,
}: {
  stickers: Sticker[];
  hostRef: RefObject<HTMLElement>;
  textRef: RefObject<HTMLElement>;
  keepClearRef: RefObject<HTMLElement>;
  onFirstDrag?: () => void;
}) {
  const { t } = useLang();
  const { openProject } = useTransition();
  const [items, setItems] = useState<Item[]>([]);
  const [label, setLabel] = useState<number | null>(null);
  const elRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const labelIndex = useRef<number | null>(null);
  const press = useRef({ x: 0, y: 0 });
  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  // Görsellerin oranı öğrenilince parçaların boyutu belirlenir
  useEffect(() => {
    let alive = true;
    const host = hostRef.current;
    if (!host) return;
    const scale = scaleFor(host.clientWidth);
    // Telefonda parçalar metnin altındaki dar alana sığsın diye daha az parça kullanılır
    const list = stickers.slice(0, host.clientWidth < 640 ? 12 : 20);
    Promise.all(
      list.map(
        (s) =>
          new Promise<number>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1);
            img.onerror = () => resolve(1);
            img.src = s.src;
          }),
      ),
    ).then((ratios) => {
      if (!alive) return;
      setItems(list.map((s, i) => ({ ...s, hh: Math.round(s.h * scale), w: Math.round(s.h * scale * ratios[i]) })));
    });
    return () => {
      alive = false;
    };
  }, [stickers, hostRef]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !items.length) return;
    let W = host.clientWidth;
    let H = host.clientHeight;

    const place = (el: HTMLElement | null, x: number, y: number, w: number, h: number, angle: number) => {
      if (el) el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0) rotate(${angle}rad)`;
    };

    // Hareket azaltma tercihinde parçalar sabit bir yığın olarak çizilir: geniş ekranda sağ altta, dar ekranda metnin altında
    if (reducedMotion) {
      const wide = W >= 1024;
      const textBottom = (textRef.current?.getBoundingClientRect().bottom ?? 0) - host.getBoundingClientRect().top;
      items.forEach((it, i) => {
        const x = W * (wide ? 0.45 + 0.52 * seeded(i, 1) : 0.1 + 0.8 * seeded(i, 1));
        const room = wide ? H * 0.22 : Math.max(0, H - textBottom - it.hh);
        const y = H - it.hh / 2 - seeded(i, 2) * room;
        place(elRefs.current[i], x, y, it.w, it.hh, (seeded(i, 3) - 0.5) * 1.2);
        if (elRefs.current[i]) elRefs.current[i]!.style.opacity = '1';
      });
      return;
    }

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
    const ground = Bodies.rectangle(W / 2, H + WALL / 2, W * 4, WALL, { isStatic: true });
    const left = Bodies.rectangle(-WALL / 2, H / 2 - 2000, WALL, H + 4000, { isStatic: true });
    const right = Bodies.rectangle(W + WALL / 2, H / 2 - 2000, WALL, H + 4000, { isStatic: true });
    Composite.add(engine.world, [ground, left, right]);

    // Metnin kapanmaması gereken bölümü görünmez bir engelle korunur.
    // Geniş ekran: açıklama ve düğmelerin çevresinde sağa eğimli bir rampa; üstüne düşen parça kayıp sağa geçer.
    // Dar ekran: metnin tamamı tavan olur; parçalar metnin altındaki alanda doğar ve orada kalır.
    const rel = (el: HTMLElement | null) => {
      const h = host.getBoundingClientRect();
      const r = el?.getBoundingClientRect() ?? h;
      return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top };
    };
    let guard: Matter.Body | null = null;
    let spawnTop = 0;
    let spawnFrom = 0.08;
    const buildGuard = () => {
      if (guard) Composite.remove(engine.world, guard);
      if (W >= 1024) {
        const box = rel(keepClearRef.current);
        const top = box.t - 24;
        const edge = box.r + 40;
        // Dik ve kaygan çatı: üstüne düşen parça durmadan sağa kayar
        const verts = [
          { x: -WALL, y: top - 700 },
          { x: edge, y: top },
          { x: edge + 180, y: H + 10 },
          { x: -WALL, y: H + 10 },
        ];
        const c = Matter.Vertices.centre(verts);
        guard = Bodies.fromVertices(c.x, c.y, [verts], { isStatic: true, friction: 0 });
        spawnTop = 0;
        spawnFrom = Math.min(0.6, (edge + 80) / W);
      } else {
        const box = rel(textRef.current);
        const bottom = box.b + 16;
        guard = Bodies.rectangle(W / 2, (bottom - 3000) / 2, W * 4, bottom + 3000, { isStatic: true });
        spawnTop = bottom + 30;
        spawnFrom = 0.08;
      }
      Composite.add(engine.world, guard);
    };
    buildGuard();

    const bodies = items.map((it, i) =>
      Bodies.rectangle(
        W * (spawnFrom + (0.97 - spawnFrom) * seeded(i, 4)),
        spawnTop ? spawnTop + it.hh / 2 + seeded(i, 5) * 40 : -it.hh - seeded(i, 5) * 200,
        it.w,
        it.hh,
        {
          chamfer: { radius: Math.min(it.w, it.hh) * 0.16 },
          angle: (seeded(i, 6) - 0.5) * 2,
          restitution: 0.3,
          friction: 0.5,
          frictionAir: 0.012,
          density: 0.002,
        },
      ),
    );
    bodiesRef.current = bodies;
    const timers = bodies.map((b, i) =>
      window.setTimeout(() => {
        Composite.add(engine.world, b);
        Body.setAngularVelocity(b, (seeded(i, 7) - 0.5) * 0.2);
        const el = elRefs.current[i];
        if (el) el.style.opacity = '1';
      }, 250 + i * 110),
    );

    Events.on(engine, 'afterUpdate', () => {
      bodies.forEach((b, i) => place(elRefs.current[i], b.position.x, b.position.y, items[i].w, items[i].hh, b.angle));
      const li = labelIndex.current;
      if (li !== null && labelRef.current) {
        const b = bodies[li];
        labelRef.current.style.transform = `translate3d(${b.position.x}px, ${b.position.y - items[li].hh / 2 - 14}px, 0) translate(-50%, -100%)`;
      }
    });

    // Fare: tut ve fırlat. Tekerlek ve dokunma dinleyicileri kaldırılır; sayfa kaydırması engellenmesin
    const mouse = Mouse.create(host);
    const handlers = mouse as unknown as Record<string, EventListener>;
    host.removeEventListener('wheel', handlers.mousewheel);
    host.removeEventListener('touchmove', handlers.mousemove);
    host.removeEventListener('touchstart', handlers.mousedown);
    host.removeEventListener('touchend', handlers.mouseup);
    const grab = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1 } });
    Composite.add(engine.world, grab);
    let dragged = false;
    Events.on(grab, 'startdrag', () => {
      if (!dragged) onFirstDrag?.();
      dragged = true;
    });

    const runner = Runner.create();
    Runner.run(runner, engine);

    // Bölüm ekranda değilken motor durur
    const io = new IntersectionObserver(([entry]) => {
      runner.enabled = entry.isIntersecting;
    });
    io.observe(host);

    // Boyut değişince zemin ve duvarlar yeni kenarlara taşınır, dışarıda kalan parçalar içeri alınır
    const ro = new ResizeObserver(() => {
      W = host.clientWidth;
      H = host.clientHeight;
      Body.setPosition(ground, { x: W / 2, y: H + WALL / 2 });
      Body.setPosition(right, { x: W + WALL / 2, y: H / 2 - 2000 });
      buildGuard();
      bodies.forEach((b) => {
        if (b.position.x > W - 20) Body.setPosition(b, { x: W - 80, y: Math.min(b.position.y, H - 80) });
        if (b.position.y > H) Body.setPosition(b, { x: b.position.x, y: H - 80 });
      });
    });
    ro.observe(host);

    return () => {
      timers.forEach(window.clearTimeout);
      io.disconnect();
      ro.disconnect();
      Runner.stop(runner);
      Mouse.clearSourceEvents(mouse);
      host.removeEventListener('mousemove', handlers.mousemove);
      host.removeEventListener('mousedown', handlers.mousedown);
      host.removeEventListener('mouseup', handlers.mouseup);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hostRef]);

  const showLabel = (i: number | null) => {
    labelIndex.current = i;
    setLabel(i);
  };

  const open = (i: number) => {
    const slug = items[i].slug;
    if (cover[slug]) openProject(slug, cover[slug], elRefs.current[i]);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {items.map((it, i) => (
        <button
          key={`${it.src}-${i}`}
          ref={(el) => (elRefs.current[i] = el)}
          type="button"
          aria-label={projectTitles[it.slug] ?? it.slug}
          style={{ width: it.w, height: it.hh, zIndex: items.length - i, opacity: 0 }}
          className={`pointer-events-auto absolute left-0 top-0 select-none will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${touch ? '' : 'cursor-grab active:cursor-grabbing'}`}
          onPointerDown={(e) => {
            press.current = { x: e.clientX, y: e.clientY };
            if (e.pointerType === 'touch' && !reducedMotion) {
              // Dokunulan parça zıplar
              const b = bodiesRef.current[i];
              if (b) {
                Body.setVelocity(b, { x: (Math.random() - 0.5) * 8, y: -16 });
                Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.35);
              }
              showLabel(i);
            }
          }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && showLabel(i)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && showLabel(null)}
          onClick={(e) => {
            // Sürükleyip bırakmak tıklama sayılmaz
            const moved = Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y);
            if (moved > 6 || touch) return;
            open(i);
          }}
        >
          <img src={it.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none drop-shadow-[0_10px_14px_rgba(0,0,0,0.18)]" />
        </button>
      ))}
      {label !== null && items[label] && (
        <div
          ref={labelRef}
          style={reducedMotion ? { display: 'none' } : undefined}
          className="pointer-events-auto absolute left-0 top-0 z-[60] whitespace-nowrap"
        >
          {cover[items[label].slug] ? (
            <button type="button" onClick={() => open(label)} className="pill border-ink bg-ink text-paper">
              {projectTitles[items[label].slug]}
              <span aria-hidden>→</span>
              <span className="sr-only">{t(play.open)}</span>
            </button>
          ) : (
            <span className="pill border-ink/15 bg-paper text-ink">{projectTitles[items[label].slug] ?? items[label].slug}</span>
          )}
        </div>
      )}
    </div>
  );
}
