/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Clean Monochrome Color System - Based on template.html
      colors: {
        // Base Colors
        black: '#000000',
        white: '#ffffff',

        // Grays
        gray: {
          50: '#f9f9f9',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#c2c2c2',
          400: '#a6a6a6',
          500: '#8a8a8a',
          600: '#6e6e6e',
          700: '#525252',
          800: '#404040',
          900: '#0d0d0d',
        },

        // White Alpha (for overlays, borders, etc)
        'white-alpha': {
          65: 'rgba(255, 255, 255, 0.65)',
          50: 'rgba(255, 255, 255, 0.5)',
          25: 'rgba(255, 255, 255, 0.25)',
          20: 'rgba(255, 255, 255, 0.2)',
          15: 'rgba(255, 255, 255, 0.15)',
          10: 'rgba(255, 255, 255, 0.1)',
          5: 'rgba(255, 255, 255, 0.05)',
          3: 'rgba(255, 255, 255, 0.03)',
          2: 'rgba(255, 255, 255, 0.02)',
        },

        // Black Alpha
        'black-alpha': {
          85: 'rgba(0, 0, 0, 0.85)',
          50: 'rgba(0, 0, 0, 0.5)',
          35: 'rgba(0, 0, 0, 0.35)',
          15: 'rgba(0, 0, 0, 0.15)',
        },

        // Semantic Colors (minimal, only when necessary)
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },

      // Typography
      fontFamily: {
        display: ['"Red Hat Display"', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },

      fontSize: {
        'display': ['64px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['36px', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
      },

      // Spacing (8px grid)
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },

      // Border Radius
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      // Shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-strong': '0 0 40px rgba(255, 255, 255, 0.15)',
      },

      // Animation
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
