import React, { useState, useEffect } from 'react';
import { DownloadCloud, X, ArrowUpRight, Plus, Share2, AlertCircle } from 'lucide-react';

interface PwaInstallProps {
  appEnv: 'dev' | 'pub';
}

export default function PwaInstall({ appEnv }: PwaInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Detect mobile iOS devices
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i) || !!ua.match(/iPod/i);
    setIsIOS(iOS);

    // Check if currently running as standalone PWA
    const runningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(runningStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      // Auto-trigger banner or badge
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleOpenPwa = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-install', handleOpenPwa);

    // Fallback display logic for testing
    if (iOS || !runningStandalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenPwa);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowModal(false);
    } else {
      // Open our informative guide modal
      setShowModal(true);
    }
  };

  // If already running standalone PWA, hide the installation banner
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* PWA Installer Bottom Sheet Modal (Matching user's screenshot aesthetic) */}
      {showModal && (
        <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm z-[999] flex items-end justify-center sm:items-center p-0 sm:p-4 transition-all duration-300">
          {/* Modal Background click closer */}
          <div className="absolute inset-0" onClick={() => setShowModal(false)} />

          <div id="pwa-install-bottom-sheet" className="relative w-full max-w-md bg-[#0f1219] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6 z-10 animate-in slide-in-from-bottom border-blue-500/10">
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h4 className="text-base font-extrabold font-sans text-slate-100">Tambahkan ke layar beranda</h4>
                <p className="text-3xs uppercase tracking-wider font-mono font-bold text-slate-500">PWA INSTALLER ENGINGE</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-[#161b22] hover:bg-[#1f2632] border border-slate-800 rounded-full text-slate-400 hover:text-slate-205 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standard options based on device characteristics */}
            <div className="space-y-3.5">
              
              {/* Option 1: Native Chrome / Mobile Installer */}
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-between p-4 bg-[#161b22] hover:bg-[#1c232d] border border-blue-500/20 hover:border-blue-500/40 rounded-2xl group transition text-left"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl group-hover:bg-blue-600/20 transition shrink-0">
                      <DownloadCloud className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-400 transition">Buat pintasan offline</span>
                      <span className="text-[10px] text-slate-400 block font-medium leading-relaxed">Pasang SIM-IBU sekarang langsung ke layar utama Anda untuk performa maksimal</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>
              ) : (
                <div className="p-4 bg-blue-950/20 border border-blue-500/10 rounded-2xl">
                  <div className="flex gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-2xs font-bold text-blue-400 uppercase tracking-widest block font-mono">Status Instalasi PWA</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Jika tombol pasang instan belum muncul, Anda dapat memasangnya melaluit menu browser Chrome Anda dengan memilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install App"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2: iOS-specific setup prompt list */}
              {isIOS ? (
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-2xs font-extrabold uppercase text-slate-400 tracking-wider">Langkah-langkah untuk iPhone/iPad:</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-400 pl-1 list-none leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 font-bold">1.</span>
                      <span>Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 text-slate-400 inline mx-0.5" /> di bagian bawah layar Safari Anda.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 font-bold">2.</span>
                      <span>Gulir ke bawah dan pilih menu <strong>Tambahkan ke Layar Utama</strong> <Plus className="w-3.5 h-3.5 text-slate-400 inline mx-0.5" />.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 font-bold">3.</span>
                      <span>Beri nama <strong>SIM-IBU</strong> lalu ketuk <strong>Tambah</strong> di sudut kanan atas.</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-2xs font-extrabold uppercase text-slate-400 tracking-wider">Langkah Manual (Android / Chrome Desktop):</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-slate-400 pl-1 list-none leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-amber-500 font-bold">1.</span>
                      <span>Buka browser <strong>Google Chrome</strong> Anda.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-amber-500 font-bold">2.</span>
                      <span>Ketuk ikon tiga titik <b className="font-extrabold font-mono text-slate-200">⋮</b> di kanan atas layar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-amber-500 font-bold">3.</span>
                      <span>Pilih opsi <strong>Tambahkan ke Layar Utama</strong> atau <strong>Instal Aplikasi</strong>.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Actions info */}
            <div className="pt-2 border-t border-slate-850 flex justify-between items-center text-3xs font-semibold text-slate-500 leading-none">
              {/* === UPDATE VERSI PWA KE v2.2 === */}
              {/* Maksud Bisnis: Memberikan informasi rilis modul PWA kepada pengguna */}
              <span>SIM-IBU PWA v2.2</span>
              <span className="text-emerald-500 uppercase font-bold tracking-widest">{appEnv === 'dev' ? 'Mode Pengembangan' : 'Diterbitkan Resmi'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
