import { useLayoutEffect, useRef } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, reducedMotion, refreshSoon, ScrollTrigger } from '../lib/scroll';
import { Words } from './Reveal';

// Yolculuk: bölüm ekranda sabit kalır, sayfa kaydıkça bir yolculuk anlatılır. Önce geniş açılış görselinde kamera
// bir noktadan (from) portala (to) kayar ve portalın içine dalar; ardından her durak, portal noktasından büyüyen ışıklı
// bir halkanın içinde kendi rengiyle açılır. Duraklarda sayaç, büyük başlık, bir görsel (ör. oyunun o dünyadaki
// ekranı) ve arkadan süzülen bir parça (ör. o dünyanın kaykayı) bulunur.
// Kamera, odak noktasını (görselin yüzdesi) ekranın ortasına getirerek kayar ve yakınlaşır; dalışın sonunda
// portal ekranın ortasındadır, halkalar da oradan büyür.
// Hareket azaltma tercihinde açılış görseli ve duraklar alt alta, sabit gösterilir.

export type JourneyStage = { title: string; text: string; image: string; accent: string; color: string };

const pad = (n: number) => String(n).padStart(2, '0');

// Zaman çizelgesi birimleri: açılış kayması 1, dalış 0,7, her durak 1,2
const DIVE = 1;
const FIRST = 1.7;
const STEP = 1.2;

