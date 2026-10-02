import { useEffect, useRef } from 'react';
import { gsap } from '../lib/scroll';

// İmleci yumuşakça takip eden mor nokta (dokunmatik ekranlarda gizlenir)
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={ref} className="cursor-follower pointer-events-none fixed left-0 top-0 z-[80]" aria-hidden>
      <div className="h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}
