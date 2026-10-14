import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Sticker } from '../../content';
import { href } from '../router';
import { PATHS, toJSON, useAdmin, type ContactData, type Content, type PlayData } from '../store';
import { BiField, Card, EditLangProvider, Field, ImageField, LangSwitch, LinesField, move, PageHeader, SaveBar, useDraft, useEditLang } from '../ui';

type SectionKey = 'acilis' | 'isler' | 'hizmetler' | 'iletisim';

const SECTIONS: { key: SectionKey; title: string; description: string; highlight: number }[] = [
  { key: 'acilis', title: 'Açılış', description: 'İlk ekrandaki cümle, düğmeler ve düşen proje parçaları.', highlight: 0 },
  { key: 'isler', title: 'İşler', description: 'Proje listesinin başlığı ve filtre yazısı. Projeler “Projeler” sayfasından gelir.', highlight: 1 },
  { key: 'hizmetler', title: 'Hizmetler', description: 'Koyu bantta yan yana duran hizmet kartları.', highlight: 2 },
  { key: 'iletisim', title: 'İletişim', description: '“Birlikte çalışalım” başlığı, paragraf ve form yazıları.', highlight: 3 },
];

// Sayfanın küçük şeması: düzenlenen bölümün sitede nerede olduğunu gösterir
function PageMap({ highlight }: { highlight: number }) {
  const blocks = [{ h: 'h-9' }, { h: 'h-7' }, { h: 'h-4', dark: true }, { h: 'h-5' }, { h: 'h-3', dark: true }];
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
  const { save, saving, pendingFor } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(original);
  // Yeni yüklenen parça görselleri de aynı commit'e girer
  const onSave = () =>
    save([{ path: file, text: toJSON(draft) }, ...pendingFor(draft)], `Panel: ana sayfa “${section.title}” güncellendi`, { [contentKey]: draft } as Partial<Content>);

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

// Sıraya bağlı sabit sahte rastgele sayı: önizlemedeki parçalar her çizimde aynı yerde durur
const seeded = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function HeroPreview({ d }: { d: PlayData }) {
  const { lang } = useEditLang();
  const { src } = useAdmin();
  return (
    <div className="relative h-80 overflow-hidden rounded-lg bg-paper p-3">
      <p className="text-[11px] font-medium">{d.hello?.[lang]}</p>
      <BigLines lines={d.statement?.[lang]} size="text-2xl mt-1" />
      <p className="mt-2 max-w-[60%] text-[10px] leading-snug text-ink/70">{d.text?.[lang]}</p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-full bg-ink px-2 py-1 text-[9px] font-semibold text-paper">{d.ctaWork?.[lang]}</span>
        <span className="rounded-full border border-ink px-2 py-1 text-[9px] font-semibold">{d.ctaContact?.[lang]}</span>
      </div>
      {d.stickers.slice(0, 14).map((s, i) =>
        s.src ? (
          <img
            key={i}
            src={src(s.src)}
            alt=""
            style={{ height: Math.max(18, s.h * 0.22), left: `${40 + seeded(i, 1) * 52}%`, bottom: `${seeded(i, 2) * 22}%`, transform: `rotate(${(seeded(i, 3) - 0.5) * 80}deg)` }}
            className="absolute w-auto drop-shadow"
          />
        ) : null,
      )}
    </div>
  );
}

function WorkPreview({ d }: { d: PlayData }) {
  const { lang } = useEditLang();
  const { content } = useAdmin();
  const visible = content.projects.filter((p) => !p.hidden);
  const disciplines = [...new Set(visible.map((p) => p.discipline?.[lang]).filter(Boolean))];
  return (
    <div>
      <div className="flex items-end justify-between gap-2 border-b border-black/10 pb-2">
        <p className="font-display text-2xl font-semibold">{d.workTitle?.[lang]}</p>
        <div className="flex flex-wrap justify-end gap-1">
          {[d.all?.[lang], ...disciplines].map((x, i) => (
            <span key={i} className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${i === 0 ? 'bg-ink text-paper' : 'border border-black/15'}`}>
              {x}
            </span>
          ))}
        </div>
      </div>
      {visible.map((p) => (
        <p key={p.slug} className="border-b border-black/10 py-1.5 font-display text-lg font-semibold leading-none">
          {p.title}
        </p>
      ))}
    </div>
  );
}

function ServicesPreview({ d }: { d: PlayData }) {
  const { lang } = useEditLang();
  return (
    <div className="rounded-lg bg-ink p-4 text-paper">
      <p className="font-display text-2xl font-semibold">{d.servicesTitle?.[lang]}</p>
      <div className="mt-3 flex flex-col gap-3">
        {d.services.map((s, i) => (
          <div key={i} className="border-t border-white/15 pt-2">
            <p className="text-[10px] text-accent">0{i + 1}</p>
            <p className="font-display text-lg font-semibold">{s.title?.[lang] || '…'}</p>
            <p className="text-[11px] leading-snug text-paper/70">{s.text?.[lang]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ d }: { d: ContactData }) {
  const { lang } = useEditLang();
  return (
    <div>
      <BigLines lines={d.title?.[lang]} size="text-4xl" />
      <p className="mt-4 text-sm leading-relaxed">{d.text?.[lang]}</p>
      <span className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper">{d.form?.send?.[lang]} →</span>
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

const selectClass = 'h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-medium outline-none focus:border-accent';

// Düşen parçalar: görsel, tıklanınca açılacak proje ve geniş ekrandaki yüksekliği
function StickerList({ value, onChange }: { value: Sticker[]; onChange: (v: Sticker[]) => void }) {
  const { content } = useAdmin();
  const update = (i: number, next: Partial<Sticker>) => onChange(value.map((s, j) => (j === i ? { ...s, ...next } : s)));
  return (
    <Card
      title="Düşen parçalar"
      description="Projelerden kesilmiş saydam zeminli PNG/WebP parçalar. Sırayla düşerler; telefonda yalnızca ilk 12, geniş ekranda ilk 20 parça gösterilir. Pasif bir projeye bağlanan parçaya tıklanınca yalnızca adı görünür."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {value.map((s, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-black/[0.08] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{i + 1}. parça</span>
              <div className="flex">
                <IconButton label="Öne al" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
                  <ArrowUp size={15} />
                </IconButton>
                <IconButton label="Arkaya al" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}>
                  <ArrowDown size={15} />
                </IconButton>
                <IconButton label="Parçayı sil" danger onClick={() => onChange(value.filter((_, j) => j !== i))}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </div>
            <ImageField label="Görsel" aspect="aspect-square" value={s.src} onChange={(v) => update(i, { src: v })} />
            <Field label="Proje">
              <select value={s.slug} onChange={(e) => update(i, { slug: e.target.value })} className={selectClass}>
                <option value="">Seçin</option>
                {content.projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                    {p.hidden ? ' (pasif)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Boyut: ${s.h} px`} hint="Geniş ekrandaki yükseklik; dar ekranda oranla küçülür.">
              <input type="range" min={60} max={240} step={10} value={s.h} onChange={(e) => update(i, { h: Number(e.target.value) })} className="w-full accent-accent" />
            </Field>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, { src: '', slug: '', h: 140 }])}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 py-4 text-sm font-semibold text-ink/60 transition hover:border-accent hover:text-accent-strong"
      >
        <Plus size={18} /> Parça ekle
      </button>
    </Card>
  );
}

