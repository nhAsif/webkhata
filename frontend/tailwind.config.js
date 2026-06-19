/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#F0F0F0',
        matter: '#FFFFFF',
        pure: '#121212',
        stardust: '#4B5563',
        boundary: '#121212',
        bitcoin: '#D02020', // Bauhaus Red
        burnt: '#1040C0',   // Bauhaus Blue
        gold: '#F0C020',    // Bauhaus Yellow
      },
      fontFamily: {
        heading: ["'Outfit'", "sans-serif"],
        body: ["'Outfit'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        'spin-slow': 'spin 15s linear infinite',
        'spin-reverse': 'spin-reverse 20s linear infinite',
        'float': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
