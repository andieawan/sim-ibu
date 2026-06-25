import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import net from 'net';
import compression from 'compression'; // For Performance scaling
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import apiRouter from './server/routes';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || process.env.APP_PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

async function isPortAvailable(port: number, host: string) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function resolvePort(preferredPort: number, host: string, maxAttempts = 10) {
  let port = preferredPort;
  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
    port += 1;
  }
  return 0; // let the OS choose a free port if all preferred ports fail
}

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: 'text/plain', limit: '10mb' }));

// Register Modular API router before Vite middleware so API routes are resolved first in dev.
app.use('/api', apiRouter);

// Database logging indicator
console.log('Database instance mapped to central server runtime.');

// --- INTEGRATING VITE DEV SERVER / PRODUCTION STATIC FILES ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In development mode, load Vite as middleware as the first middleware.
    // This is required so Vite can properly handle HMR, module requests, and /@vite/client.
    const vitePort = Number(process.env.HMR_PORT || process.env.PORT || DEFAULT_PORT);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : {
          protocol: 'ws',
          host: process.env.HOST || 'localhost',
          port: vitePort,
          clientPort: vitePort,
        },
      },
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

  let port = await resolvePort(DEFAULT_PORT, HOST);
  if (!port) {
    port = 0;
  }

  const listener = app.listen(port, HOST, () => {
    const address = listener.address();
    const actualPort = address && typeof address === 'object' ? address.port : port;
    console.log(`SiGup Full-Stack application is active on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${actualPort}`);
    if (actualPort !== DEFAULT_PORT) {
      console.warn(`Preferred port ${DEFAULT_PORT} was unavailable; using port ${actualPort} instead.`);
    }
  }).on('error', (err) => {
    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. This should not happen after port resolution.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
