import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import compression from 'compression'; // For Performance scaling
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import apiRouter from './server/routes';

const app = express();
const PORT = 3000;

// Improve API Server Performance & Load Times
app.use(compression());

// Custom whitelisted CORS middleware
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

// Enable JSON parser, urlencoded, and plain text parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: 'text/plain', limit: '50mb' }));

// Serve static assets from the public folder directly (both dev & prod)
// This guarantees that sw.js, manifest.json, and icon files are served with the correct headers without redirects.
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

// Register Modular API router
app.use('/api', apiRouter);

// Database logging indicator
console.log('Database instance mapped to central server runtime.');

// --- INTEGRATING VITE DEV SERVER / PRODUCTION STATIC FILES ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In development mode, load Vite as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    // In production mode, serve compiled static assets with Cache-Control for performance
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y', // Cache static assets for 1 year (Vite hashes filenames)
      immutable: true, // Files never change
      index: false // Let the catch-all handle index.html to prevent caching HTML
    }));
    app.get('*', (req, res) => {
      // Do not cache index.html
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sim-ibu Full-Stack application is active on http://localhost:${PORT}`);
  });
}

startServer();
