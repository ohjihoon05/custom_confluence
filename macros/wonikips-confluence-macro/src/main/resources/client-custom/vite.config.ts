import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },
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
        // 런타임 process 폴리필 (Vite define으로 못 잡은 dynamic 참조 방어)
        banner: 'if(typeof process==="undefined"){window.process={env:{NODE_ENV:"production"}};}',
      },
    },
    cssCodeSplit: false,
  },
});
