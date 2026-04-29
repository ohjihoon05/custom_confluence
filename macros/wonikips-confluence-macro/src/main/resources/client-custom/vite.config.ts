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
    // ES2019: object spread / rest 등을 native 지원하는 브라우저만 타겟.
    // es2015로 낮추면 esbuild이 var $=(a,b)=>... helper를 IIFE 바깥으로 호이스트해
    // 전역 $를 덮어쓰고 jQuery $가 깨짐 (1.0.25 회귀, edit page 전체 dead).
    target: 'es2019',
    minify: 'esbuild',
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'WonikIPSEditor',
      fileName: () => 'wonikips-editor.js',
    },
    rollupOptions: {
      external: ['jquery', 'AJS'],
      // src/macros/* 는 side-effect import (registerMacro 호출). tree-shaking 보호.
      treeshake: {
        moduleSideEffects: (id) => /[\\/]src[\\/]macros[\\/]/.test(id),
      },
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
