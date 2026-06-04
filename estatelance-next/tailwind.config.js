/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './libs/components/**/*.{js,ts,jsx,tsx}',
  ],
  important: '#__next',
  theme: {
    extend: {
      colors: {
        // Light — Minimal & Clean
        primary:        '#6366F1',
        'primary-dark': '#4F46E5',
        'primary-light': '#818CF8',

        // Dark — Dark Premium accent
        'dp-accent':     '#A855F7',
        'dp-accent-dark':'#9333EA',
        'dp-bg':         '#09090B',
        'dp-card':       '#111111',
        'dp-border':     '#27272A',

        // Common
        'surface-muted': '#FAFAFA',
        'border-subtle': '#E4E4E7',
        'text-muted':    '#71717A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.02em',
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        // Light
        card:   '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
        modal:  '0 10px 32px rgba(0,0,0,0.08)',
        indigo: '0 4px 16px rgba(99,102,241,0.3)',
        // Dark
        'dp-card':  '0 4px 20px rgba(0,0,0,0.6)',
        'dp-glow':  '0 0 32px rgba(168,85,247,0.25)',
        'dp-btn':   '0 4px 16px rgba(168,85,247,0.4)',
      },
      backgroundImage: {
        'dp-gradient': 'linear-gradient(135deg, #A855F7, #9333EA)',
        'dp-glow-radial': 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.15) 0%, transparent 65%)',
      },
    },
  },
  plugins: [
    // Global button outline reset
    function({ addBase }) {
      addBase({
        'button': { outline: 'none', '&:focus': { outline: 'none' } },
        '[type="button"]': { outline: 'none', '&:focus': { outline: 'none' } },
        '[type="submit"]': { outline: 'none', '&:focus': { outline: 'none' } },
        'input': { outline: 'none' },
        'select': { outline: 'none' },
        'textarea': { outline: 'none' },
      });
    },
  ],
  corePlugins: {
    preflight: false,
  },
}


