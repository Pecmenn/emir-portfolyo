import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useLang } from '../../lib/i18n';
import { reducedMotion } from '../../lib/scroll';
import { useMobile } from '../Scenes';
import { useSceneProgress } from '../sceneProgress';
import Kroki from './Kroki';
import './kusur.css';
import { car, CAR_B, getScreens, SIG_A, SIG_B } from './screens.js';

// Kusur sayfasının canlı katmanları. Hepsi sahne ilerlemesini (p) dinler ve doğrudan DOM'a yazar; kaydırırken React çizimi olmaz.
// Ölçüler çalışma alanı birimindedir (--u), telefon ekranları 393 pikselde çizilip ölçeklenir (--un).

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const local = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(0.001, b - a));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const U = (n: number) => `calc(var(--u) * ${n})`;
const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

type Props = Record<string, unknown> | undefined;

export default function KusurLive({ name, w, props }: { name: string; w: number; props: Props }) {
  switch (name) {
    case 'crash':
      return <Crash />;
    case 'form':
      return <Form {...(props as FormProps)} />;
    case 'hazard':
      return <Hazard {...(props as HazardProps)} />;
    case 'clock':
      return <Clock {...(props as ClockProps)} />;
    case 'phone':
      return <Phone w={w} {...(props as PhoneProps)} />;
    case 'kroki':
      return <Kroki />;
    case 'sign':
      return <Sign />;
    case 'dent':
      return <Dent {...(props as DentProps)} />;
    case 'logo':
      return <Logo {...(props as LogoProps)} />;
    case 'icon':
      return <AppIcon w={w} />;
    default:
      return null;
  }
}

// Göçük: k harfinin gövdesine açılan kırık çizgi. d 0-1 arası derinlik; 0'da harfin kenarına değmez
export function dentClip(d: number) {
  const x = (n: number) => `${(n * d).toFixed(2)}%`;
  return `polygon(-6% -12%, 106% -12%, 106% 112%, -6% 112%, -6% 70%, ${x(4)} 70%, ${x(14.5)} 62%, ${x(9.5)} 55%, ${x(19)} 47%, ${x(11)} 39%, ${x(4)} 33%, -6% 33%)`;
}

function Logo({ size = 200, color = '#F3F4F8' }: LogoProps) {
  return (
    <div className="ks ks-logo" style={{ fontSize: U(size), color }}>
      <span style={{ clipPath: dentClip(1) }}>k</span>
      <span>usur</span>
    </div>
  );
}
type LogoProps = { size?: number; color?: string };

function AppIcon({ w }: { w: number }) {
  return (
    <div className="ks" style={{ width: U(w), height: U(w), borderRadius: U(w * 0.225), background: '#2318D6', display: 'grid', placeItems: 'center', boxShadow: `0 ${U(30)} ${U(60)} ${U(-24)} rgba(5,3,60,.6)` }}>
      <span className="ks-logo" style={{ fontSize: U(w * 0.86), color: '#F3F4F8', marginTop: U(w * -0.06) }}>
        <span style={{ clipPath: dentClip(1) }}>k</span>
      </span>
    </div>
  );
}

