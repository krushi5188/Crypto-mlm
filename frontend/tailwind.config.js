/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome Premium Colors - Fixed for readability
        primary: '#000000',      // Black primary
        secondary: '#ffffff',    // White secondary
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
        
        // Semantic colors
        success: '#10b981',      // Green for success
        warning: '#f59e0b',      // Orange for warnings
        error: '#ef4444',        // Red for errors
        info: '#3b82f6',         // Blue for info
        
        // Text colors - FIXED for contrast
        'text': {
          primary: '#ffffff',              // White text for dark backgrounds
          secondary: 'rgba(255, 255, 255, 0.7)',
          muted: 'rgba(255, 255, 255, 0.5)',
          dimmed: 'rgba(255, 255, 255, 0.3)',
        },
        
        // Background colors
        'bg': {
          primary: '#000000',              // Black background
          secondary: '#0d0d0d',
          elevated: '#171717',
          card: '#1a1a1a',
        },
        
        // Glass/Overlay colors
        'glass': {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.1)',
          strong: 'rgba(255, 255, 255, 0.15)',
        },
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-border-strong': 'rgba(255, 255, 255, 0.2)',
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
