import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';

export default function HomeKelasTab(props: any) {
  const {
    currentUser, classes, schoolIdentity, theme, stats, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal,
    loadingClasses, displayedClasses, selectedClassForView, setSelectedClassForView, setSiswaListForView, handleViewSiswa, handleDeleteKelas,
    classStats, loadingSiswa, siswaListForView, handleDeactivateSiswa, handleReactivateSiswa,
    schedules, selectedDayFilter, setSelectedDayFilter, loadingSchedules,
    showStats, setShowStats, onRefreshClasses
  } = props;
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
      
  // ============================================================================
  // RENDERING TAB DAFTAR KELAS ADAPTIF (LIGHT & DARK MODE)
  // Maksud Bisnis: Menampilkan daftar kelas yang terdaftar dengan gaya bento-grid premium,
  // di mana kelas yang aktif/dipilih memiliki kontras visual tinggi, skema warna dinamis,
  // serta accordion informasi detail siswa dan grafik statistik Recharts.
  //
  // Aliran Data:
  // - Input: `displayedClasses` (array data kelas), `selectedClassForView` (ID kelas aktif),
  //   `theme` ('light' | 'dark' atau tema kustom lainnya), `classStats` (data performa absensi/nilai).
  // - Output: Antarmuka interaktif responsif dengan transisi animasi accordion yang halus.
  // ============================================================================
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>Daftar Kelas Tersedia</h4>
              {currentUser.role === 'admin' && (
                <button
                  onClick={onOpenAddKelasModal}
                  className="text-xs text-blue-400 font-bold bg-blue-900/40 border border-blue-500/30 hover:bg-blue-900/60 px-3 py-1.5 rounded-full"
                >
                  + Kelas
                </button>
              )}
            </div>

            {loadingClasses ? (
              <div className="py-12 text-center text-slate-500 font-medium animate-pulse">Loading kelas...</div>
            ) : displayedClasses.length === 0 ? (
              <div className={`py-12 rounded-3xl border border-dashed text-center text-sm ${
                theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-[#161b22] border-slate-800/80 text-slate-400'
              }`}>
                Belum ada kelas terdaftar. {currentUser.role === 'admin' && 'Klik + Kelas untuk memulai.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayedClasses.map((k) => {
                  const isSelected = selectedClassForView === k.id;
                  return (
                    <div
                      key={k.id}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? theme === 'light'
                            ? 'bg-blue-50/70 border-blue-500/45 shadow-lg ring-1 ring-blue-500/10'
                            : 'bg-[#111622]/85 border-blue-500/40 shadow-xl ring-1 ring-blue-500/10'
                          : theme === 'light'
                            ? 'bg-white border-slate-200/90 hover:border-slate-300/90 hover:shadow-sm'
                            : 'bg-[#161b22] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* // --- BAGIAN TOMBOL HEADER KELAS --- */}
                      <div
                        onClick={() => {
                          if (isSelected) {
                            setSelectedClassForView(null);
                            setSiswaListForView([]);
                          } else {
                            handleViewSiswa(k.id);
                          }
                        }}
                        className={`p-4 text-left cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected 
                            ? theme === 'light'
                              ? 'bg-gradient-to-r from-blue-500/10 via-blue-50/40 to-transparent border-b border-blue-100'
                              : 'bg-gradient-to-r from-blue-600/15 via-blue-900/10 to-transparent border-b border-slate-800/60' 
                            : theme === 'light'
                              ? 'hover:bg-slate-50/80'
                              : 'hover:bg-[#1c212c]'
                        }`}
                      >
                        <div className="space-y-1">
                          <h5 className={`font-extrabold text-sm flex items-center gap-2 ${
                            theme === 'light' ? 'text-slate-800' : 'text-[#f1f5f9]'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              isSelected 
                                ? theme === 'light' ? 'bg-blue-600 animate-pulse' : 'bg-blue-400 animate-pulse' 
                                : 'bg-slate-400'
                            }`} />
                            {k.nama_kelas}
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              theme === 'light'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-[#0f1219] text-slate-400 border-slate-850'
                            }`}>
                              {k.sekolah}
                            </span>
                            {isSelected && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse ${
                                theme === 'light' 
                                  ? 'text-blue-700 bg-blue-50 border border-blue-200' 
                                  : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                              }`}>
                                Detail Terbuka
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteKelas(k.id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg transition-colors hover:bg-rose-500/10 cursor-pointer"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className={`p-1 rounded-lg transition-colors ${
                            isSelected 
                              ? theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}>
                            <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
                              isSelected 
                                ? theme === 'light' ? 'rotate-90 text-blue-600' : 'rotate-90 text-blue-400' 
                                : ''
                            }`} />
                          </div>
                        </div>
                      </div>
                      {/* // --- AKHIR DARI TOMBOL HEADER KELAS --- */}

                      {/* // --- CONTAINER ACCORDION DETAIL KELAS --- */}
                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className={`${theme === 'light' ? 'bg-blue-50/20' : 'bg-[#0e121a]/80'} overflow-hidden`}
                          >
                            <div className={`p-4 sm:p-5 space-y-4 border-t ${theme === 'light' ? 'border-blue-100' : 'border-slate-850'}`}>
                              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b gap-2 ${
                                theme === 'light' ? 'border-slate-200' : 'border-slate-850'
                              }`}>
                                <div>
                                  <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                                  }`}>
                                    Daftar Siswa Kelas {k.nama_kelas}
                                  </h4>
                                  <p className={`text-[11px] ${
                                    theme === 'light' ? 'text-slate-500' : 'text-slate-550'
                                  }`}>Menampilkan seluruh daftar siswa dan statistik belajar aktif.</p>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  {currentUser.role === 'admin' && (
                                    <button
                                      onClick={onOpenAddSiswaModal}
                                      className="bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all"
                                    >
                                      + Siswa
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedClassForView(null);
                                      setSiswaListForView([]);
                                    }}
                                    className="text-xs text-rose-400 hover:text-rose-350 font-bold px-2.5 py-1.5 rounded-xl hover:bg-rose-500/5 transition-colors cursor-pointer"
                                  >
                                    Tutup Detail
                                  </button>
                                </div>
                              </div>

                              {/* Action items inside class details */}
                              <div className="flex gap-2.5">
                                <button
                                  onClick={() => onNavigateToTab('absensi', k.id)}
                                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                                    theme === 'light' 
                                      ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100/70' 
                                      : 'text-blue-400 bg-blue-900/30 border border-blue-500/20 hover:bg-blue-900/50'
                                  }`}
                                >
                                  Isi Absensi Kelas
                                </button>
                                <button
                                  onClick={() => onNavigateToTab('nilai', k.id)}
                                  className={`flex-1 py-2 text-center text-xs font-bold rounded-xl cursor-pointer transition-all ${
                                    theme === 'light' 
                                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70' 
                                      : 'text-indigo-400 bg-indigo-900/30 border border-indigo-500/20 hover:bg-indigo-900/50'
                                  }`}
                                >
                                  Input Nilai Kelas
                                </button>
                              </div>

                              {/* Class-level Summary Statistics (Recharts Component) */}
                              {classStats && classStats.length > 0 && (() => {
                                const isScrollable = classStats.length > 15;
                                const chartMinWidth = isScrollable ? Math.max(700, classStats.length * 35) : '100%';
                                return (
                                  <div className={`p-3.5 rounded-2xl border space-y-3 shadow-inner ${
                                    theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0f1219] border-slate-800/80 text-slate-300'
                                  }`}>
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                                        theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                          theme === 'light' ? 'bg-emerald-600' : 'bg-emerald-400'
                                        }`} />
                                        Statistik Kelas: Rata-rata Nilai vs Rasio Absen
                                      </span>
                                      {isScrollable && (
                                        <span className="text-[9px] text-blue-400 bg-blue-950/40 border border-blue-900/30 px-1.5 py-0.5 rounded font-bold font-mono animate-pulse">
                                          ← Geser Layar/Kursor ↔ →
                                        </span>
                                      )}
                                      <span className="text-[9px] text-slate-500 font-bold font-mono">RECHARTS ENGINE</span>
                                    </div>

                                    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                      <div style={{ width: chartMinWidth === '100%' ? '100%' : `${chartMinWidth}px`, height: '200px' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                                          <ComposedChart data={classStats} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1f2937'} opacity={theme === 'light' ? 0.8 : 0.3} />
                                            <XAxis dataKey="name" stroke={theme === 'light' ? '#64748b' : '#4b5563'} tick={{ fontSize: 9 }} />
                                            <YAxis yAxisId="left" stroke={theme === 'light' ? '#2563eb' : '#3b82f6'} tick={{ fontSize: 9 }} domain={[0, 100]} />
                                            <YAxis yAxisId="right" orientation="right" stroke={theme === 'light' ? '#dc2626' : '#f43f5e'} tick={{ fontSize: 9 }} domain={[0, 100]} allowDecimals={false} />
                                            <Tooltip
                                              contentStyle={{ 
                                                backgroundColor: theme === 'light' ? '#ffffff' : '#161b22', 
                                                borderColor: theme === 'light' ? '#e2e8f0' : '#374151', 
                                                borderRadius: '12px', 
                                                fontSize: '10px', 
                                                color: theme === 'light' ? '#1f2937' : '#e5e7eb' 
                                              }}
                                              itemStyle={{ color: theme === 'light' ? '#1f2937' : '#e5e7eb' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} />
                                            <Bar yAxisId="left" dataKey="Rata-rata Nilai" fill={theme === 'light' ? '#2563eb' : '#3b82f6'} radius={[3, 3, 0, 0]} barSize={12} />
                                            <Line yAxisId="right" type="monotone" dataKey="Rasio Absen (%)" stroke={theme === 'light' ? '#dc2626' : '#f43f5e'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                          </ComposedChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-slate-550 leading-relaxed font-medium">
                                      * Analisis Kelas: <strong>Batang Biru</strong> menunjukkan Rata-rata Nilai siswa. <strong>Garis Merah</strong> menunjukkan Rasio Absen / Ketidakhadiran siswa (0-100%).
                                    </p>
                                  </div>
                                );
                              })()}

                              {loadingSiswa ? (
                                <div className="py-8 text-center text-slate-500 font-medium text-xs animate-pulse">Loading data siswa...</div>
                              ) : siswaListForView.length === 0 ? (
                                <div className={`text-center py-8 text-slate-500 text-xs space-y-1 rounded-xl border ${
                                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#111622]/40 border-slate-800'
                                }`}>
                                  <p>Belum ada siswa di kelas ini.</p>
                                  <p className="text-[10px] text-slate-600">Gunakan tab info sekolah untuk mengimpor atau klik + Siswa.</p>
                                </div>
                              ) : (
                                <div className={`overflow-x-auto rounded-xl border ${
                                  theme === 'light' ? 'border-slate-200 bg-white' : 'border-slate-850 bg-[#111622]/45'
                                }`}>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className={`border-b pb-1 text-[10px] ${
                                        theme === 'light' ? 'bg-slate-100/80 border-slate-200 text-slate-700' : 'text-slate-500 bg-[#161b22]/50 border-slate-800/80'
                                      }`}>
                                        <th className="py-2.5 px-3 font-bold text-left uppercase tracking-wider text-[9px]">NIS</th>
                                        <th className="py-2.5 px-3 font-bold text-left uppercase tracking-wider text-[9px]">Nama Lengkap</th>
                                        <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wider text-[9px]">L/P</th>
                                        <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wider text-[9px]">Status</th>
                                        {currentUser.role === 'admin' && (
                                          <th className="py-2.5 px-3 font-bold text-center uppercase tracking-wider text-[9px]">Aksi</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {siswaListForView.map((s) => (
                                        <tr key={s.nis} className={`transition-colors ${
                                          theme === 'light' ? 'hover:bg-blue-100/40' : 'hover:bg-[#1c2129]/70'
                                        }`}>
                                          <td 
                                            className={`py-2.5 px-3 font-mono font-medium cursor-pointer hover:text-blue-500 transition-colors ${
                                              theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                                            }`}
                                            onClick={() => (window as any).showStudentProfile?.(s.nis)}
                                            title="Klik untuk melihat profil"
                                          >
                                            {s.nis}
                                          </td>
                                          <td 
                                            className={`py-2.5 px-3 font-bold cursor-pointer hover:text-blue-500 hover:underline transition-all ${
                                              theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                                            }`}
                                            onClick={() => (window as any).showStudentProfile?.(s.nis)}
                                            title="Klik untuk melihat profil"
                                          >
                                            {s.nama}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                              s.jenis_kelamin === 'L'
                                                ? theme === 'light' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-900/30 text-blue-400 border border-blue-500/10'
                                                : theme === 'light' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-pink-900/30 text-pink-400 border border-pink-500/10'
                                            }`} title={s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}>
                                              {s.jenis_kelamin}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                              s.status_aktif !== 0
                                                ? theme === 'light' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-emerald-950/40 text-emerald-450 border border-emerald-500/10'
                                                : theme === 'light' ? 'bg-amber-50 text-amber-700 border border-amber-250' : 'bg-amber-950/40 text-amber-500 border border-amber-500/10'
                                            }`}>
                                              {s.status_aktif !== 0 ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                          </td>
                                          {currentUser.role === 'admin' && (
                                            <td className="py-2.5 px-3 text-center">
                                              {s.status_aktif !== 0 ? (
                                                <button
                                                  onClick={() => handleDeactivateSiswa(s.nis)}
                                                  className="text-slate-500 hover:text-amber-500 p-1 transition-colors cursor-pointer"
                                                  title="Nonaktifkan Siswa (Berhenti/Pindah)"
                                                >
                                                  <UserX className="w-4 h-4 text-amber-550 hover:text-amber-400" />
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleReactivateSiswa(s.nis)}
                                                  className="text-slate-500 hover:text-blue-500 p-1 transition-colors cursor-pointer"
                                                  title="Aktifkan Kembali Siswa"
                                                >
                                                  <UserCheck className="w-4 h-4 text-blue-450 hover:text-blue-450" />
                                                </button>
                                              )}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* // --- AKHIR DARI CONTAINER ACCORDION DETAIL KELAS --- */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
  );
}
