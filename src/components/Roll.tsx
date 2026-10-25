import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, reducedMotion } from '../lib/scroll';

// Fare üzerine gelince harfler sırayla yukarı yuvarlanır, alttan aynı harfin kopyası gelir (Lusion'daki başlık hover'ı).
// Üst öğede `group` sınıfı varsa hover onu izler; ekran okuyucu yalnızca düz metni okur
export function Roll({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="roll-line">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="roll-ch" style={{ transitionDelay: `${Math.min(i * 16, 320)}ms` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </span>
    </span>
  );
}

// Düğme imlece doğru hafifçe çekilir, imleç ayrılınca yerine yaylanır. Dönüşüm dış sarmalayıcıya uygulanır;
// içteki düğmenin kendi Tailwind dönüşümleriyle çakışmaz
export function Magnetic({ children, strength = 0.3, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion || window.matchMedia('(hover: none)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
}