function ServiceList({ value, onChange }: { value: PlayData['services']; onChange: (v: PlayData['services']) => void }) {
  const { content } = useAdmin();
  const update = (i: number, next: Partial<PlayData['services'][number]>) => onChange(value.map((s, j) => (j === i ? { ...s, ...next } : s)));
  return (
    <>
      {value.map((s, i) => (
        <Card
          key={i}
          title={`${i + 1}. hizmet`}
          aside={
            <div className="flex">
              <IconButton label="Yukarı taşı" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
                <ArrowUp size={16} />
              </IconButton>
              <IconButton label="Aşağı taşı" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}>
                <ArrowDown size={16} />
              </IconButton>
              <IconButton label="Hizmeti sil" danger onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          }
        >
          <BiField label="Başlık" value={s.title} onChange={(v) => update(i, { title: v })} placeholder="Ör. Tasarım" />
          <BiField label="Açıklama" long value={s.text} onChange={(v) => update(i, { text: v })} />
          <Field label="Örnek iş (isteğe bağlı)" hint="Kartın altında bu projeye giden bir düğme görünür. Yalnızca aktif projeler seçilebilir.">
            <select value={s.example} onChange={(e) => update(i, { example: e.target.value })} className={selectClass}>
              <option value="">Yok</option>
              {content.projects
                .filter((p) => !p.hidden)
                .map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
            </select>
          </Field>
        </Card>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { title: { tr: '', en: '' }, text: { tr: '', en: '' }, example: '' }])}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 py-4 text-sm font-semibold text-ink/60 transition hover:border-accent hover:text-accent-strong"
      >
        <Plus size={18} /> Hizmet ekle
      </button>
    </>
  );
}

