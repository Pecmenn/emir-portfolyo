import { ExternalLink, FolderKanban, House, Loader2, LogOut, Settings as SettingsIcon, Type } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, createLocalClient, forgetToken, GitHubError, LOCAL_MODE, login, savedToken, SITE_URL } from './github';
import { HomeSectionEditor, HomeSectionsList } from './pages/HomeSections';
import Login from './pages/Login';
import ProjectEditor from './pages/ProjectEditor';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Texts from './pages/Texts';
import { href, useRoute } from './router';
import { AdminProvider, loadContent, useAdmin, type Content } from './store';

const NAV = [
  { key: 'projeler', label: 'Projeler', icon: FolderKanban },
  { key: 'ana-sayfa', label: 'Ana sayfa', icon: House },
  { key: 'ayarlar', label: 'Ayarlar', icon: SettingsIcon },
  { key: 'metinler', label: 'Metinler', icon: Type },
];

function Shell() {
  const route = useRoute();
  const { user, logout } = useAdmin();
  const [page = 'projeler', sub] = route;

  let view;
  if (page === 'projeler') view = sub ? <ProjectEditor slug={sub} /> : <Projects />;
  else if (page === 'ana-sayfa') view = sub ? <HomeSectionEditor sectionKey={sub} /> : <HomeSectionsList />;
  else if (page === 'ayarlar') view = <Settings />;
  else if (page === 'metinler') view = <Texts />;
  else view = <Projects />;

  return (
    <div className="min-h-[100svh] bg-paper pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href={href('projeler')} className="flex items-center gap-2.5">
            <img src="/admin-logo.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight">Panel</span>
          </a>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.key}
                href={href(n.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  page === n.key ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-black/[0.05] hover:text-ink'
                }`}
              >
                <n.icon size={16} /> {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink/60 hover:bg-black/[0.05] hover:text-ink">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Siteyi aç</span>
            </a>
            {user.login === 'yerel' || user.login === 'deneme' ? (
              // Yerel modda giriş yok; kayıtlar bilgisayardaki dosyalara gider
              <span
                title={user.login === 'yerel' ? 'Kayıtlar bilgisayardaki dosyalara yazılır ve yerel commit olarak birikir; canlıya alınana kadar yayına çıkmaz.' : 'Deneme modu: kaydetme kapalı.'}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent-strong"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
                {user.login === 'yerel' ? 'Yerel mod' : 'Deneme'}
              </span>
            ) : (
              <>
                <img src={user.avatar_url} alt={user.login} title={user.login} className="ml-1 h-8 w-8 rounded-full" />
                <button type="button" onClick={logout} aria-label="Çıkış yap" title="Çıkış yap" className="grid h-9 w-9 place-items-center rounded-xl text-ink/50 hover:bg-black/[0.05] hover:text-ink">
                  <LogOut size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">{view}</main>

      {/* Telefonda alt sekme çubuğu */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-black/[0.06] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {NAV.map((n) => (
          <a key={n.key} href={href(n.key)} className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${page === n.key ? 'text-accent-strong' : 'text-ink/45'}`}>
            <n.icon size={20} />
            {n.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

type State =
  | { status: 'signed-out'; error: string; busy: boolean }
  | { status: 'loading' }
  | { status: 'ready'; content: Content; user: { login: string; avatar_url: string }; token: string }
  | { status: 'error'; message: string };

// Yalnızca geliştirme sunucusunda: /admin?demo arayüzü yerel içerikle dener, kaydetme kapalıdır
const DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');

// Yerel mod (localhost) ve deneme modu: giriş yok, içerik proje dosyalarından okunur
function LocalApp({ readOnly }: { readOnly: boolean }) {
  const client = useMemo(() => {
    const local = createLocalClient();
    if (!readOnly) return local;
    return {
      ...local,
      commit: async () => {
        throw new Error('Deneme modunda kaydetme kapalı.');
      },
    };
  }, [readOnly]);
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    loadContent(client).then(setContent, (err) => setError(err instanceof Error ? err.message : 'İçerik okunamadı.'));
  }, [client]);

  if (error)
    return (
      <div className="grid min-h-[100svh] place-items-center bg-paper p-6 text-center text-ink/60">
        <p>Yerel içerik okunamadı: {error}. Geliştirme sunucusunu (npm run dev) yeniden başlatmayı deneyin.</p>
      </div>
    );
  if (!content) return null;
  return (
    <AdminProvider client={client} initial={content} user={{ login: readOnly ? 'deneme' : 'yerel', avatar_url: '/admin-logo.svg' }} onLogout={() => {}}>
      <Shell />
    </AdminProvider>
  );
}

export default function App() {
  if (DEMO || LOCAL_MODE) return <LocalApp readOnly={DEMO} />;
  return <LiveApp />;
}

function LiveApp() {
  const [token, setToken] = useState(savedToken);
  const [state, setState] = useState<State>(token ? { status: 'loading' } : { status: 'signed-out', error: '', busy: false });
  const client = useMemo(() => (token ? createClient(token) : null), [token]);

  const logout = useCallback(() => {
    forgetToken();
    setToken(null);
    setState({ status: 'signed-out', error: '', busy: false });
  }, []);

  useEffect(() => {
    if (!client || !token) return;
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const [user, canWrite] = await Promise.all([client.user(), client.canWrite()]);
        if (!canWrite) {
          if (!cancelled) setState({ status: 'error', message: `“${user.login}” hesabının bu sitenin içeriğini değiştirme yetkisi yok.` });
          return;
        }
        const content = await loadContent(client);
        if (!cancelled) setState({ status: 'ready', content, user, token });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof GitHubError && err.status === 401) {
          forgetToken();
          setToken(null);
          setState({ status: 'signed-out', error: 'Oturumun süresi doldu, lütfen tekrar giriş yap.', busy: false });
        } else {
          setState({ status: 'error', message: err instanceof Error ? err.message : 'İçerik yüklenemedi.' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, token]);

  const onLogin = async () => {
    setState({ status: 'signed-out', error: '', busy: true });
    try {
      setToken(await login());
    } catch (err) {
      setState({ status: 'signed-out', error: err instanceof Error ? err.message : 'Giriş yapılamadı.', busy: false });
    }
  };

  if (state.status === 'signed-out') return <Login onLogin={onLogin} busy={state.busy} error={state.error} />;
  if (state.status === 'loading')
    return (
      <div className="grid min-h-[100svh] place-items-center bg-paper text-ink/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" />
          <p className="text-sm font-medium">İçerik yükleniyor…</p>
        </div>
      </div>
    );
  if (state.status === 'error')
    return (
      <div className="grid min-h-[100svh] place-items-center bg-paper p-6 text-center">
        <div className="max-w-sm">
          <p className="font-display text-2xl font-semibold">Bir sorun var</p>
          <p className="mt-2 text-ink/60">{state.message}</p>
          <button type="button" onClick={logout} className="mt-6 rounded-xl bg-ink px-5 py-3 font-semibold text-paper">
            Farklı hesapla giriş yap
          </button>
        </div>
      </div>
    );

  return (
    <AdminProvider client={client!} initial={state.content} user={state.user} onLogout={logout}>
      <Shell />
    </AdminProvider>
  );
}
