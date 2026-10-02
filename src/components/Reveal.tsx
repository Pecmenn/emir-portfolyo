import { useLayoutEffect, useRef, type ReactNode } from 'react';
import AutoVideo from './AutoVideo';
import { gsap, reducedMotion, refreshSoon } from '../lib/scroll';

// Satırlar maskenin altından sırayla yukarı kayar
export function Lines({ lines, className = '', as: Tag = 'h2' }: { lines: string[]; className?: string; as?: 'h1' | 'h2' | 'p' }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-line]', {
        yPercent: 110,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: 'top 85%' },
      });
    }, ref);
    return () => ctx.revert();
    // Dizi her çizimde yeniden oluşabilir; animasyon yalnızca metin gerçekten değişince yeniden kurulur,
    // yoksa üst bileşen her güncellendiğinde (ör. kaydırma) animasyon baştan başlar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.join('\n')]);

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} className="line-mask">
          <span data-line className="block">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

// Görsel alttan yukarı perde gibi açılır, içindeki fotoğraf hafifçe küçülerek yerine oturur
export function RevealImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  onLoad,
  video,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  onLoad?: () => void;
  // Varsa görselin üstünde sessiz döngü olarak oynar; görsel, video yüklenene kadar görünür
  video?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 88%' } });
      tl.fromTo(ref.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' });
      tl.fromTo('img, video', { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-black/5 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => {
          refreshSoon();
          onLoad?.();
        }}
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
      />
      {video && <AutoVideo src={video} poster={src} className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`} />}
    </div>
  );
}

// Öğeler görünür alana girince aşağıdan yukarı belirir
export function FadeUp({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%' },
      });
    });
    return () => ctx.revert();
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
