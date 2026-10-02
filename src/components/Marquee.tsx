import { useEffect, useRef } from 'react';
import { gsap, lenis, reducedMotion } from '../lib/scroll';

function Star({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 0c1.2 10.6 8.4 18.2 20 20-11.6 1.8-18.8 9.4-20 20C18.8 29.4 11.6 21.8 0 20 11.6 18.2 18.8 10.6 20 0z" fill="currentColor" />
    </svg>
  );
}

// Sonsuz kayan büyük yazı; kaydırma yönü değişince akış yönü de değişir
export default function Marquee({ items }: { items: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const track = trackRef.current!;
    const tween = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    const unsubscribe = lenis.on('scroll', ({ direction, velocity }: { direction: number; velocity: number }) => {
      const speed = 1 + Math.min(Math.abs(velocity) / 8, 3);
      gsap.to(tween, { timeScale: direction < 0 ? -speed : speed, duration: 0.3, overwrite: true });
    });
    return () => {
      unsubscribe();
      tween.kill();
    };
  }, [items]);

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <Star className="mx-[3vw] h-[5vw] w-[5vw] min-h-8 min-w-8 text-accent" />
          <span className="display whitespace-nowrap text-[clamp(3rem,min(8vw,9vh),8rem)]">{item}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden py-4" aria-label={items.join(', ')}>
      <div ref={trackRef} className="flex w-max" aria-hidden>
        {row}
        {row}
      </div>
    </div>
  );
}

export { Star };
