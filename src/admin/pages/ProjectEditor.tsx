import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Eye, Film, GalleryHorizontal, Hash, Image as ImageIcon, Images, Plus, Quote, Rotate3d, Trash2, Type, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { GalleryBlock, Project } from '../../content';
import { SITE_URL } from '../github';
import { go, href } from '../router';
import { PATHS, sortProjects, toJSON, useAdmin, type Bi } from '../store';
import { BiField, Button, Card, ConfirmDialog, EditLangProvider, Field, ImageField, LangSwitch, move, SaveBar, TextInput, Toggle, useDraft, useEditLang, VideoField } from '../ui';

const empty: Bi = { tr: '', en: '' };

function slugify(text: string) {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
  return text
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function newProject(order: number): Project {
  return {
    order,
    slug: '',
    title: '',
    discipline: { ...empty },
    year: String(new Date().getFullYear()),
    cover: '',
    summary: { ...empty },
    client: '',
    role: { ...empty },
    services: { ...empty },
    intro: { ...empty },
    gallery: [],
    featured: false,
  };
}

const DISCIPLINES: Bi[] = [
  { tr: 'Marka Kimliği', en: 'Brand Identity' },
  { tr: 'UI/UX', en: 'UI/UX' },
  { tr: 'Motion', en: 'Motion' },
  { tr: 'Dijital Pazarlama', en: 'Digital Marketing' },
  { tr: 'Web Tasarımı', en: 'Web Design' },
];

const BLOCKS: { type: GalleryBlock['type']; label: string; description: string; icon: typeof ImageIcon }[] = [
  { type: 'chapter', label: 'Bölüm açılışı', description: 'Numaralı büyük bölüm başlığı (01, 02 ...); numara sıradan otomatik gelir', icon: Hash },
  { type: 'text', label: 'Başlık + açıklama', description: 'Bölüm başlığı solda, kısa açıklama sağda', icon: Type },
  { type: 'pair', label: 'İki görsel', description: 'Yan yana iki eşit görsel', icon: Images },
  { type: 'text-image', label: 'Metin + görsel', description: 'Kısa bir açıklama ve yanında görsel', icon: Quote },
  { type: 'full', label: 'Geniş görsel', description: 'Sayfa genişliğinde görsel, altında isteğe bağlı büyük cümle', icon: ImageIcon },
  { type: 'video', label: 'Video', description: 'Sessiz, döngüde oynayan video', icon: Film },
  { type: 'showcase', label: '3B vitrin', description: 'Fareyle 3 boyutlu eğilen tek görsel; saydam zeminli cihaz görselleri için ideal', icon: Rotate3d },
  { type: 'strip', label: 'Sürüklenen şerit', description: 'Yatayda fareyle sürüklenerek gezilen görsel dizisi', icon: GalleryHorizontal },
];

function blankBlock(type: GalleryBlock['type']): GalleryBlock {
  if (type === 'pair') return { type, image1: '', image2: '' };
  if (type === 'text-image') return { type, text: { ...empty }, image: '', side: 'right' };
  if (type === 'video') return { type, video: '', full: true };
  if (type === 'text' || type === 'chapter') return { type, title: { ...empty }, text: { ...empty } };
  if (type === 'showcase') return { type, image: '' };
  if (type === 'strip') return { type, images: ['', ''] };
  return { type: 'full', image: '', quote: { ...empty } };
}

// Sağdaki canlı önizleme: kartın ana sayfada ve proje sayfasının kapağında nasıl görüneceği
function Preview({ p }: { p: Project }) {
  const { src } = useAdmin();
  const { lang } = useEditLang();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Ana sayfadaki kart</p>
        <div className="relative aspect-[10/7] overflow-hidden rounded-lg bg-paper">
          {p.cover && <img src={src(p.cover)} alt="" className="h-full w-full object-cover" />}
          {p.coverVideo && <video src={src(p.coverVideo)} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />}
        </div>
        <div className="mt-2 flex justify-between text-[13px] font-medium">
          <span>{p.title || 'Proje adı'}</span>
          <span className="text-ink/45">{p.discipline?.[lang] || 'Disiplin'}</span>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Proje sayfasının kapağı</p>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink text-paper">
          {p.cover && <img src={src(p.cover)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10" />
          <div className="absolute inset-x-4 bottom-4">
            <p className="font-display text-4xl font-semibold leading-none tracking-tight">{p.title || 'Proje adı'}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-snug text-paper/85">{p.summary?.[lang]}</p>
            <p className="mt-3 border-t border-white/20 pt-2 text-[11px] font-medium">
              {p.year} · {p.discipline?.[lang]}
            </p>
          </div>
        </div>
      </div>
      {p.caseStudy?.metrics?.length ? (
        <div className="rounded-lg bg-ink p-4 text-paper">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper/50">Vaka çalışması rakamları</p>
          <div className="flex flex-wrap gap-5">
            {p.caseStudy.metrics.map((m, i) => (
              <div key={i}>
                <p className="font-display text-2xl font-semibold">{m.value}</p>
                <p className="text-[11px] text-paper/60">{m.label?.[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GalleryEditor({ blocks, onChange }: { blocks: GalleryBlock[]; onChange: (b: GalleryBlock[]) => void }) {
  const [adding, setAdding] = useState(false);
  const update = (i: number, block: GalleryBlock) => onChange(blocks.map((b, j) => (j === i ? block : b)));

  return (
    <Card title="Galeri" description="Proje sayfasında kapaktan sonra, yukarıdan aşağı bu sırayla gösterilir.">
      {blocks.length === 0 && <p className="rounded-xl bg-paper p-4 text-sm text-ink/55">Henüz blok yok. Aşağıdan bir blok ekleyin.</p>}
      {blocks.map((block, i) => {
        const meta = BLOCKS.find((b) => b.type === block.type)!;
        return (
          <div key={i} className="rounded-xl border border-black/[0.08] p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent-strong">
                  <meta.icon size={15} />
                </span>
                {i + 1}. {meta.label}
              </span>
              <div className="flex">
                <button type="button" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => onChange(move(blocks, i, i - 1))} className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-black/5 disabled:opacity-25">
                  <ArrowUp size={16} />
                </button>
                <button type="button" aria-label="Aşağı taşı" disabled={i === blocks.length - 1} onClick={() => onChange(move(blocks, i, i + 1))} className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-black/5 disabled:opacity-25">
                  <ArrowDown size={16} />
                </button>
                <button type="button" aria-label="Bloğu sil" onClick={() => onChange(blocks.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {block.type === 'pair' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField label="Sol görsel" aspect="aspect-[4/3]" value={block.image1} onChange={(v) => update(i, { ...block, image1: v })} />
                <ImageField label="Sağ görsel" aspect="aspect-[4/3]" value={block.image2} onChange={(v) => update(i, { ...block, image2: v })} />
              </div>
            )}
            {block.type === 'text-image' && (
              <div className="flex flex-col gap-4">
                <BiField label="Metin" long value={block.text} onChange={(v) => update(i, { ...block, text: v })} />
                <ImageField label="Görsel" aspect="aspect-[4/5] max-w-xs" value={block.image} onChange={(v) => update(i, { ...block, image: v })} />
                <Field label="Görselin konumu">
                  <div className="inline-flex rounded-xl bg-black/[0.05] p-1">
                    {(['left', 'right'] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => update(i, { ...block, side })}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${block.side === side ? 'bg-white shadow-sm' : 'text-ink/55'}`}
                      >
                        {side === 'left' ? 'Solda' : 'Sağda'}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
            {block.type === 'video' && (
              <div className="flex flex-col gap-4">
                <VideoField label="Video" value={block.video} onChange={(v) => update(i, { ...block, video: v })} />
                <Toggle label="Tam genişlik" hint="Kapalıysa video ortada, daha dar gösterilir." checked={block.full} onChange={(v) => update(i, { ...block, full: v })} />
              </div>
            )}
            {(block.type === 'text' || block.type === 'chapter') && (
              <div className="flex flex-col gap-4">
                <BiField label="Başlık" value={block.title} onChange={(v) => update(i, { ...block, title: v })} placeholder="Ör. Görsel kimlik" />
                <BiField label="Açıklama" long value={block.text} onChange={(v) => update(i, { ...block, text: v })} />
              </div>
            )}
            {block.type === 'showcase' && (
              <ImageField
                label="Görsel"
                hint="Kırpılmadan kendi oranında gösterilir. Saydam zeminli PNG/WebP cihaz görselleri en iyi sonucu verir."
                value={block.image}
                onChange={(v) => update(i, { ...block, image: v })}
              />
            )}
            {block.type === 'strip' && (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-ink/55">Görseller aynı yükseklikte, kendi oranlarıyla yan yana dizilir.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {block.images.map((img, j) => (
                    <div key={j} className="relative">
                      <ImageField
                        label={`Görsel ${j + 1}`}
                        aspect="aspect-[4/5]"
                        value={img}
                        onChange={(v) => update(i, { ...block, images: block.images.map((x, k) => (k === j ? v : x)) })}
                      />
                      <button
                        type="button"
                        aria-label="Görseli çıkar"
                        onClick={() => update(i, { ...block, images: block.images.filter((_, k) => k !== j) })}
                        className="absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-lg text-ink/45 hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="soft" onClick={() => update(i, { ...block, images: [...block.images, ''] })}>
                  <Plus size={16} /> Görsel ekle
                </Button>
              </div>
            )}
            {block.type === 'full' && (
              <div className="flex flex-col gap-4">
                <ImageField label="Görsel" value={block.image} onChange={(v) => update(i, { ...block, image: v })} />
                <BiField label="Altındaki büyük cümle (isteğe bağlı)" hint="Görselin altında ortalanmış büyük yazıyla görünür." value={block.quote} onChange={(v) => update(i, { ...block, quote: v })} placeholder="Ör. Az biçim, çok anlam." />
              </div>
            )}
          </div>
        );
      })}
      {adding ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {BLOCKS.map((b) => (
            <button
              key={b.type}
              type="button"
              onClick={() => {
                onChange([...blocks, blankBlock(b.type)]);
                setAdding(false);
              }}
              className="rounded-xl border border-black/10 p-4 text-left transition hover:border-accent hover:bg-accent/5"
            >
              <b.icon size={20} className="mb-2 text-accent-strong" />
              <span className="block text-sm font-semibold">{b.label}</span>
              <span className="block text-xs text-ink/55">{b.description}</span>
            </button>
          ))}
          <button type="button" onClick={() => setAdding(false)} className="text-sm font-semibold text-ink/50 sm:col-span-2">
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/10 py-4 text-sm font-semibold text-ink/60 transition hover:border-accent hover:text-accent-strong"
        >
          <Plus size={18} /> Blok ekle
        </button>
      )}
    </Card>
  );
}

function Editor({ original, isNew }: { original: Project; isNew: boolean }) {
  const { content, save, saving, pendingFor, notify, src } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(original);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const set = <K extends keyof Project>(key: K, value: Project[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const slug = isNew ? slugify(draft.title) : draft.slug;
  const caseOn = !!draft.caseStudy;

  const onSave = async () => {
    if (!draft.title.trim()) return notify('Lütfen proje adını yazın.', 'error');
    if (!slug) return notify('Proje adından sayfa adresi oluşturulamadı; harf veya rakam içeren bir ad yazın.', 'error');
    if (isNew && content.projects.some((p) => p.slug === slug)) return notify('Bu adla bir proje zaten var. Farklı bir ad deneyin.', 'error');
    if (draft.coverVideo && !draft.cover)
      notify('İpucu: kapak görseli de ekleyin. Video yüklenene kadar ve proje açılış animasyonunda o görünür.', 'error');
    const project: Project = { ...draft, slug };
    const changes = [{ path: PATHS.project(slug), text: toJSON(project) }, ...pendingFor(project)];
    const projects = isNew ? sortProjects([...content.projects, project]) : content.projects.map((p) => (p.slug === slug ? project : p));
    const ok = await save(changes, `Panel: “${project.title}” ${isNew ? 'eklendi' : 'güncellendi'}`, { projects });
    if (ok && isNew) go('projeler', slug);
  };

  const onDelete = async () => {
    setConfirmDelete(false);
    const ok = await save([{ path: PATHS.project(original.slug), delete: true }], `Panel: “${original.title}” silindi`, {
      projects: content.projects.filter((p) => p.slug !== original.slug),
    });
    if (ok) go('projeler');
  };

  return (
    <div>
      <a href={href('projeler')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
        <ArrowLeft size={16} /> Projeler
      </a>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{draft.title || (isNew ? 'Yeni proje' : 'Adsız proje')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <LangSwitch />
          {!isNew && (
            <a href={`${SITE_URL}/proje/${original.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-black/5">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Sitede aç</span>
            </a>
          )}
          <span className="lg:hidden">
            <Button variant="soft" onClick={() => setShowPreview(true)}>
              <Eye size={16} /> Önizleme
            </Button>
          </span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5 pb-28">
          <Card title="Temel bilgiler">
            <Field label="Proje adı">
              <TextInput value={draft.title} onChange={(v) => set('title', v)} placeholder="Ör. Nova" />
            </Field>
            <BiField label="Disiplin" hint="Kartın sağ altında görünür." value={draft.discipline} onChange={(v) => set('discipline', v)} />
            <div className="-mt-3 flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => (
                <button key={d.tr} type="button" onClick={() => set('discipline', d)} className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-ink/60 hover:border-accent hover:text-accent-strong">
                  {d.tr}
                </button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Yıl">
                <TextInput value={draft.year} onChange={(v) => set('year', v)} placeholder="2026" />
              </Field>
              <Field label="Sayfa adresi" hint={isNew ? 'Proje adından otomatik oluşur.' : 'Yayınlanmış projenin adresi değiştirilemez.'}>
                <div className="rounded-xl bg-paper px-3.5 py-2.5 text-[15px] text-ink/55">/proje/{slug || '…'}</div>
              </Field>
            </div>
          </Card>

          <Card title="Kapak ve özet" description="Kapak hem ana sayfadaki kartta hem proje sayfasının tam ekran girişinde kullanılır.">
            <ImageField label="Kapak görseli" hint="Yatay bir görsel seçin. Büyük fotoğraflar yüklenirken otomatik küçültülür." value={draft.cover} onChange={(v) => set('cover', v)} />
            <VideoField
              label="Kapak videosu (isteğe bağlı)"
              hint="Varsa kapak görselinin yerine sessiz ve döngüde oynar: giriş slider’ında, ana sayfadaki kartta ve proje sayfasının kapağında. Girişte öne çıkan projelerde ziyaretçi sesi açabilir. Kapak görseli yine gerekli; video yüklenene kadar o görünür."
              value={draft.coverVideo}
              poster={draft.cover}
              onChange={(v) => set('coverVideo', v || undefined)}
            />
            <Field
              label="Telefonda kapağın odağı"
              hint="Telefonda kapağın yalnızca dikey bir dilimi görünür. Kaydırıcıyla görselin hangi bölümünün görüneceğini seçin: solda sol kenar, ortada merkez, sağda sağ kenar."
            >
              <div className="flex items-center gap-4">
                {draft.cover && (
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-black/5">
                    <img src={src(draft.cover)} alt="" className="h-full w-full object-cover" />
                    <span
                      className="absolute inset-y-0 w-[24%] -translate-x-1/2 rounded-sm ring-2 ring-white shadow-[0_0_0_999px_rgba(0,0,0,.45)]"
                      style={{ left: `${12 + (draft.coverFocus ?? 50) * 0.76}%` }}
                    />
                  </div>
                )}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Telefonda kapağın odağı"
                  value={draft.coverFocus ?? 50}
                  onChange={(e) => set('coverFocus', Number(e.target.value) === 50 ? undefined : Number(e.target.value))}
                  className="w-full accent-ink"
                />
                <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-ink/60">%{draft.coverFocus ?? 50}</span>
              </div>
            </Field>
            <BiField label="Kısa özet" long hint="Proje sayfasının kapağında, başlığın yanında görünür. 1-2 cümle." value={draft.summary} onChange={(v) => set('summary', v)} />
          </Card>

          <Card title="Ana sayfadaki yeri">
            <Toggle
              label="Girişte öne çıkar"
              hint="Açıksa ana sayfanın en üstündeki tam ekran slider’da gösterilir. 3 proje önerilir."
              checked={!!draft.featured}
              onChange={(v) => set('featured', v)}
            />
            <Toggle
              label="Pasif"
              hint="Açıksa proje sitede hiçbir yerde görünmez (giriş, işler listesi, proje sayfası). Panelde kalır, istediğiniz zaman yeniden açabilirsiniz."
              checked={!!draft.hidden}
              onChange={(v) => set('hidden', v || undefined)}
            />
            <p className="rounded-xl bg-paper p-3 text-[13px] text-ink/60">Projenin işler bölümündeki sırasını Projeler sayfasında kartları sürükleyerek değiştirebilirsiniz.</p>
          </Card>

          <Card title="Sayfa zemini">
            <Toggle
              label="Koyu proje sayfası"
              hint="Açıksa künye ve galeri koyu zeminde gösterilir. Koyu tonlu sunumlar ve saydam zeminli cihaz görselleri için uygundur."
              checked={!!draft.dark}
              onChange={(v) => set('dark', v || undefined)}
            />
            <Field
              label="Zemin rengi (isteğe bağlı)"
              hint="Sunum görsellerinin zemin rengini yazarsanız (ör. #131814) görseller sayfayla kesintisiz birleşir ve geniş görseller kenar boşluğu olmadan dizilir."
            >
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Zemin rengi seç"
                  value={draft.canvas || '#0a0a0a'}
                  onChange={(e) => set('canvas', e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-black/10 bg-transparent"
                />
                <TextInput value={draft.canvas ?? ''} placeholder="#131814" onChange={(v) => set('canvas', v.trim() || undefined)} />
              </div>
            </Field>
          </Card>

          <Card title="Künye" description="Proje sayfasında kapaktan hemen sonra gelen bilgiler.">
            <Field label="Müşteri">
              <TextInput value={draft.client} onChange={(v) => set('client', v)} placeholder="Ör. Nova Finans" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <BiField label="Rolüm" value={draft.role} onChange={(v) => set('role', v)} placeholder="Ör. Marka tasarımcısı" />
              <BiField label="Kapsam" value={draft.services} onChange={(v) => set('services', v)} placeholder="Ör. Strateji, logo, tipografi" />
            </div>
            <BiField label="Giriş paragrafı" long hint="Künyenin yanında büyük puntoyla görünür. Projeyi 2-3 cümlede anlatın." value={draft.intro} onChange={(v) => set('intro', v)} />
          </Card>

          <Card title="Vaka çalışması" description="UI/UX ve pazarlama projeleri için problem → süreç → sonuç anlatımı ve rakamlar.">
            <Toggle
              label="Bu projede vaka çalışması göster"
              checked={caseOn}
              onChange={(on) =>
                set('caseStudy', on ? draft.caseStudy ?? { challenge: { ...empty }, process: { ...empty }, result: { ...empty }, metrics: [] } : undefined)
              }
            />
            {draft.caseStudy && (
              <>
                <BiField label="Problem" long value={draft.caseStudy.challenge} onChange={(v) => set('caseStudy', { ...draft.caseStudy!, challenge: v })} />
                <BiField label="Süreç" long value={draft.caseStudy.process} onChange={(v) => set('caseStudy', { ...draft.caseStudy!, process: v })} />
                <BiField label="Sonuç" long value={draft.caseStudy.result} onChange={(v) => set('caseStudy', { ...draft.caseStudy!, result: v })} />
                <div>
                  <p className="mb-2 text-sm font-medium">Rakamlar</p>
                  <div className="flex flex-col gap-3">
                    {draft.caseStudy.metrics.map((m, i) => (
                      <div key={i} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-end gap-2">
                        <Field label="Değer">
                          <TextInput
                            value={m.value}
                            placeholder="%42"
                            onChange={(v) => set('caseStudy', { ...draft.caseStudy!, metrics: draft.caseStudy!.metrics.map((x, j) => (j === i ? { ...x, value: v } : x)) })}
                          />
                        </Field>
                        <BiField
                          label="Açıklama"
                          value={m.label}
                          placeholder="daha fazla rezervasyon"
                          onChange={(v) => set('caseStudy', { ...draft.caseStudy!, metrics: draft.caseStudy!.metrics.map((x, j) => (j === i ? { ...x, label: v } : x)) })}
                        />
                        <button
                          type="button"
                          aria-label="Rakamı sil"
                          onClick={() => set('caseStudy', { ...draft.caseStudy!, metrics: draft.caseStudy!.metrics.filter((_, j) => j !== i) })}
                          className="mb-1 grid h-10 w-10 place-items-center rounded-lg text-ink/50 hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => set('caseStudy', { ...draft.caseStudy!, metrics: [...draft.caseStudy!.metrics, { value: '', label: { ...empty } }] })}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-accent-strong hover:bg-accent/10"
                  >
                    <Plus size={16} /> Rakam ekle
                  </button>
                </div>
              </>
            )}
          </Card>

          <GalleryEditor blocks={draft.gallery} onChange={(g) => set('gallery', g)} />

          {!isNew && (
            <div className="flex justify-center">
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Projeyi sil
              </Button>
            </div>
          )}
        </div>

        <aside className="sticky top-24 hidden rounded-2xl border border-black/[0.06] bg-white p-5 lg:block">
          <Preview p={{ ...draft, slug }} />
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-white p-5 lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Önizleme</p>
            <button type="button" aria-label="Önizlemeyi kapat" onClick={() => setShowPreview(false)} className="grid h-10 w-10 place-items-center rounded-full bg-black/5">
              <X size={18} />
            </button>
          </div>
          <Preview p={{ ...draft, slug }} />
        </div>
      )}

      <SaveBar dirty={dirty || isNew} saving={saving} onSave={onSave} onReset={isNew ? () => go('projeler') : reset} />
      <ConfirmDialog
        open={confirmDelete}
        title="Proje silinsin mi?"
        text={`“${original.title}” siteden kaldırılacak. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default function ProjectEditor({ slug }: { slug: string }) {
  const { content } = useAdmin();
  const isNew = slug === 'yeni';
  const original = useMemo(
    () => (isNew ? newProject(Math.max(0, ...content.projects.map((p) => p.order ?? 0)) + 1) : content.projects.find((p) => p.slug === slug)),
    [isNew, slug, content.projects],
  );
  if (!original) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink/60">Bu proje bulunamadı.</p>
        <a href={href('projeler')} className="mt-4 inline-block font-semibold text-accent-strong">
          Projelere dön
        </a>
      </div>
    );
  }
  return (
    <EditLangProvider>
      <Editor key={slug} original={original} isNew={isNew} />
    </EditLangProvider>
  );
}
