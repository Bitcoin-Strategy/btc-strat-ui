import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import path from 'path';

import { requireBundledDependencies } from './scripts/require-bundled-dependencies';

export default defineConfig({
  plugins: [requireBundledDependencies(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/',
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
