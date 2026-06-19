/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map legacy colors to new dynamic tokens
        void: 'var(--neutral-secondary-soft)', // page background
        matter: 'var(--neutral-primary-soft)', // card background (cream)
        pure: 'var(--neo-ink)',
        stardust: 'var(--body-subtle)',
        boundary: 'var(--border-default)',
        bitcoin: 'var(--brand)',
        burnt: 'var(--dark)',
        gold: 'var(--warning)',
        black: 'var(--neo-border)',

        // Standard Design Tokens
        'neutral-primary-soft': 'var(--neutral-primary-soft)',
        'neutral-primary': 'var(--neutral-primary)',
        'neutral-primary-medium': 'var(--neutral-primary-medium)',
        'neutral-primary-strong': 'var(--neutral-primary-strong)',
        'neutral-secondary-soft': 'var(--neutral-secondary-soft)',
        'neutral-secondary': 'var(--neutral-secondary)',
        'neutral-secondary-medium': 'var(--neutral-secondary-medium)',
        'neutral-secondary-strong': 'var(--neutral-secondary-strong)',
        'neutral-tertiary-soft': 'var(--neutral-tertiary-soft)',
        'neutral-tertiary': 'var(--neutral-tertiary)',
        'neutral-tertiary-medium': 'var(--neutral-tertiary-medium)',
        'neutral-quaternary': 'var(--neutral-quaternary)',
        'quaternary-medium': 'var(--quaternary-medium)',
        gray: 'var(--gray)',

        brand: 'var(--brand)',
        'brand-softer': 'var(--brand-softer)',
        'brand-soft': 'var(--brand-soft)',
        'brand-medium': 'var(--brand-medium)',
        'brand-strong': 'var(--brand-strong)',

        success: 'var(--success)',
        'success-soft': 'var(--success-soft)',
        'success-medium': 'var(--success-medium)',
        'success-strong': 'var(--success-strong)',

        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        'danger-medium': 'var(--danger-medium)',
        'danger-strong': 'var(--danger-strong)',

        warning: 'var(--warning)',
        'warning-soft': 'var(--warning-soft)',
        'warning-medium': 'var(--warning-medium)',
        'warning-strong': 'var(--warning-strong)',

        dark: 'var(--dark)',
        'dark-strong': 'var(--dark-strong)',
        disabled: 'var(--disabled)',

        // Accents
        purple: 'var(--purple)',
        sky: 'var(--sky)',
        teal: 'var(--teal)',
        pink: 'var(--pink)',
        cyan: 'var(--cyan)',
        fuchsia: 'var(--fuchsia)',
        indigo: 'var(--indigo)',
        orange: 'var(--orange)',

        // Text color overrides
        heading: 'var(--heading)',
        body: 'var(--body)',
        'body-subtle': 'var(--body-subtle)',
        'fg-brand': 'var(--fg-brand)',
        'fg-brand-strong': 'var(--fg-brand-strong)',
        'fg-success': 'var(--fg-success)',
        'fg-danger': 'var(--fg-danger)',
        'fg-warning': 'var(--fg-warning)',
        'fg-disabled': 'var(--fg-disabled)',

        // Borders
        'border-default': 'var(--border-default)',
        'border-brand': 'var(--border-brand)',
        'border-warning': 'var(--border-warning)',
        'border-danger': 'var(--border-danger)',
        'border-success': 'var(--border-success)',
      },
      fontFamily: {
        heading: ["'Zilla Slab'", "'Noto Sans Bengali'", "serif"],
        body: ["'Libre Franklin'", "'Noto Sans Bengali'", "sans-serif"],
        display: ["'Baloo 2'", "'Noto Sans Bengali'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'spin-reverse': 'spin-reverse 15s linear infinite',
        'float': 'float 8s ease-in-out infinite',
        'bounce-spring': 'bounce-spring 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-spring': {
          '0%': { transform: 'scale(0.9) translateY(10px)', opacity: '0' },
          '70%': { transform: 'scale(1.05) translateY(-2px)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        '2xs': 'var(--shadow-2xs)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      borderRadius: {
        base: '16px',
        default: '10px',
        sm: '6px',
        full: '9999px',
      },
      textColor: {
        black: 'var(--neo-ink)',
      }
    },
  },
  plugins: [],
}
