import { useLayoutEffect, useRef } from 'react';
import { gsap, reducedMotion } from '../lib/scroll';

// İki bölüm arasında basamak basamak yükselen bloklar; kaydırmaya bağlı ilerler. Şerit ekrana girdikten
// sonra başlar ve ekranın ortasını geçene kadar sürer, böylece hareket izlenebilir.
// Zemin bir sonraki bölümün rengindedir; önceki bölümün renginde bloklar yukarı çekilir. Böylece alt kenarda
// iki bölüm arasında piksel altı boşluktan açık renkli çizgi sızmaz.
// to: bir sonraki bölümün rengi. from: bu şeridin zemini.
export default function StairDivider({ from, to, short = false }: { from: 'paper' | 'ink'; to: 'paper' | 'ink'; short?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const steps = [0.15, 0.55, 0.3, 0.8];

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'bottom 35%', scrub: 0.6 },
      });
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el, i) => {
        tl.fromTo(el, { scaleY: 1 }, { scaleY: 0, ease: 'none', duration: 1 }, steps[i] * 0.6);
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} aria-hidden className={`flex ${short ? 'h-[7vh]' : 'h-[18vh]'} ${to === 'paper' ? 'bg-paper' : 'bg-ink'}`}>
      {steps.map((_, i) => (
        <div
          key={i}
          data-step
          className={`-mt-px h-[calc(100%+1px)] flex-1 origin-top ${from === 'paper' ? 'bg-paper' : 'bg-ink'}`}
          style={reducedMotion ? { transform: 'scaleY(0)' } : undefined}
        />
      ))}
    </div>
  );
}
