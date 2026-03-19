/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas:   '#F5F0E8',   // warm cream page bg
        paper:    '#FDFAF5',   // slightly lighter surface
        linen:    '#EDE6D8',   // card / section bg
        tan:      '#C9A97A',   // primary brand accent
        sienna:   '#8B5E3C',   // deeper leather brown
        espresso: '#2C1A0E',   // near-black text
        fog:      '#9E9186',   // muted secondary text
        border:   '#D9CEBE',   // subtle borders
        rust:     '#C0542A',   // error / alert
        sage:     '#5E7A5A',   // success green
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'tan-gradient':    'linear-gradient(135deg, #C9A97A 0%, #8B5E3C 100%)',
        'canvas-gradient': 'linear-gradient(180deg, #FDFAF5 0%, #F5F0E8 100%)',
      },
      boxShadow: {
        'soft':   '0 1px 3px rgba(44,26,14,0.06), 0 4px 16px rgba(44,26,14,0.04)',
        'card':   '0 2px 8px rgba(44,26,14,0.08), 0 12px 32px rgba(44,26,14,0.06)',
        'hover':  '0 4px 16px rgba(44,26,14,0.12), 0 16px 40px rgba(44,26,14,0.08)',
      },
      animation: {
        'fade-up':   'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fadeIn 0.5s ease both',
        'shimmer':   'shimmer 1.8s infinite',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
    },
  },
  plugins: [],
};