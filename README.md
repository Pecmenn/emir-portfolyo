# Portfolyo

React, TypeScript, Tailwind CSS ve Framer Motion ile yazılmış tek sayfalık portfolyo sitesi.

## Çalıştırma

```
npm install
npm run dev
```

Site http://localhost:5173 adresinde açılır.

## İçeriği düzenleme

İsim, metinler, projeler ve sosyal bağlantılar `src/content.ts` dosyasındadır. Proje görsellerini `public/images/` klasörüne koyup `image: '/images/dosya.jpg'` şeklinde verin.

## Yayına alma

```
npm run build
```

`dist/` klasörü Vercel, Netlify veya Cloudflare Pages gibi statik barındırma servislerine yüklenebilir.
