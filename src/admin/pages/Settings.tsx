import { FileText, Plus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { PATHS, toJSON, useAdmin, type SiteData } from '../store';
import { BiField, Card, EditLangProvider, Field, LangSwitch, PageHeader, SaveBar, TextInput, useDraft } from '../ui';

const TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
  { value: 'Europe/London', label: 'Londra' },
  { value: 'Europe/Berlin', label: 'Berlin / Amsterdam' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
  { value: 'Asia/Dubai', label: 'Dubai' },
];

function CvField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { addPendingFile, src, notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const name = value ? value.split('/').pop() : '';

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return notify('Lütfen PDF formatında bir dosya seçin.', 'error');
    setBusy(true);
    try {
      onChange(await addPendingFile(file, 'cv'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">CV (PDF)</p>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-paper/60 p-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-accent-strong shadow-sm">
          <FileText size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name || 'Henüz CV yüklenmedi'}</p>
          {value && (
            <a href={src(value)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent-strong">
              Aç
            </a>
          )}
        </div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-paper disabled:opacity-50">
          <Upload size={15} /> {value ? 'Değiştir' : 'Yükle'}
        </button>
      </div>
      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <p className="mt-1.5 text-[13px] text-ink/50">Menüdeki ve Hakkımda bölümündeki “CV İndir” butonları bu dosyayı indirir.</p>
    </div>
  );
}

function SettingsForm() {
  const { content, save, saving, pendingFor } = useAdmin();
  const { draft, setDraft, dirty, reset } = useDraft(content.site);
  const set = <K extends keyof SiteData>(key: K, value: SiteData[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const [advanced, setAdvanced] = useState(false);

  const onSave = () => save([{ path: PATHS.site, text: toJSON(draft) }, ...pendingFor(draft)], 'Panel: genel ayarlar güncellendi', { site: draft });

  return (
    <div>
      <PageHeader title="Ayarlar" description="Adınız, iletişim bilgileriniz, CV ve sosyal medya. Sitenin birçok yerinde kullanılır." actions={<LangSwitch />} />
      <div className="flex max-w-3xl flex-col gap-5 pb-28">
        <Card title="Kimlik">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ad soyad" hint="Alt bilgide dev boyutta görünür.">
              <TextInput value={draft.name} onChange={(v) => set('name', v)} />
            </Field>
            <Field label="Logo kısaltması" hint="Sol üst köşede görünür.">
              <TextInput value={draft.monogram} onChange={(v) => set('monogram', v)} placeholder="AS" />
            </Field>
          </div>
          <BiField label="Unvan" value={draft.role} onChange={(v) => set('role', v)} placeholder="Creative Generalist" />
        </Card>

        <Card title="İletişim">
          <Field label="E-posta" hint="İletişim bölümünde ve alt bilgide görünür.">
            <TextInput type="email" value={draft.email} onChange={(v) => set('email', v)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Şehir">
              <TextInput value={draft.location} onChange={(v) => set('location', v)} />
            </Field>
            <Field label="Saat dilimi" hint="Alt bilgideki yerel saat için.">
              <select
                value={draft.timeZone}
                onChange={(e) => set('timeZone', e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-paper/60 px-3.5 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/20"
              >
                {!TIMEZONES.some((z) => z.value === draft.timeZone) && <option value={draft.timeZone}>{draft.timeZone}</option>}
                {TIMEZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <CvField value={draft.cv} onChange={(v) => set('cv', v)} />
        </Card>

        <Card title="Sosyal medya" description="İletişim bölümünde ve alt bilgide bu sırayla görünür.">
          {draft.socials.map((s, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] items-end gap-2">
              <Field label="Ad">
                <TextInput value={s.label} placeholder="LinkedIn" onChange={(v) => set('socials', draft.socials.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
              </Field>
              <Field label="Bağlantı">
                <TextInput value={s.href} placeholder="https://" onChange={(v) => set('socials', draft.socials.map((x, j) => (j === i ? { ...x, href: v } : x)))} />
              </Field>
              <button type="button" aria-label="Bağlantıyı sil" onClick={() => set('socials', draft.socials.filter((_, j) => j !== i))} className="mb-1 grid h-10 w-10 place-items-center rounded-lg text-ink/45 hover:bg-red-50 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set('socials', [...draft.socials, { label: '', href: '' }])} className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-accent-strong hover:bg-accent/10">
            <Plus size={16} /> Bağlantı ekle
          </button>
        </Card>

        <Card title="Gelişmiş">
          {advanced ? (
            <Field label="Form adresi" hint="İletişim formunun mesajları göndereceği servis, ör. https://formspree.io/f/xxxx. Boşsa “Gönder” e-posta uygulamasını açar.">
              <TextInput value={draft.formEndpoint} onChange={(v) => set('formEndpoint', v)} placeholder="https://formspree.io/f/…" />
            </Field>
          ) : (
            <button type="button" onClick={() => setAdvanced(true)} className="w-fit text-sm font-semibold text-ink/55 hover:text-ink">
              İletişim formu ayarlarını göster
            </button>
          )}
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={onSave} onReset={reset} />
    </div>
  );
}

export default function Settings() {
  return (
    <EditLangProvider>
      <SettingsForm />
    </EditLangProvider>
  );
}
