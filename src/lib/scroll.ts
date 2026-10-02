import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tek bir yumuşak kaydırma örneği; GSAP'in zamanlayıcısıyla senkron çalışır
export const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.1, wheelMultiplier: 1 });

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

let refreshTimer: number | undefined;
// Görseller yüklendikçe tetikleyici konumlarını tek seferde yeniden hesapla
export function refreshSoon() {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
}

export function scrollToTarget(target: string | number, immediate = false) {
  lenis.scrollTo(target, { immediate, offset: 0, duration: 1.4 });
}

export { gsap, ScrollTrigger };
