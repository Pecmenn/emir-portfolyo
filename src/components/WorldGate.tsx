import { useLayoutEffect, useRef } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion } from '../lib/scroll';
import { Words } from './Reveal';

// Dünyanın girişi: bölüm başlığının yanında dünyanın kapısı (oyundaki portal) durur. Kaydırdıkça kahraman o dünyanın
// kaykayıyla soldan gelir, yoldaki engelin üstünden kickflip ile atlar, yol üstündeki altınları toplar (her altın köşedeki
// sayaca uçar; bkz. WorldTour) ve küçülerek kapının içine girer. Arkada dünyanın element simgesi büyük bir filigran olarak
// döner. data-world-at, WorldTour'un dünya değişimini izlediği işarettir.

export const COIN = '/images/skate-odyssey/obje/altin.webp';
// Altınların kahramanın yolundaki yeri (sahne genişliğinin oranı) ve engelin yeri
const COINS = [0.12, 0.2, 0.28, 0.46, 0.54, 0.62];
const OBSTACLE = 0.37;
const GATE_X = 0.66;

export type GateWorld = { at: number; name: string; gate: string; icon?: string; accent: string; obstacle?: string };

export default function WorldGate({ index, title, text, world, hero }: { index: number; title: string; text: string; world: GateWorld; hero?: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const stage = stageRef.current!;
    const coins = Array.from(stage.querySelectorAll<HTMLElement>('[data-coin]'));
    const taken = coins.map(() => false);
    const ctx = gsap.context(() => {
      gsap.from('[data-gate-rule]', { scaleX: 0, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
      gsap.from('[data-gate-num]', { yPercent: 110, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start: 'top 80%' } });
      gsap.fromTo('[data-gate-icon]', { rotate: -18, yPercent: 20 }, { rotate: 14, yPercent: -20, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });

      // Kahramanın yolu sahne genişliğinin oranıyla tanımlanır; x, sahne genişliğine göre hesaplanır
      const width = () => stage.clientWidth;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top 85%',
          end: 'bottom 30%',
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Kahraman bir altının hizasını geçince altın sayaca uçar; geri kaydırınca yerine döner
            const x = -0.18 + (GATE_X + 0.18) * self.progress;
            coins.forEach((coin, i) => {
              const passed = x >= COINS[i];
              if (passed === taken[i]) return;
              taken[i] = passed;
              const r = coin.getBoundingClientRect();
              window.dispatchEvent(new CustomEvent('world:coin', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2, delta: passed ? 1 : -1 } }));
              gsap.to(coin, { scale: passed ? 0 : 1, opacity: passed ? 0 : 1, duration: 0.25, overwrite: true });
            });
          },
        },
      });
      tl.fromTo('[data-hero]', { x: () => -0.18 * width() }, { x: () => (GATE_X - 0.06) * width(), duration: 1 }, 0)
        // Engelin üstünden zıplama ve kaykayın havada dönmesi
        .to('[data-hero-body]', { yPercent: -55, duration: 0.09, ease: 'power2.out' }, OBSTACLE - 0.1)
        .to('[data-hero-body]', { yPercent: 0, duration: 0.09, ease: 'power2.in' }, OBSTACLE - 0.01)
        .fromTo('[data-hero-board]', { rotationX: 0, transformPerspective: 500 }, { rotationX: 360, duration: 0.18, ease: 'power1.inOut' }, OBSTACLE - 0.1)
        // Kapıya yaklaşırken küçülür ve içine girer
        .to('[data-hero]', { scale: 0.42, duration: 0.3, ease: 'power1.in' }, 0.7)
        .to('[data-hero]', { opacity: 0, duration: 0.08 }, 0.92)
        .fromTo('[data-gate-glow]', { opacity: 0.35, scale: 0.8 }, { opacity: 1, scale: 1.15, duration: 0.35 }, 0.65)
        .fromTo('[data-gate]', { scale: 0.94 }, { scale: 1.04, duration: 1 }, 0);
    }, ref);
    return () => ctx.revert();
  }, [world.gate, world.accent, hero]);

  return (
    <div ref={ref} data-world-at={world.at} className="gutter relative overflow-x-clip pb-[6vh] pt-[16vh]">
      {world.icon && (
        <img
          data-gate-icon
          src={world.icon}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-[6%] top-[8%] w-[min(52vw,46rem)] select-none opacity-[0.13] mix-blend-luminosity lg:right-[2%]"
        />
      )}
      <div data-gate-rule className="relative h-px origin-left bg-current opacity-20" />
      <div className="relative mt-[4vh] grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="line-mask display text-[clamp(4.5rem,11vw,15rem)] leading-[0.85] opacity-25">
            <span data-gate-num className="block">
              {String(index).padStart(2, '0')}
            </span>
          </p>
          <p className="mt-[2vh] flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] opacity-85">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-current" />
            {world.name}
          </p>
          <Words key={`g-${lang}`} as="h2" text={title} className="display mt-[3vh] text-[clamp(2.6rem,4.8vw,7.5rem)] leading-[0.98]" />
          {text.trim() && (
            <Words key={`gt-${lang}`} text={text} className="mt-[3vh] max-w-xl text-[clamp(1.05rem,1.15vw,1.6rem)] font-medium leading-snug opacity-80" />
          )}
        </div>

        {/* Sahne: zemin ışığı, kapı, yol üstündeki altınlar ve engel, kaykaydaki kahraman */}
        <div ref={stageRef} aria-hidden className="relative h-[min(56svh,26rem)] lg:col-span-7 lg:h-[min(78vh,46rem)]">
          <div className="absolute inset-x-[4%] bottom-[6%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.28),rgba(255,255,255,0))]" />
          {/* Konumlandırma dış kutularda (translate), GSAP'ın büyütüp döndürdüğü öğeler iç kutularda; ikisi aynı öğede çakışırdı */}
          <div className="absolute bottom-[8%] h-[80%] -translate-x-1/2" style={{ left: `${GATE_X * 100}%` }}>
            <div data-gate className="relative h-full origin-bottom">
              <div
                data-gate-glow
                className="absolute left-[15%] top-[38%] h-[46%] w-[70%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(255,255,255,0))] blur-md"
              />
              <img src={world.gate} alt="" draggable={false} className="relative h-full w-auto max-w-none select-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
          {COINS.map((x, i) => (
            <div key={i} className="absolute bottom-[30%] -translate-x-1/2" style={{ left: `${x * 100}%`, marginBottom: `${Math.sin(i * 1.3) * 18}px` }}>
              <img data-coin src={COIN} alt="" draggable={false} className="w-[clamp(1.6rem,2.6vw,2.6rem)] select-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]" />
            </div>
          ))}
          {world.obstacle && (
            <img
              src={world.obstacle}
              alt=""
              draggable={false}
              className="absolute bottom-[10%] h-[18%] w-auto -translate-x-1/2 select-none drop-shadow-[0_14px_16px_rgba(0,0,0,0.35)]"
              style={{ left: `${OBSTACLE * 100}%` }}
            />
          )}
          {hero && (
            <div data-hero className="absolute bottom-[9%] left-0 h-[48%] origin-bottom" style={reducedMotion ? { transform: `translateX(${(GATE_X - 0.3) * 100}%)` } : undefined}>
              <div data-hero-body className="relative h-full">
                <img src={hero} alt="" draggable={false} className="relative z-[1] h-[88%] w-auto max-w-none select-none drop-shadow-[0_16px_18px_rgba(0,0,0,0.3)]" />
                {/* Yatay kaykay kahramanın ayaklarının altında; kickflip için iç öğe döner */}
                <div className="absolute bottom-0 left-1/2 w-[150%] -translate-x-1/2">
                  <img data-hero-board src={world.accent} alt="" draggable={false} className="w-full select-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
