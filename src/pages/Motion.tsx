import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { play, projects, site } from '../content';
import { Magnetic } from '../components/Roll';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { gsap, lenis, reducedMotion } from '../lib/scroll';

// Hareket menüsü (geçici, yalnızca seçim için): modern sitelerde kullanılan 12 hareket türü, gerçek proje görselleriyle.
// Kullanıcı beğendiklerinin numarasını söyler; site seçilen hareketlerle kurulur. Metinler bu sayfaya özel ve geçici
// olduğu için içerik dosyalarına taşınmadı.

const covers = projects.map((p) => p.cover).filter(Boolean);
const cover = (i: number) => covers[i % covers.length];

function Label({ n, title, text, light }: { n: string; title: string; text: string; light?: boolean }) {
  return (
    <div className={`gutter pointer-events-none absolute left-0 top-0 z-20 pt-[84px] ${light ? 'text-paper' : 'text-ink'}`}>
      <p className="flex items-baseline gap-3">
        <span className={`rounded-full px-2.5 py-1 text-sm font-medium tabular-nums ${light ? 'bg-paper text-ink' : 'bg-ink text-paper'}`}>{n}</span>
        <span className="text-[clamp(1.1rem,1.4vw,1.5rem)] font-medium">{title}</span>
      </p>
      <p className="mt-2 max-w-sm text-sm opacity-70">{text}</p>
    </div>
  );
}

