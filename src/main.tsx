import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo, init?: RequestInit) => {
  return originalFetch(input, { ...init, credentials: 'include' });
};

/**
 * ============================================================================
 * SIM-IBU (SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM) - ENTRY POINT REACT
 * FILE: src/main.tsx
 * 
 * Developer Note:
 * Titik awal (Entry Point) di mana aplikasi React pertama kali dimuat.
 * File ini melekatkan komponen `<App />` ke elemen `<div id="root">` 
 * pada berkas `index.html`.
 * ============================================================================
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
