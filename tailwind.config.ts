import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: 'rgb(59 130 246 / <alpha-value>)',
        'brand-dark': 'rgb(29 78 216 / <alpha-value>)',
        'brand-light': 'rgb(239 246 255 / <alpha-value>)',
        surface: 'rgb(248 250 252 / <alpha-value>)',
      },
      spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontSize: {
        'display-lg': ['56px', { fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.1' }],
        'display-md': ['40px', { fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.1' }],
        'h1': ['32px', { fontWeight: '700', letterSpacing: '-0.01em', lineHeight: '1.2' }],
        'h2': ['24px', { fontWeight: '700', letterSpacing: '-0.01em', lineHeight: '1.2' }],
        'h3': ['20px', { fontWeight: '600', lineHeight: '1.3' }],
        'body-lg': ['16px', { lineHeight: '1.6' }],
        'body': ['14px', { lineHeight: '1.6' }],
        'body-sm': ['13px', { lineHeight: '1.5' }],
        'label': ['12px', { fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1.4' }],
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px rgb(0 0 0 / 0.1)',
        base: '0 2px 8px rgb(0 0 0 / 0.08)',
        md: '0 4px 16px rgb(0 0 0 / 0.12)',
        lg: '0 8px 24px rgb(0 0 0 / 0.15)',
        xl: '0 12px 32px rgb(0 0 0 / 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
