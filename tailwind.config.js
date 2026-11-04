/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // hover: stilleri yalnızca fareli cihazlarda çalışır; telefonda dokunulan öğede takılı kalmaz
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        paper: '#F4F4F1',
        ink: '#0A0A0A',
        // Koyu zeminde okunur; açık zeminde (paper, proje tuvali) WCAG AA için mute-ink kullan
        mute: '#8C8C88',
        'mute-ink': '#6B6B67',
        // Elektrik mor: açık zeminde vurgu ve düğmeler; koyu zeminde metin için accent-soft
        accent: '#6236FF',
        'accent-soft': '#A993FF',
        'accent-strong': '#6236FF',
        // Ana sayfadaki 3B kutunun zemini (morumsu gece)
        night: '#120E22',
        // Görsel kartlarının açık zemini (soluk lila)
        mist: '#ECEAF3',
        // Yeni kimlik (LinkedIn kapağıyla aynı aile): siyah zemin, krem yazı, şarap vurgu
        coal: '#0D0B0B',
        'coal-2': '#161212',
        'coal-3': '#1E1818',
        seam: '#2C2525',
        cream: '#F1E9DE',
        stone: '#A99F95',
        wine: '#6B0F17',
        'wine-deep': '#4A0A10',
        // Siyah zeminde büyük yazı ve küçük dolgular (kontrast 3:1)
        'wine-bright': '#B8202F',
        // Siyah zeminde küçük yazı ve hata mesajları (kontrast 5:1)
        'wine-light': '#E0505F',
      },
      fontFamily: {
        // Başlıklar dar ve kalın (Anton), gövde sade (Hanken Grotesk)
        display: ['Anton', 'Impact', '"Arial Narrow"', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
    },
  },
  plugins: [],
};
