/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome Premium Colors (from template)
        primary: '#ffffff',
        secondary: '#000000',
        accent: '#404040',
        
        // Base colors
        black: '#000000',
        white: '#ffffff',
        
        // Grays
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0d0d0d',
        },
        
        // Semantic colors (monochrome versions)
        success: '#ffffff',
        warning: '#a3a3a3',
        error: '#525252',
        info: '#737373',
        
        // Text colors
        'text': {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.65)',
          muted: 'rgba(255, 255, 255, 0.5)',
          dimmed: 'rgba(255, 255, 255, 0.25)',
        },
        
        // Glass/Overlay colors
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        display: ['Red Hat Display', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(255, 255, 255, 0.15)',
        'glow-strong': '0 0 60px rgba(255, 255, 255, 0.25)',
      },
    },
  },
  plugins: [],
}
