import type { Config } from 'tailwindcss';
import tailwindCssAnimate from 'tailwindcss-animate';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        dark: 'hsl(var(--dark))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        orange: 'hsl(var(--orange))',
        green: 'hsl(var(--green))',
        red: 'hsl(var(--red))',
        muted: 'hsl(var(--muted))',
        text: 'hsl(var(--text))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      screens: {
        xs: '375px',
        sm: '480px',
        md: '768px',
        lg: '976px',
        xl: '1240px',
        '2xl': '1436px',
        '3xl': '1636px',
        '4xl': '1786px',
        '5xl': '1925px',
      },
      animation: {
        duckFadeIn: 'duckFadeIn 0.5s ease-in-out',
      },
      keyframes: {
        duckFadeIn: {
          '0%': {
            opacity: '0%',
          },
          '75%': {
            opacity: '0%',
          },
          '100%': {
            opacity: '100%',
          },
        },
      },
    },
  },
  plugins: [tailwindCssAnimate],
} satisfies Config;

export default config;