// 01 — Harfler üç boyutta dönerek gelir, kaydırınca dağılır
function Kinetic() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>('[data-ch]');
      gsap.from(chars, { yPercent: 140, rotateX: -110, opacity: 0, duration: 1.5, ease: 'expo.out', stagger: 0.04, delay: 2.4 });
      chars.forEach((c) => {
        gsap.to(c, {
          x: gsap.utils.random(-380, 380),
          y: gsap.utils.random(-300, 300),
          rotate: gsap.utils.random(-120, 120),
          scale: gsap.utils.random(0.4, 1.6),
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  const words = site.name.split(' ');
  return (
    <section ref={ref} className="relative grid h-[100svh] place-items-center overflow-hidden bg-paper [perspective:900px]">
      <Label n="01" title="Kinetik başlık" text="Harfler üç boyutta dönerek gelir; aşağı kaydırınca her biri farklı yöne dağılır." />
      <h1 className="display text-center text-[clamp(3.5rem,12vw,14rem)] leading-[0.9]">
        {words.map((w, wi) => (
          <span key={wi} className="inline-block whitespace-nowrap">
            {Array.from(w).map((ch, i) => (
              <span key={i} data-ch className="inline-block will-change-transform">
                {ch}
              </span>
            ))}
            {wi < words.length - 1 && ' '}
          </span>
        ))}
      </h1>
    </section>
  );
}

// 02 — İki sıra kayan proje adı; kaydırma hızlandıkça şerit hızlanır ve eğilir
function VelocityMarquee() {
  const rows = useRef<HTMLDivElement[]>([]);
  useEffect(() => {
    if (reducedMotion) return;
    const xs = [0, 0];
    let skew = 0;
    const tick = () => {
      const v = (lenis as unknown as { velocity: number }).velocity || 0;
      skew += (gsap.utils.clamp(-16, 16, v * 0.7) - skew) * 0.12;
      rows.current.forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;
        const w = row.scrollWidth / 2;
        xs[i] = gsap.utils.wrap(-w, 0, xs[i] + dir * (1.4 + Math.abs(v) * 0.5));
        row.style.transform = `translate3d(${xs[i]}px,0,0) skewX(${skew * -dir}deg)`;
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  const titles = projects.map((p) => p.title);
  return (
    <section data-theme="dark" className="relative overflow-hidden bg-ink pb-[16vh] pt-[30vh] text-paper">
      <Label light n="02" title="Hızla eğilen şerit" text="Proje adları sonsuz döngüde kayar. Hızlı kaydırınca şerit hızlanır ve eğilir." />
      {[0, 1].map((r) => (
        <div key={r} className="py-1">
          <div ref={(el) => el && (rows.current[r] = el)} className="flex w-max gap-[4vw] whitespace-nowrap will-change-transform">
            {[...titles, ...titles].map((t, i) => (
              <span key={i} className={`display text-[clamp(3rem,9vw,10rem)] leading-[1.05] ${r ? 'text-accent-soft' : ''}`}>
                {t}
                <span className="ml-[4vw] opacity-30">✦</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// 03 — Küçük görsel kaydırdıkça ekranı doldurur, başlık iki yana açılır
function ZoomThrough() {
  const ref = useRef<HTMLElement>(null);
  const p = projects[0];
  const [first, ...rest] = p.title.split(' ');
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      tl.fromTo('[data-zt-media]', { clipPath: 'inset(32% 38% 32% 38% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut' }, 0)
        .fromTo('[data-zt-img]', { scale: 1.6 }, { scale: 1, ease: 'power2.inOut' }, 0)
        .to('[data-zt-l]', { xPercent: -130, ease: 'power2.in' }, 0)
        .to('[data-zt-r]', { xPercent: 130, ease: 'power2.in' }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative h-[300vh] bg-paper">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Label n="03" title="Ekranı dolduran görsel" text="Ortadaki küçük görsel kaydırdıkça büyüyüp ekranı kaplar, başlık iki yana açılır." />
        <div data-zt-media className="absolute inset-0">
          <img data-zt-img src={p.cover} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="gutter display pointer-events-none absolute inset-0 flex items-center justify-between text-[clamp(3rem,10vw,12rem)] text-paper mix-blend-difference">
          <span data-zt-l>{first}</span>
          <span data-zt-r>{rest.join(' ')}</span>
        </div>
      </div>
    </section>
  );
}

// 04 — Proje kartları üst üste biner; alttaki küçülüp kararır
function StackCards() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const list = projects.slice(0, 5);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-stack]');
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card.firstElementChild, {
          scale: 0.88,
          filter: 'brightness(0.65)',
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 14%', scrub: true },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative bg-paper pb-[12vh]">
      <div className="relative h-[34vh]">
        <Label n="04" title="Üst üste binen kartlar" text="Her proje bir kart. Yenisi geldikçe öncekinin üstüne biner; alttaki küçülüp kararır." />
      </div>
      {list.map((p, i) => (
        <div key={p.slug} data-stack className="gutter sticky mb-[12vh]" style={{ top: `calc(12vh + ${i * 16}px)` }}>
          <div className="card relative h-[76vh] origin-top bg-mist will-change-transform">
            <img src={p.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-black/60 to-transparent p-[clamp(1rem,2vw,2rem)] text-paper">
              <p className="display text-[clamp(2.2rem,5vw,5.5rem)]">{p.title}</p>
              <p className="text-sm font-medium opacity-80">{t(p.discipline)}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

// 05 — Paragrafın kelimeleri kaydırdıkça sırayla yanar
function TextFill() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const words = `${play.statement[lang].join(' ')} ${t(play.text)}`.split(/\s+/);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-fw]', { opacity: 0.12 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom 55%', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, [words.join(' ')]);
  return (
    <section ref={ref} className="gutter relative bg-paper pb-[24vh] pt-[30vh]">
      <Label n="05" title="Yanan kelimeler" text="Büyük paragraf soluk başlar; kaydırdıkça kelimeler sırayla yanar." />
      <p className="display max-w-[22ch] text-[clamp(2.4rem,5.6vw,6.5rem)] leading-[1.02]">
        {words.map((w, i) => (
          <span key={i} data-fw className="inline-block pr-[0.25em]">
            {w}
          </span>
        ))}
      </p>
    </section>
  );
}

// 06 — Sabitlenen bölümde görseller yatay akar; hızlanınca eğilir
function SkewRail() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
      const settle = gsap.delayedCall(0.12, () => skewTo(0)).pause();
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            skewTo(gsap.utils.clamp(-12, 12, self.getVelocity() / -250));
            settle.restart(true);
          },
        },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} data-theme="dark" className="relative flex h-[100svh] items-center overflow-hidden bg-night text-paper">
      <Label light n="06" title="Eğilen yatay galeri" text="Bölüm sabitlenir, görseller yatay akar. Hızlı kaydırınca bütün şerit eğilir." />
      <div ref={trackRef} className="gutter flex w-max gap-6 pt-[10vh] will-change-transform">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card h-[56vh] w-[42vh] shrink-0 bg-white/5">
            <img src={cover(i + 1)} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

// 07 — Kartlar fareyle üç boyutta eğilir, üstünde ışık gezer
function TiltCards() {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    gsap.to(el, { rotateY: (px - 0.5) * 22, rotateX: -(py - 0.5) * 18, scale: 1.03, duration: 0.6, ease: 'power3.out' });
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
  return (
    <section className="gutter relative bg-paper pb-[14vh] pt-[30vh]">
      <Label n="07" title="Fareyle eğilen kartlar" text="Fareyi kartların üstünde gezdir: kart üç boyutta eğilir, üstünde ışık gezer." />
      <div className="grid gap-6 [perspective:1200px] md:grid-cols-3">
        {[2, 3, 4].map((i) => (
          <div key={i} onPointerMove={onMove} onPointerLeave={onLeave} className="card relative aspect-[3/4] bg-mist will-change-transform [transform-style:preserve-3d]">
            <img src={cover(i)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.45),rgba(255,255,255,0)_45%)] mix-blend-overlay" />
          </div>
        ))}
      </div>
    </section>
  );
}

// 08 — Ortadan büyüyen daire yeni bölümü açar
function CircleReveal() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      tl.fromTo('[data-cr]', { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(80% at 50% 55%)', ease: 'power2.inOut' }, 0)
        .fromTo('[data-cr-img]', { scale: 1.4 }, { scale: 1, ease: 'power2.inOut' }, 0)
        .fromTo('[data-cr-text]', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out' }, 0.3);
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="relative h-[260vh] bg-paper">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Label n="08" title="Daireyle açılan bölüm" text="Ortada bir daire belirir ve büyüyerek yeni bölümü açar." />
        <p className="display absolute inset-0 grid place-items-center text-[clamp(2.5rem,7vw,8rem)] opacity-15">{projects[1]?.title}</p>
        <div data-cr className="absolute inset-0 bg-ink">
          <img data-cr-img src={cover(1)} alt="" className="h-full w-full object-cover opacity-80" />
          <p data-cr-text className="display absolute inset-0 grid place-items-center text-[clamp(3rem,9vw,11rem)] text-paper">
            {projects[1]?.title}
          </p>
        </div>
      </div>
    </section>
  );
}

// 09 — Dağınık parçalar kaydırdıkça ızgarada yerine oturur
function Assemble() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-as]').forEach((tile) => {
        gsap.fromTo(
          tile,
          { x: gsap.utils.random(-700, 700), y: gsap.utils.random(-500, 500), rotate: gsap.utils.random(-50, 50), scale: gsap.utils.random(0.3, 1.3), opacity: 0 },
          { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'center 55%', scrub: 0.8 } },
        );
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} className="gutter relative overflow-hidden bg-paper pb-[16vh] pt-[30vh]">
      <Label n="09" title="Yerine oturan ızgara" text="Proje kareleri ekrana dağınık gelir; kaydırdıkça uçup ızgarada yerine oturur." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} data-as className="card aspect-square bg-mist will-change-transform">
            <img src={cover(i)} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

// 10 — Görselin üstüne gelince büyüyen özel imleç ve mıknatıslı düğmeler
function CursorMagnet() {
  const ref = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current!;
    const dot = dotRef.current!;
    if (reducedMotion || window.matchMedia('(hover: none)').matches) return;
    const xTo = gsap.quickTo(dot, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(dot, 'y', { duration: 0.45, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
      const over = (e.target as HTMLElement).closest('[data-cursor]');
      gsap.to(dot, { scale: over ? 1 : 0.18, duration: 0.4, ease: 'power3.out' });
      gsap.to(dot.firstElementChild, { opacity: over ? 1 : 0, duration: 0.25 });
    };
    const leave = () => gsap.to(dot, { scale: 0, duration: 0.3 });
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (
    <section ref={ref} className="gutter relative cursor-none overflow-hidden bg-paper pb-[14vh] pt-[30vh]">
      <Label n="10" title="Büyüyen imleç ve mıknatıs" text="İmleç görsellerin üstünde büyüyüp yazıya dönüşür; düğmeler imlece doğru çekilir." />
      <div ref={dotRef} className="pointer-events-none absolute left-0 top-0 z-30 -ml-12 -mt-12 grid h-24 w-24 scale-0 place-items-center rounded-full bg-accent text-sm font-medium text-paper">
        <span className="opacity-0">Aç</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[5, 6].map((i) => (
          <div key={i} data-cursor className="card aspect-[16/10] bg-mist">
            <img src={cover(i)} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        {['İşlere bak', 'Birlikte çalışalım', 'CV'].map((l) => (
          <Magnetic key={l} strength={0.45}>
            <span className="pill min-h-14 border-ink px-8 text-base">{l}</span>
          </Magnetic>
        ))}
      </div>
    </section>
  );
}

// 11 — Görselin üstüne gelince yüzey sıvı gibi dalgalanır
function Liquid() {
  const onEnter = (id: string) => {
    if (reducedMotion) return;
    const map = document.querySelector(`#${id} feDisplacementMap`);
    const turb = document.querySelector(`#${id} feTurbulence`);
    gsap.fromTo(map, { attr: { scale: 0 } }, { attr: { scale: 70 }, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1 });
    gsap.fromTo(turb, { attr: { baseFrequency: 0.004 } }, { attr: { baseFrequency: 0.018 }, duration: 1, ease: 'sine.inOut' });
  };
  return (
    <section className="gutter relative bg-paper pb-[14vh] pt-[30vh]">
      <Label n="11" title="Sıvı gibi dalgalanan görsel" text="Fareyi görselin üstüne getir: yüzey bir an su gibi dalgalanıp yerine döner." />
      <svg className="absolute h-0 w-0" aria-hidden>
        {['liq-a', 'liq-b'].map((id) => (
          <filter key={id} id={id}>
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['liq-a', 7],
          ['liq-b', 8],
        ].map(([id, i]) => (
          <div key={id} onPointerEnter={() => onEnter(id as string)} className="card aspect-[16/10] bg-mist">
            <img src={cover(i as number)} alt="" className="h-full w-full scale-105 object-cover" style={{ filter: `url(#${id})` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

// 12 — Görseller bir silindirin çevresine dizilir, kaydırdıkça döner
function Cylinder() {
  const ref = useRef<HTMLElement>(null);
  const N = 10;
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-ring]', { rotateY: 20 }, { rotateY: -340, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={ref} data-theme="dark" className="relative h-[320vh] bg-ink text-paper">
      <div className="sticky top-0 grid h-[100svh] place-items-center overflow-hidden [perspective:1600px]">
        <Label light n="12" title="Dönen 3B galeri" text="Görseller bir silindirin çevresine dizilir; kaydırdıkça silindir döner." />
        <div data-ring className="relative h-[42vh] w-[30vh] [transform-style:preserve-3d]" style={{ ['--r' as string]: `calc(30vh / 2 / ${Math.tan(Math.PI / N).toFixed(4)} + 4vh)` } as React.CSSProperties}>
          {Array.from({ length: N }, (_, i) => (
            <div key={i} className="card absolute inset-0 [backface-visibility:hidden]" style={{ transform: `rotateY(${(360 / N) * i}deg) translateZ(var(--r))` }}>
              <img src={cover(i)} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Outro({ children }: { children: ReactNode }) {
  return <section className="gutter bg-paper py-[16vh]">{children}</section>;
}

export default function MotionMenu() {
  usePageMeta(`Hareket menüsü · ${site.name}`);
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Kinetic />
      <VelocityMarquee />
      <ZoomThrough />
      <StackCards />
      <TextFill />
      <SkewRail />
      <TiltCards />
      <CircleReveal />
      <Assemble />
      <CursorMagnet />
      <Liquid />
      <Cylinder />
      <Outro>
        <p className="display max-w-[20ch] text-[clamp(2.4rem,5vw,5.5rem)] leading-[1]">Beğendiklerinin numaralarını yaz, siteyi onlarla kurayım.</p>
      </Outro>
    </main>
  );
}
