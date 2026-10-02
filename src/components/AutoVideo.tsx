import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/scroll';

// Sessiz, döngüde oynayan video. Yalnızca ekranda görünürken ve active olduğunda oynar; böylece
// aynı sayfadaki birçok video telefonu yormaz. Tarayıcılar sesli videoyu kendiliğinden başlatmaz,
// bu yüzden ses yalnızca kullanıcı düğmeye bastıktan sonra (muted=false) açılır.
export default function AutoVideo({
  src,
  poster,
  className = '',
  active = true,
  muted = true,
}: {
  src: string;
  poster?: string;
  className?: string;
  active?: boolean;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      if (visible.current && active && !reducedMotion) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    sync();
    return () => observer.disconnect();
  }, [active, src]);

  // React "muted" özelliğini sonradan güncellemez; doğrudan videoya yazılır
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = muted;
    if (!muted && active) video.play().catch(() => {});
  }, [muted, active]);

  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" className={className} />;
}
