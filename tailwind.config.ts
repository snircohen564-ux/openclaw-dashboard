import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        card: '#1a1a2e',
        'card-hover': '#1e1e38',
        border: '#2a2a4a',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        muted: '#6b7280',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
      },
    },
  },
  plugins: [],
}
export default config
