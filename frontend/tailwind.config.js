/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fbbf24',
        secondary: '#10b981',
        accent: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'text': {
          primary: '#ffffff',
          secondary: '#e5e7eb',
          muted: '#9ca3af',
          dimmed: '#6b7280',
        },
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        display: ['Red Hat Display', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(251, 191, 36, 0.25)',
        'glow-strong': '0 0 60px rgba(251, 191, 36, 0.4)',
      },
    },
  },
  plugins: [],
}
