/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#1DA1F2', 600: '#1a8cd8' },
        dark: {
          300: '#94a3b8', 400: '#64748b', 500: '#475569',
          600: '#334155', 700: '#1e293b', 800: '#15202b',
          900: '#0f172a', 950: '#0a0f1a',
        },
      },
    },
  },
  plugins: [],
};
