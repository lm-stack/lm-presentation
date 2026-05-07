/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFD838',
        'primary-light': '#FEE487',
        secondary: '#191919',
        text: 'var(--color-text, #6B6F84)',
        bg: '#FFFFFF',
        shadow: 'rgba(26, 26, 26, 0.04)',
        'dark-bg': '#2C3049',
        'dark-text': 'rgba(255, 255, 255, 0.92)',
        'dark-border': 'rgba(255, 255, 255, 0.42)',
        'dark-shadow': '#373D61',
      },
      fontFamily: {
        primary: ['"Hanken Grotesk"', 'sans-serif'],
        secondary: ['"Space Grotesk"', 'monospace'],
      },
      spacing: {
        1: '0.4rem',
        2: '0.8rem',
        3: '1.2rem',
        4: '1.6rem',
        5: '2rem',
        6: '2.4rem',
        7: '2.8rem',
        8: '3.2rem',
        9: '3.6rem',
        10: '4rem',
        12: '4.8rem',
        14: '5.6rem',
        16: '6.4rem',
        20: '8rem',
        25: '10rem',
        container: '1536px',
      },
      borderRadius: {
        s: '12px',
        m: '16px',
        card: '20px',
      },
      boxShadow: {
        card: '0 12px 12px 0 rgba(26, 26, 26, 0.04)',
      },
    },
  },
  plugins: [],
};
