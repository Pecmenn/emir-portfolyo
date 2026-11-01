import { useEffect, useRef, type ReactNode } from 'react';
import { cvUrl, play, projects, site, ui, type Text } from '../content';
import WorkCard from '../components/WorkCard';
import Contact from '../sections/Contact';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { useSoftReveal } from '../lib/reveal';
import { refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Ana sayfa (Design. Build. Automate.): açılış, disiplin şeridi, üç alan, seçili işler, uçtan uca vaka (şarap bandı),
// hakkımda, nasıl çalışırım ve iletişim. Metinler src/content/play.json'da, panelde "Ana sayfa" altında.
// Hareketler yumuşaktır: satırlar maskenin altından kayar, bloklar hafifçe yükselir (bkz. src/lib/reveal.ts).

// Çok satırlı başlık: satırlar "\n" ile ayrılır, her biri ayrı kayar
function SoftLines({ text, className = '', as: Tag = 'h2', accent = -1 }: { text: string; className?: string; as?: 'h1' | 'h2'; accent?: number }) {
  const lines = text.split('\n');
  return (
    <Tag className={`display ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} aria-hidden className="line-mask soft-line">
          <span className={i === accent ? 'text-wine-light' : ''}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

// Bölüm başı: solda büyük başlık, sağda kısa açıklama
function Head({ title, text }: { title: Text; text: Text }) {
  const { t, lang } = useLang();
  return (
    <div data-reveal className="mb-10 grid gap-4 lg:mb-16 lg:grid-cols-2 lg:items-end">
      <SoftLines key={lang} text={t(title)} className="text-[clamp(3rem,7vw,6.5rem)]" />
      <p className="soft-rise max-w-[46ch] text-stone lg:justify-self-end">{t(text)}</p>
    </div>
  );
}

function Hero({ ready }: { ready: boolean }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  // Açılış ekranı kalkınca satırlar kayar
  useEffect(() => {
    if (ready) ref.current?.classList.add('is-in');
  }, [ready, lang]);
  return (
    <div ref={ref} className="gutter grid gap-10 pb-[clamp(40px,6vw,80px)] pt-[calc(68px+clamp(40px,8vw,110px))]">
      <h1 lang="en" className="display text-[clamp(4.2rem,15.5vw,15.5rem)]" aria-label={play.hero.lines.join(' ')}>
        {play.hero.lines.map((line, i) => (
          <span key={line} aria-hidden className="line-mask soft-line">
            <span className={i === play.hero.accent ? 'text-wine-light' : ''}>{line}</span>
          </span>
        ))}
      </h1>
      <div className="soft-rise grid gap-7 border-t border-seam pt-7 [transition-delay:.25s] lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-5">
          <p key={lang} className="max-w-[34ch] text-[clamp(1.15rem,1.6vw,1.5rem)] leading-[1.35]">
            {t(play.hero.intro)}
          </p>
          <span className="inline-flex items-center gap-2.5 text-sm text-stone">
            <i aria-hidden className="h-2 w-2 rounded-full bg-[#5ec27a] [animation:status-pulse_2.4s_infinite]" />
            {t(play.hero.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => scrollToTarget('#isler')} className="btn btn-wine">
            {t(play.ctaWork)} <span aria-hidden className="arrow">↓</span>
          </button>
          <button type="button" onClick={() => scrollToTarget('#iletisim')} className="btn">
            {t(play.ctaContact)}
          </button>
        </div>
      </div>
    </div>
  );
}

// Disiplinler yavaşça akan bir şeritte; hareket azaltıldıysa durur
function Ticker() {
  const { t } = useLang();
  const items = [...play.ticker, ...play.ticker];
  return (
    <div aria-hidden className="overflow-hidden border-y border-seam py-[18px]">
      <div className="flex w-max gap-12 [animation:ticker_40s_linear_infinite] motion-reduce:[animation:none]">
        {items.map((item, i) => (
          <span key={i} className="display whitespace-nowrap text-[clamp(1.4rem,2.4vw,2.2rem)] text-stone">
            {t(item)}
            <span className="pl-12 text-wine-light">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Otomasyonu anlatan küçük akış şeması (gerçek görsel yerine)
function FlowArt() {
  return (
    <div className="grid h-full w-full place-items-center bg-coal-3">
      <svg viewBox="0 0 200 130" fill="none" aria-hidden className="w-[86%]">
        <rect x="8" y="14" width="56" height="28" rx="6" fill="#2C2525" />
        <text x="36" y="32" fill="#F1E9DE" fontSize="10" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif">
          Excel
        </text>
        <rect x="72" y="51" width="56" height="28" rx="6" fill="#6B0F17" />
        <text x="100" y="69" fill="#F1E9DE" fontSize="10" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif">
          AI
        </text>
        <rect x="136" y="88" width="56" height="28" rx="6" fill="#2C2525" />
        <text x="164" y="106" fill="#F1E9DE" fontSize="10" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif">
          Mailing
        </text>
        <path d="M64 28 C84 28 84 65 72 65" stroke="#A99F95" strokeWidth="1.4" />
        <path d="M128 65 C150 65 140 102 136 102" stroke="#A99F95" strokeWidth="1.4" />
        <circle cx="64" cy="28" r="3" fill="#D26A72" />
        <circle cx="128" cy="65" r="3" fill="#D26A72" />
      </svg>
    </div>
  );
}

// Üç alan: satırın üstüne gelince şarap rengi soldan dolar
function Areas() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  return (
    <section ref={ref} id="alanlar" className="gutter py-[clamp(80px,11vw,160px)]">
      <Head title={play.areas.title} text={play.areas.text} />
      <div className="border-t border-seam">
        {play.areas.items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={() => scrollToTarget('#isler')}
            className="soft-rise group relative isolate grid w-full gap-5 overflow-hidden border-b border-seam py-[clamp(24px,3vw,40px)] text-left lg:grid-cols-[70px_1.1fr_1fr_auto] lg:items-center lg:px-4"
          >
            <span aria-hidden className="absolute inset-0 -z-10 origin-left scale-x-0 bg-wine transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
            <span className="text-sm tabular-nums text-stone transition-colors duration-500 group-hover:text-cream">0{i + 1}</span>
            <span lang="en" className="display text-[clamp(3rem,7.5vw,7rem)]">
              {item.title}
            </span>
            <span>
              <span className="block max-w-[40ch] text-stone transition-colors duration-500 group-hover:text-cream">{t(item.text)}</span>
              <span className="mt-3.5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag.en} className="tag">
                    {t(tag)}
                  </span>
                ))}
              </span>
            </span>
            <span className="flex gap-2.5">
              {item.images.map((src, j) => (
                <span key={j} className="aspect-[4/3] w-[calc(50%-5px)] shrink-0 overflow-hidden rounded-xl bg-coal-2 lg:w-[clamp(120px,14vw,210px)]">
                  {src === 'flow' ? (
                    <FlowArt />
                  ) : (
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                    />
                  )}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// Seçili işler: iki sütunda dönüşümlü genişlikte büyük kartlar
function Work() {
  const { t } = useLang();
  const { goTo } = useTransition();
  const ref = useRef<HTMLElement>(null);
  const list = play.work.featured.map((slug) => projects.find((p) => p.slug === slug)).filter((p): p is (typeof projects)[number] => !!p);
  useSoftReveal(ref, [list.length]);
  const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7', 'lg:col-span-6', 'lg:col-span-6'];
  return (
    <section ref={ref} id="isler" className="gutter pb-[clamp(80px,11vw,160px)]">
      <Head title={play.work.title} text={play.work.text} />
      <div className="grid gap-x-[clamp(14px,1.6vw,24px)] gap-y-[clamp(28px,3vw,44px)] lg:grid-cols-12">
        {list.map((p, i) => (
          <WorkCard key={p.slug} project={p} className={`soft-rise ${spans[i % spans.length]} ${i % 2 ? '[transition-delay:.1s]' : ''}`} />
        ))}
      </div>
      <div className="soft-rise mt-[clamp(32px,4vw,56px)] flex justify-center">
        <button type="button" onClick={() => goTo('/isler')} className="btn">
          {t(play.work.all)} <span aria-hidden className="arrow">→</span>
        </button>
      </div>
    </section>
  );
}

// Adımların küçük çizimleri (kimlik, site, otomasyon)
const STEP_ART: ReactNode[] = [
  <svg key="k" viewBox="0 0 160 100" className="w-[70%]" aria-hidden>
    <circle cx="50" cy="50" r="30" fill="#F1E9DE" />
    <rect x="92" y="22" width="44" height="16" rx="4" fill="#D26A72" />
    <rect x="92" y="44" width="44" height="16" rx="4" fill="#0D0B0B" />
    <rect x="92" y="66" width="44" height="16" rx="4" fill="#F1E9DE" opacity=".5" />
  </svg>,
  <svg key="s" viewBox="0 0 160 100" className="w-[74%]" aria-hidden>
    <rect x="10" y="10" width="140" height="80" rx="8" fill="#0D0B0B" />
    <rect x="20" y="22" width="60" height="8" rx="3" fill="#F1E9DE" />
    <rect x="20" y="36" width="40" height="5" rx="2" fill="#A99F95" />
    <rect x="90" y="22" width="50" height="56" rx="5" fill="#6B0F17" />
    <rect x="20" y="62" width="30" height="12" rx="6" fill="#D26A72" />
  </svg>,
  <svg key="o" viewBox="0 0 160 100" className="w-[80%]" aria-hidden>
    <rect x="6" y="38" width="38" height="24" rx="5" fill="#F1E9DE" />
    <rect x="62" y="38" width="38" height="24" rx="5" fill="#D26A72" />
    <rect x="118" y="14" width="36" height="22" rx="5" fill="#0D0B0B" />
    <rect x="118" y="64" width="36" height="22" rx="5" fill="#0D0B0B" />
    <path d="M44 50h18M100 50c8 0 8-25 18-25M100 50c8 0 8 25 18 25" stroke="#F1E9DE" strokeWidth="1.5" fill="none" />
  </svg>,
];

// Uçtan uca vaka: sitenin tek şarap rengi bandı
function CaseBand() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  return (
    <section ref={ref} id="vaka" className="bg-wine py-[clamp(80px,11vw,160px)]">
      <div className="gutter">
        <Head title={play.case.title} text={play.case.text} />
        <div className="grid gap-3.5 lg:grid-cols-3">
          {play.case.steps.map((step, i) => (
            <article
              key={step.title.en}
              className={`soft-rise grid min-h-[360px] content-start gap-[18px] rounded-[20px] bg-wine-deep p-6 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5 ${['', '[transition-delay:.1s]', '[transition-delay:.2s]'][i]}`}
            >
              <span className="display text-[1.6rem] text-wine-light">0{i + 1}</span>
              <h3 className="display text-[clamp(2.2rem,3vw,3rem)]">{t(step.title)}</h3>
              <p className="text-cream/80">{t(step.text)}</p>
              <div className="mt-auto grid h-[150px] place-items-center overflow-hidden rounded-[14px] bg-[#310709]">{STEP_ART[i % STEP_ART.length]}</div>
              <span className="justify-self-start rounded-full border border-cream/35 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]">{t(play.case.soon)}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  const linkedin = site.socials.find((s) => /linkedin/i.test(s.href));
  const initials = site.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
  return (
    <section ref={ref} id="hakkimda" className="gutter grid gap-[clamp(28px,4vw,64px)] py-[clamp(80px,11vw,160px)] lg:grid-cols-[5fr_7fr]">
      <div className="soft-rise relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[radial-gradient(120%_90%_at_50%_20%,#8a1620,#4A0A10_60%,#2a0609)]">
        {play.about.photo ? (
          <img src={play.about.photo} alt={site.name} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden className="display absolute inset-0 grid place-items-center text-[clamp(6rem,14vw,12rem)] text-cream/10">
            {initials}
          </span>
        )}
      </div>
      <div data-reveal>
        <SoftLines key={lang} text={t(play.about.title)} className="mb-7 text-[clamp(3rem,6.5vw,6rem)]" />
        <p className="soft-rise max-w-[54ch] text-[clamp(1.05rem,1.25vw,1.2rem)]">{t(play.about.text)}</p>
        <div className="soft-rise mt-8 grid gap-[18px] border-t border-seam pt-6 [transition-delay:.1s]">
          {play.about.tools.map((group) => (
            <div key={group.label.en} className="grid gap-2.5 sm:grid-cols-[140px_1fr] sm:items-start">
              <h4 className="eyebrow mt-1">{t(group.label)}</h4>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item} className="tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="soft-rise mt-8 flex flex-wrap gap-3 [transition-delay:.2s]">
          {cvUrl && (
            <a href={cvUrl} download className="btn btn-wine">
              {t(ui.cv)} <span aria-hidden className="arrow">↓</span>
            </a>
          )}
          {linkedin && (
            <a href={linkedin.href} target="_blank" rel="noreferrer" className="btn">
              LinkedIn <span aria-hidden className="arrow">↗</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  return (
    <section ref={ref} id="surec" className="gutter pb-[clamp(80px,11vw,160px)]">
      <Head title={play.process.title} text={play.process.text} />
      <div className="grid gap-px border-y border-seam bg-seam lg:grid-cols-4">
        {play.process.steps.map((step, i) => (
          <div key={step.title.en} className={`soft-rise grid content-start gap-3 bg-coal px-6 pb-9 pt-7 ${['', '[transition-delay:.1s]', '[transition-delay:.2s]', '[transition-delay:.3s]'][i]}`}>
            <span className="text-sm tabular-nums text-wine-light">0{i + 1}</span>
            <h3 className="display text-[clamp(2rem,2.6vw,2.6rem)]">{t(step.title)}</h3>
            <p className="text-stone">{t(step.text)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home({ ready }: { ready: boolean }) {
  usePageMeta();
  useEffect(() => {
    refreshSoon();
  }, []);
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero ready={ready} />
      <Ticker />
      <Areas />
      <Work />
      <CaseBand />
      <About />
      <Process />
      <Contact />
    </main>
  );
}
