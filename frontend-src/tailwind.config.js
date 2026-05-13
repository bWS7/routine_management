/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#FFF1F1',
          100: '#FFE1E1',
          200: '#FFC7C7',
          300: '#FFA1A1',
          400: '#FF6B6B',
          500: '#E60000', // Vermelho Accent
          600: '#990000', // Vinho Médio
          700: '#660000', // Vinho Profundo
          800: '#4D0000', // Vinho Dark
          900: '#330000',
        },
        sidebar: {
          bg:     '#0D0D0D', // Preto Profundo
          hover:  '#1A1A1A',
          active: '#262626',
          border: '#1A1A1A',
          text:   '#A3A3A3',
          label:  '#525252',
        },
        surface: {
          DEFAULT: '#F5F5F5',
          card:    '#FFFFFF',
          overlay: 'rgba(0,0,0,0.5)',
        },
        brand: '#660000', // Vinho
        success: { DEFAULT: '#22C55E', light: '#DCFCE7', dark: '#15803D' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
        error:   { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
        info:    { DEFAULT: '#3B82F6', light: '#DBEAFE', dark: '#1D4ED8' },
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'modal':   '0 20px 60px -15px rgb(0 0 0 / 0.25)',
        'toast':   '0 10px 25px -5px rgb(0 0 0 / 0.15)',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
