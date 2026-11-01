import { useEffect, type RefObject } from 'react';
import { reducedMotion } from './scroll';

// Yumuşak beliriş: kap içindeki `.soft-rise` öğeleri ve `data-reveal` kapları görünür alana girince `is-in` sınıfı alır;
// CSS geçişi (index.css) satırları kaydırır ve blokları yükseltir. Bir kez oynar.
export function useSoftReveal(ref: RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal], .soft-rise'));
    if (root.matches('[data-reveal]')) targets.push(root);
    if (reducedMotion) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
