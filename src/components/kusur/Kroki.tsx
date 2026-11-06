import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useLang } from '../../lib/i18n';
import { reducedMotion } from '../../lib/scroll';
import { useMobile } from '../Scenes';
import { useSceneProgress } from '../sceneProgress';
import { car, CAR_A, CAR_B } from './screens.js';

// Sayfanın imza anı: ziyaretçi krokideki iki arabayı sürükler, tahmini kusur oranı canlı değişir.
// Dokunulmadığı sürece kaydırma üç örnek kazayı oynatır; arabaya dokunulduğu anda kontrol ziyaretçiye geçer.
// Kurallar örnektir: resmî kaynaklarda senaryo başına oran yok, bu yüzden sonuç her yerde "tahmini" yazar.

const W = 910;
const H = 550;
const LEN = 120;
const WID = 60;
const LANE = { opp: 220, one: 320, two: 420 };
const ROAD = { top: 170, mid: 270, dash: 370, bottom: 470 };
const SIDE = { l: 590, r: 730, x: 660 };

type Side = 'a' | 'b';
type Pos = { x: number; y: number };
type Zone = 'side' | 'opp' | 'one' | 'two';
type Rule = 'rear' | 'lane' | 'opp' | 'junction' | 'swipe';
type Verdict = { rule: Rule; a: number; b: number; at: Pos } | null;

const zoneOf = (p: Pos): Zone => {
  if (p.y < ROAD.top) return 'side';
  if (p.y < ROAD.mid) return 'opp';
  return p.y < ROAD.dash ? 'one' : 'two';
};
const headingOf = (z: Zone) => (z === 'side' ? 180 : z === 'opp' ? -90 : 90);
const half = (z: Zone): Pos => (z === 'side' ? { x: WID / 2, y: LEN / 2 } : { x: LEN / 2, y: WID / 2 });

function gap(a: Pos, b: Pos) {
  const ha = half(zoneOf(a));
  const hb = half(zoneOf(b));
  return { dx: Math.abs(a.x - b.x) - (ha.x + hb.x), dy: Math.abs(a.y - b.y) - (ha.y + hb.y) };
}

function judge(a: Pos, b: Pos, mover: Side): Verdict {
  const { dx, dy } = gap(a, b);
  if (dx > 9 || dy > 9) return null;
  const at = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const za = zoneOf(a);
  const zb = zoneOf(b);
  const fault = (who: Side, rule: Rule): Verdict => ({ rule, at, a: who === 'a' ? 100 : 0, b: who === 'b' ? 100 : 0 });
  if (za === zb) {
    // Aynı şerit: arkadaki kusurlu
    let rear: Side;
    if (za === 'side') rear = a.y < b.y ? 'a' : 'b';
    else if (za === 'opp') rear = a.x > b.x ? 'a' : 'b';
    else rear = a.x < b.x ? 'a' : 'b';
    return fault(rear, 'rear');
  }
  if (za === 'side') return fault('a', 'junction');
  if (zb === 'side') return fault('b', 'junction');
  if (za === 'opp' || zb === 'opp') return fault(mover, 'opp');
  // Komşu şeritler: yan yanaysa kimin değiştirdiği belli değil
  if (Math.abs(a.x - b.x) < 44) return { rule: 'swipe', at, a: 50, b: 50 };
  return fault(mover, 'lane');
}

const COPY: Record<Rule | 'none', { tr: string; en: string }> = {
  none: { tr: 'Henüz temas yok', en: 'No contact yet' },
  rear: { tr: 'Öndeki araca arkadan çarpma', en: 'Hitting the car in front' },
  lane: { tr: 'Şerit değiştirirken çarpma', en: 'Hitting a car while changing lanes' },
  opp: { tr: 'Karşı şeride geçme', en: 'Crossing into oncoming traffic' },
  junction: { tr: 'Kavşakta geçiş önceliğine uymama', en: 'Not giving way at a junction' },
  swipe: { tr: 'Yan yana sürtme. Şeridi kim değiştirdi belli değil.', en: 'A side-swipe. No telling who changed lanes.' },
};
const LIST: Rule[] = ['rear', 'lane', 'opp', 'junction'];

