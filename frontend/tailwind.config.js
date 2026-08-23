/** @type {import('tailwindcss').Config} */

export default {

  content: ['./index.html', './src/**/*.{js,jsx}'],

  theme: {

    extend: {

      colors: {

        neff: {

          green: '#00FF85',

          dark: '#0A0A0A',

          card: '#111111',

          border: '#1E1E1E',

          text: '#FFFFFF',

          muted: '#888888',

        }

      },

      fontFamily: {

        sans: ['Inter', 'system-ui', 'sans-serif'],

      },

      keyframes: {

        fadeUp: {

          '0%': { opacity: '0', transform: 'translateY(12px)' },

          '100%': { opacity: '1', transform: 'translateY(0)' },

        },

      },

      animation: {

        'fade-up': 'fadeUp 0.5s ease-out both',

      },

    }

  },

  plugins: [

    require('@tailwindcss/typography'),

  ]

}