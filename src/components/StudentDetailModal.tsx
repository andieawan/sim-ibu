import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Calendar, Award, Info, RefreshCw, 
  CheckCircle2, AlertCircle, Sparkles, BookOpen, Clock, Activity
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nis: string | null;
  theme: 'light' | 'emerald' | 'rose' | 'indigo' | 'flat' | string;
}

export default function StudentDetailModal({ isOpen, onClose, nis, theme }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'umum' | 'absensi' | 'nilai'>('umum');
  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && nis) {
      fetchStudentProfile();
    } else {
      // Reset state when closing
      setProfileData(null);
      setError(null);
      setActiveTab('umum');
    }
  }, [isOpen, nis]);

  // ============================================================================
  // LOGIKA AMBIL PROFIL SISWA KOMPREHENSIF
  // Maksud Bisnis: Mengambil profil, nilai, dan absensi lengkap siswa dari API
  //                 backend untuk disajikan secara terpusat pada dialog detail.
  //
  // Aliran Data:
  // - Input: `nis` (String, NIS siswa terplih)
  // - Output: Menetapkan state `profileData` dengan respons objek komprehensif.
  // ============================================================================
  const fetchStudentProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/siswa-profile/${nis}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileData(data);
      } else {
        setError(data.error || 'Gagal memuat profil siswa');
      }
    } catch (err: any) {
      console.error('Error fetching student profile:', err);
      setError('Kesalahan jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  // === AKHIR DARI LOGIKA AMBIL PROFIL SISWA ===

  const isLight = theme === 'light';

  // Warna-warni kelas penyesuaian berdasarkan tema aktif
  const getThemeColor = () => {
    switch (theme) {
      case 'emerald': return { bg: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/20', focus: 'focus:border-emerald-500' };
      case 'rose': return { bg: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-500/20', focus: 'focus:border-rose-500' };
      case 'indigo': return { bg: 'bg-indigo-600', text: 'text-indigo-400', border: 'border-indigo-500/20', focus: 'focus:border-indigo-500' };
      case 'flat': return { bg: 'bg-teal-600', text: 'text-teal-400', border: 'border-teal-500/20', focus: 'focus:border-teal-500' };
      default: return { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/20', focus: 'focus:border-blue-500' };
    }
  };

  const colors = getThemeColor();

  // Hitung persentase kehadiran
  const getAbsensiStats = () => {
    if (!profileData || !profileData.absensi) return { hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0, rate: 100 };
    const logs = profileData.absensi;
    let hadir = 0, izin = 0, sakit = 0, alfa = 0;
    logs.forEach((item: any) => {
      if (item.status === 'Hadir') hadir++;
      else if (item.status === 'Izin') izin++;
      else if (item.status === 'Sakit') sakit++;
      else if (item.status === 'Alfa') alfa++;
    });
    const total = logs.length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { hadir, izin, sakit, alfa, total, rate };
  };

  const absensiStats = getAbsensiStats();

  return (
    <AnimatePresence>
      {/* === OPTIMASI DIALOG LAYAR SENTUH & ANIMASI KELUAR (EXIT ANIMATION) === */}
      {/* Maksud Bisnis: Merender modal di bawah AnimatePresence secara kondisional */}
      {/*                 agar transisi exit dapat dipicu dengan sempurna ketika modal ditutup. */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop Semitransparan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 ${
              isLight ? 'bg-slate-900/60' : 'bg-[#090d16]/92'
            } backdrop-blur-md`}
          />

          {/* Konten Modal Tengah */}
          {/* Maksud Bisnis: Mendukung penutupan modal saat pengguna menyentuh/mengklik area luar sekeliling modal */}
          <div 
            onClick={onClose}
            className="flex min-h-screen items-center justify-center p-4 relative z-10"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()} /* Mencegah modal tertutup tidak sengaja ketika mengklik di dalam kotak modal */
              className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50' 
                  : 'bg-[#111622] border-slate-800 text-slate-200 shadow-[#020617]/50'
              }`}
            >
              {/* Header Profil Hiasan */}
              <div className={`h-2 absolute top-0 left-0 right-0 ${colors.bg}`} />
              
              {/* Tombol Tutup - Dilengkapi area sentuh minimum 44px ramah layar sentuh (p-3 + 20px icon) */}
              <button
                onClick={onClose}
                aria-label="Tutup Rincian Siswa"
                className={`absolute top-3 right-3 p-3 rounded-xl transition-all z-20 flex items-center justify-center hover:scale-105 active:scale-95 ${
                  isLight 
                    ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' 
                    : 'hover:bg-slate-800 text-slate-500 hover:text-slate-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <RefreshCw className={`w-8 h-8 animate-spin ${colors.text}`} />
                <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Sinkronisasi profil & berkas siswa...
                </span>
              </div>
            ) : error ? (
              <div className="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <h4 className="font-bold text-sm">Terjadi Kesalahan</h4>
                <p className={`text-xs max-w-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{error}</p>
                <button
                  onClick={fetchStudentProfile}
                  className={`mt-2 px-4 py-2 text-2xs font-extrabold rounded-xl transition ${colors.bg} text-white hover:opacity-90`}
                >
                  Coba Lagi
                </button>
              </div>
            ) : profileData ? (
              <div className="p-6">
                
                {/* Banner Profil */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-5 relative z-10 border-slate-100 dark:border-slate-800">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-bold text-xl uppercase ${
                    isLight 
                      ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-sm' 
                      : 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-md'
                  }`}>
                    {profileData.siswa.nama.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        {profileData.siswa.nama}
                      </h3>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase font-mono tracking-wider ${
                        profileData.siswa.status_aktif !== 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15'
                      }`}>
                        {profileData.siswa.status_aktif !== 0 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className={`text-3xs font-mono mt-0.5 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>NIS: <strong className="font-bold">{profileData.siswa.nis}</strong></span>
                      <span>&bull;</span>
                      <span>Kelas: <strong className="font-bold text-blue-500">{profileData.siswa.nama_kelas || 'Umum'}</strong></span>
                      <span>&bull;</span>
                      <span>{profileData.siswa.sekolah}</span>
                    </p>
                  </div>
                </div>

                {/* Tabs Kategori Informasi */}
                <div className="flex gap-1.5 border-b mt-5 pb-px border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('umum')}
                    className={`pb-2.5 px-3 text-2xs font-extrabold border-b-2 transition-all relative ${
                      activeTab === 'umum'
                        ? isLight ? 'border-blue-600 text-blue-600' : 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Informasi Umum
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('absensi')}
                    className={`pb-2.5 px-3 text-2xs font-extrabold border-b-2 transition-all relative ${
                      activeTab === 'absensi'
                        ? isLight ? 'border-blue-600 text-blue-600' : 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Presensi ({absensiStats.rate}%)
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('nilai')}
                    className={`pb-2.5 px-3 text-2xs font-extrabold border-b-2 transition-all relative ${
                      activeTab === 'nilai'
                        ? isLight ? 'border-blue-600 text-blue-600' : 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Akademik & Nilai
                    </span>
                  </button>
                </div>

                {/* TAB CONTENT */}
                <div className="mt-5 min-h-[220px]">
                  
                  {/* TAB 1: INFORMASI UMUM */}
                  {activeTab === 'umum' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className={`p-4 rounded-2xl border ${
                        isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#161b22]/40 border-slate-800'
                      }`}>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block font-mono">Biodata Dasar</span>
                        <div className="mt-2.5 space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                            <span className="text-slate-500">Nama Lengkap</span>
                            <span className="font-semibold text-right">{profileData.siswa.nama}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                            <span className="text-slate-500">NIS</span>
                            <span className="font-mono font-bold text-right">{profileData.siswa.nis}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Jenis Kelamin</span>
                            <span className="font-semibold text-right">
                              {profileData.siswa.jenis_kelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#161b22]/40 border-slate-800'
                      }`}>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block font-mono">Institusi & Kelas</span>
                        <div className="mt-2.5 space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                            <span className="text-slate-500">Sekolah</span>
                            <span className="font-semibold text-right">{profileData.siswa.sekolah || 'SMK Ibu'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                            <span className="text-slate-500">Rombel Kelas</span>
                            <span className="font-bold text-blue-500 text-right">{profileData.siswa.nama_kelas || 'Umum'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Status Absensi</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold font-mono text-[10px] ${
                              absensiStats.alfa > 2 
                                ? 'bg-rose-500/10 text-rose-500' 
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {absensiStats.alfa > 2 ? 'Rawan (Alfa > 2)' : 'Sehat'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`sm:col-span-2 p-4 rounded-2xl border flex items-start gap-3.5 ${
                        isLight ? 'bg-blue-50/30 border-blue-500/10' : 'bg-blue-950/10 border-blue-500/10'
                      }`}>
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-blue-500">Sistem Kartu Pelajar Digital</h5>
                          <p className={`text-[11px] leading-relaxed mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            Informasi kesiswaan ini disinkronisasikan langsung ke pangkalan data sekolah secara real-time. Wali murid dapat melihat riwayat kehadiran, pengumuman, dan grafik nilai tuntas kriteria ketuntasan minimal (KKM) langsung dari portal ini.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: ABSENSI */}
                  {activeTab === 'absensi' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Statistik Kartu Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className={`p-2.5 rounded-xl border text-center ${
                          isLight ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-950/10 border-emerald-500/15'
                        }`}>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold font-mono block uppercase">Hadir</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{absensiStats.hadir}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center ${
                          isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-950/10 border-blue-500/15'
                        }`}>
                          <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold font-mono block uppercase">Izin</span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{absensiStats.izin}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center ${
                          isLight ? 'bg-amber-50 border-amber-100' : 'bg-amber-950/10 border-amber-500/15'
                        }`}>
                          <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold font-mono block uppercase">Sakit</span>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{absensiStats.sakit}</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-center ${
                          isLight ? 'bg-rose-50 border-rose-100' : 'bg-rose-950/10 border-rose-500/15'
                        }`}>
                          <span className="text-[9px] text-rose-600 dark:text-rose-500 font-bold font-mono block uppercase">Alfa</span>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 block">{absensiStats.alfa}</span>
                        </div>
                      </div>

                      {/* Riwayat Log Absen */}
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block font-mono mb-2">Riwayat Harian Kronologis</span>
                        {profileData.absensi && profileData.absensi.length > 0 ? (
                          <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                            {profileData.absensi.map((log: any) => (
                              <div
                                key={log.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#161b22]/40 border-slate-850'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="font-semibold">{log.tanggal}</span>
                                </div>
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded font-mono ${
                                  log.status === 'Hadir'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : log.status === 'Izin'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : log.status === 'Sakit'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-2xs text-slate-500 italic py-6">Belum ada riwayat presensi harian untuk siswa ini.</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: AKADEMIK & NILAI */}
                  {activeTab === 'nilai' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Tabel Nilai */}
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block font-mono mb-2">Pencapaian Kriteria Ketuntasan</span>
                        {profileData.nilai && profileData.nilai.length > 0 ? (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {profileData.nilai.map((act: any) => {
                              const isPassed = act.nilai >= (act.kkm || 75);
                              return (
                                <div
                                  key={act.id}
                                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                    isLight ? 'bg-slate-50/50 border-slate-100' : 'bg-[#161b22]/40 border-slate-850'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{act.nama_aktivitas}</span>
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 border border-slate-700/50 text-slate-400 rounded-md">KKM: {act.kkm || 75}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                      {act.tanggal} {act.catatan ? `• Catatan: "${act.catatan}"` : ''}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 justify-between sm:justify-start">
                                    <span className="font-black text-sm text-right min-w-[32px]">
                                      {act.nilai}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded font-mono ${
                                      isPassed
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}>
                                      {isPassed ? 'Tuntas' : 'Remedial'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-2xs text-slate-500 italic py-6">Belum ada riwayat pencapaian nilai untuk siswa ini.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                </div>

              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
}
