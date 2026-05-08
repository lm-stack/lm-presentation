import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://slides.lausanne.marketing',
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    sitemap(),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
  build: {
    format: 'directory',
  },
});
