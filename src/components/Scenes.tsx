import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { Scene, SceneLayer, SceneMotion } from '../content';
import { useLang } from '../lib/i18n';
import { reducedMotion, refreshSoon } from '../lib/scroll';

// Sahne motoru: proje sayfasını ekranda sabit kalan sahnelere böler (bkz. Project.scenes).
// Sahne boyunca kaydırma 0-1 arası bir ilerlemeye çevrilir; her katman bu ilerlemeye göre from → to arasında
// hareket eder, metinler belirlenen anda yumuşakça girer. Geri kaydırınca aynı yol tersine oynar.
// Katmanlar 1600×900'lük çalışma alanına (telefonda 400×700) yerleşir; alan üst menünün altına sığacak şekilde ölçeklenir.
// Fotoğraf katmanında telefon ekranları perspektif matrisiyle fotoğrafın içine oturur ve kaydırdıkça kayarak değişir.
// Sahnelerin kendi zemini yok: renk sayfanın (body) zeminindedir ve kaydırdıkça bir sahneninkinden diğerininkine geçer,
// böylece sahne sınırlarında çizgi oluşmaz (bkz. usePageTone).

const BOARD = { desk: [1600, 900], mobile: [400, 700] };
const HEADER = 68;
const REST = [0, 0, 0, 1, 1];
// Ekran geçişinin ve kelime aydınlanmasının süresi (sahne ilerlemesi cinsinden)
const SWAP = 0.08;
const WORD = 0.06;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => 1 - (1 - t) ** 3;
const smooth = (t: number) => t * t * (3 - 2 * t);
const fill = (v: number[] | undefined, base: number[]) => base.map((b, i) => v?.[i] ?? b);
const mix = (a: number[], b: number[], k: number) => a.map((x, i) => x + (b[i] - x) * k);
const local = (p: number, start = 0, end = 1) => clamp01((p - start) / Math.max(0.001, end - start));
const U = (n: number) => `calc(var(--u) * ${n})`;

function sample(m: SceneMotion | undefined, p: number) {
  if (!m) return REST;
  const to = fill(m.to, REST);
  if (reducedMotion) return to;
  let v = mix(fill(m.from, to), to, ease(local(p, m.start, m.end)));
  if (m.out) v = mix(v, fill(m.out.to, v), ease(local(p, m.out.start, m.out.end)));
  return v;
}

function channels(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, a: number) {
  return `rgba(${channels(hex).join(',')},${a})`;
}

// Sayfanın zemin rengi: üst kenarı ekrana giren sahnenin rengine o sahne yerine oturana kadar geçer.
// İlk sahneden önce ve son sahneden sonra sitenin kendi zeminine döner.
function usePageTone(wrap: RefObject<HTMLDivElement>, scenes: Scene[]) {
  useEffect(() => {
    const list = wrap.current;
    if (!list) return;
    const { body } = document;
    const base = (getComputedStyle(body).backgroundColor.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const tones = scenes.map((s) => ({
      from: s.bg ? channels(s.bg) : base,
      shift: s.bgShift && { ...s.bgShift, to: channels(s.bgShift.color) },
    }));
    const toneAt = (i: number, p: number) => {
      const { from, shift } = tones[i];
      return shift ? mix(from, shift.to, ease(local(p, shift.start, shift.end))) : from;
    };
    let raf = 0;
    let last = '';
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const sh = window.innerHeight;
      let i = -1;
      for (let n = 0; n < list.children.length && list.children[n].getBoundingClientRect().top < sh; n++) i = n;
      let tone = base;
      if (i >= 0) {
        const r = list.children[i].getBoundingClientRect();
        tone = mix(i ? toneAt(i - 1, 1) : base, toneAt(i, -r.top / Math.max(1, r.height - sh)), smooth(clamp01(1 - r.top / sh)));
        if (i === list.children.length - 1) tone = mix(tone, base, smooth(clamp01(1 - r.bottom / sh)));
      }
      const css = `rgb(${tone.map(Math.round).join(',')})`;
      if (css !== last) body.style.backgroundColor = last = css;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      body.style.backgroundColor = '';
    };
  }, [wrap, scenes]);
}

