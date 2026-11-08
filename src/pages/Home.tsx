import { useEffect, useRef } from 'react';
import { cvUrl, play, projects, site, ui, type Text } from '../content';
import WorkStrips from '../components/WorkStrips';
import Contact from '../sections/Contact';
import { HOME_WORK_COUNT } from '../lib/homeWork';
import { useLang } from '../lib/i18n';
import { usePageMeta } from '../lib/meta';
import { useSoftReveal } from '../lib/reveal';
import { refreshSoon, scrollToTarget } from '../lib/scroll';
import { useTransition } from '../lib/transition';

// Ana sayfa (Design. Build. Automate.): açılış, disiplin şeridi, hakkımda (yanında üç alan), seçili işler,
// nasıl çalışırım ve iletişim. Metinler src/content/play.json'da, panelde "Ana sayfa" altında.
// Hareketler yumuşaktır: satırlar maskenin altından kayar, bloklar hafifçe yükselir (bkz. src/lib/reveal.ts).

// Çok satırlı başlık: satırlar "\n" ile ayrılır, her biri ayrı kayar
function SoftLines({ text, className = '', as: Tag = 'h2', accent = -1 }: { text: string; className?: string; as?: 'h1' | 'h2'; accent?: number }) {
  const lines = text.split('\n');
  return (
    <Tag className={`display ${className}`} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} aria-hidden className="line-mask soft-line">
          <span className={i === accent ? 'text-wine-bright' : ''}>{line}</span>
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
    <div ref={ref} className="gutter grid gap-10 pb-[clamp(40px,6vw,80px)] pt-[calc(68px+clamp(40px,8vw,110px))] [@media(max-height:520px)]:pt-[84px]">
      {/* İngilizce üç satır: noktalı harf yok, afiş sıkılığı her ekranda korunur. Yatay telefonda ekran yüksekliğine göre küçülür */}
      <h1 lang="en" className="display text-[clamp(4.2rem,15.5vw,15.5rem)] leading-[0.9] [@media(max-height:520px)]:text-[24svh]" aria-label={play.hero.lines.join(' ')}>
        {play.hero.lines.map((line, i) => (
          <span key={line} aria-hidden className="line-mask soft-line">
            <span className={i === play.hero.accent ? 'text-wine-bright' : ''}>{line}</span>
          </span>
        ))}
      </h1>
      {/* Başlığın altında yalnızca tanıtım ve durum satırı; panelde ikisi de boşsa alt çizgiyle birlikte hiç çizilmez */}
      {(t(play.hero.intro).trim() || t(play.hero.status).trim()) && (
        <div className="soft-rise border-t border-seam pt-7 [transition-delay:.25s]">
          <div className="grid gap-5">
            {t(play.hero.intro).trim() && (
              <p key={lang} className="max-w-[34ch] text-[clamp(1.15rem,1.6vw,1.5rem)] leading-[1.35]">
                {t(play.hero.intro)}
              </p>
            )}
            {t(play.hero.status).trim() && (
              <span className="inline-flex items-center gap-2.5 text-sm text-stone">
                <i aria-hidden className="h-2 w-2 rounded-full bg-[#5ec27a] [animation:status-pulse_2.4s_infinite]" />
                {t(play.hero.status)}
              </span>
            )}
          </div>
        </div>
      )}
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
            <span className="pl-12 text-wine-bright">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Seçili işler: üzerine gelince genişleyen kapak şeritleri (bkz. WorkStrips).
// Paneldeki Projeler sırasının ilk aktif projeleri gösterilir
function Work() {
  const { t } = useLang();
  const { goTo } = useTransition();
  const ref = useRef<HTMLElement>(null);
  const list = projects.slice(0, HOME_WORK_COUNT);
  useSoftReveal(ref, [list.length]);
  return (
    <section ref={ref} id="isler" className="gutter scroll-mt-[92px] pb-[clamp(80px,11vw,160px)]">
      <Head title={play.work.title} text={play.work.text} />
      <WorkStrips projects={list} />
      <div className="soft-rise mt-[clamp(32px,4vw,56px)] flex justify-center">
        <button type="button" onClick={() => goTo('/isler')} className="btn">
          {t(play.work.all)} <span aria-hidden className="arrow">→</span>
        </button>
      </div>
    </section>
  );
}

function About() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  const initials = site.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
  return (
    <section
      ref={ref}
      id="hakkimda"
      className="gutter grid gap-[clamp(28px,4vw,64px)] py-[clamp(80px,11vw,160px)] sm:grid-cols-[clamp(220px,36vw,340px)_minmax(0,1fr)] lg:grid-cols-[clamp(340px,36vw,520px)_minmax(0,1fr)] xl:grid-cols-[clamp(340px,29vw,520px)_minmax(0,4fr)_minmax(0,5fr)] xl:grid-rows-1"
    >
      {/* Geniş ekranda üç sütun: fotoğraf, başlık ve metin, üç alan (Design, Build, Automate). Yüksekliği fotoğrafın oranı
          belirler (before boşluğu), diğer sütunlar ona uzar; içerik daha uzun olursa fotoğraf da birlikte uzar. Tablette ve
          dizüstünde fotoğrafla metin yan yana, alanlar tam genişlikte altta; telefonda her şey alt alta */}
      <div className="soft-rise relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[radial-gradient(120%_90%_at_50%_20%,#8a1620,#4A0A10_60%,#2a0609)] xl:aspect-auto xl:before:block xl:before:pt-[114%] xl:before:content-['']">
        {play.about.photo ? (
          <img src={play.about.photo} alt={site.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span aria-hidden className="display absolute inset-0 grid place-items-center text-[clamp(6rem,14vw,12rem)] text-cream/10">
            {initials}
          </span>
        )}
      </div>
      {/* Üç sütunda yazı ölçüleri sütun genişliğine bağlı (cqw); başlık fotoğrafın üstüyle, metin altıyla hizalanır */}
      <div data-reveal className="flex flex-col lg:justify-between xl:[container-type:inline-size]">
        <SoftLines key={lang} text={t(play.about.title)} className="mb-7 text-[clamp(3rem,6.5vw,6rem)] xl:text-[length:min(25cqw,190px)]" />
        <div>
          <p className="soft-rise max-w-[54ch] text-[clamp(1.05rem,1.25vw,1.2rem)] xl:max-w-none xl:text-[length:min(6.4cqw,30px)] xl:leading-[1.38]">{t(play.about.text)}</p>
          {cvUrl && (
            <div className="soft-rise mt-8 [transition-delay:.1s]">
              <a href={cvUrl} download className="btn btn-wine">
                {t(ui.cv)} <span aria-hidden className="arrow">↓</span>
              </a>
            </div>
          )}
        </div>
      </div>
      {/* Üç alan: satırın üstüne gelince şarap rengi soldan dolar, tıklayınca seçili işlere iner.
          Telefonda ve geniş ekranın dar sütununda başlık üstte, açıklama altta; tablette ve dizüstünde yan yana */}
      <div className="grid border-b border-seam sm:col-span-2 xl:col-span-1 xl:col-start-3 xl:auto-rows-fr xl:[container-type:inline-size]">
        {play.areas.items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onClick={() => scrollToTarget('#isler')}
            style={{ transitionDelay: `${(i + 1) * 90}ms` }}
            className="soft-rise group relative isolate grid w-full gap-y-3 overflow-hidden border-t border-seam py-5 text-left sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-x-6 sm:px-4 xl:grid-cols-1 xl:content-center"
          >
            <span aria-hidden className="absolute inset-0 -z-10 origin-left scale-x-0 bg-wine transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
            <span lang="en" className="display text-[clamp(2.6rem,10vw,3.4rem)] sm:text-[clamp(2.8rem,6vw,4rem)] xl:text-[length:min(11cqw,4rem)]">
              {item.title}
            </span>
            <span className="block max-w-[46ch] text-stone transition-colors duration-500 group-hover:text-cream xl:max-w-none xl:text-[length:min(3.7cqw,19px)] xl:leading-snug">
              {t(item.text)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Process() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  useSoftReveal(ref);
  return (
    <section ref={ref} id="surec" className="gutter py-[clamp(80px,11vw,160px)]">
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
      <About />
      <Work />
      <Process />
      <Contact />
    </main>
  );
}
