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
        accent: '#B98CFF',
        'accent-strong': '#7C4DDB',
      },
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
    },
  },
  plugins: [],
};
