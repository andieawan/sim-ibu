import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, CheckCircle2, Bug, Cpu, Clock, 
  ChevronRight, Bookmark, ArrowUpRight, HelpCircle, Flame
} from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
}

export default function ChangelogModal({ isOpen, onClose, theme }: ChangelogModalProps) {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  // Log pembaruan terstruktur untuk mengedukasi pengguna dan memperlihatkan profesionalitas
  const logs = [
    {
      version: 'v2.2.0 (Stabil)',
      date: '25 Juni 2026',
      badge: 'Terbaru',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Peningkatan besar pada sistem informasi kesiswaan interaktif, penyesuaian visual Light/Dark Mode yang ultra-responsif, serta optimasi layar sentuh (Touch-First).',
      changes: [
        {
          type: 'fitur',
          title: 'Aksesibilitas & Optimasi Layar Sentuh (Touch-First)',
          desc: 'Penerapan standar area sentuh interaktif (minimal 44px) untuk semua tombol utama dan menu navigasi seluler. Menghilangkan stuck hover effect pada perangkat mobile serta menambahkan active state scale feedback yang taktil dan instan.'
        },
        {
          type: 'fitur',
          title: 'Detail Profil Siswa Komprehensif',
          desc: 'Integrasi kartu detail profil siswa interaktif yang dapat diakses dari halaman manapun (Guru, Rekap, Wali Kelas, Wali Murid). Memuat ringkasan biodata, statistik persentase kehadiran, riwayat absen harian kronologis, serta grafik pencapaian nilai KKM (Tuntas/Remedial).'
        },
        {
          type: 'perbaikan',
          title: 'Sinkronisasi Versi Sistem Global',
          desc: 'Penyelarasan nomor rilis SIM-IBU v2.2.0-STABLE secara serentak di seluruh modul antarmuka termasuk panel Login, menu instalasi PWA, serta halaman Administrasi.'
        },
        {
          type: 'perbaikan',
          title: 'Perbaikan Kontras Dropdown Light Mode',
          desc: 'Mengatasi masalah teks dropdown "<option>" yang berwarna putih/tersembunyi saat berada di Light Mode pada halaman Nilai, Absensi, dan Rekapitulasi Guru. Teks kini dinamis menyesuaikan tema perangkat.'
        },
        {
          type: 'perbaikan',
          title: 'Optimalisasi Atribut Selector CSS Global',
          desc: 'Menambahkan rule CSS robust di "index.css" untuk meng-override latar belakang panel gelap ([class*="bg-[#161b22]"]) menjadi putih/slate bersih secara konsisten ketika berpindah ke Light Mode.'
        }
      ]
    },
    {
      version: 'v2.1.0',
      date: '18 Juni 2026',
      badge: 'Stabil',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Penyempurnaan arsitektur database multi-engine serta fungsionalitas PWA offline.',
      changes: [
        {
          type: 'fitur',
          title: 'Multi-Engine Database Wrapper (Factory Pattern)',
          desc: 'Mengimplementasikan Adapter Database otomatis yang dapat diterjemahkan secara fleksibel antara SQLite, MySQL, dan PostgreSQL berdasarkan nilai DB_TYPE di berkas konfig .'
        },
        {
          type: 'fitur',
          title: 'PWA & Offline-First Ready',
          desc: 'Pemasangan aplikasi pintasan instan (A2HS) langsung ke beranda Android, iOS, maupun Desktop PC dengan Service Worker terintegrasi untuk mempercepat loading aset.'
        },
        {
          type: 'perbaikan',
          title: 'Akurasi Rekap Absensi Guru',
          desc: 'Perbaikan kalkulasi persentase kehadiran siswa di tabel rekap agar konsisten dengan riwayat harian yang di-input secara dinamis.'
        }
      ]
    },
    {
      version: 'v1.0.0',
      date: '01 Mei 2026',
      badge: 'Rilis Awal',
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-700/50',
      description: 'Peluncuran perdana SIM-IBU (Sistem Informasi Monitor Ibu) sebagai platform monitoring siswa SMK Ibu Kartini.',
      changes: [
        {
          type: 'fitur',
          title: 'Autentikasi Multi-Peran (Role-Based Auth)',
          desc: 'Pemisahan modul dashboard untuk Administrator, Guru Pengajar, Wali Kelas, dan Wali Murid.'
        },
        {
          type: 'fitur',
          title: 'Sistem Nilai & Absensi Real-time',
          desc: 'Pencatatan kehadiran harian siswa, input nilai kuis/ujian, beserta parameter ketuntasan KKM langsung tersimpan ke pangkalan data.'
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop Semitransparan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 ${
            isLight ? 'bg-slate-900/50' : 'bg-[#090d16]/90'
          } backdrop-blur-md`}
        />

        {/* Konten Modal Tengah */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className={`relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border flex flex-col max-h-[85vh] ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800' 
              : 'bg-[#111622] border-slate-800 text-slate-200'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-blue-600/5 dark:bg-blue-500/5 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Log Pembaruan Aplikasi</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-mono">Daftar Fitur, Perbaikan & Versi SIM-IBU</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-all ${
                isLight 
                  ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' 
                  : 'hover:bg-slate-800 text-slate-500 hover:text-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Log List (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-8">
            
            <div className={`p-4 rounded-2xl border ${
              isLight ? 'bg-blue-50/50 border-blue-500/10' : 'bg-blue-950/10 border-blue-500/10'
            } text-xs leading-relaxed`}>
              <span className="font-bold text-blue-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Catatan Pengembang
              </span>
              Sistem terus mengalami perbaikan berkelanjutan demi menjamin akurasi data presensi dan nilai siswa. Anda dapat memantau log perbaikan yang telah kami rilis secara berkala di halaman ini.
            </div>

            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.version} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 last:border-transparent">
                  {/* Penanda bullet di garis timeline */}
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border border-slate-900 shadow" />
                  
                  {/* Rincian Rilis */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black font-mono">{log.version}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded border font-mono ${log.badgeColor}`}>
                        {log.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.date}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      {log.description}
                    </p>

                    {/* List item perubahan */}
                    <div className="mt-3.5 space-y-2.5">
                      {log.changes.map((change, cIdx) => (
                        <div 
                          key={cIdx} 
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#161b22]/40 border-slate-850/60'
                          }`}
                        >
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded tracking-wider shrink-0 mt-0.5 ${
                            change.type === 'fitur'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                              : change.type === 'perbaikan'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/10'
                          }`}>
                            {change.type === 'fitur' ? 'Baru' : 'Perbaikan'}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{change.title}</h4>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{change.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Footer Info */}
          <div className="p-4 bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 text-center">
            <p className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">
              SIM-IBU &bull; SISTEM INFORMASI MONITOR &bull; VERSI 2.2.0 STABIL
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