function Section({ sectionKey }: { sectionKey: SectionKey }) {
  const { content } = useAdmin();
  const section = SECTIONS.find((s) => s.key === sectionKey)!;

  if (sectionKey === 'acilis') {
    return (
      <SectionShell section={section} original={content.play} file={PATHS.play} contentKey="play" preview={(d) => <HeroPreview d={d} />}>
        {(d, set) => (
          <>
            <Card>
              <BiField label="Selam satırı" value={d.hello} onChange={(v) => set((x) => ({ ...x, hello: v }))} placeholder="Ör. Merhaba, ben Emir." />
              <LinesField label="Büyük cümle" hint="Her satır ayrı kayarak belirir. Kısa satırlar en iyi sonucu verir; telefonda en uzun satır ekrana sığacak kadar küçülür." value={d.statement} onChange={(v) => set((x) => ({ ...x, statement: v }))} />
              <BiField label="Açıklama" long value={d.text} onChange={(v) => set((x) => ({ ...x, text: v }))} />
              <div className="grid gap-5 sm:grid-cols-2">
                <BiField label="İşler düğmesi" value={d.ctaWork} onChange={(v) => set((x) => ({ ...x, ctaWork: v }))} />
                <BiField label="İletişim düğmesi" value={d.ctaContact} onChange={(v) => set((x) => ({ ...x, ctaContact: v }))} />
                <BiField label="İpucu (fare)" value={d.hint} onChange={(v) => set((x) => ({ ...x, hint: v }))} />
                <BiField label="İpucu (dokunmatik)" value={d.hintTouch} onChange={(v) => set((x) => ({ ...x, hintTouch: v }))} />
                <BiField label="“Projeyi aç” (ekran okuyucu)" value={d.open} onChange={(v) => set((x) => ({ ...x, open: v }))} />
              </div>
            </Card>
            <StickerList value={d.stickers} onChange={(v) => set((x) => ({ ...x, stickers: v }))} />
          </>
        )}
      </SectionShell>
    );
  }
  if (sectionKey === 'isler') {
    return (
      <SectionShell section={section} original={content.play} file={PATHS.play} contentKey="play" preview={(d) => <WorkPreview d={d} />}>
        {(d, set) => (
          <Card description="Filtreler projelerin disiplinlerinden kendiliğinden oluşur; sıralama “Projeler” sayfasındaki sıradır.">
            <BiField label="Bölüm başlığı" value={d.workTitle} onChange={(v) => set((x) => ({ ...x, workTitle: v }))} />
            <BiField label="“Tümü” filtresi" value={d.all} onChange={(v) => set((x) => ({ ...x, all: v }))} />
          </Card>
        )}
      </SectionShell>
    );
  }
  if (sectionKey === 'hizmetler') {
    return (
      <SectionShell section={section} original={content.play} file={PATHS.play} contentKey="play" preview={(d) => <ServicesPreview d={d} />}>
        {(d, set) => (
          <>
            <Card>
              <BiField label="Bölüm başlığı" value={d.servicesTitle} onChange={(v) => set((x) => ({ ...x, servicesTitle: v }))} />
              <BiField label="Örnek iş düğmesi" value={d.exampleLabel} onChange={(v) => set((x) => ({ ...x, exampleLabel: v }))} />
            </Card>
            <ServiceList value={d.services} onChange={(v) => set((x) => ({ ...x, services: v }))} />
          </>
        )}
      </SectionShell>
    );
  }
  return (
    <SectionShell section={section} original={content.contact} file={PATHS.contact} contentKey="contact" preview={(d) => <ContactPreview d={d} />}>
      {(d, set) => (
        <>
          <Card>
            <LinesField label="Büyük başlık" hint="Her satır ayrı ayrı kayarak belirir." value={d.title} onChange={(v) => set((x) => ({ ...x, title: v }))} />
            <BiField label="Paragraf" long value={d.text} onChange={(v) => set((x) => ({ ...x, text: v }))} />
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
