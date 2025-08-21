/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom mobile breakpoints
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      // Touch-friendly spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Mobile-optimized typography
      fontSize: {
        '2xs': '0.625rem',
      },
      // Custom mobile utilities
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px',
      },
      // Animation for mobile interactions
      animation: {
        'tap': 'tap 0.1s ease-in-out',
      },
      keyframes: {
        tap: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
        }
      }
    },
  },
  plugins: [
    // Add line-clamp utility
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        // Safe area utilities for mobile devices with notches
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          'padding-right': 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}