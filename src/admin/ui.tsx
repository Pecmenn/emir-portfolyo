import { ArrowDown, ArrowUp, Check, Film, ImagePlus, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clone, useAdmin, type Bi, type Lines } from './store';

// ---------- Düzenleme dili (TR / EN) ----------

type EditLang = 'tr' | 'en';
const LangContext = createContext<{ lang: EditLang; setLang: (l: EditLang) => void }>({ lang: 'tr', setLang: () => {} });
export const useEditLang = () => useContext(LangContext);

export function EditLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<EditLang>('tr');
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function LangSwitch() {
  const { lang, setLang } = useEditLang();
  return (
    <div className="inline-flex rounded-full bg-black/[0.06] p-1 text-sm font-semibold" role="tablist" aria-label="Düzenleme dili">
      {(['tr', 'en'] as const).map((code) => (
        <button
          key={code}
          role="tab"
          aria-selected={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-4 py-1.5 transition-colors ${lang === code ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
        >
          {code === 'tr' ? 'Türkçe' : 'English'}
        </button>
      ))}
    </div>
  );
}

// ---------- Taslak yönetimi ----------

export function useDraft<T>(original: T) {
  const [draft, setDraft] = useState<T>(() => clone(original));
  const originalJSON = useMemo(() => JSON.stringify(original), [original]);
  useEffect(() => setDraft(clone(original)), [originalJSON]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(draft) !== originalJSON;

  // Kaydedilmemiş değişiklik varken sekme kapatılırsa uyar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return { draft, setDraft, dirty, reset: () => setDraft(clone(original)) };
}

// ---------- Düzen parçaları ----------

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, aside }: { title?: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
      {(title || aside) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink/55">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, badge }: { label: string; hint?: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        {label}
        {badge}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] leading-snug text-ink/50">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-black/10 bg-paper/60 px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-ink/30 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/20';

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

export function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Yazdıkça kutu uzar; uzun metinlerde kaydırma çubuğu çıkmaz
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={3}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} resize-none leading-relaxed`}
    />
  );
}

function MissingBadge({ show, other }: { show: boolean; other: EditLang }) {
  if (!show) return null;
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{other === 'en' ? 'İngilizcesi boş' : 'Türkçesi boş'}</span>;
}

// İki dilli metin: yalnızca seçili dilin kutusu görünür, diğer dil boşsa uyarı rozeti çıkar
export function BiField({ label, hint, value, onChange, long, placeholder }: { label: string; hint?: string; value: Bi | undefined; onChange: (v: Bi) => void; long?: boolean; placeholder?: string }) {
  const { lang } = useEditLang();
  const v = value ?? { tr: '', en: '' };
  const other = lang === 'tr' ? 'en' : 'tr';
  const set = (text: string) => onChange({ ...v, [lang]: text });
  return (
    <Field label={label} hint={hint} badge={<MissingBadge show={!!v[lang] && !v[other]} other={other} />}>
      {long ? <TextArea value={v[lang]} onChange={set} placeholder={placeholder} /> : <TextInput value={v[lang]} onChange={set} placeholder={placeholder} />}
    </Field>
  );
}

function IconButton({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/50 transition hover:bg-black/[0.05] hover:text-ink disabled:opacity-25 ${danger ? 'hover:!bg-red-50 hover:!text-red-600' : ''}`}
    >
      {children}
    </button>
  );
}

