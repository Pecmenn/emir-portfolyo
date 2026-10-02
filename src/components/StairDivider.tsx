import { useLayoutEffect, useRef } from 'react';
import { gsap, reducedMotion } from '../lib/scroll';

// İki bölüm arasında basamak basamak yükselen bloklar; kaydırmaya bağlı ilerler.
// to: bir sonraki bölümün rengi. from: bu şeridin zemini.
export default function StairDivider({ from, to }: { from: 'paper' | 'ink'; to: 'paper' | 'ink' }) {
  const ref = useRef<HTMLDivElement>(null);
  const steps = [0.15, 0.55, 0.3, 0.8];

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      });
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el, i) => {
        tl.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: 1 }, steps[i] * 0.6);
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} aria-hidden className={`flex h-[30vh] items-end ${from === 'paper' ? 'bg-paper' : 'bg-ink'}`}>
      {steps.map((_, i) => (
        <div
          key={i}
          data-step
          className={`h-full flex-1 origin-bottom ${to === 'paper' ? 'bg-paper' : 'bg-ink'}`}
          style={reducedMotion ? undefined : { transform: 'scaleY(0)' }}
        />
      ))}
    </div>
  );
}