// ─── Açılış: araba logoya çarpar ─────────────────────────
function Crash() {
  const mobile = useMobile();
  const { lang } = useLang();
  const cfg = mobile ? { fs: 122, x: 34, y: 112, len: 170 } : { fs: 430, x: 360, y: 72, len: 340 };
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const carEl = useRef<HTMLDivElement>(null);
  const tik = useRef<HTMLSpanElement>(null);
  const push = [44, 34, 25, 15, 7].map((n) => (n * cfg.fs) / 430);
  const lean = [-1.6, 0.7, -0.6, 0.9, 0];

  useSceneProgress((p) => {
    const hit = reducedMotion ? 1 : local(p, 0.05, 0.3);
    const back = reducedMotion ? 1 : easeOut(local(p, 0.3, 0.44));
    const start = -(cfg.len + cfg.x + 360);
    const x = start * (1 - easeIn(hit)) - back * (cfg.fs * 0.075);
    if (carEl.current) carEl.current.style.transform = `translate3d(${U(x)},0,0)`;
    letters.current.forEach((el, i) => {
      if (!el) return;
      const k = reducedMotion ? 1 : easeOut(local(p, 0.295 + i * 0.012, 0.37 + i * 0.012));
      el.style.transform = `translate3d(${U(push[i] * k)},0,0) rotate(${lean[i] * k}deg)`;
      if (i === 0) el.style.clipPath = dentClip(reducedMotion ? 1 : easeOut(local(p, 0.295, 0.325)));
    });
    tik.current?.classList.toggle('is-in', p >= 0.3);
  });

  return (
    <div className="kl-fill ks">
      <div className="ks-logo" style={{ position: 'absolute', left: U(cfg.x), top: U(cfg.y), fontSize: U(cfg.fs), color: '#F3F4F8' }}>
        {'kusur'.split('').map((c, i) => (
          <span key={i} ref={(el) => (letters.current[i] = el)} style={{ transformOrigin: '50% 100%', willChange: 'transform' }}>
            {c}
          </span>
        ))}
      </div>
      {/* Arabanın burnu k'nin soluna değer */}
      <div
        ref={carEl}
        style={{
          position: 'absolute',
          left: U(cfg.x + cfg.fs * 0.052 - cfg.len),
          top: U(cfg.y + cfg.fs * 0.5 - (cfg.len * 62) / 240),
          width: U(cfg.len),
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 -1 120 62" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<g transform="translate(120 0) rotate(90)">${car({ ...CAR_B, letter: '' })}</g>` }} />
      </div>
      <span
        ref={tik}
        className="ks-hand kl-lit"
        style={{ position: 'absolute', left: U(cfg.x - cfg.fs * 0.11), top: U(cfg.y - cfg.fs * 0.1), fontSize: U(cfg.fs * 0.2), color: '#FFC7D4', ['--r' as string]: '-9deg' } as CSSProperties}
      >
        {lang === 'en' ? 'bump.' : 'tık.'}
      </span>
    </div>
  );
}

// ─── Kâğıt tutanak: titreyen elle doldurulur ─────────────
const FORM_TEXT = {
  title: { tr: 'Kaza Tespit Tutanağı', en: 'Accident Report Form' },
  f12: { tr: 'Tarih, saat ve yer', en: 'Date, time and place' },
  f3: { tr: 'Tanıklar', en: 'Witnesses' },
  f4: { tr: 'Sürücü, T.C. kimlik no, belge no', en: 'Driver, ID number, licence number' },
  f5: { tr: 'Araç, plaka, şasi no', en: 'Vehicle, plate, chassis number' },
  f6: { tr: 'Sigorta şirketi, poliçe no, TRAMER no', en: 'Insurer, policy number, TRAMER number' },
  f7: { tr: 'Kazanın oluş nedeni', en: 'Cause of the accident' },
  f9: { tr: 'İlk darbe', en: 'First impact' },
  f10: { tr: 'Kroki', en: 'Sketch' },
  f11: { tr: 'Sürücü görüşü', en: 'Driver’s view' },
  f12s: { tr: 'İmza', en: 'Signature' },
};

type FormProps = { scale?: number };
function Form({ scale = 1 }: FormProps) {
  const mobile = useMobile();
  const { lang } = useLang();
  const T = (o: { tr: string; en: string }) => (lang === 'en' ? o.en : o.tr);
  const L = (tr: string, en: string) => (lang === 'en' ? en : tr);
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useSceneProgress((p) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('[data-at]').forEach((n) => {
      const [a, b] = (n.dataset.at ?? '0,1').split(',').map(Number);
      const k = reducedMotion ? 1 : local(p, a, b);
      if (n.dataset.mode === 'strike') n.style.transform = `scaleX(${k})`;
      else if (n.dataset.mode === 'pop') n.classList.toggle('is-in', p >= a);
      else n.style.clipPath = `inset(-40% ${100 - k * 100}% -40% 0)`;
    });
    sheet.current?.classList.toggle('kl-tremble', p > 0.04 && p < 0.97);
  });

  const cell = (no: string, label: string, body: React.ReactNode, span = 1) => (
    <div style={{ gridColumn: `span ${span}`, padding: `${U(7)} ${U(10)} ${U(8)}`, borderTop: '1.5px solid #2318D6', borderLeft: '1.5px solid #2318D6', minHeight: U(58) }}>
      <p style={{ fontSize: U(14), lineHeight: 1.2, color: '#2318D6', fontWeight: 500 }}>
        <b style={{ fontWeight: 800, marginRight: U(5) }}>{no}</b>
        {label}
      </p>
      <div className="ks-hand" style={{ fontSize: U(29), lineHeight: 1.1, color: '#14107A', marginTop: U(3), position: 'relative' }}>
        {body}
      </div>
    </div>
  );
  const ink = (text: string, at: string, style?: CSSProperties) => (
    <span data-at={at} style={{ display: 'inline-block', clipPath: 'inset(-40% 100% -40% 0)', whiteSpace: 'nowrap', ...style }}>
      {text}
    </span>
  );
  const strike = (at: string, top = '56%') => <i data-at={at} data-mode="strike" style={{ position: 'absolute', left: '-2%', right: 0, top, height: U(3), background: '#D4124E', transformOrigin: '0 50%', transform: 'scaleX(0)', borderRadius: U(2) }} />;
  const note = (text: string, at: number, style: CSSProperties, r = '-4deg') => (
    <span data-at={`${at},1`} data-mode="pop" className="ks-hand kl-lit" style={{ position: 'absolute', zIndex: 5, color: '#D4124E', fontSize: U(29), lineHeight: 1.04, whiteSpace: 'nowrap', ['--r' as string]: r, ...style } as CSSProperties}>
      {text}
    </span>
  );

  return (
    <div ref={root} className="ks" style={{ position: 'absolute', left: 0, top: 0, width: U(600), height: U(830), transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <div ref={sheet} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: '#fff', transform: 'rotate(1.4deg)', boxShadow: `0 ${U(50)} ${U(80)} ${U(-40)} rgba(20,16,122,.45)`, padding: U(22) }}>
          <p style={{ fontSize: U(25), fontWeight: 800, letterSpacing: '-0.02em', color: '#2318D6', marginBottom: U(10) }}>{T(FORM_TEXT.title)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: `calc(100% - ${U(48)})`, borderRight: '1.5px solid #2318D6', borderBottom: '1.5px solid #2318D6' }}>
            {cell('1-2', T(FORM_TEXT.f12), ink(L('3.11.2026  18:12  Kozyatağı', '3.11.2026  18:12  Kozyatağı'), '.05,.13'), 2)}
            {cell('3', T(FORM_TEXT.f3), ink(L('yok galiba', 'none I think'), '.13,.17'), 2)}
            {cell(
              '4',
              `A ${T(FORM_TEXT.f4)}`,
              <>
                {ink('Burcu Aksoy', '.17,.22')}
                <br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {ink('1098…', '.22,.25')}
                  {strike('.26,.29')}
                </span>
              </>,
            )}
            {cell(
              '4',
              `B ${T(FORM_TEXT.f4)}`,
              <>
                {ink('Hakan Yıl…', '.25,.29', { color: '#D4124E' })}
              </>,
            )}
            {cell(
              '5',
              `A ${T(FORM_TEXT.f5)}`,
              <>
                {ink('34 KSR 206', '.3,.34')}
                <br />
                {ink(L('şasi ???', 'chassis ???'), '.35,.38', { color: '#D4124E' })}
              </>,
            )}
            {cell('5', `B ${T(FORM_TEXT.f5)}`, ink('34 HKN 58', '.38,.42', { color: '#D4124E' }))}
            {cell(
              '6',
              `A ${T(FORM_TEXT.f6)}`,
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {ink(L('poliçe arabada mı', 'policy in the car?'), '.43,.48')}
                {strike('.49,.52', '50%')}
              </span>,
            )}
            {cell('6', `B ${T(FORM_TEXT.f6)}`, ink('', '0,0'))}
            {cell(
              '7',
              T(FORM_TEXT.f7),
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: `${U(1)} ${U(10)}`, fontFamily: 'inherit', alignItems: 'center' }}>
                {[L('Kırmızı ışıkta geçme', 'Running a red light'), L('Arkadan çarpma', 'Rear-end collision'), L('Geçiş önceliği', 'Right of way'), L('Sollama', 'Overtaking')].flatMap((row, i) => [
                  <span key={`l${i}`} style={{ fontFamily: "'Atkinson Hyperlegible Next'", fontSize: U(15), lineHeight: 1.5, color: '#2318D6' }}>
                    {row}
                  </span>,
                  <i key={`a${i}`} style={{ width: U(15), height: U(15), boxShadow: 'inset 0 0 0 1.5px #2318D6' }} />,
                  <i key={`b${i}`} style={{ width: U(15), height: U(15), boxShadow: 'inset 0 0 0 1.5px #2318D6' }} />,
                ])}
              </div>,
            )}
            {cell(
              '9-10',
              `${T(FORM_TEXT.f9)}, ${T(FORM_TEXT.f10)}`,
              <svg viewBox="0 0 300 92" style={{ width: '100%', display: 'block', overflow: 'visible' }} aria-hidden="true">
                <path data-at=".55,.68" d="M4 28C60 26 110 30 296 25M4 70C90 72 200 66 296 70" fill="none" stroke="#14107A" strokeWidth="2.2" strokeLinecap="round" style={{ clipPath: 'inset(-40% 100% -40% 0)' }} />
                <path data-at=".62,.72" d="M46 36h46v22h-46zM60 34l12 26M112 38h44v24h-44zM88 40c10 6 14 12 26 8c-12 8-22 4-30 12c10-2 22-6 34 2" fill="none" stroke="#D4124E" strokeWidth="2.4" strokeLinecap="round" style={{ clipPath: 'inset(-40% 100% -40% 0)' }} />
              </svg>,
            )}
            {cell(
              '11',
              T(FORM_TEXT.f11),
              <span style={{ position: 'relative', display: 'inline-block' }}>
                {ink(L('ışıkta duruyordum, ani fre', 'I was stopped at the lig'), '.72,.82')}
                {strike('.83,.86')}
              </span>,
              2,
            )}
            {cell('12', T(FORM_TEXT.f12s), <span>&nbsp;</span>, 2)}
          </div>
        </div>
      </div>
      {note(L('şasi no nerede yazar??', 'where is the chassis no??'), 0.36, mobile ? { left: U(250), top: U(292), fontSize: U(36) } : { left: U(296), top: U(336) })}
      {note(L('TRAMER ne demek', 'what is TRAMER'), 0.47, mobile ? { right: U(16), top: U(408), fontSize: U(36) } : { right: U(-132), top: U(420) }, '5deg')}
      {note(L('kroki çizemem ki', 'I can’t draw this'), 0.66, mobile ? { left: U(20), top: U(640), fontSize: U(38) } : { right: U(-132), top: U(620) }, '-7deg')}
      {note(L('diiit!', 'beeep!'), 0.76, mobile ? { right: U(14), top: U(-14), fontSize: U(64) } : { right: U(-124), top: U(90), fontSize: U(62) }, '8deg')}
      {note(L('diiiiit!!', 'beeeeep!!'), 0.88, mobile ? { left: U(240), top: U(170), fontSize: U(58) } : { left: U(-200), top: U(64), fontSize: U(52) }, '-10deg')}
    </div>
  );
}

