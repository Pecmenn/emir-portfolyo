import { useEffect, useRef } from 'react';
import { gsap } from '../lib/scroll';

// İmleci yumuşakça takip eden nokta. Fare ilk hareket edene kadar görünmez: kendini fareli gösteren bazı telefonlarda
// (hover: hover bildiren Android cihazlar) sol üst köşede takılı kalmasın
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      el.style.opacity = '1';
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={ref} className="cursor-follower pointer-events-none fixed left-0 top-0 z-[80] opacity-0" aria-hidden>
      <div className="h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine-light" />
    </div>
  );
}
