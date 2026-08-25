import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/vocabmaster/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, '_vite-pages/app/index.html'),
        ios: resolve(__dirname, '_vite-pages/app-ios/index.html'),
      },
    },
  },
});
