import { Fragment, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import AutoVideo from './AutoVideo';
import { gsap, reducedMotion, refreshSoon } from '../lib/scroll';

// Satırlar maskenin altından sırayla yukarı kayar
export function Lines({
  lines,
  className = '',
  as: Tag = 'h2',
  style,
}: {
  lines: string[];
  className?: string;
  as?: 'h1' | 'h2' | 'p';
  style?: CSSProperties;
}) {
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
    <Tag ref={ref} className={className} style={style}>
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

// Görselin kenarları zemine yumuşakça karışır; koyu sayfalarda görsel çerçevesi ve saydam olmayan gölgeler seçilmez
export const EDGE_FADE: CSSProperties = {
  maskImage:
    'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 94%, transparent)',
  maskComposite: 'intersect',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 5%, #000 94%, transparent)',
  WebkitMaskComposite: 'source-in',
};

// Görsel alttan yukarı perde gibi açılır, içindeki fotoğraf hafifçe küçülerek yerine oturur
export function RevealImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  onLoad,
  video,
  natural = false,
  hoverZoom = false,
  fade = false,
  capHeight = true,
  density,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  onLoad?: () => void;
  // Varsa görselin üstünde sessiz döngü olarak oynar; görsel, video yüklenene kadar görünür
  video?: string;
  // Görsel kırpılmadan kendi oranında gösterilir (saydam zeminli görseller için zemin rengi de kaldırılır)
  natural?: boolean;
  // Fare üzerine gelince görsel hafifçe yakınlaşır ve fareyi takip ederek kayar
  hoverZoom?: boolean;
  // Kenarlar zemine yumuşakça karışır (EDGE_FADE)
  fade?: boolean;
  // Kendi oranındaki görsel ekran yüksekliğiyle sınırlanır; kapalıysa genişliği doldurur
  capHeight?: boolean;
  // Görselin piksel yoğunluğu (ör. 2: 2880px kaynak 1440px tasarım boyutunda). Verilirse görsel tasarım boyutundan
  // büyük gösterilmez; büyütülüp yumuşamaz
  density?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 88%' } });
      tl.fromTo(ref.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' });
      tl.fromTo('img, video', { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
    }, ref);
    return () => ctx.revert();
  }, []);

  // Yakınlaşma ayrı bir sarmalayıcıda yapılır; açılış animasyonunun görsel üzerindeki ölçeğiyle çakışmaz
  const onMove = (e: React.PointerEvent) => {
    if (!hoverZoom || reducedMotion || e.pointerType !== 'mouse') return;
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(zoomRef.current, { scale: 1.08, xPercent: -px * 6, yPercent: -py * 6, duration: 0.8, ease: 'power3.out' });
  };
  const onLeave = () => {
    if (!hoverZoom) return;
    gsap.to(zoomRef.current, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.9, ease: 'power3.out' });
  };

  // Kendi oranındaki görsel ekran yüksekliğini aşmaz, dar kalırsa ortalanır
  const fill = natural
    ? capHeight
      ? 'mx-auto block h-auto max-h-[92vh] w-auto max-w-full'
      : 'mx-auto block h-auto w-full'
    : 'absolute inset-0 h-full w-full object-cover';
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative overflow-hidden ${natural ? '' : 'bg-black/5'} ${className}`}
    >
      <div ref={zoomRef} className={natural ? '' : 'absolute inset-0'}>
        {src && (
          <img
            src={src}
            alt={alt}
            // Kendi oranındaki görsel yüklenene kadar yüksekliği sıfırdır; tembel yükleme onu hiç tetiklemeyebilir
            loading={natural ? 'eager' : 'lazy'}
            onLoad={(e) => {
              if (density) e.currentTarget.style.maxWidth = `min(100%, ${e.currentTarget.naturalWidth / density}px)`;
              refreshSoon();
              onLoad?.();
            }}
            style={fade ? EDGE_FADE : undefined}
            className={`${fill} ${imgClassName}`}
          />
        )}
        {video && <AutoVideo src={video} poster={src || undefined} className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`} />}
      </div>
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

// Kelimeler maskenin altından sırayla yukarı kayar. immediate: kaydırmayı beklemeden (ör. sayfa açılışında) oynar
export function Words({
  text,
  className = '',
  as: Tag = 'p',
  delay = 0,
  immediate = false,
}: {
  text: string;
  className?: string;
  as?: 'h2' | 'h3' | 'p';
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/).filter(Boolean);
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-word]', {
        yPercent: 110,
        duration: 1,
        ease: 'expo.out',
        stagger: Math.min(0.03, 0.9 / Math.max(words.length, 1)),
        delay,
        scrollTrigger: immediate ? undefined : { trigger: ref.current, start: 'top 88%' },
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="-mb-[0.12em] -mr-[0.08em] inline-block overflow-hidden pb-[0.12em] pr-[0.08em] align-top">
            <span data-word className="inline-block">
              {word}
            </span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}
