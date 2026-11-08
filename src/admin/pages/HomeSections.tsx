import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Step } from '../../content';
import { HOME_WORK_COUNT } from '../../lib/homeWork';
import { href } from '../router';
import { PATHS, sortProjects, toJSON, useAdmin, type ContactData, type Content, type PlayData } from '../store';
import { BiField, Card, EditLangProvider, Field, ImageField, LangSwitch, LinesField, move, PageHeader, SaveBar, TextInput, useDraft, useEditLang } from '../ui';

// Ana sayfa (Design. Build. Automate.) bölümleri; sitede yukarıdan aşağı bu sırayla görünür.
// Çok satırlı başlıklarda her satır ayrı satıra yazılır (Enter); sitede her satır ayrı kayar.
type SectionKey = 'acilis' | 'isler' | 'hakkimda' | 'surec' | 'iletisim';

const SECTIONS: { key: SectionKey; title: string; description: string }[] = [
  { key: 'acilis', title: 'Açılış', description: '“DESIGN. BUILD. AUTOMATE.” başlığı, tanıtım cümlesi, durum ve kayan disiplin şeridi.' },
  { key: 'hakkimda', title: 'Hakkımda', description: 'Fotoğraf, kısa tanıtım ve yanında duran Design, Build, Automate satırları.' },
  { key: 'isler', title: 'Seçili işler', description: 'Genişleyen şeritlerin başlığı ve açıklaması. Şeritler Projeler sayfasındaki sıradan gelir.' },
  { key: 'surec', title: 'Nasıl çalışırım', description: 'Dört adımlık çalışma süreci.' },
  { key: 'iletisim', title: 'İletişim', description: '“Birlikte çalışalım” başlığı, paragraf ve form yazıları.' },
];

// Sayfanın küçük şeması: düzenlenen bölümün sitede nerede olduğunu gösterir
function PageMap({ highlight }: { highlight: number }) {
  const blocks = ['h-7', 'h-7', 'h-6', 'h-4', 'h-4'];
  return (
    <div className="flex w-16 shrink-0 flex-col gap-0.5 rounded-lg border border-black/10 bg-[#0D0B0B] p-1">
      {blocks.map((h, i) => (
        <div key={i} className={`${h} rounded-[3px] ${i === highlight ? 'bg-[#B8202F]' : 'bg-white/10'}`} />
      ))}
    </div>
  );
}

export function HomeSectionsList() {
  return (
    <div>
      <PageHeader title="Ana sayfa" description="Bölümler sitede yukarıdan aşağı bu sırayla görünür. Renkli alan, bölümün sayfadaki yerini gösterir." />
      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <a key={s.key} href={href('ana-sayfa', s.key)} className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:border-accent/60 hover:shadow-md">
            <PageMap highlight={i} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink/40">{i + 1}. bölüm</p>
              <h2 className="font-display text-xl font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-0.5 text-sm text-ink/55">{s.description}</p>
            </div>
            <ChevronRight className="text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-accent-strong" />
          </a>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink/55">
        Projeler, adınız ve iletişim bilgileriniz ayrı sayfalarda: <a className="font-semibold text-accent-strong" href={href('projeler')}>Projeler</a> ve{' '}
        <a className="font-semibold text-accent-strong" href={href('ayarlar')}>Ayarlar</a>.
      </p>
    </div>
  );
}

