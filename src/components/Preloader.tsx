import { useLayoutEffect, useRef, useState } from 'react';
import { ui } from '../content';
import { useLang } from '../lib/i18n';
import { gsap, lenis, reducedMotion } from '../lib/scroll';

// Açılışta 0'dan 100'e sayan sayaç; bitince panel yukarı kayarak sayfayı açar
export default function Preloader({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    lenis.stop();
    const counter = { value: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          lenis.start();
          setGone(true);
        },
      });
      tl.from('[data-col]', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0);
      tl.to(
        counter,
        {
          value: 100,
          duration: reducedMotion ? 0.2 : 1.8,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (countRef.current) countRef.current.textContent = String(Math.round(counter.value));
          },
        },
        0,
      );
      tl.add(onDone, '-=0.1');
      tl.to(rootRef.current, { yPercent: -100, duration: reducedMotion ? 0.2 : 0.9, ease: 'expo.inOut' });
    }, rootRef);
    return () => ctx.revert();
    // onDone yalnızca ilk açılışta çağrılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] bg-accent text-ink" aria-hidden>
      <div className="gutter absolute inset-0 flex">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} data-col className="h-full flex-1 border-l border-ink/10 first:border-l-0" />
        ))}
      </div>
      <p className="gutter absolute bottom-6 left-0 text-xs font-medium uppercase tracking-[0.2em]">{t(ui.loading)}…</p>
      <span ref={countRef} className="display gutter absolute bottom-2 right-0 text-[22vw] leading-none sm:text-[12vw]">
        0
      </span>
    </div>
  );
}