// ─── Dörtlü ışık: kaza modunda ekranı kaplayan tek hareket ───
type HazardProps = { start?: number; end?: number; out?: number };
function Hazard({ start = 0.1, end = 0.2, out = 2 }: HazardProps) {
  const el = useRef<HTMLDivElement>(null);
  useSceneProgress((p) => {
    if (el.current) el.current.style.opacity = String(smooth(local(p, start, end)) * (1 - smooth(local(p, out, out + 0.08))));
  });
  return (
    <div ref={el} className="kl-fill" style={{ opacity: 0 }}>
      <div className="kl-fill kl-blink" style={{ background: 'radial-gradient(70% 90% at 0% 100%, rgba(255,149,0,.95), rgba(255,149,0,0) 70%), radial-gradient(70% 90% at 100% 100%, rgba(255,149,0,.95), rgba(255,149,0,0) 70%), radial-gradient(60% 60% at 0% 0%, rgba(255,149,0,.55), rgba(255,149,0,0) 70%), radial-gradient(60% 60% at 100% 0%, rgba(255,149,0,.55), rgba(255,149,0,0) 70%)' }} />
    </div>
  );
}

// ─── Kazadan sonra geçen süre ────────────────────────────
type ClockProps = { from?: number; to?: number; size?: number; color?: string; label?: { tr: string; en: string }; start?: number; end?: number; show?: number };
function Clock({ from = 0, to = 60, size = 44, color = '#FF9500', label, start = 0, end = 1, show = -1 }: ClockProps) {
  const { lang } = useLang();
  const el = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useSceneProgress((p) => {
    if (el.current) el.current.textContent = clock(from + (to - from) * local(p, start, end));
    if (box.current) box.current.style.opacity = p >= show ? '1' : '0';
  });
  return (
    <div ref={box} className="ks" style={{ color, textAlign: 'right', transition: 'opacity .3s' }}>
      <span ref={el} style={{ fontSize: U(size), fontWeight: 800, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"', lineHeight: 1, display: 'block' }}>
        {clock(from)}
      </span>
      {label && <span style={{ fontSize: U(Math.max(13, size * 0.34)), fontWeight: 700, display: 'block', marginTop: U(3) }}>{lang === 'en' ? label.en : label.tr}</span>}
    </div>
  );
}

// ─── Canlı telefon ───────────────────────────────────────
// flow: sırayla gösterilen ekranlar; at: her geçişin ilerlemedeki yeri; time: [başlangıç sn, bitiş sn, p başı, p sonu];
// typing: [taraf 'a' | 'b', alan adı, p başı, p sonu] harf harf dolan alanlar (iki ekranda aynı anda)
type PhoneProps = { flow: string[]; at?: number[]; time?: number[]; typing?: [string, string, number, number][]; bezel?: string };
function Phone({ w, flow, at = [], time, typing, bezel = '#06052a' }: PhoneProps & { w: number }) {
  const { lang } = useLang();
  const screens = useMemo(() => getScreens(lang), [lang]);
  const strip = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    strip.current?.querySelectorAll<HTMLElement>('[data-a],[data-b]').forEach((n) => {
      if (n.dataset.full == null) n.dataset.full = n.textContent ?? '';
    });
  }, [lang, screens]);

  useSceneProgress((p) => {
    const el = strip.current;
    if (!el) return;
    const off = at.reduce((sum, a) => sum + (reducedMotion ? Number(p >= a) : smooth(local(p, a - 0.03, a + 0.03))), 0);
    el.style.transform = `scale(calc(var(--un) * ${w} / 393)) translate3d(${-off * 393}px,0,0)`;
    // Geçişten hemen önce düğme basılır
    el.querySelectorAll<HTMLElement>('.ks-screen').forEach((scr, i) => {
      const a = at[i];
      scr.querySelector('[data-press]')?.classList.toggle('is-down', a != null && p > a - 0.05 && p < a - 0.02);
      scr.querySelector('[data-tick]')?.classList.toggle('on', a != null && p > a - 0.11);
    });
    if (time) {
      const [s0, s1, a, b] = time;
      const txt = clock(s0 + (s1 - s0) * local(p, a, b));
      el.querySelectorAll('[data-clock]').forEach((n) => (n.textContent = txt));
    }
    typing?.forEach(([side, key, a, b]) => {
      el.querySelectorAll<HTMLElement>(`[data-${side}="${key}"]`).forEach((n) => {
        const full = n.dataset.full ?? '';
        const k = reducedMotion ? 1 : local(p, a, b);
        n.textContent = k <= 0 ? ' ' : full.slice(0, Math.ceil(full.length * k));
      });
    });
  });

  return (
    <div
      className="kl-phone"
      style={{
        borderRadius: U(w * 0.125),
        boxShadow: `0 0 0 ${U(w * 0.024)} ${bezel}, 0 ${U(50)} ${U(100)} ${U(-34)} rgba(5,3,60,.72)`,
      }}
    >
      <div ref={strip} className="kl-phone-in" style={{ transform: `scale(calc(var(--un) * ${w} / 393))` }}>
        {flow.map((n) => (
          <div key={`${lang}-${n}`} className={`ks ks-screen ${screens[n]?.cls ?? ''}`} dangerouslySetInnerHTML={{ __html: screens[n]?.html ?? '' }} />
        ))}
      </div>
    </div>
  );
}