type Geo = { sw: number; sh: number; u: number; bl: number; bt: number };

// Fotoğrafın kendi piksel ölçüsünden ekrandaki boyuta geçiş: tam sahnede "cover", kutuda kutu genişliği
function photoFit(L: SceneLayer, geo: Geo) {
  const W = L.width ?? 1;
  const H = L.height ?? 1;
  if (!L.full) return { k: ((L.box?.[2] ?? W) * geo.u) / W, left: 0, top: 0 };
  const k = Math.max(geo.sw / W, geo.sh / H);
  const [fx, fy] = L.focus ?? [0.5, 0.5];
  return { k, left: (geo.sw - W * k) * fx, top: (geo.sh - H * k) * fy };
}

export function useMobile() {
  // Yatay duran küçük telefonda dikey çalışma alanı çok küçülür; orada masaüstü düzeni kullanılır
  const query = '(max-width: 767px) and (orientation: portrait)';
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mobile;
}

// Marka yazısı yalnızca sahneli sayfada yüklenir
export function useSceneFont(font?: string) {
  useEffect(() => {
    if (!font) return;
    const href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [font]);
}

export default function Scenes({ scenes, font }: { scenes: Scene[]; font?: string }) {
  const mobile = useMobile();
  const wrap = useRef<HTMLDivElement>(null);
  usePageTone(wrap, scenes);
  useSceneFont(font);

  useEffect(() => {
    refreshSoon();
  }, [mobile]);

  return (
    <div ref={wrap}>
      {scenes.map((scene, i) => (
        <SceneView key={i} scene={scene} mobile={mobile} />
      ))}
    </div>
  );
}

function SceneView({ scene, mobile }: { scene: Scene; mobile: boolean }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [bw, bh] = mobile ? BOARD.mobile : BOARD.desk;

  // Telefon değerleri masaüstü değerlerinin üstüne yazılır
  const layers = scene.layers.map((L) => (mobile && L.m ? { ...L, ...L.m } : L)).filter((L) => !(mobile && L.m?.hide));

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      const ah = sh - HEADER;
      const u = Math.min(sw / bw, ah / bh);
      setGeo({
        sw,
        sh,
        u,
        bl: (sw - bw * u) / 2,
        bt: HEADER + (ah - bh * u) / 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bw, bh]);

  // Kaydırma döngüsü: sahne ekrana yakınken her karede ilerlemeyi hesaplar ve katmanlara uygular
  useEffect(() => {
    if (!geo) return;
    const items = layers.map((L, i) => {
      const el = refs.current[i];
      return {
        L,
        el,
        words: el ? Array.from(el.querySelectorAll<HTMLElement>('[data-word]')) : [],
        strips: el ? Array.from(el.querySelectorAll<HTMLElement>('[data-strip]')) : [],
        steps: el ? Array.from(el.querySelectorAll<HTMLElement>('[data-step]')) : [],
      };
    });
    let raf = 0;
    let last = NaN;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const r = root.current?.getBoundingClientRect();
      const sh = stage.current?.clientHeight ?? 0;
      if (!r || r.bottom < -sh * 0.5 || r.top > window.innerHeight * 1.5) return;
      // Sahne sabitlenmeden önce eksi, sabitlik bitince 1'in üstüne çıkar; girişler sahne ekrana girerken başlayabilsin
      const p = Math.max(-1, Math.min(2, -r.top / Math.max(1, r.height - sh)));
      if (p === last) return;
      last = p;
      for (const { L, el, words, strips, steps } of items) {
        if (!el) continue;
        if (L.motion) {
          const [x, y, rot, s, o] = sample(L.motion, p);
          el.style.transform = `translate3d(${x * geo.u}px, ${y * geo.u}px, 0) rotate(${rot}deg) scale(${s})`;
          el.style.opacity = String(o);
        }
        if (L.kind === 'text' || L.kind === 'svg' || L.kind === 'word') {
          const [a = -0.2, b = 9] = L.at ?? [];
          el.classList.toggle('is-in', p >= a && p < b);
        }
        if (words.length) {
          const [a = -0.2, b = 0.7] = L.at ?? [];
          words.forEach((w, i) => {
            const at = a + ((b - a) * i) / words.length;
            w.style.opacity = String(0.16 + 0.84 * smooth(clamp01((p - at) / WORD + 1)));
          });
        }
        for (const strip of strips) {
          const swaps = (strip.dataset.strip ?? '').split(',').filter(Boolean).map(Number);
          const off = swaps.reduce((sum, at) => sum + (reducedMotion ? Number(p >= at) : smooth(local(p, at - SWAP / 2, at + SWAP / 2))), 0);
          strip.style.transform = `translate3d(${-off * Number(strip.dataset.w)}px, 0, 0)`;
        }
        if (steps.length) {
          const at = L.at ?? [];
          steps.forEach((step, i) => {
            const on = p >= at[i] && (i === at.length - 1 || p < at[i + 1]);
            step.classList.toggle('is-on', on);
            const bar = step.querySelector<HTMLElement>('[data-bar]');
            if (bar) bar.style.transform = `scaleX(${local(p, at[i], at[i + 1] ?? at[i] + 0.2)})`;
          });
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // layers her çizimde yeniden kurulur; döngü yalnızca ölçü ya da düzen değişince yenilenir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, mobile, scene]);

  const length = (mobile && scene.mlength) || scene.length;
  return (
    <section ref={root} className="relative" style={{ height: `${length}vh` }}>
      <div ref={stage} className="scene-stage sticky top-0 h-[100svh]">
        {geo && (
          <div style={{ ['--u' as string]: `${geo.u}px` } as CSSProperties} className="absolute inset-0">
            {layers.map((L, i) => (
              <Layer key={i} L={L} geo={geo} index={i} setRef={(el) => (refs.current[i] = el)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Layer({ L, geo, index, setRef }: { L: SceneLayer; geo: Geo; index: number; setRef: (el: HTMLDivElement | null) => void }) {
  const [x = 0, y = 0, w = 0, h] = L.box ?? [];
  const full = L.full || L.kind === 'scrim';
  let height = h;
  if (L.kind === 'photo' && !full && L.width && L.height) height = (w * L.height) / L.width;
  if (L.kind === 'screen' && h == null) height = (w * 852) / 393;

  // Fotoğrafta hareket merkezi fotoğraf pikselinden ekran pikseline çevrilir (ör. telefonun ortasına yakınlaşma)
  let origin = L.origin ? `${L.origin[0]}% ${L.origin[1]}%` : '50% 50%';
  if (L.kind === 'photo' && L.origin) {
    const { k, left, top } = photoFit(L, geo);
    origin = `${left + L.origin[0] * k}px ${top + L.origin[1] * k}px`;
  }

  const style: CSSProperties = full
    ? { position: 'absolute', inset: 0 }
    : {
        position: 'absolute',
        left: geo.bl + x * geo.u,
        top: geo.bt + y * geo.u,
        width: U(w),
        height: height != null ? U(height) : undefined,
      };
  style.zIndex = L.z ?? index;
  style.transformOrigin = origin;
  if (L.motion) style.willChange = 'transform, opacity';
  if (L.motion && reducedMotion) style.opacity = fill(L.motion.to, REST)[4];
  if (L.radius && !full) {
    style.borderRadius = U(L.radius);
    style.overflow = 'hidden';
  }

  const layer = (
    <div ref={setRef} style={style} className={`${L.kind === 'text' ? 'scene-text' : ''} ${L.align === 'center' ? 'text-center' : ''}`}>
      <LayerBody L={L} geo={geo} w={w} />
    </div>
  );
  // Sahne dikeyde kırpmaz (bkz. .scene-stage). Tam ekran katman yakınlaşınca komşu sahneye taşmasın;
  // ışık da sahnenin üst ve alt kenarına gelmeden silinsin, kenarda çizgi bırakmasın
  if (!full && L.kind !== 'glow') return layer;
  return (
    <div className={`absolute inset-0 overflow-hidden ${L.kind === 'glow' ? 'scene-glow' : ''}`} style={{ zIndex: style.zIndex }}>
      {layer}
    </div>
  );
}

const glass = 'linear-gradient(115deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,.04) 30%,transparent 48%,rgba(255,255,255,.04) 100%)';

function LayerBody({ L, geo, w }: { L: SceneLayer; geo: Geo; w: number }) {
  const { t, lang } = useLang();
  const font: CSSProperties = L.font ? { fontFamily: `"${L.font}", system-ui, sans-serif` } : {};
  // Görsel yolundaki {lang}, sitenin diline göre değişir (arayüz ekranları iki dilde olan projeler için)
  const src = L.src?.replace('{lang}', lang);

  switch (L.kind) {
    case 'photo': {
      const { k, left, top } = photoFit(L, geo);
      return (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: L.width,
            height: L.height,
            transform: `translate(${left}px, ${top}px) scale(${k})`,
          }}
        >
          <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
          {L.screens?.map((s, i) => {
            const mask = `url(${s.mask}) 0 0 / 100% 100% no-repeat`;
            return (
              <div key={i} className="absolute inset-0" style={{ WebkitMask: mask, mask }}>
                <div className="absolute left-0 top-0 origin-top-left overflow-hidden" style={{ width: s.w, height: s.h, transform: s.matrix }}>
                  <div data-strip={(s.swap ?? []).join(',')} data-w={s.w} className="flex h-full will-change-transform">
                    {s.images.map((src) => (
                      <img key={src} src={src} alt="" draggable={false} className="block h-full shrink-0" style={{ width: s.w }} />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 mix-blend-screen" style={{ background: glass }} />
              </div>
            );
          })}
        </div>
      );
    }
    case 'screen':
      return (
        <img
          src={src}
          alt=""
          draggable={false}
          className="block h-full w-full"
          style={{
            borderRadius: U(w * 0.135),
            boxShadow: '0 50px 90px -40px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.1)',
          }}
        />
      );
    case 'text':
      return (
        <>
          {L.kicker && t(L.kicker) && (
            <p key={`k-${lang}`} className="soft-rise eyebrow" style={{ fontSize: U(15), color: L.accent }}>
              {t(L.kicker)}
            </p>
          )}
          {L.title && t(L.title) && (
            <h2
              className="display"
              style={{
                fontSize: U(L.size ?? 96),
                marginTop: L.kicker ? U(20) : 0,
                color: L.color,
              }}
            >
              {t(L.title)
                .split('\n')
                .map((line, i) => (
                  <span key={`${lang}-${i}`} className="line-mask soft-line">
                    <span>{line}</span>
                  </span>
                ))}
            </h2>
          )}
          {L.text && t(L.text) && (
            <p
              key={`t-${lang}`}
              className="soft-rise [transition-delay:.12s]"
              style={{
                fontSize: U(L.textSize ?? 21),
                marginTop: L.title ? U(26) : 0,
                lineHeight: 1.45,
                color: L.ink ?? 'rgba(241,233,222,.8)',
              }}
            >
              {t(L.text)}
            </p>
          )}
        </>
      );
    case 'para':
      return (
        <p
          key={lang}
          className="font-medium"
          style={{
            fontSize: U(L.size ?? 46),
            lineHeight: 1.22,
            letterSpacing: '-0.015em',
            color: L.color,
          }}
        >
          {t(L.text ?? { tr: '', en: '' })
            .split(/\s+/)
            .map((word, i) => (
              <span key={i} data-word style={{ opacity: 0.16 }}>
                {word}{' '}
              </span>
            ))}
        </p>
      );
    case 'scrim': {
      const c = L.color ?? '#0B1020';
      const dir = { left: '90deg', bottom: '0deg', top: '180deg' }[L.side ?? 'left'];
      return (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${dir}, ${rgba(c, 0.82)} 0%, ${rgba(c, 0.42)} 38%, ${rgba(c, 0)} 68%)`,
          }}
        />
      );
    }
    case 'glow':
      return (
        <div
          className="aspect-square w-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${L.color} 0%, transparent 68%)`,
          }}
        />
      );
    // Yazı ölçüsü kutu genişliğine bağlı; dar ekranda küçük örnekler de taşmaz
    case 'swatch':
      return (
        <div
          className="flex h-full w-full flex-col justify-end"
          style={{
            ...font,
            background: L.color,
            color: L.ink ?? '#fff',
            borderRadius: U(w * 0.14),
            padding: U(w * 0.12),
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)',
          }}
        >
          <p style={{ fontSize: U(w * 0.13), fontWeight: 600, letterSpacing: '-0.02em' }}>{L.label ? t(L.label) : L.name}</p>
          <p style={{ fontSize: U(w * 0.085), opacity: 0.72, marginTop: U(4) }}>{L.value}</p>
        </div>
      );
    case 'svg':
      return <div className="soft-rise h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: L.svg ?? '' }} />;
    case 'word':
      return (
        <p
          className="soft-rise whitespace-nowrap"
          style={{
            ...font,
            fontSize: U(L.size ?? 120),
            fontWeight: L.weight ?? 800,
            lineHeight: 0.95,
            letterSpacing: `${L.tracking ?? -0.045}em`,
            color: L.color,
          }}
        >
          {L.value}
        </p>
      );
    case 'type':
      return (
        <div
          className="flex h-full w-full items-center"
          style={{
            ...font,
            gap: U(40),
            padding: U(32),
            borderRadius: U(26),
            background: 'rgba(255,255,255,.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)',
            color: L.color ?? '#F3F5FF',
          }}
        >
          <p
            style={{
              fontSize: U(L.size ?? 112),
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: `${L.tracking ?? -0.04}em`,
            }}
          >
            Aa
          </p>
          <div>
            <p
              style={{
                fontSize: U(30),
                fontWeight: 700,
                letterSpacing: `${L.tracking ?? -0.03}em`,
              }}
            >
              {L.name}
            </p>
            {L.label && (
              <p style={{ fontSize: U(15), opacity: 0.65, marginTop: U(6), fontFamily: L.labelFont ? `"${L.labelFont}", system-ui, sans-serif` : undefined }}>
                {t(L.label)}
              </p>
            )}
            {L.value && (
              <p
                style={{
                  fontSize: U(26),
                  fontWeight: 600,
                  marginTop: U(14),
                  letterSpacing: `${L.tracking ?? -0.02}em`,
                  color: L.accent,
                }}
              >
                {L.value}
              </p>
            )}
          </div>
        </div>
      );
    case 'toast':
      return (
        <div
          className="flex items-start backdrop-blur-md"
          style={{
            ...font,
            gap: U(16),
            padding: U(18),
            borderRadius: U(24),
            background: L.color ?? 'rgba(243,245,255,.94)',
            color: L.ink ?? '#0B1020',
            boxShadow: '0 30px 60px -24px rgba(0,0,0,.55)',
          }}
        >
          <div
            className="shrink-0 [&>svg]:h-full [&>svg]:w-full"
            style={{ width: U(44), height: U(44) }}
            dangerouslySetInnerHTML={{ __html: L.svg ?? '' }}
          />
          <div className="min-w-0 flex-1">
            <p className="flex justify-between" style={{ fontSize: U(13), opacity: 0.6, letterSpacing: '0.01em' }}>
              <span>{L.name}</span>
              {L.label && <span>{t(L.label)}</span>}
            </p>
            {L.title && (
              <p
                style={{
                  fontSize: U(18),
                  fontWeight: 700,
                  marginTop: U(3),
                  letterSpacing: '-0.02em',
                }}
              >
                {t(L.title)}
              </p>
            )}
            {L.text && <p style={{ fontSize: U(15), marginTop: U(2), opacity: 0.75 }}>{t(L.text)}</p>}
          </div>
        </div>
      );
    case 'steps':
      return (
        <ol className="flex" style={{ gap: U(20) }}>
          {(L.labels ?? []).map((label, i) => (
            <li key={i} data-step className="group flex-1 text-cream/40 transition-colors duration-500 [&.is-on]:text-cream">
              <p className="flex items-baseline" style={{ gap: U(10), fontSize: U(16), fontWeight: 500 }}>
                <span className="tabular-nums" style={{ fontSize: U(13) }}>
                  0{i + 1}
                </span>
                {t(label)}
              </p>
              <span className="relative block overflow-hidden rounded-full bg-cream/15" style={{ height: 2, marginTop: U(12) }}>
                <span data-bar className="absolute inset-0 origin-left bg-cream" style={{ transform: 'scaleX(0)' }} />
              </span>
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}
