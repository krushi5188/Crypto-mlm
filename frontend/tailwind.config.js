/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome base
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#404040',
        
        // Base colors
        black: '#000000',
        white: '#ffffff',
        
        // BRIGHT Gold colors (highly visible on black)
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',  // BRIGHT yellow-gold
          500: '#f59e0b',  // BRIGHT orange-gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // BRIGHT Green colors (highly visible on black)
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',  // BRIGHT green
          500: '#22c55e',  // BRIGHT green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        
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
        
        // Semantic colors - BRIGHT and visible
        success: '#22c55e',      // Bright green
        warning: '#f59e0b',      // Bright orange
        error: '#ef4444',        // Bright red
        info: '#3b82f6',         // Bright blue
        
        // Text colors with STRONG contrast
        'text': {
          primary: '#ffffff',              // Pure white
          secondary: '#e5e5e5',            // Very light gray (was too dim)
          muted: '#a3a3a3',                // Medium gray (was too dim)
          dimmed: '#737373',               // Lighter gray
        },
        
        // Background colors
        'bg': {
          primary: '#000000',
          secondary: '#0d0d0d',
          elevated: '#171717',
          card: '#1a1a1a',
          page: '#000000',
          section: '#0a0a0a',
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
        'glow': '0 0 40px rgba(251, 191, 36, 0.3)',
        'glow-strong': '0 0 60px rgba(251, 191, 36, 0.4)',
        'glow-gold': '0 0 40px rgba(251, 191, 36, 0.3)',
        'glow-green': '0 0 40px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
}