// ─── İki imza: kaydırdıkça çizilir ───────────────────────
function Sign() {
  const a = useRef<SVGPathElement>(null);
  const b = useRef<SVGPathElement>(null);
  useEffect(() => {
    [a, b].forEach((r) => {
      if (!r.current) return;
      const n = r.current.getTotalLength();
      r.current.style.strokeDasharray = String(n);
      r.current.style.strokeDashoffset = reducedMotion ? '0' : String(n);
    });
  }, []);
  useSceneProgress((p) => {
    [
      [a, 0.08, 0.4],
      [b, 0.42, 0.72],
    ].forEach(([r, s, e]) => {
      const el = (r as React.RefObject<SVGPathElement>).current;
      if (el && !reducedMotion) el.style.strokeDashoffset = String(el.getTotalLength() * (1 - smooth(local(p, s as number, e as number))));
    });
  });
  return (
    <svg className="kl-fill" viewBox="0 0 440 120" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', overflow: 'visible' }} aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path ref={a} d={SIG_A} stroke="#F3F4F8" strokeWidth="4.4" transform="translate(4 8)" />
        <path ref={b} d={SIG_B} stroke="#FFC7D4" strokeWidth="4.4" transform="translate(226 6)" />
      </g>
    </svg>
  );
}

// ─── Marka: göçüğün açılışı ──────────────────────────────
type DentProps = { size?: number; color?: string; start?: number; end?: number };
function Dent({ size = 900, color = '#F3F4F8', start = 0.1, end = 0.36 }: DentProps) {
  const el = useRef<HTMLSpanElement>(null);
  useSceneProgress((p) => {
    if (el.current) el.current.style.clipPath = dentClip(reducedMotion ? 1 : easeOut(local(p, start, end)));
  });
  return (
    <div className="ks ks-logo" style={{ fontSize: U(size), color }}>
      <span ref={el} style={{ clipPath: dentClip(0) }}>
        k
      </span>
    </div>
  );
}
