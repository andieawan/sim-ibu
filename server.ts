// ============================================================================
// Nama File : server.ts
// Lokasi    : /server.ts
// Peran     : Entry point utama server full-stack Express untuk aplikasi SIMIBU.
//             Mengatur routing API, middleware, kompresi, penyajian berkas statis, 
//             dan pengintegrasian Vite Dev Server / produksi.
// Dependency: dotenv, express, compression, vite, dotenv-safe
// ============================================================================

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import compression from 'compression'; // Middleware untuk kompresi payload agar performa transmisi data meningkat
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import apiRouter from './server/routes';
import { startBackupScheduler } from './server/scheduler';

const app = express();
const PORT = 3000;

// Meningkatkan kinerja API server & mempercepat waktu loading menggunakan kompresi GZIP
app.use(compression());

// Penanganan kebijakan CORS (Cross-Origin Resource Sharing) kustom untuk origin yang diizinkan
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.APP_URL
].filter(Boolean) as string[];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.run.app') || 
                      origin.includes('localhost');
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware untuk melakukan parsing JSON, URL-encoded form data, dan plain text dengan limit kapasitas besar (50MB)
// Kapasitas besar diperlukan untuk impor spreadsheet massal dan unggah basis data cadangan.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: 'text/plain', limit: '50mb' }));

// Menyajikan berkas statis dari direktori 'public' (berlaku di mode pengembangan & produksi)
// Hal ini menjamin Service Worker (sw.js), manifest.json, dan ikon-ikon disajikan dengan header HTTP yang tepat tanpa redirect.
app.use(express.static(path.join(process.cwd(), 'public'), {
  maxAge: '0',
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Mendaftarkan router modular untuk seluruh endpoint API SIMIBU (/api/*)
app.use('/api', apiRouter);

// Indikator konsol bahwa instansi database telah terhubung ke runtime server utama
console.log('Database instance mapped to central server runtime.');

// ============================================================================
// FUNGSI UTAMA: startServer()
// Deskripsi : Memulai siklus hidup aplikasi. Menentukan apakah server berjalan 
//             di mode pengembangan (Vite dev server) atau mode produksi (Express statis).
// Efek       : Menjalankan pendengaran port HTTP & penjadwal pencadangan otomatis.
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Mode Pengembangan: Muat Vite sebagai middleware Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    // Mode Produksi: Sajikan aset statis yang sudah dikompilasi oleh Vite
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y', // Cache aset statis selama 1 tahun karena Vite menghasilkan hash nama file yang unik
      immutable: true, // Berkas statis tidak akan berubah namanya
      index: false // Biarkan penanganan catch-all di bawah menangani berkas index.html untuk mencegah caching HTML yang lama
    }));
    app.get('*', (req, res) => {
      // Pastikan index.html tidak dicache agar klien selalu menerima pembaruan aplikasi terbaru
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from:', distPath);
  }

  // Menjalankan aplikasi pada host 0.0.0.0 agar dapat diakses dari luar kontainer Cloud Run
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sim-ibu Full-Stack application is active on http://localhost:${PORT}`);
    // Jalankan scheduler pencadangan otomatis (Google Drive / Lokal)
    startBackupScheduler();
  });
}

startServer();
