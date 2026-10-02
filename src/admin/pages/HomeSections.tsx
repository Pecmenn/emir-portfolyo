import { ArrowLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { href } from '../router';
import { PATHS, toJSON, useAdmin, type AboutData, type ContactData, type Content, type ExpertiseData, type Lines, type WorkData } from '../store';
import { BiField, Card, EditLangProvider, LangSwitch, LinesField, PageHeader, SaveBar, useDraft, useEditLang } from '../ui';

type SectionKey = 'hakkimda' | 'isler' | 'uzmanlik' | 'iletisim';

const SECTIONS: { key: SectionKey; title: string; description: string; highlight: number }[] = [
  { key: 'hakkimda', title: 'Hakkımda', description: 'Girişin hemen altındaki büyük cümle ve paragraf.', highlight: 1 },
  { key: 'isler', title: 'İşler · sloganlar', description: 'Proje satırlarının yanında kayarak beliren kısa sloganlar.', highlight: 2 },
  { key: 'uzmanlik', title: 'Uzmanlık', description: 'Koyu bantta kayan disiplin adları ve hizmet listesi.', highlight: 3 },
  { key: 'iletisim', title: 'İletişim', description: '“Birlikte çalışalım” başlığı, paragraf ve form yazıları.', highlight: 4 },
];

// Sayfanın küçük şeması: düzenlenen bölümün sitede nerede olduğunu gösterir
function PageMap({ highlight }: { highlight: number }) {
  const blocks = [
    { h: 'h-6', dark: true },
    { h: 'h-4' },
    { h: 'h-8' },
    { h: 'h-4', dark: true },
    { h: 'h-4' },
    { h: 'h-3', dark: true },
  ];
  return (
    <div className="flex w-16 shrink-0 flex-col gap-0.5 rounded-lg border border-black/10 bg-white p-1">
      {blocks.map((b, i) => (
        <div key={i} className={`${b.h} rounded-[3px] ${i === highlight ? 'bg-accent' : b.dark ? 'bg-ink/80' : 'bg-black/[0.07]'}`} />
      ))}
    </div>
  );
}

export function HomeSectionsList() {
  return (
    <div>
      <PageHeader title="Ana sayfa" description="Bölümler sitede yukarıdan aşağı bu sırayla görünür. Mor alan, bölümün sayfadaki yerini gösterir." />
      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <a key={s.key} href={href('ana-sayfa', s.key)} className="group flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:border-accent/60 hover:shadow-md">
            <PageMap highlight={s.highlight} />
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
  section,
  original,
  file,
  contentKey,
  children,
  preview,
}: {
  section: (typeof SECTIONS)[number];
  original: T;
  file: string;
  contentKey: keyof Content;
  children: (draft: T, setDraft: (fn: (d: T) => T) => void) => ReactNode;
  preview: (draft: T) => ReactNode;
}) {
  const { save, saving } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(original);
  const onSave = () => save([{ path: file, text: toJSON(draft) }], `Panel: ana sayfa “${section.title}” güncellendi`, { [contentKey]: draft } as Partial<Content>);

  return (
    <div>
      <a href={href('ana-sayfa')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft size={16} /> Ana sayfa
      </a>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <PageMap highlight={section.highlight} />
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

function BigLines({ lines, size = 'text-3xl' }: { lines: string[] | undefined; size?: string }) {
  return (
    <p className={`font-display font-semibold leading-[0.95] tracking-tight ${size}`}>
      {(lines ?? []).map((l, i) => (
        <span key={i} className="block">
          {l || '…'}
        </span>
      ))}
    </p>
  );
}

function AboutPreview({ d }: { d: AboutData }) {
  const { lang } = useEditLang();
  return (
    <div>
      <p className="mb-2 text-xs text-ink/45">{d.label?.[lang]}</p>
      <BigLines lines={d.lines?.[lang]} />
      <p className="mt-4 text-sm leading-relaxed">{d.text?.[lang]}</p>
    </div>
  );
}

function WorkPreview({ d }: { d: WorkData }) {
  const { lang } = useEditLang();
  return (
    <div className="flex flex-col gap-4">
      {d.slogans.map((s, i) => (
        <div key={i} className={`flex gap-2 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
          <div className="aspect-[10/7] w-1/2 rounded bg-black/[0.08]" />
          <div className="w-1/2">
            <BigLines lines={s[lang]} size="text-base" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpertisePreview({ d }: { d: ExpertiseData }) {
  const { lang } = useEditLang();
  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-ink px-3 py-4 text-paper">
        <p className="whitespace-nowrap font-display text-xl font-semibold">{(d.marquee?.[lang] ?? []).join('  ✦  ')}</p>
      </div>
      <p className="mb-2 mt-4 text-xs text-ink/45">{d.listLabel?.[lang]}</p>
      {(d.list?.[lang] ?? []).map((l, i) => (
        <p key={i} className={`font-display text-lg font-semibold leading-tight ${i === 0 ? '' : 'opacity-25'}`}>
          {l}
        </p>
      ))}
    </div>
  );
}

function ContactPreview({ d }: { d: ContactData }) {
  const { lang } = useEditLang();
  return (
    <div>
      <p className="mb-2 text-xs text-ink/45">{d.label?.[lang]}</p>
      <BigLines lines={d.title?.[lang]} size="text-4xl" />
      <p className="mt-4 text-sm leading-relaxed">{d.text?.[lang]}</p>
      <span className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper">{d.form?.send?.[lang]} →</span>
    </div>
  );
}

function SloganList({ value, onChange }: { value: Lines[]; onChange: (v: Lines[]) => void }) {
  return (
    <>
      {value.map((s, i) => (
        <Card
          key={i}
          title={`${i + 1}. satırın sloganı`}
          description={i % 2 === 0 ? 'Bu satırda büyük proje solda, slogan sağda.' : 'Bu satırda büyük proje sağda, slogan solda.'}
          aside={
            <button type="button" aria-label="Sloganı sil" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-ink/45 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          }
        >
          <LinesField label="Satırlar" hint="Her satır ayrı kayarak belirir. 2-3 kısa satır önerilir." value={s} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
        </Card>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { tr: [''], en: [''] }])}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 py-4 text-sm font-semibold text-ink/60 transition hover:border-accent hover:text-accent-strong"
      >
        <Plus size={18} /> Slogan ekle
      </button>
    </>
  );
}

function Section({ sectionKey }: { sectionKey: SectionKey }) {
  const { content } = useAdmin();
  const section = SECTIONS.find((s) => s.key === sectionKey)!;

  if (sectionKey === 'hakkimda') {
    return (
      <SectionShell section={section} original={content.about} file={PATHS.about} contentKey="about" preview={(d) => <AboutPreview d={d} />}>
        {(d, set) => (
          <Card>
            <BiField label="Küçük başlık" hint="Bölümün üstündeki küçük etiket." value={d.label} onChange={(v) => set((x) => ({ ...x, label: v }))} />
            <LinesField label="Büyük cümle" hint="Her satır ayrı ayrı kayarak belirir. 3-4 kısa satır en iyi sonucu verir." value={d.lines} onChange={(v) => set((x) => ({ ...x, lines: v }))} />
            <BiField label="Paragraf" long hint="Büyük cümlenin sağında, büyük puntoyla görünür." value={d.text} onChange={(v) => set((x) => ({ ...x, text: v }))} />
          </Card>
        )}
      </SectionShell>
    );
  }
  if (sectionKey === 'isler') {
    return (
      <SectionShell section={section} original={content.work} file={PATHS.work} contentKey="work" preview={(d) => <WorkPreview d={d} />}>
        {(d, set) => <SloganList value={d.slogans} onChange={(v) => set((x) => ({ ...x, slogans: v }))} />}
      </SectionShell>
    );
  }
  if (sectionKey === 'uzmanlik') {
    return (
      <SectionShell section={section} original={content.expertise} file={PATHS.expertise} contentKey="expertise" preview={(d) => <ExpertisePreview d={d} />}>
        {(d, set) => (
          <>
            <Card title="Kayan yazı" description="Koyu bantta sonsuz kayan disiplin adları. Telefonda gösterilmez.">
              <LinesField label="İfadeler" addLabel="İfade ekle" hint="3-5 kısa ifade önerilir." value={d.marquee} onChange={(v) => set((x) => ({ ...x, marquee: v }))} />
            </Card>
            <Card title="Hizmet listesi" description="Kaydırdıkça ortadaki satır koyulaşır.">
              <BiField label="Liste başlığı" value={d.listLabel} onChange={(v) => set((x) => ({ ...x, listLabel: v }))} />
              <LinesField label="Hizmetler" addLabel="Hizmet ekle" hint="Türkçe ve İngilizce satır sayısı aynı olmalı." value={d.list} onChange={(v) => set((x) => ({ ...x, list: v }))} />
            </Card>
          </>
        )}
      </SectionShell>
    );
  }
  return (
    <SectionShell section={section} original={content.contact} file={PATHS.contact} contentKey="contact" preview={(d) => <ContactPreview d={d} />}>
      {(d, set) => (
        <>
          <Card description="E-posta adresi ve sosyal medya bağlantıları Ayarlar sayfasından gelir.">
            <BiField label="Küçük başlık" value={d.label} onChange={(v) => set((x) => ({ ...x, label: v }))} />
            <LinesField label="Büyük başlık" hint="Her satır ayrı ayrı kayarak belirir." value={d.title} onChange={(v) => set((x) => ({ ...x, title: v }))} />
            <BiField label="Paragraf" long value={d.text} onChange={(v) => set((x) => ({ ...x, text: v }))} />
          </Card>
          <Card title="Buton ve form yazıları">
            <div className="grid gap-5 sm:grid-cols-2">
              <BiField label="“Kopyala” butonu" value={d.copy} onChange={(v) => set((x) => ({ ...x, copy: v }))} />
              <BiField label="“Kopyalandı” mesajı" value={d.copied} onChange={(v) => set((x) => ({ ...x, copied: v }))} />
              <BiField label="Ad alanı" value={d.form.name} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, name: v } }))} />
              <BiField label="E-posta alanı" value={d.form.email} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, email: v } }))} />
              <BiField label="Mesaj alanı" value={d.form.message} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, message: v } }))} />
              <BiField label="Gönder butonu" value={d.form.send} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, send: v } }))} />
              <BiField label="Gönderilirken" value={d.form.sending} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, sending: v } }))} />
              <BiField label="Başarılı mesajı" value={d.form.sent} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, sent: v } }))} />
              <BiField label="Hata mesajı" value={d.form.error} onChange={(v) => set((x) => ({ ...x, form: { ...x.form, error: v } }))} />
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
