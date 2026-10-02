# CLAUDE.md

Kişisel portfolyo sitesi (Creative Generalist). React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + GSAP (ScrollTrigger) + Lenis + React Router. Arka uç yok.

- Komutlar: `npm run dev` (http://localhost:5173), `npm run build` (tip kontrolü + `dist/`), `npm run preview`.
- İçerik `src/content/` altındaki JSON dosyalarında (`site.json`, `home.json`, `ui.json`, `projects/*.json`) ve `/admin` panelinden (Decap CMS, `public/admin/index.html`) düzenlenir. `src/content.ts` yalnızca türleri tanımlar ve içeriği dağıtır. Her metin `{ tr, en }` çifti; bileşenlerde `useLang().t()` ile okunur. Bileşenlere metin gömme.
- İçeriğe yeni alan eklenirse hem JSON dosyasına, hem `src/content.ts` türüne, hem de `public/admin/index.html` içindeki panel alanlarına eklenmeli.
- Paneli yerelde kullanmak için `npm run dev` ile birlikte `npm run cms` (decap-server) çalıştırılır, panel http://localhost:5173/admin/index.html adresindedir.
- Sayfalar: `/` (`src/pages/Home.tsx`) ve `/proje/:slug` (`src/pages/Project.tsx`). Ana sayfa bölümleri `src/sections/`, ortak parçalar `src/components/`.
- Animasyon altyapısı `src/lib/`: `scroll.ts` (tek Lenis örneği + GSAP), `transition.tsx` (proje açılış geçişi `openProject`, diğer sayfa geçişleri `goTo`), `i18n.tsx` (TR/EN).
- Kaydırma Lenis ile yapılır; sayfa içi kaydırma için `scrollToTarget`, `window.scrollTo` kullanma. Animasyonlar `gsap.context` içinde kurulur ve temizlenir.
- Menünün açık/koyu rengi, altındaki bölümün `data-theme="dark"` özniteliğinden okunur; koyu bölümlere bu özniteliği ekle.
- Renk token'ları `tailwind.config.js`: `paper` #F4F4F1, `ink` #0A0A0A, `mute` #8C8C88, `accent` #B98CFF (mor). Sınıflarda bu adları kullan, sabit hex yazma. Fontlar: Clash Display (`font-display`), Satoshi (`font-sans`), Fontshare'den.
- Proje görselleri şimdilik picsum yer tutucuları; gerçek görseller `public/images/` altına konup `/images/...` yoluyla verilir. CV dosyası `public/cv/ad-soyad-cv.pdf`.
- Site iki dilli (TR varsayılan, EN); `<html lang>` dil seçimine göre güncellenir.
