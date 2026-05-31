/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './libs/components/**/*.{js,ts,jsx,tsx}',
  ],
  important: '#__next',
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        'primary-dark': '#3525cd',
        secondary: '#7c3aed',
        'bg-base': '#faf8ff',
        'surface-muted': '#f8fafc',
        'surface-container': '#eaedff',
        'on-surface': '#131b2e',
        'on-surface-variant': '#464555',
        'outline-variant': '#c7c4d8',
        'border-subtle': '#e2e8f0',
        'accent-indigo': '#818cf8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        modal: '0 10px 25px rgba(15,23,42,0.1)',
        indigo: '0 4px 20px rgba(79,70,229,0.35)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}


