/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
      },
      fontFamily: {
        display: ['"General Sans"', 'system-ui', 'sans-serif'],
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
    },
  },
  plugins: [],
};