export default function Journey({
  title,
  text,
  image,
  from,
  to,
  stages,
  alt,
}: {
  title: string;
  text: string;
  image: string;
  from: number;
  to: { x: number; y: number };
  stages: JourneyStage[];
  alt: string;
}) {
  const { lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const n = stages.length;
  const total = FIRST + n * STEP + 0.4;

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const box = stageRef.current!;
    const img = box.querySelector<HTMLImageElement>('[data-j-img]')!;
    // Kamera: odak noktası (fx, fy; görselin yüzdesi) ekranın ortasına getirilir, z yakınlaştırmadır. Geniş ekranda
    // görsel ekrana neredeyse sığdığı için hafif yakın başlanır, böylece yatak odasından portala kayış görünür olur.
    // Görsel kenarları ekranın içine girmesin diye kaydırma sınırlanır
    const cam = { fx: from / 100, fy: 0.5, z: 1 };
    const place = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      const ar = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 16 / 9;
      const base = Math.max(W, H * ar) * (W > H ? 1.35 : 1);
      const iw = base * cam.z;
      const ih = iw / ar;
      const tx = Math.min(0, Math.max(W - iw, W / 2 - cam.fx * iw));
      const ty = Math.min(0, Math.max(H - ih, H / 2 - cam.fy * ih));
      img.style.width = `${base}px`;
      img.style.height = `${base / ar}px`;
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${cam.z})`;
    };
    place();
    img.addEventListener('load', place);
    ScrollTrigger.addEventListener('refresh', place);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true },
      });
      tl.fromTo(cam, { fx: from / 100, fy: 0.5 }, { fx: to.x / 100, fy: to.y / 100, duration: DIVE, ease: 'power1.inOut', onUpdate: place, immediateRender: false }, 0)
        .to('[data-j-caption]', { opacity: 0, y: -40, duration: 0.35 }, 0.55)
        .fromTo(cam, { z: 1 }, { z: 8, duration: 0.7, ease: 'power2.in', onUpdate: place, immediateRender: false }, DIVE)
        .fromTo('[data-j-flash]', { opacity: 0 }, { opacity: 1, duration: 0.25 }, DIVE + 0.45)
        .to('[data-j-flash]', { opacity: 0, duration: 0.3 }, FIRST + 0.25);

      gsap.utils.toArray<HTMLElement>('[data-j-stage]').forEach((el, i) => {
        const at = FIRST + i * STEP;
        const ring = el.previousElementSibling as HTMLElement;
        const portal = { r: 0 };
        // Daire ve halka aynı yarıçapla büyür; sahnenin köşegeni kadar büyüyünce ekranı tamamen kaplar, halka da söner
        const apply = () => {
          const max = Math.hypot(box.clientWidth, box.clientHeight);
          const r = portal.r * max;
          el.style.clipPath = `circle(${r}px at 50% 50%)`;
          ring.style.width = ring.style.height = `${r * 2}px`;
          ring.style.opacity = String(portal.r > 0 ? Math.max(0, 1 - portal.r) : 0);
        };
        apply();
        tl.fromTo(portal, { r: 0 }, { r: 1, duration: 0.5, ease: 'power2.inOut', onUpdate: apply, immediateRender: false }, at)
          .from(el.querySelectorAll('[data-j-text]'), { yPercent: 40, opacity: 0, duration: 0.35, stagger: 0.05 }, at + 0.2);
        const card = el.querySelector('[data-j-card]');
        if (card) tl.from(card, { xPercent: 25, yPercent: 10, rotate: 6, opacity: 0, duration: 0.45 }, at + 0.25);
        const accent = el.querySelector('[data-j-accent]');
        if (accent) {
          tl.fromTo(
            accent,
            // Ortalama da GSAP'ta (xPercent/yPercent); sınıfla verilen translate, GSAP'ın dönüşümüyle ezilirdi
            { xPercent: -50, yPercent: -50, x: () => -window.innerWidth * 0.65, y: () => window.innerHeight * 0.55, rotate: -50 },
            { xPercent: -50, yPercent: -50, x: () => window.innerWidth * 0.65, y: () => -window.innerHeight * 0.55, rotate: 70, duration: STEP + 0.2 },
            at,
          );
        }
      });
      tl.to({}, { duration: 0.4 });
    }, ref);
    return () => {
      img.removeEventListener('load', place);
      ScrollTrigger.removeEventListener('refresh', place);
      ctx.revert();
    };
  }, [image, from, to.x, to.y, n, stages.map((s) => s.image + s.accent + s.color).join('|')]);

  const stage = (s: JourneyStage, i: number) => (
    <div className="gutter relative grid h-full content-center gap-[4vh] pb-[6vh] pt-[calc(4rem+2vh)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-0">
      <div className="lg:col-span-5">
        <p data-j-text aria-hidden className="display text-[clamp(2.25rem,4.5vw,6rem)] leading-[0.85] tabular-nums opacity-40">
          {pad(i + 1)}
          <span className="opacity-50">/{pad(n)}</span>
        </p>
        <h3 data-j-text className="display mt-[1.5vh] text-[clamp(3rem,7vw,9rem)] leading-[0.92]">
          {s.title}
        </h3>
        {s.text.trim() && (
          <p data-j-text className="mt-[2vh] max-w-md text-[clamp(1rem,1.15vw,1.45rem)] font-medium leading-snug opacity-85">
            {s.text}
          </p>
        )}
      </div>
      {s.image && (
        <div className="lg:col-span-7 lg:flex lg:justify-end">
          <img
            data-j-card
            src={s.image}
            alt={alt}
            draggable={false}
            className="w-full max-w-[36rem] select-none rounded-[clamp(0.8rem,1.4vw,1.75rem)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-[6px] ring-white/15"
          />
        </div>
      )}
    </div>
  );

  if (reducedMotion) {
    return (
      <section data-theme="dark" className="bg-ink text-paper">
        <div className="relative">
          <img src={image} alt={alt} className="block h-[70vh] w-full object-cover" style={{ objectPosition: `${from}% 50%` }} />
          <div className="gutter absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent pb-[6vh] pt-[12vh]">
            <h2 className="display max-w-3xl text-[clamp(2rem,3.4vw,5rem)] leading-[1.02]">{title}</h2>
            {text.trim() && <p className="mt-[2vh] max-w-md text-[clamp(1rem,1.1vw,1.5rem)] font-medium leading-snug opacity-80">{text}</p>}
          </div>
        </div>
        {stages.map((s, i) => (
          <div key={i} className="py-[8vh]" style={{ backgroundColor: s.color }}>
            {stage(s, i)}
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: `${total * 70 + 100}vh` }}>
      <div ref={stageRef} data-theme="dark" className="sticky top-0 h-[100svh] overflow-hidden bg-ink text-paper">
        {/* Açılış: kamera görselde kayar, sonra portala dalar */}
        <div data-j-cam className="absolute inset-0 overflow-hidden">
          <img data-j-img src={image} alt={alt} draggable={false} onLoad={refreshSoon} className="absolute left-0 top-0 max-w-none origin-top-left select-none will-change-transform" />
        </div>
        <div data-j-caption className="gutter absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pb-[8vh] pt-[20vh]">
          <Words key={`h-${lang}`} as="h2" text={title} className="display max-w-4xl text-[clamp(2.2rem,4.2vw,6rem)] leading-[1.02]" />
          {text.trim() && (
            <Words key={`p-${lang}`} text={text} className="mt-[2vh] max-w-md text-[clamp(1rem,1.1vw,1.5rem)] font-medium leading-snug opacity-85" />
          )}
        </div>
        <div
          data-j-flash
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{ background: `radial-gradient(circle at 50% 50%, #fff 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0) 75%)` }}
        />
        {stages.map((s, i) => (
          <div key={i}>
            {/* Portal halkası: açılan dairenin kenarında, durağın renginde parlayan çember */}
            <div
              aria-hidden
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{
                left: '50%',
                top: '50%',
                border: `clamp(6px, 0.8vw, 14px) solid ${s.color}`,
                boxShadow: `0 0 60px 18px ${s.color}, inset 0 0 60px 18px rgba(255,255,255,0.6)`,
              }}
            />
            <div data-j-stage className="absolute inset-0 z-[5] overflow-hidden" style={{ backgroundColor: s.color, clipPath: 'circle(0px at 50% 50%)' }}>
              {s.accent && (
                <img
                  data-j-accent
                  src={s.accent}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[min(42vh,24rem)] w-auto select-none opacity-90 drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]"
                />
              )}
              {stage(s, i)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
