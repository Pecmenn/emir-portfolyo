// GitHub ile konuşan küçük katman: giriş, dosya okuma ve birden çok dosyayı tek commit'te kaydetme.

export const REPO = 'Pecmenn/emir-portfolyo';
export const BRANCH = 'main';
// GitHub girişi Netlify'nın OAuth hizmeti üzerinden yapılır (site Cloudflare'da yayında olsa da); giriş bu Netlify sitesi adına açılır
export const SITE_ID = 'emir-portfolyo.netlify.app';
// Görseller ve "Siteyi aç" bağlantısı panelin açıldığı adresten gelir: yerelde geliştirme sunucusu,
// yayında ise sitenin kendi adresi (hangi barındırma veya alan adı olursa olsun)
export const SITE_URL = window.location.origin;

const API = 'https://api.github.com';
const TOKEN_KEY = 'admin-token';

export function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function forgetToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Depolama kapalıysa yapacak bir şey yok
  }
}

// Netlify'ın OAuth penceresiyle el sıkışma: pencere "authorizing:github" der, biz aynısını geri yollarız,
// pencere de sonucu "authorization:github:success:{...}" olarak bildirir.
export function login(): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = 520;
    const h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      `https://api.netlify.com/auth?provider=github&site_id=${SITE_ID}&scope=repo`,
      'github-login',
      `width=${w},height=${h},left=${left},top=${top}`,
    );
    if (!popup) {
      reject(new Error('Giriş penceresi açılamadı. Tarayıcının açılır pencere engelleyicisini kapatıp tekrar deneyin.'));
      return;
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://api.netlify.com' || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') {
        popup.postMessage(e.data, e.origin);
        return;
      }
      const match = e.data.match(/^authorization:github:(success|error):(.+)$/);
      if (!match) return;
      cleanup();
      try {
        const payload = JSON.parse(match[2]);
        if (match[1] === 'success' && payload.token) {
          try {
            localStorage.setItem(TOKEN_KEY, payload.token);
          } catch {
            // Depolama kapalıysa oturum bu sekmeyle sınırlı kalır
          }
          resolve(payload.token);
        } else {
          reject(new Error(payload.message || 'GitHub girişi tamamlanamadı.'));
        }
      } catch {
        reject(new Error('GitHub girişi tamamlanamadı.'));
      }
    };

    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Giriş penceresi kapatıldı.'));
      }
    }, 600);

    function cleanup() {
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
    }
    window.addEventListener('message', onMessage);
  });
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function createClient(token: string) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(API + path, {
      ...init,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.json()).message ?? '';
      } catch {
        // Gövde JSON değilse durum koduyla yetin
      }
      throw new GitHubError(detail || `GitHub isteği başarısız (${res.status})`, res.status);
    }
    return (res.status === 204 ? null : await res.json()) as T;
  }

  const decode = (b64: string) => {
    const bin = atob(b64.replace(/\n/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  };

  return {
    user: () => request<{ login: string; avatar_url: string; name: string | null }>('/user'),

    canWrite: async () => {
      const repo = await request<{ permissions?: { push?: boolean } }>(`/repos/${REPO}`);
      return !!repo.permissions?.push;
    },

    readJSON: async <T,>(path: string): Promise<T> => {
      const file = await request<{ content: string }>(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
      return JSON.parse(decode(file.content)) as T;
    },

    listDir: (path: string) => request<{ name: string; path: string; type: string }[]>(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`),

    // Değişiklikleri tek bir commit olarak gönderir; böylece Netlify siteyi bir kez yeniden yayınlar
    commit: async (changes: FileChange[], message: string) => {
      const ref = await request<{ object: { sha: string } }>(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
      const head = ref.object.sha;
      const commit = await request<{ tree: { sha: string } }>(`/repos/${REPO}/git/commits/${head}`);

      const tree = await Promise.all(
        changes.map(async (c) => {
          if (c.delete) return { path: c.path, mode: '100644', type: 'blob', sha: null };
          const blob = await request<{ sha: string }>(`/repos/${REPO}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify(c.base64 ? { content: c.base64, encoding: 'base64' } : { content: c.text ?? '', encoding: 'utf-8' }),
          });
          return { path: c.path, mode: '100644', type: 'blob', sha: blob.sha };
        }),
      );

      const newTree = await request<{ sha: string }>(`/repos/${REPO}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: commit.tree.sha, tree }),
      });
      const newCommit = await request<{ sha: string }>(`/repos/${REPO}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
      });
      await request(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: newCommit.sha }),
      });
      return newCommit.sha;
    },
  };
}

export type FileChange = { path: string; text?: string; base64?: string; delete?: boolean };
export type GitHubClient = ReturnType<typeof createClient>;