function SectionShell<T>({
  sectionKey,
  original,
  file,
  contentKey,
  children,
  preview,
}: {
  sectionKey: SectionKey;
  original: T;
  file: string;
  contentKey: keyof Content;
  children: (draft: T, setDraft: (fn: (d: T) => T) => void) => ReactNode;
  preview: (draft: T) => ReactNode;
}) {
  const { save, saving, pendingFor } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(original);
  const index = SECTIONS.findIndex((s) => s.key === sectionKey);
  const section = SECTIONS[index];
  // Yeni yüklenen görseller de aynı commit'e girer
  const onSave = () =>
    save([{ path: file, text: toJSON(draft) }, ...pendingFor(draft)], `Panel: ana sayfa “${section.title}” güncellendi`, { [contentKey]: draft } as Partial<Content>);

  return (
    <div>
      <a href={href('ana-sayfa')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft size={16} /> Ana sayfa
      </a>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <PageMap highlight={index} />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{section.title}</h1>
            <p className="text-[15px] text-ink/60">{section.description}</p>
          </div>
        </div>
        <LangSwitch />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5 pb-28">{children(draft, (fn) => setDraft(fn))}</div>
        <aside className="sticky top-24 hidden rounded-2xl border border-black/[0.06] bg-white p-5 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Sitede görünümü</p>
          {preview(draft)}
        </aside>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={onSave} onReset={reset} />
    </div>
  );
}

// Önizleme: sitedeki siyah zeminde dar başlık ve sade metin
function Preview({ title, text, children }: { title?: string; text?: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg bg-[#0D0B0B] p-4 text-[#F1E9DE]">
      {title && (
        <p className="font-['Anton',sans-serif] text-3xl uppercase leading-[0.9]">
          {title.split('\n').map((l, i) => (
            <span key={i} className="block">
              {l || '…'}
            </span>
          ))}
        </p>
      )}
      {text && <p className="mt-3 text-[11px] leading-snug text-[#A99F95]">{text}</p>}
      {children}
    </div>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg text-ink/50 disabled:opacity-25 ${danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-black/5'}`}
    >
      {children}
    </button>
  );
}

function ListTools({ i, length, onMove, onRemove, what }: { i: number; length: number; onMove: (to: number) => void; onRemove: () => void; what: string }) {
  return (
    <div className="flex">
      <IconButton label="Yukarı taşı" disabled={i === 0} onClick={() => onMove(i - 1)}>
        <ArrowUp size={16} />
      </IconButton>
      <IconButton label="Aşağı taşı" disabled={i === length - 1} onClick={() => onMove(i + 1)}>
        <ArrowDown size={16} />
      </IconButton>
      <IconButton label={`${what} sil`} danger onClick={onRemove}>
        <Trash2 size={16} />
      </IconButton>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 py-3 text-sm font-semibold text-ink/60 transition hover:border-accent hover:text-accent-strong"
    >
      <Plus size={18} /> {children}
    </button>
  );
}

const selectClass = 'h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-accent';
const blank = { tr: '', en: '' };
const titleHint = 'Her satır ayrı satıra yazılır (Enter); sitede her satır ayrı kayar.';

// Adım listesi (vaka ve süreç): başlık ve kısa açıklama
function StepList({ value, onChange, what }: { value: Step[]; onChange: (v: Step[]) => void; what: string }) {
  const update = (i: number, next: Partial<Step>) => onChange(value.map((s, j) => (j === i ? { ...s, ...next } : s)));
  return (
    <>
      {value.map((s, i) => (
        <Card key={i} title={`${i + 1}. ${what}`} aside={<ListTools i={i} length={value.length} what={what} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />}>
          <BiField label="Başlık" value={s.title} onChange={(v) => update(i, { title: v })} />
          <BiField label="Açıklama" long value={s.text} onChange={(v) => update(i, { text: v })} />
        </Card>
      ))}
      <AddButton onClick={() => onChange([...value, { title: blank, text: blank }])}>{what[0].toUpperCase() + what.slice(1)} ekle</AddButton>
    </>
  );
}

function Section({ sectionKey }: { sectionKey: SectionKey }) {
  const { content } = useAdmin();
  const { lang } = useEditLang();
  const homeProjects = sortProjects(content.projects.filter((p) => !p.hidden)).slice(0, HOME_WORK_COUNT);
  const shell = { sectionKey, original: content.play, file: PATHS.play, contentKey: 'play' as const };

  if (sectionKey === 'acilis') {
    return (
      <SectionShell<PlayData> {...shell} preview={(d) => <Preview title={d.hero.lines.join('\n')} text={d.hero.intro?.[lang]} />}>
        {(d, set) => (
          <>
            <Card title="Büyük başlık" description="Üç satır; dil seçiminden bağımsızdır (İngilizce kalır). Şarap renkli satırı aşağıdan seçin.">
              {d.hero.lines.map((line, i) => (
                <Field key={i} label={`${i + 1}. satır`}>
                  <TextInput value={line} onChange={(v) => set((x) => ({ ...x, hero: { ...x.hero, lines: x.hero.lines.map((l, j) => (j === i ? v : l)) } }))} />
                </Field>
              ))}
              <Field label="Şarap renkli satır">
                <select value={d.hero.accent} onChange={(e) => set((x) => ({ ...x, hero: { ...x.hero, accent: Number(e.target.value) } }))} className={selectClass}>
                  <option value={-1}>Hiçbiri</option>
                  {d.hero.lines.map((l, i) => (
                    <option key={i} value={i}>
                      {i + 1}. satır ({l})
                    </option>
                  ))}
                </select>
              </Field>
            </Card>
            <Card>
              <BiField label="Tanıtım cümlesi" long value={d.hero.intro} onChange={(v) => set((x) => ({ ...x, hero: { ...x.hero, intro: v } }))} />
              <BiField label="Durum (yeşil noktalı satır)" value={d.hero.status} onChange={(v) => set((x) => ({ ...x, hero: { ...x.hero, status: v } }))} />
              <BiField label="Üst menüdeki iletişim düğmesi" value={d.ctaContact} onChange={(v) => set((x) => ({ ...x, ctaContact: v }))} />
            </Card>
            <Card title="Kayan disiplin şeridi" description="Açılışın altında yavaşça akan kelimeler.">
              {d.ticker.map((item, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <BiField label={`${i + 1}. kelime`} value={item} onChange={(v) => set((x) => ({ ...x, ticker: x.ticker.map((t, j) => (j === i ? v : t)) }))} />
                  </div>
                  <ListTools i={i} length={d.ticker.length} what="Kelimeyi" onMove={(to) => set((x) => ({ ...x, ticker: move(x.ticker, i, to) }))} onRemove={() => set((x) => ({ ...x, ticker: x.ticker.filter((_, j) => j !== i) }))} />
                </div>
              ))}
              <AddButton onClick={() => set((x) => ({ ...x, ticker: [...x.ticker, blank] }))}>Kelime ekle</AddButton>
            </Card>
          </>
        )}
      </SectionShell>
    );
  }

  if (sectionKey === 'isler') {
    return (
      <SectionShell<PlayData> {...shell} preview={(d) => <Preview title={d.work.title?.[lang]} text={homeProjects.map((p) => p.title).join(' · ')} />}>
        {(d, set) => (
          <>
            <Card>
              <BiField label="Bölüm başlığı" hint={titleHint} long value={d.work.title} onChange={(v) => set((x) => ({ ...x, work: { ...x.work, title: v } }))} />
              <BiField label="Açıklama" long value={d.work.text} onChange={(v) => set((x) => ({ ...x, work: { ...x.work, text: v } }))} />
              <BiField label="“Bütün işler” düğmesi ve sayfa başlığı" value={d.work.all} onChange={(v) => set((x) => ({ ...x, work: { ...x.work, all: v } }))} />
            </Card>
            <Card title="Ana sayfadaki projeler" description={`Projeler sayfasındaki sıranın ilk ${HOME_WORK_COUNT} aktif projesi, genişleyen şeritler olarak bu sırayla görünür. Değiştirmek için Projeler sayfasında kartları sürükleyin.`}>
              <ol className="grid gap-2">
                {homeProjects.map((p, i) => (
                  <li key={p.slug} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 text-sm font-medium">
                    <span className="tabular-nums text-ink/40">{i + 1}</span>
                    {p.title}
                  </li>
                ))}
              </ol>
              <a href={href('projeler')} className="text-sm font-semibold text-accent-strong">
                Projeler sayfasına git
              </a>
            </Card>
          </>
        )}
      </SectionShell>
    );
  }

  if (sectionKey === 'hakkimda') {
    return (
      <SectionShell<PlayData> {...shell} preview={(d) => <Preview title={d.about.title?.[lang]} text={d.about.text?.[lang]} />}>
        {(d, set) => {
          const updateArea = (i: number, next: Partial<PlayData['areas']['items'][number]>) =>
            set((x) => ({ ...x, areas: { ...x.areas, items: x.areas.items.map((it, j) => (j === i ? { ...it, ...next } : it)) } }));
          return (
            <>
              <Card>
                <BiField label="Başlık" hint={titleHint} long value={d.about.title} onChange={(v) => set((x) => ({ ...x, about: { ...x.about, title: v } }))} />
                <BiField label="Tanıtım metni" long value={d.about.text} onChange={(v) => set((x) => ({ ...x, about: { ...x.about, text: v } }))} />
                <ImageField label="Fotoğraf" hint="Dikey (4:5) bir portre en iyi sonucu verir. Boşsa baş harfleriniz gösterilir." aspect="aspect-[4/5]" value={d.about.photo} onChange={(v) => set((x) => ({ ...x, about: { ...x.about, photo: v } }))} />
              </Card>
              {d.areas.items.map((item, i) => (
                <Card
                  key={item.key}
                  title={item.title}
                  description={i === 0 ? 'Fotoğrafın ve tanıtım metninin yanında bu sırayla görünür. Satıra tıklayan ziyaretçi seçili işlere iner.' : undefined}
                >
                  <BiField label="Açıklama" long value={item.text} onChange={(v) => updateArea(i, { text: v })} />
                </Card>
              ))}
            </>
          );
        }}
      </SectionShell>
    );
  }

  if (sectionKey === 'surec') {
    return (
      <SectionShell<PlayData> {...shell} preview={(d) => <Preview title={d.process.title?.[lang]} text={d.process.steps.map((s) => s.title?.[lang]).join(' · ')} />}>
        {(d, set) => (
          <>
            <Card>
              <BiField label="Bölüm başlığı" hint={titleHint} long value={d.process.title} onChange={(v) => set((x) => ({ ...x, process: { ...x.process, title: v } }))} />
              <BiField label="Açıklama" long value={d.process.text} onChange={(v) => set((x) => ({ ...x, process: { ...x.process, text: v } }))} />
            </Card>
            <StepList what="adım" value={d.process.steps} onChange={(v) => set((x) => ({ ...x, process: { ...x.process, steps: v } }))} />
          </>
        )}
      </SectionShell>
    );
  }

  return (
    <SectionShell<ContactData>
      sectionKey="iletisim"
      original={content.contact}
      file={PATHS.contact}
      contentKey="contact"
      preview={(d) => <Preview title={(d.title?.[lang] ?? []).join('\n')} text={d.text?.[lang]} />}
    >
      {(d, set) => (
        <>
          <Card>
            <LinesField label="Büyük başlık" hint="Her satır ayrı ayrı kayarak belirir; son satır şarap renginde olur." value={d.title} onChange={(v) => set((x) => ({ ...x, title: v }))} />
            <BiField label="Paragraf (isteğe bağlı)" long value={d.text} onChange={(v) => set((x) => ({ ...x, text: v }))} />
          </Card>
          <Card title="Form yazıları">
            <div className="grid gap-5 sm:grid-cols-2">
              <BiField label="Ad alanı" value={d.form.name} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, name: v } }))} />
              <BiField label="E-posta alanı" value={d.form.email} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, email: v } }))} />
              <BiField label="Mesaj alanı" value={d.form.message} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, message: v } }))} />
              <BiField label="Gönder butonu" value={d.form.send} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, send: v } }))} />
              <BiField label="Gönderilirken" value={d.form.sending} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, sending: v } }))} />
              <BiField label="Başarılı mesajı" value={d.form.sent} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, sent: v } }))} />
              <BiField label="Hata mesajı" value={d.form.error} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, error: v } }))} />
              <BiField label="Ad alanı: örnek metin" value={d.form.phName} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, phName: v } }))} />
              <BiField label="E-posta alanı: örnek metin" value={d.form.phEmail} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, phEmail: v } }))} />
              <BiField label="Mesaj alanı: örnek metin" value={d.form.phMessage} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, phMessage: v } }))} />
              <BiField label="Boş alan uyarısı" value={d.form.required} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, required: v } }))} />
              <BiField label="Hatalı e-posta uyarısı" value={d.form.emailInvalid} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, emailInvalid: v } }))} />
              <BiField label="E-posta taslağı hazırlandı (form adresi yoksa)" long value={d.form.mailtoOpened} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, mailtoOpened: v } }))} />
              <BiField label="“Uygulama açılmadıysa” notu" value={d.form.mailtoNote} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, mailtoNote: v } }))} />
            </div>
          </Card>
        </>
      )}
    </SectionShell>
  );
}

export function HomeSectionEditor({ sectionKey }: { sectionKey: string }) {
  if (!SECTIONS.some((s) => s.key === sectionKey)) return <HomeSectionsList />;
  return (
    <EditLangProvider>
      <Section key={sectionKey} sectionKey={sectionKey as SectionKey} />
    </EditLangProvider>
  );
}
