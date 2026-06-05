import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://slides.lausanne.marketing',
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Sur OneDrive + en cas de build concurrent, le watcher Vite voit les
    // écritures dans .astro/ et dist/ et part en boucle de full-reload
    // (« Failed to load url astro:server-app.js »). On les ignore, et on
    // débounce les événements multi-passes de OneDrive.
    server: {
      watch: {
        ignored: ['**/.astro/**', '**/dist/**'],
        awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
      },
    },
  },
  build: {
    format: 'directory',
  },
});
