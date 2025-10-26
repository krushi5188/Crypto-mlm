/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure Monochrome System
        black: '#000000',
        white: '#ffffff',

        gray: {
          900: '#0d0d0d',
          800: '#1a1a1a',
          700: '#262626',
          600: '#404040',
          500: '#525252',
          400: '#737373',
          300: '#a6a6a6',
          200: '#d4d4d4',
          100: '#e5e5e5',
        },
      },

      fontFamily: {
        display: ['"Red Hat Display"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
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
      },
    },
  },
  plugins: [],
}