export function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Satır satır kayarak beliren metinler: her satır ayrı kutu, eklenebilir, silinebilir, sıralanabilir
export function LinesField({ label, hint, value, onChange, addLabel = 'Satır ekle' }: { label: string; hint?: string; value: Lines | undefined; onChange: (v: Lines) => void; addLabel?: string }) {
  const { lang } = useEditLang();
  const v = value ?? { tr: [], en: [] };
  const list = v[lang] ?? [];
  const other = lang === 'tr' ? 'en' : 'tr';
  const set = (next: string[]) => onChange({ ...v, [lang]: next });
  const mismatch = (v[other]?.length ?? 0) !== list.length && list.length > 0 && (v[other]?.length ?? 0) > 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        {label}
        <MissingBadge show={list.length > 0 && !(v[other]?.length)} other={other} />
        {mismatch && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold text-ink/60">TR {v.tr.length} · EN {v.en.length} satır</span>}
      </div>
      <div className="flex flex-col gap-2">
        {list.map((line, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-6 shrink-0 text-right text-xs font-semibold text-ink/30">{i + 1}</span>
            <input value={line} onChange={(e) => set(list.map((l, j) => (j === i ? e.target.value : l)))} className={`${inputClass} ml-1`} />
            <IconButton label="Yukarı taşı" disabled={i === 0} onClick={() => set(move(list, i, i - 1))}>
              <ArrowUp size={16} />
            </IconButton>
            <IconButton label="Aşağı taşı" disabled={i === list.length - 1} onClick={() => set(move(list, i, i + 1))}>
              <ArrowDown size={16} />
            </IconButton>
            <IconButton label="Satırı sil" danger onClick={() => set(list.filter((_, j) => j !== i))}>
              <X size={16} />
            </IconButton>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => set([...list, ''])} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-accent-strong hover:bg-accent/10">
        <Plus size={16} /> {addLabel}
      </button>
      {hint && <p className="mt-1 text-[13px] leading-snug text-ink/50">{hint}</p>}
    </div>
  );
}

// Görsel seçme: sürükle-bırak veya tıkla; yüklenen görsel hemen önizlenir, kaydedince siteye gider
export function ImageField({ label, hint, value, onChange, aspect = 'aspect-[16/10]' }: { label: string; hint?: string; value: string | undefined; onChange: (v: string) => void; aspect?: string }) {
  const { src, addPendingFile, notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Lütfen bir görsel dosyası seçin (JPG, PNG veya WebP).', 'error');
      return;
    }
    setBusy(true);
    try {
      onChange(await addPendingFile(file, 'images'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`group relative overflow-hidden rounded-xl border-2 border-dashed transition ${aspect} ${
          over ? 'border-accent bg-accent/10' : value ? 'border-transparent' : 'border-black/15 bg-paper/60 hover:border-accent/60'
        }`}
      >
        {value ? (
          <>
            <img src={src(value)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/50 via-transparent p-3 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold shadow">
                <Upload size={15} /> Değiştir
              </button>
              <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow">
                <Trash2 size={15} /> Kaldır
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/50">
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus size={28} />}
            <span className="text-sm font-medium">Görsel seç veya buraya sürükle</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {hint && <p className="mt-1.5 text-[13px] leading-snug text-ink/50">{hint}</p>}
    </div>
  );
}

// Cloudflare Pages dosya başına en fazla 25 MB kabul eder
const MAX_VIDEO_MB = 25;
const WARN_VIDEO_MB = 12;

// Video: ya dosya yüklenir (kısa döngüler) ya da başka bir servisteki doğrudan video bağlantısı yapıştırılır
export function VideoField({ label, hint, value, onChange, poster }: { label: string; hint?: string; value: string | undefined; onChange: (v: string) => void; poster?: string }) {
  const { src, addPendingFile, notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'link'>(value && /^https?:/.test(value) ? 'link' : 'upload');
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!/^video\/(mp4|webm)$/.test(file.type)) return notify('Lütfen MP4 veya WebM formatında bir video seçin.', 'error');
    const mb = file.size / 1024 / 1024;
    if (mb > MAX_VIDEO_MB)
      return notify(`Bu video ${mb.toFixed(0)} MB. Panelden en fazla ${MAX_VIDEO_MB} MB yüklenebilir; uzun videolar için "Bağlantı" seçeneğini kullanın.`, 'error');
    if (mb > WARN_VIDEO_MB) notify(`Video ${mb.toFixed(0)} MB; sayfanın yavaş açılmaması için ${WARN_VIDEO_MB} MB altı önerilir.`, 'error');
    setBusy(true);
    try {
      onChange(await addPendingFile(file, 'videos'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <div className="inline-flex rounded-lg bg-black/[0.05] p-0.5 text-xs font-semibold">
          {(['upload', 'link'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-md px-2.5 py-1 ${mode === m ? 'bg-white shadow-sm' : 'text-ink/55'}`}>
              {m === 'upload' ? 'Dosya yükle' : 'Bağlantı'}
            </button>
          ))}
        </div>
      </div>
      {value ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
          <video src={src(value)} poster={poster ? src(poster) : undefined} muted loop playsInline autoPlay className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 p-3">
            {mode === 'upload' && (
              <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold shadow">
                <Upload size={15} /> Değiştir
              </button>
            )}
            <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow">
              <Trash2 size={15} /> Kaldır
            </button>
          </div>
        </div>
      ) : mode === 'upload' ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-paper/60 text-ink/50 transition hover:border-accent/60"
        >
          {busy ? <Loader2 className="animate-spin" /> : <Film size={28} />}
          <span className="text-sm font-medium">MP4 veya WebM video seç</span>
          <span className="text-xs">En fazla {MAX_VIDEO_MB} MB · {WARN_VIDEO_MB} MB altı önerilir</span>
        </button>
      ) : (
        <input
          type="url"
          placeholder="https://… .mp4"
          onBlur={(e) => e.target.value && onChange(e.target.value.trim())}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className={inputClass}
        />
      )}
      <input ref={input} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <p className="mt-1.5 text-[13px] leading-snug text-ink/50">
        {mode === 'link'
          ? 'Doğrudan video dosyasının bağlantısını yapıştırın (sonu .mp4 veya .webm ile biten). Cloudinary veya Bunny gibi servisler bu bağlantıyı verir; YouTube sayfa bağlantıları çalışmaz.'
          : hint ?? 'Kısa döngüler için uygundur. Sitede sessiz ve döngüde oynar.'}
      </p>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start justify-between gap-4 text-left">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-ink/50">{hint}</span>}
      </span>
      <span className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-accent-strong' : 'bg-black/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-ink text-paper hover:bg-ink/85',
    soft: 'bg-black/[0.06] text-ink hover:bg-black/10',
    ghost: 'text-ink/70 hover:bg-black/[0.05] hover:text-ink',
    danger: 'text-red-600 hover:bg-red-50',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

// Kaydedilmemiş değişiklik varken altta beliren çubuk
export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div
      className={`fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 px-3 transition-all duration-300 md:bottom-6 ${
        dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-paper shadow-2xl">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-accent" /> Kaydedilmemiş değişiklikler
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} disabled={saving} className="rounded-lg px-3 py-2 text-sm font-semibold text-paper/70 hover:text-paper disabled:opacity-40">
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-ink hover:brightness-105 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Yayınlanıyor…' : 'Kaydet ve yayınla'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="dialog" aria-modal className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-ink/60">{text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