// Kaydırmayla oynayan örnekler: [başla, bit], hareket etmeyen ve hareket eden araba
const DEMO: { from: number; to: number; still: [Side, Pos]; move: [Side, Pos, Pos]; mover: Side }[] = [
  { from: 0.04, to: 0.26, still: ['a', { x: 580, y: LANE.one }], move: ['b', { x: 320, y: LANE.one }, { x: 580 - LEN, y: LANE.one }], mover: 'b' },
  { from: 0.38, to: 0.52, still: ['a', { x: 580, y: LANE.one }], move: ['b', { x: 570, y: 436 }, { x: 570, y: 386 }], mover: 'b' },
  { from: 0.68, to: 0.84, still: ['b', { x: SIDE.x, y: LANE.opp }], move: ['a', { x: SIDE.x, y: 62 }, { x: SIDE.x, y: LANE.opp - WID / 2 - LEN / 2 }], mover: 'a' },
];
const FADE = 0.035;

export default function Kroki() {
  const mobile = useMobile();
  const { lang } = useLang();
  const T = (o: { tr: string; en: string }) => (lang === 'en' ? o.en : o.tr);
  const L = (tr: string, en: string) => (lang === 'en' ? en : tr);

  const svg = useRef<SVGSVGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const carA = useRef<SVGGElement>(null);
  const carB = useRef<SVGGElement>(null);
  const tik = useRef<SVGTextElement>(null);
  const numA = useRef<HTMLSpanElement>(null);
  const numB = useRef<HTMLSpanElement>(null);
  const state = useRef({
    a: { x: 580, y: LANE.one } as Pos,
    b: { x: 320, y: LANE.one } as Pos,
    shownA: { x: 580, y: LANE.one, r: 90, o: 1 },
    shownB: { x: 320, y: LANE.one, r: 90, o: 1 },
    opacity: { a: 1, b: 1 },
    drag: null as Side | null,
    mover: 'b' as Side,
    user: false,
    p: 0,
    shown: { a: 0, b: 0 },
    target: { a: 0, b: 0 },
    lastKey: '',
  });
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [user, setUser] = useState(false);

  const evaluate = useCallback(() => {
    const s = state.current;
    const v = judge(s.a, s.b, s.mover);
    const key = v ? `${v.rule}-${v.a}` : '';
    if (key === s.lastKey) return;
    s.lastKey = key;
    s.target = v ? { a: v.a, b: v.b } : { a: 0, b: 0 };
    setVerdict(v);
    if (v) {
      if (tik.current) {
        tik.current.setAttribute('x', String(v.at.x));
        tik.current.setAttribute('y', String(v.at.y - 42));
        tik.current.style.opacity = '1';
        window.setTimeout(() => tik.current && (tik.current.style.opacity = '0'), 650);
      }
      if (!reducedMotion && svg.current) {
        svg.current.classList.remove('kl-shake');
        void svg.current.getBoundingClientRect();
        svg.current.classList.add('kl-shake');
      }
      if (s.user) navigator.vibrate?.(14);
    }
  }, []);

  // Kaydırmayla örnekler
  const playDemo = (p: number) => {
    const s = state.current;
    let cur = DEMO[0];
    for (const d of DEMO) if (p >= d.from - 0.08) cur = d;
    const k = reducedMotion ? 1 : Math.min(1, Math.max(0, (p - cur.from) / (cur.to - cur.from)));
    const eased = k * k * (3 - 2 * k);
    const [mv, m0, m1] = cur.move;
    const [st, sp] = cur.still;
    s[mv] = { x: m0.x + (m1.x - m0.x) * eased, y: m0.y + (m1.y - m0.y) * eased };
    s[st] = { ...sp };
    s.mover = cur.mover;
    // Örnekler arasında arabalar solar
    const idx = DEMO.indexOf(cur);
    const next = DEMO[idx + 1];
    const fadeIn = Math.min(1, Math.max(0, (p - (cur.from - 0.08)) / FADE));
    const fadeOut = next ? 1 - Math.min(1, Math.max(0, (p - (next.from - 0.08 - FADE)) / FADE)) : 1;
    const o = idx === 0 ? fadeOut : Math.min(fadeIn, fadeOut);
    s.opacity = { a: o, b: o };
    evaluate();
  };
  useSceneProgress((p) => {
    state.current.p = p;
    if (!state.current.user) playDemo(p);
  });

  // Çizim döngüsü: arabalar hedefe yumuşakça gider, sayılar yuvarlanır
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const s = state.current;
      const place = (el: SVGGElement | null, cur: { x: number; y: number; r: number; o: number }, to: Pos, op: number, fast: boolean) => {
        const k = reducedMotion ? 1 : fast ? 0.55 : 0.28;
        let dr = headingOf(zoneOf(to)) - cur.r;
        if (dr > 180) dr -= 360;
        if (dr < -180) dr += 360;
        // Yerine oturan araba için DOM'a yazılmaz; sahne ekranda değilken döngü boşa çalışmasın
        const still = Math.abs(to.x - cur.x) < 0.05 && Math.abs(to.y - cur.y) < 0.05 && Math.abs(dr) < 0.05 && Math.abs(op - cur.o) < 0.005;
        if (still && el?.hasAttribute('transform')) return;
        cur.x += (to.x - cur.x) * k;
        cur.y += (to.y - cur.y) * k;
        cur.r += dr * (reducedMotion ? 1 : 0.2);
        cur.o += (op - cur.o) * 0.3;
        if (el) {
          el.setAttribute('transform', `translate(${cur.x.toFixed(1)} ${cur.y.toFixed(1)})`);
          el.style.opacity = cur.o.toFixed(2);
          const body = el.firstElementChild;
          body?.setAttribute('transform', `rotate(${cur.r.toFixed(1)}) translate(-30 -60)`);
        }
      };
      place(carA.current, s.shownA, s.a, s.opacity.a, s.drag === 'a');
      place(carB.current, s.shownB, s.b, s.opacity.b, s.drag === 'b');
      s.shown.a += (s.target.a - s.shown.a) * 0.18;
      s.shown.b += (s.target.b - s.shown.b) * 0.18;
      const ta = `A %${Math.round(s.shown.a)}`;
      const tb = `B %${Math.round(s.shown.b)}`;
      if (numA.current && numA.current.textContent !== ta) numA.current.textContent = ta;
      if (numB.current && numB.current.textContent !== tb) numB.current.textContent = tb;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toSketch = (e: { clientX: number; clientY: number }): Pos => {
    const el = svg.current!;
    const m = el.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: pt.x, y: pt.y };
  };

  // Araba yolda kalır ve diğerinin içine giremez
  const constrain = (who: Side, raw: Pos): Pos => {
    const s = state.current;
    const out = { ...raw };
    out.x = Math.min(W - 40, Math.max(40, out.x));
    if (out.y < ROAD.top) {
      if (out.x > SIDE.l - 30 && out.x < SIDE.r + 30) {
        out.x = Math.min(SIDE.r - WID / 2 - 4, Math.max(SIDE.l + WID / 2 + 4, out.x));
        out.y = Math.max(62, out.y);
      } else out.y = ROAD.top + WID / 2 + 2;
    }
    out.y = Math.min(ROAD.bottom - WID / 2 - 2, out.y);
    const other = who === 'a' ? s.b : s.a;
    const { dx, dy } = gap(out, other);
    if (dx < 0 && dy < 0) {
      if (dx > dy) out.x += out.x < other.x ? dx : -dx;
      else out.y += out.y < other.y ? dy : -dy;
    }
    return out;
  };

  const take = (who: Side) => {
    const s = state.current;
    s.drag = who;
    s.mover = who;
    s.opacity = { a: 1, b: 1 };
    if (!s.user) {
      s.user = true;
      setUser(true);
    }
  };

  const onDown = (who: Side) => (e: ReactPointerEvent<SVGGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    take(who);
  };
  const onMove = (who: Side) => (e: ReactPointerEvent<SVGGElement>) => {
    const s = state.current;
    if (s.drag !== who) return;
    s[who] = constrain(who, toSketch(e));
    evaluate();
  };
  const settle = (who: Side) => {
    const s = state.current;
    const v = judge(s.a, s.b, s.mover);
    // Temas yoksa şeridin ortasına oturur; temas varsa olduğu yerde kalır
    if (!v) {
      const z = zoneOf(s[who]);
      if (z === 'side') s[who] = { ...s[who], x: SIDE.x };
      else s[who] = { ...s[who], y: LANE[z] };
      s[who] = constrain(who, s[who]);
    }
    evaluate();
  };
  const onUp = (who: Side) => () => {
    state.current.drag = null;
    settle(who);
  };
  const onKey = (who: Side) => (e: KeyboardEvent<SVGGElement>) => {
    const step = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
    if (!step) return;
    e.preventDefault();
    take(who);
    state.current.drag = null;
    const s = state.current;
    s[who] = constrain(who, { x: s[who].x + step[0], y: s[who].y + step[1] });
    evaluate();
  };

  const back = () => {
    const s = state.current;
    s.user = false;
    s.drag = null;
    setUser(false);
    // Kaydırma konumundaki örneğe geri döner
    playDemo(s.p);
  };

  const faultSide: Side | null = verdict && verdict.a !== verdict.b ? (verdict.a > verdict.b ? 'a' : 'b') : null;
  const viewBox = mobile ? '250 30 580 487' : `0 0 ${W} ${H}`;

  // Masaüstü ve telefon yerleşimi
  const box = mobile
    ? { sk: { left: 0, top: 112, width: 400, height: 336 }, res: { left: 20, top: 462, width: 360 } }
    : { sk: { left: 660, top: 16, width: 880, height: 532 }, res: { left: 660, top: 572, width: 880 } };
  const px = (o: Record<string, number>): CSSProperties => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `calc(var(--u) * ${v})`])) as CSSProperties;

  const aColor = '#2318D6';
  const bColor = '#D4124E';

  return (
    <div ref={wrap} className="ks kl-fill" style={{ color: '#14107A' }}>
      <div style={{ position: 'absolute', ...px(box.sk) }}>
        <svg ref={svg} viewBox={viewBox} className="ks-sketch" style={{ height: '100%', backgroundSize: `${mobile ? 30 : 22}px ${mobile ? 30 : 22}px`, boxShadow: '0 0 0 2px #2318D6', overflow: 'hidden', touchAction: 'pan-y' }} role="group" aria-label={L('Kaza krokisi', 'Accident sketch')}>
          <g fill="none" stroke="#2318D6" strokeLinecap="round">
            <path d={`M-10 ${ROAD.top + 1}C160 ${ROAD.top - 2} 380 ${ROAD.top + 3} ${SIDE.l} ${ROAD.top}M${SIDE.r} ${ROAD.top}C790 ${ROAD.top - 2} 860 ${ROAD.top + 2} ${W + 10} ${ROAD.top}`} strokeWidth="3" />
            <path d={`M-10 ${ROAD.bottom}C240 ${ROAD.bottom + 3} 620 ${ROAD.bottom - 3} ${W + 10} ${ROAD.bottom + 1}`} strokeWidth="3" />
            <path d={`M${SIDE.l} ${ROAD.top}C${SIDE.l + 2} 130 ${SIDE.l - 2} 70 ${SIDE.l} -10M${SIDE.r} ${ROAD.top}C${SIDE.r - 2} 130 ${SIDE.r + 2} 70 ${SIDE.r} -10`} strokeWidth="3" />
            <path d={`M-10 ${ROAD.mid - 3}H${SIDE.l}M${SIDE.r} ${ROAD.mid - 3}H${W + 10}M-10 ${ROAD.mid + 3}H${SIDE.l}M${SIDE.r} ${ROAD.mid + 3}H${W + 10}`} strokeWidth="2" />
            <path d={`M-10 ${ROAD.dash}H${W + 10}`} strokeWidth="2.200" strokeDasharray="22 18" />
          </g>
          {/* Yön okları ve yol ver levhası */}
          <g fill="none" stroke="#2318D6" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" opacity=".5">
            <path d="M800 220h-46m12 -10l-12 10l12 10" />
            <path d="M770 320h46m-12 -10l12 10l-12 10" />
            <path d="M770 420h46m-12 -10l12 10l-12 10" />
          </g>
          <path d={`M${SIDE.l - 54} 122h34l-17 30z`} fill="#FFC7D4" stroke="#D4124E" strokeWidth="3" strokeLinejoin="round" />
          <text x={SIDE.l - 150} y="144" fontFamily="Mansalva" fontSize="26" fill="#D4124E">
            {L('yol ver', 'give way')}
          </text>
          <text x="300" y="506" fontFamily="Mansalva" fontSize="26" fill="#2318D6">
            {L('Değirmenyolu Cd.', 'Değirmenyolu St.')}
          </text>

          {(['a', 'b'] as Side[]).map((who) => {
            const opts = who === 'a' ? CAR_A : CAR_B;
            return (
              <g
                key={who}
                ref={who === 'a' ? carA : carB}
                className="kl-kroki-car"
                tabIndex={0}
                role="button"
                aria-label={who === 'a' ? L('A aracı, ok tuşlarıyla taşı', 'Car A, move with arrow keys') : L('B aracı, ok tuşlarıyla taşı', 'Car B, move with arrow keys')}
                onPointerDown={onDown(who)}
                onPointerMove={onMove(who)}
                onPointerUp={onUp(who)}
                onPointerCancel={onUp(who)}
                onKeyDown={onKey(who)}
              >
                <g dangerouslySetInnerHTML={{ __html: car({ ...opts, letter: '' }) }} />
                <rect className="kl-kroki-ring" x="-74" y="-74" width="148" height="148" rx="26" fill="none" stroke="#FF9500" strokeWidth="4" />
                {/* Parmakla tutmayı kolaylaştıran görünmez alan */}
                <circle r={mobile ? 78 : 66} fill="transparent" />
                <text y="9" textAnchor="middle" fontFamily="'Atkinson Hyperlegible Next',sans-serif" fontWeight="800" fontSize="24" fill={who === 'a' ? '#F3F4F8' : '#D4124E'} style={{ pointerEvents: 'none' }}>
                  {who.toUpperCase()}
                </text>
              </g>
            );
          })}
          <text ref={tik} textAnchor="middle" fontFamily="Mansalva" fontSize="44" fill="#D4124E" style={{ opacity: 0, transition: 'opacity .25s', pointerEvents: 'none' }}>
            {L('tık!', 'bump!')}
          </text>
        </svg>
      </div>

      {/* Sonuç şeridi */}
      <div aria-live="polite" style={{ position: 'absolute', ...px(box.res) }}>
        <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: `calc(var(--u) * ${mobile ? 44 : 64})`, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>
          <span ref={numA} style={{ color: aColor }}>
            A %0
          </span>
          <span ref={numB} style={{ color: bColor }}>
            B %0
          </span>
        </p>
        <div style={{ display: 'flex', overflow: 'hidden', height: `calc(var(--u) * ${mobile ? 16 : 24})`, marginTop: `calc(var(--u) * ${mobile ? 8 : 10})`, borderRadius: `calc(var(--u) * 14)`, background: 'rgba(35,24,214,.14)' }}>
          <i className="kl-seg" style={{ width: `${verdict?.a ?? 0}%`, background: aColor }} />
          <i className="kl-seg" style={{ width: `${verdict?.b ?? 0}%`, background: bColor }} />
        </div>
        <p style={{ marginTop: `calc(var(--u) * ${mobile ? 10 : 14})`, fontSize: `calc(var(--u) * ${mobile ? 21 : 32})`, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.015em', minHeight: `calc(var(--u) * ${mobile ? 48 : 40})` }}>{T(COPY[verdict?.rule ?? 'none'])}</p>
        <p style={{ marginTop: `calc(var(--u) * 6)`, fontSize: `calc(var(--u) * ${mobile ? 14 : 17})`, color: 'rgba(20,16,122,.72)' }}>
          {L('Örnek kurallarla tahmin. Kesin oranı sigorta şirketleri belirler.', 'An estimate from sample rules. The insurers set the final split.')}
          {user && (
            <>
              {' '}
              <button type="button" className="kl-reset" onClick={back}>
                {L('Örneklere dön', 'Back to the examples')}
              </button>
            </>
          )}
        </p>
      </div>

      {/* Tutanağın 7. alanı: kutular kendiliğinden işaretlenir (telefonda yer açmak için gizli) */}
      {!mobile && (
        <div style={{ position: 'absolute', left: U(70), top: U(452), width: U(510) }}>
          <p style={{ fontSize: U(20), fontWeight: 700, color: aColor }}>
            <b style={{ fontWeight: 800, marginRight: U(8) }}>7</b>
            {L('Kazanın oluş nedeni', 'Cause of the accident')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', columnGap: U(14), marginTop: U(12), alignItems: 'center' }}>
            <span />
            <b style={{ fontSize: U(18), fontWeight: 800, color: aColor, textAlign: 'center' }}>A</b>
            <b style={{ fontSize: U(18), fontWeight: 800, color: bColor, textAlign: 'center' }}>B</b>
            {LIST.flatMap((rule) => {
              const on = verdict?.rule === rule;
              return [
                <span key={`${rule}-l`} style={{ fontSize: U(21), lineHeight: 1.15, padding: `${U(11)} 0`, borderTop: '1.5px solid rgba(35,24,214,.2)', fontWeight: on ? 800 : 500, transition: 'font-weight .1s' }}>
                  {T(COPY[rule])}
                </span>,
                ...(['a', 'b'] as Side[]).map((who) => (
                  <span key={`${rule}-${who}`} style={{ display: 'grid', placeItems: 'center', alignSelf: 'stretch', borderTop: '1.5px solid rgba(35,24,214,.2)' }}>
                    <svg viewBox="0 0 32 32" className={`kl-tick ${on && faultSide === who ? 'is-on' : ''}`} style={{ width: U(32), height: U(32), overflow: 'visible' }} aria-hidden="true">
                      <rect x="3" y="3" width="26" height="26" fill="none" stroke={who === 'a' ? aColor : bColor} strokeWidth="2" />
                      <path d="M6 16l7 8L28 -2" fill="none" stroke={who === 'a' ? aColor : bColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )),
              ];
            })}
          </div>
        </div>
      )}

      {/* İlk dokunuşa kadar ipucu */}
      {!user && (
        <p className="ks-hand" style={{ position: 'absolute', left: U(mobile ? 22 : 700), top: U(mobile ? 128 : 40), fontSize: U(mobile ? 25 : 40), color: '#D4124E', transform: 'rotate(-4deg)', pointerEvents: 'none' }}>
          {L('arabaları sürükle!', 'drag the cars!')}
        </p>
      )}
    </div>
  );
}

const U = (n: number) => `calc(var(--u) * ${n})`;
