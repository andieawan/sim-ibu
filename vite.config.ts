// ============================================================================
// SISTEM GURU PINTAR (SiGup) - VITE BUNDLER CONFIGURATION
// FILE: vite.config.ts
// 
// Developer Note:
// File ini mengatur bagaimana Vite memaketkan (bundle) aplikasi React 
// untuk mode development dan production. Kami mengoptimalkan chunk splitting
// di rollupOptions agar file build (dist) lebih efisien.
// ============================================================================
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 3000,
      // === OPTIMASI BUNDLE PRODUCTION ===
      // Catatan: Kami menonaktifkan pemisahan manualChunks kustom agar semua dependency
      // dimuat dalam urutan yang tepat oleh Vite tanpa menyebabkan masalah 'createContext' tidak terdefinisi.
      rollupOptions: {
        output: {
          // Menggunakan strategi pembagian otomatis bawaan Vite yang lebih aman untuk dependensi React
        }
      }
    }
  };
});
