/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        'panel-bg': 'var(--panel-bg)',
        'panel-border': 'var(--panel-border)',
        muted: 'var(--muted)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        accent: 'var(--accent)',
        primary: 'var(--primary)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        node: {
          trigger: '#EC4899',   // pink
          action: '#3B82F6',    // blue
          logic: '#F59E0B',     // amber
          data: '#10B981',      // emerald
        }
      },
      animation: {
        'draw-line': 'draw 1s ease-out forwards',
      },
      keyframes: {
        draw: {
          '0%': { strokeDasharray: '0, 1000' },
          '100%': { strokeDasharray: '1000, 1000' },
        }
      }
    },
  },
  plugins: [],
}
