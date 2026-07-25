import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Syrka Campus tokens (DESIGN-001) — namespaced to avoid touching
        // the legacy National Human Capital Intelligence palette below.
        'campus-ink': {
          950: '#050505',
          900: '#111111',
          700: '#2E2E2E',
        },
        'campus-stone': {
          500: '#71716C',
          300: '#C8C7C0',
          100: '#F4F3EF',
        },
        'campus-white': '#FFFFFF',
        'campus-silver': '#E7E5DE',
        'campus-gold': {
          500: '#B89B5E',
          dark: '#D4BE7F',
        },
        'campus-blue': {
          600: '#2F5F8F',
          dark: '#78A6D1',
        },
        'campus-green': {
          600: '#2F6B4F',
          dark: '#78B892',
        },
        'campus-amber': {
          600: '#9A6A20',
          dark: '#D0A04F',
        },
        'campus-red': {
          600: '#8E2F2F',
          dark: '#D17B7B',
        },
        'campus-purple': {
          600: '#5D4A7A',
          dark: '#A997CA',
        },
        // Semantic roles that flip with the shared `.dark` class via CSS vars.
        'campus-bg': 'var(--campus-bg)',
        'campus-surface': 'var(--campus-surface)',
        'campus-surface-raised': 'var(--campus-surface-raised)',
        'campus-border': 'var(--campus-border)',
        'campus-text': 'var(--campus-text)',
        'campus-text-secondary': 'var(--campus-text-secondary)',
        'campus-muted': 'var(--campus-muted)',

        // Syrka corporate homepage tokens — isolated from Campus (campus-*)
        // and the legacy palette below. Used only by the "/" corporate
        // marketing site and its components/corporate/* — never by
        // authenticated Campus routes.
        'syrka-obsidian': '#050505',
        'syrka-carbon': '#111214',
        'syrka-graphite': '#202226',
        'syrka-offwhite': '#F2F0EA',
        'syrka-white': '#FFFFFF',
        'syrka-steel': '#7A7E85',
        'syrka-hairline': '#34363A',
        'syrka-signal': '#2864FF',

        // Legacy National Human Capital Intelligence palette — preserved as-is.
        'background': '#111417',
        'surface': '#111417',
        'surface-container-lowest': '#0B0F11',
        'surface-container-low': '#191C1F',
        'surface-container': '#1D2023',
        'surface-container-high': '#272A2D',
        'surface-container-highest': '#323538',
        'surface-bright': '#37393D',
        'on-background': '#E1E2E6',
        'on-surface': '#E1E2E6',
        'on-surface-variant': '#C6C6C6',
        'primary': '#FFFFFF',
        'on-primary': '#1A1C1C',
        'primary-container': '#D4D4D4',
        'primary-fixed': '#5D5F5F',
        'primary-fixed-dim': '#454747',
        'secondary': '#C5C6CA',
        'secondary-fixed': '#C5C6CA',
        'secondary-fixed-dim': '#A9ABAF',
        'outline': '#919191',
        'outline-variant': '#474747',
        'error': '#FFB4AB',
        'error-container': '#93000A',
      },
      borderRadius: {
        DEFAULT: '0px',
        'none': '0px',
        'sm': '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        'full': '9999px',
        // Syrka Campus radius scale (DESIGN-001 §7) — additive keys so the
        // legacy zero-radius system above is untouched.
        'campus-sm': '6px',
        'campus-md': '10px',
        'campus-lg': '16px',
        'campus-xl': '24px',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
        // Syrka Campus typography (DESIGN-001 §5) — Geist, loaded via
        // next/font in app/layout.tsx as --font-geist-sans / --font-geist-mono.
        // Deliberately NOT registered under the default `sans`/`mono` keys:
        // Tailwind's preflight applies those globally to <html>, which would
        // reach legacy routes. campus-sans/campus-mono are additive-only.
        'campus-sans': ['var(--font-geist-sans)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        'campus-mono': ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-lg': ['clamp(56px, 8vw, 96px)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-md': ['clamp(40px, 6vw, 72px)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-sm': ['clamp(32px, 4vw, 48px)', { lineHeight: '1.0', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-lg': ['clamp(24px, 3vw, 36px)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['clamp(20px, 2.5vw, 28px)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['15px', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['13px', { lineHeight: '1.55', letterSpacing: '0' }],
        'label-lg': ['12px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
        'label-md': ['11px', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
        'label-sm': ['10px', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '700' }],
        // Syrka Campus type scale (DESIGN-001 §5) — additive campus-* keys.
        // Tailwind's own text-xs…text-5xl keys are left untouched so legacy
        // routes keep their original rendered sizes exactly.
        'campus-xs': ['12px', { lineHeight: '16px' }],
        'campus-sm': ['14px', { lineHeight: '20px' }],
        'campus-base': ['16px', { lineHeight: '24px' }],
        'campus-lg': ['18px', { lineHeight: '28px' }],
        'campus-xl': ['20px', { lineHeight: '30px' }],
        'campus-2xl': ['24px', { lineHeight: '32px' }],
        'campus-3xl': ['32px', { lineHeight: '40px' }],
        'campus-4xl': ['44px', { lineHeight: '52px' }],
        'campus-5xl': ['56px', { lineHeight: '64px' }],
      },
      transitionDuration: {
        'campus-fast': '120ms',
        'campus-base': '180ms',
        'campus-slow': '280ms',
      },
      transitionTimingFunction: {
        'campus-standard': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      boxShadow: {
        'campus-subtle': '0 1px 2px rgba(0, 0, 0, 0.06)',
        'campus-panel': '0 12px 32px rgba(0, 0, 0, 0.10)',
      },
      opacity: {
        'campus-disabled': '0.45',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
export default config;
