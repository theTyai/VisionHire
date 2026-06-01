/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9f7',
          100: '#d9f0ea',
          200: '#b4e1d5',
          300: '#84cdbc',
          400: '#53b39f',
          500: '#0D6F56', // Deep Teal from Logo
          600: '#0a5a45',
          700: '#084838',
          800: '#06392d',
          900: '#052e25',
          950: '#021a15',
        },
        accent: {
          400: '#fbbf24',
          500: '#F2A900', // Yellow/Orange Arrow from Logo
          600: '#d97706',
        },
        dark: {
          900: '#0a0b14',
          800: '#0f1020',
          700: '#141628',
          600: '#1c1f38',
          500: '#242847',
          400: '#2e3358',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideIn: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        fadeIn: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
