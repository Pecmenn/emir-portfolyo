import { useEffect, useRef, useState } from 'react';
import { expertise } from '../content';
import Marquee from '../components/Marquee';
import { useLang } from '../lib/i18n';
import { lenis } from '../lib/scroll';

// Koyu bölüm: kayan disiplin yazısı
export function Toolkit() {
  const { lang } = useLang();
  return (
    <section data-theme="dark" className="bg-ink pb-[6vh] pt-[1vh] text-paper">
      <Marquee items={expertise.marquee[lang]} />
    </section>
  );
}

// Açık bölüm: kaydırdıkça ekranın ortasına gelen hizmet koyulaşır
export function ServiceList() {
  const { t, lang } = useLang();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => {
      const items = listRef.current?.children;
      if (!items) return;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      Array.from(items).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    update();
    const unsubscribe = lenis.on('scroll', update);
    return unsubscribe;
  }, [lang]);

  return (
    <section className="gutter grid bg-paper py-20 sm:grid-cols-2 sm:pb-[14vh] sm:pt-[2vh]">
      <p className="mb-8 h-fit text-sm font-medium sm:sticky sm:top-1/2">{t(expertise.listLabel)}</p>
      <ul ref={listRef}>
        {expertise.list[lang].map((item, i) => {
          const dist = Math.abs(i - active);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.4 : 0.14;
          return (
            <li
              key={item}
              className="display text-[clamp(1.8rem,3.4vw,3.2rem)] leading-[1.1] transition-opacity duration-300"
              style={{ opacity }}
            >
              {item}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
