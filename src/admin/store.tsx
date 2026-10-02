import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Project } from '../content';
import { SITE_URL, type FileChange, type GitHubClient } from './github';

export type Bi = { tr: string; en: string };
export type Lines = { tr: string[]; en: string[] };

export type SiteData = {
  name: string;
  monogram: string;
  role: Bi;
  email: string;
  location: string;
  timeZone: string;
  cv: string;
  formEndpoint: string;
  socials: { label: string; href: string }[];
};
export type AboutData = { label: Bi; lines: Lines; text: Bi };
export type WorkData = { slogans: Lines[] };
export type ExpertiseData = { marquee: Lines; listLabel: Bi; list: Lines };
export type ContactData = {
  label: Bi;
  title: Lines;
  text: Bi;
  copy: Bi;
  copied: Bi;
  form: Record<'name' | 'email' | 'message' | 'send' | 'sending' | 'sent' | 'error', Bi>;
};
export type UiData = Record<string, Bi | Record<string, Bi>>;

export type Content = {
  site: SiteData;
  about: AboutData;
  work: WorkData;
  expertise: ExpertiseData;
  contact: ContactData;
  ui: UiData;
  projects: Project[];
};

export const PATHS = {
  site: 'src/content/site.json',
  about: 'src/content/about.json',
  work: 'src/content/work.json',
  expertise: 'src/content/expertise.json',
  contact: 'src/content/contact.json',
  ui: 'src/content/ui.json',
  projectsDir: 'src/content/projects',
  project: (slug: string) => `src/content/projects/${slug}.json`,
} as const;

export const toJSON = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const sortProjects = (list: Project[]) => [...list].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

type Toast = { id: number; tone: 'ok' | 'error'; text: string };

type Ctx = {
  content: Content;
  user: { login: string; avatar_url: string };
  // Değişiklikleri GitHub'a tek commit olarak gönderir ve yerel kopyayı günceller
  save: (changes: FileChange[], message: string, next: Partial<Content>) => Promise<boolean>;
  saving: boolean;
  // Yeni seçilen görseller kaydedilene kadar bellekte bekler
  addPendingFile: (file: File, folder: 'images' | 'cv' | 'videos') => Promise<string>;
  pendingFor: (values: unknown) => FileChange[];
  src: (path: string | undefined) => string;
  notify: (text: string, tone?: Toast['tone']) => void;
  logout: () => void;
};

const AdminContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}

function slugifyFile(name: string) {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return name
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => map[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

// Büyük fotoğrafları yüklemeden önce 2400px genişliğe küçültür; site hızlı açılsın
async function prepareImage(file: File): Promise<{ blob: Blob; ext: string }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  if (!/^(jpe?g|webp)$/.test(ext)) return { blob: file, ext };
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap || bitmap.width <= 2400) return { blob: file, ext: ext === 'jpeg' ? 'jpg' : ext };
  const scale = 2400 / bitmap.width;
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b ?? file), 'image/jpeg', 0.86));
  return { blob, ext: 'jpg' };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function AdminProvider({
  client,
  initial,
  user,
  onLogout,
  children,
}: {
  client: GitHubClient;
  initial: Content;
  user: { login: string; avatar_url: string };
  onLogout: () => void;
  children: ReactNode;
}) {
  const [content, setContent] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pending = useRef(new Map<string, { base64: Promise<string>; url: string }>());

  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Math.random();
    setToasts((list) => [...list, { id, tone, text }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), tone === 'ok' ? 4200 : 7000);
  }, []);

  const addPendingFile = useCallback(async (file: File, folder: 'images' | 'cv' | 'videos') => {
    const base = slugifyFile(file.name.replace(/\.[^.]+$/, '')) || 'dosya';
    const { blob, ext } = folder === 'images' ? await prepareImage(file) : { blob: file as Blob, ext: (file.name.split('.').pop() || 'pdf').toLowerCase() };
    const path = `/${folder}/${base}-${Date.now().toString(36)}.${ext}`;
    pending.current.set(path, { base64: blobToBase64(blob), url: URL.createObjectURL(blob) });
    return path;
  }, []);

  // Kaydedilen içerikte geçen ve henüz yüklenmemiş dosyaları commit'e ekler
  const pendingFor = useCallback((values: unknown) => {
    const text = JSON.stringify(values);
    const changes: FileChange[] = [];
    pending.current.forEach((_v, path) => {
      if (text.includes(`"${path}"`)) changes.push({ path: `public${path}` });
    });
    return changes;
  }, []);

  const save = useCallback<Ctx['save']>(
    async (changes, message, next) => {
      setSaving(true);
      try {
        // Bekleyen dosyaların içeriğini commit'ten hemen önce hazırla
        const resolved = await Promise.all(
          changes.map(async (c) => {
            if (c.text !== undefined || c.delete || c.base64) return c;
            const item = pending.current.get(c.path.replace(/^public/, ''));
            return item ? { ...c, base64: await item.base64 } : c;
          }),
        );
        await client.commit(resolved, message);
        setContent((prev) => ({ ...prev, ...next }));
        notify('Kaydedildi. Site yaklaşık 1 dakika içinde güncellenecek.');
        return true;
      } catch (err) {
        notify(err instanceof Error ? `Kaydedilemedi: ${err.message}` : 'Kaydedilemedi.', 'error');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [client, notify],
  );

  const src = useCallback((path: string | undefined) => {
    if (!path) return '';
    const local = pending.current.get(path);
    if (local) return local.url;
    return path.startsWith('/') ? SITE_URL + path : path;
  }, []);

  useEffect(() => {
    const map = pending.current;
    return () => map.forEach((v) => URL.revokeObjectURL(v.url));
  }, []);

  const value = useMemo(
    () => ({ content, user, save, saving, addPendingFile, pendingFor, src, notify, logout: onLogout }),
    [content, user, save, saving, addPendingFile, pendingFor, src, notify, onLogout],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === 'ok' ? 'bg-ink text-paper' : 'bg-red-600 text-white'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
}

export async function loadContent(client: GitHubClient): Promise<Content> {
  const [site, about, work, expertise, contact, ui, files] = await Promise.all([
    client.readJSON<SiteData>(PATHS.site),
    client.readJSON<AboutData>(PATHS.about),
    client.readJSON<WorkData>(PATHS.work),
    client.readJSON<ExpertiseData>(PATHS.expertise),
    client.readJSON<ContactData>(PATHS.contact),
    client.readJSON<UiData>(PATHS.ui),
    client.listDir(PATHS.projectsDir),
  ]);
  const projects = await Promise.all(files.filter((f) => f.name.endsWith('.json')).map((f) => client.readJSON<Project>(f.path)));
  return { site, about, work, expertise, contact, ui, projects: sortProjects(projects) };
}
