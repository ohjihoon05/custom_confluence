import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2015',
    minify: 'esbuild',
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'WonikIPSEditor',
      fileName: () => 'wonikips-editor.js',
    },
    rollupOptions: {
      external: ['jquery', 'AJS'],
      output: {
        globals: { jquery: 'jQuery', AJS: 'AJS' },
        assetFileNames: (asset) => asset.name === 'style.css' ? 'wonikips-editor.css' : '[name][extname]',
      },
    },
    cssCodeSplit: false,
  },
});
