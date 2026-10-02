import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../lib/scroll';

// İmleci takip eden nokta; data-cursor="Etiket" taşıyan öğelerin üzerinde etikete dönüşür
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const { pathname } = useLocation();

  // Sayfa değişince önceki sayfadaki etiket ekranda asılı kalmasın
  useEffect(() => setLabel(''), [pathname]);

  useEffect(() => {
    const el = ref.current!;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      xTo(e.clientX);
      yTo(e.clientY);
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
      setLabel(target?.dataset.cursor ?? '');
    };
    const leave = () => setLabel('');
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-follower pointer-events-none fixed left-0 top-0 z-[80]" aria-hidden>
      <div
        className={`-translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-accent font-medium text-ink transition-all duration-300 ${
          label ? 'rounded-full px-4 py-2 text-sm' : 'h-2.5 w-2.5 rounded-full text-[0px]'
        }`}
      >
        {label}
      </div>
    </div>
  );
}
