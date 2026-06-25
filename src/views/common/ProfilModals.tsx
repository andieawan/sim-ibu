import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, GraduationCap, Percent, Info, RefreshCw, UserX, BarChart3,
  X, Search, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { Kelas } from '../../types';

export default function ProfilModals(props: any) {
  const {
    activeModal, setActiveModal, modalData,
    searchQuery, setSearchQuery, onNavigateToTab, stats, onClassChange, classSuffix, targetClass, modalLoading
  } = props;

  return (
      <AnimatePresence>
        {activeModal === 'classes' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090d16]/92 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111622] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100">Daftar Kelas yang Diajar</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Ringkasan beban kerja semester berjalan</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition duration-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto relative z-10 pr-1">
                {stats?.classes_breakdown && stats.classes_breakdown.length > 0 ? (
                  stats.classes_breakdown.map((item) => (
                    <div key={item.id} className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/30 transition-colors duration-300">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-200">{item.nama_kelas}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700/60 font-bold text-slate-400 rounded">{item.sekolah}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-semibold font-mono">
                          <span>Siswa: {item.total_siswa} (L: {item.total_l}, P: {item.total_p})</span>
                          <span>&bull;</span>
                          <span className="text-emerald-400">Rerata: {item.rata_rata_nilai}</span>
                          {item.total_remedial > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="text-rose-455">{item.total_remedial} Remedi</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClassChange(item.id);
                          setActiveModal(null);
                        }}
                        className="text-2xs font-extrabold bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition px-3 py-1.5 rounded-lg active:scale-95"
                      >
                        Pilih Kelas &rarr;
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-500 italic py-6">Tidak ada data kelas yang terdaftar.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'all_students' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090d16]/92 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111622] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100">Daftar Siswa Didik{classSuffix}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total: {targetClass ? targetClass.total_siswa : stats?.total_siswa} Peserta Didik (L: {targetClass ? targetClass.total_l : stats?.total_l}, P: {targetClass ? targetClass.total_p : stats?.total_p})</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition duration-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan NIS atau Nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto relative z-10 pr-1">
                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-xs font-bold font-mono">Memuat database siswa...</span>
                  </div>
                ) : (() => {
                  const filtered = modalData.filter((s: any) => 
                    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.nis.includes(searchQuery)
                  );
                  
                  if (filtered.length === 0) {
                    return <p className="text-center text-xs text-slate-500 italic py-6">Tidak menemukan siswa yang cocok.</p>;
                  }

                  return filtered.map((item: any) => (
                    <div 
                      key={item.nis} 
                      onClick={() => {
                        setActiveModal(null);
                        setTimeout(() => {
                          (window as any).showStudentProfile?.(item.nis);
                        }, 100);
                      }}
                      className="bg-[#161b22] border border-slate-800/80 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 hover:border-indigo-500/40 hover:bg-slate-800/20 transition duration-200 cursor-pointer group"
                      title="Klik untuk detail riwayat & nilai siswa"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.jenis_kelamin === 'L' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        }`}>{item.jenis_kelamin}</span>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-400 transition-colors">{item.nama}</span>
                          <span className="text-[10px] text-slate-500 font-mono">NIS: {item.nis} &bull; {item.sekolah}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-800/80 text-slate-300 border border-slate-700/60 rounded-lg group-hover:border-blue-500/20 transition-all">{item.nama_kelas}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'rare_attendance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090d16]/92 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111622] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <UserX className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100 font-mono">Indeks Presensi Buruk{classSuffix}</h4>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">Siswa dengan satu atau lebih absensi Tidak Hadir</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition duration-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto relative z-10 pr-1">
                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs font-bold font-mono">Memetakan data presensi buruk...</span>
                  </div>
                ) : (() => {
                  const filtered = modalData.filter((s: any) => 
                    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.nis.includes(searchQuery)
                  );
                  
                  if (filtered.length === 0) {
                    return <p className="text-center text-xs text-slate-500 italic py-6">Tidak ada siswa yang terdeteksi jarang hadir dengan filter tersebut.</p>;
                  }

                  return filtered.map((item: any) => {
                    const isSevere = item.total_tidak_hadir >= 3;
                    return (
                      <div 
                        key={item.nis} 
                        onClick={() => {
                          setActiveModal(null);
                          setTimeout(() => {
                            (window as any).showStudentProfile?.(item.nis);
                          }, 100);
                        }}
                        className="bg-[#161b22] border border-slate-800/80 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/30 hover:bg-slate-800/20 transition duration-200 cursor-pointer group"
                        title="Klik untuk detail riwayat & nilai siswa"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{item.nama}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-md">{item.nama_kelas}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">NIS: {item.nis} &bull; {item.sekolah}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[10px] font-bold">
                          <span className="text-blue-400">S: {item.sakit_count}</span>
                          <span className="text-indigo-400">I: {item.izin_count}</span>
                          <span className="text-rose-400">A: {item.alfa_count}</span>
                          <span className={`px-2 py-0.5 rounded-md border ${
                            isSevere ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.total_tidak_hadir}x Absen
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'remedial' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090d16]/92 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111622] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <Percent className="w-5 h-5 text-rose-500" />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-100">Daftar Aktivitas Siswa Remedial{classSuffix}</h4>
                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">Menunjukkan detail ulangan harian atau ujian di bawah KKM</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition duration-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama siswa atau nama aktivitas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-xl text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto relative z-10 pr-1">
                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                    <span className="text-xs font-bold font-mono">Memuat nilai remedial...</span>
                  </div>
                ) : (() => {
                  const filtered = modalData.filter((s: any) => 
                    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.nama_aktivitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.nis.includes(searchQuery)
                  );
                  
                  if (filtered.length === 0) {
                    return <p className="text-center text-xs text-slate-500 italic py-6">Tidak menemukan riwayat remedial yang cocok.</p>;
                  }

                  return filtered.map((item: any, idx: number) => (
                    <div 
                      key={`${item.nis}-${item.nama_aktivitas}-${idx}`} 
                      onClick={() => {
                        setActiveModal(null);
                        setTimeout(() => {
                          (window as any).showStudentProfile?.(item.nis);
                        }, 100);
                      }}
                      className="bg-[#161b22] border border-slate-800/80 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-500/30 hover:bg-slate-800/20 transition duration-200 cursor-pointer group"
                      title="Klik untuk detail riwayat & nilai siswa"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">{item.nama}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-md">{item.nama_kelas}</span>
                        </div>
                        <span className="text-[9px] text-rose-450 block mt-0.5 font-semibold">Ujian: {item.nama_aktivitas} ({new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})})</span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-[#12161f] border border-slate-800 px-3 py-1.5 rounded-lg text-right font-mono self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-rose-400">{item.nilai}</span>
                          <span className="text-[9px] text-slate-500"> / KKM {item.kkm}</span>
                        </div>
                        <span className="text-[10px] px-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold">REMEDI</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'binaan' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#090d16]/92 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#111622] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="text-base font-extrabold text-[#f1f5f9] tracking-tight">Siswa Binaan Khusus{classSuffix}</h4>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">Siswa yang terdeteksi butuh bimbingan (Remedial & Presensi Indeks Rendah)</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition duration-200 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative z-10">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-200 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-[350px] overflow-y-auto relative z-10 pr-1">
                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-xs font-bold font-mono">Memetakan siswa binaan...</span>
                  </div>
                ) : (() => {
                  const filtered = modalData.filter((s: any) => 
                    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    s.nis.includes(searchQuery)
                  );
                  
                  if (filtered.length === 0) {
                    return <p className="text-center text-xs text-slate-500 italic py-6">Tidak ada siswa binaan yang terdeteksi dengan filter tersebut.</p>;
                  }

                  return filtered.map((item: any) => {
                    return (
                      <div key={item.nis} className="bg-[#161b22] border border-slate-800/80 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-500/20 transition duration-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{item.nama}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-md">{item.nama_kelas}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">NIS: {item.nis} &bull; {item.sekolah}</span>
                        </div>
                        
                        <div className="flex items-center gap-2.5 self-end sm:self-auto font-mono text-[9px] font-bold">
                          {item.total_tidak_hadir > 0 && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {item.total_tidak_hadir}x Absen
                            </span>
                          )}
                          {item.total_remedial_fields > 0 && (
                            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                              {item.total_remedial_fields}x Remedi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
