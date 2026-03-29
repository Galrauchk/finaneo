/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0A2540', light: '#1a3a5c', dark: '#061b2e' },
        gold: { DEFAULT: '#C9A84C', light: '#d4bc72', dark: '#b8963a' },
        dark: '#1A1A2E',
        light: '#F5F7FA',
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'h1': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'h2': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
      },
      maxWidth: {
        'site': '1200px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(10,37,64,0.08), 0 4px 12px rgba(10,37,64,0.04)',
        'card-hover': '0 8px 30px rgba(10,37,64,0.12), 0 2px 8px rgba(10,37,64,0.06)',
        'nav': '0 2px 20px rgba(10,37,64,0.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
