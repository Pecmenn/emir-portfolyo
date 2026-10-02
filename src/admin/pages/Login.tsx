import { Loader2, LogIn } from 'lucide-react';

export default function Login({ onLogin, busy, error }: { onLogin: () => void; busy: boolean; error: string }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <img src="/admin-logo.svg" alt="" className="h-12 w-12" />
        <div>
          <p className="font-display text-7xl font-semibold leading-[0.9] tracking-tight">
            Portfolyo
            <br />
            paneli.
          </p>
          <p className="mt-6 max-w-sm text-paper/60">Projelerini, metinlerini ve bilgilerini buradan güncelle. Kaydettiğin her değişiklik yaklaşık bir dakikada sitede yayınlanır.</p>
        </div>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
      <div className="flex items-center justify-center bg-paper p-6">
        <div className="w-full max-w-sm">
          <img src="/admin-logo.svg" alt="" className="mb-8 h-12 w-12 lg:hidden" />
          <h1 className="font-display text-4xl font-semibold tracking-tight">Hoş geldin</h1>
          <p className="mt-2 text-ink/60">Devam etmek için sitenin bağlı olduğu GitHub hesabıyla giriş yap.</p>
          <button
            type="button"
            onClick={onLogin}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-ink px-5 py-4 font-semibold text-paper transition hover:bg-ink/85 disabled:opacity-60"
          >
            {busy ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {busy ? 'Giriş yapılıyor…' : 'GitHub ile giriş yap'}
          </button>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <p className="mt-6 text-xs text-ink/45">Giriş penceresi açılmazsa tarayıcının açılır pencere engelleyicisini bu site için kapatın.</p>
        </div>
      </div>
    </div>
  );
}
