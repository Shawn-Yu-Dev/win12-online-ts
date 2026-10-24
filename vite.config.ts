import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const page = (name: string) => resolve(root, name);

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        desktop: page('desktop.html'),
        boot: page('boot.html'),
        bios: page('bios.html'),
        index: page('index.html'),
        mainpage: page('mainpage.html'),
        404: page('404.html'),
        bluescreen: page('bluescreen.html'),
        minesweeper: page('games/minesweeper.html'),
        'service-worker': page('src/entries/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'service-worker' ? 'sw.js' : 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    port: 5173,
  },
});
