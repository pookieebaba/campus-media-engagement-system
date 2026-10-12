/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FDFCF8',
        foreground: '#2C2C24',
        moss: {
          DEFAULT: '#5D7052',
          light: '#7A9068',
          dark: '#4A5A40',
        },
        terracotta: {
          DEFAULT: '#C18C5D',
          light: '#D4A87A',
          dark: '#A87545',
        },
        sand: '#E6DCCD',
        stone: '#F0EBE5',
        border: '#DED8CF',
        destructive: {
          DEFAULT: '#A85448',
          light: '#C4675A',
          dark: '#8A3F35',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        moss: '0 4px 16px rgba(93,112,82,0.12)',
        card: '0 2px 8px rgba(44,44,36,0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
