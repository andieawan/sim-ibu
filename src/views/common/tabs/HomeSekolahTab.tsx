import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import ProfilView from '../ProfilView';
import WaliKelasView from '../../wali-kelas/WaliKelasView';

export default function HomeSekolahTab(props: any) {
  const {
    currentUser, classes, schoolIdentity, theme, stats, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal,
    loadingClasses, displayedClasses, selectedClassForView, setSelectedClassForView, setSiswaListForView, handleViewSiswa, handleDeleteKelas,
    classStats, loadingSiswa, siswaListForView, handleDeactivateSiswa, handleReactivateSiswa,
    schedules, selectedDayFilter, setSelectedDayFilter, loadingSchedules,
    showStats, setShowStats, onRefreshClasses
  } = props;
  return (
    
        <div className="space-y-6">
          {/* Personalized Schedule Container */}
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Calendar className="w-16 h-16 text-emerald-500/5" />
            </div>

            {(() => {
              const dayOrder: Record<string, number> = {
                'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
              };

              const userSchedules = schedules.filter(s => {
                if (currentUser.role === 'admin') return true;
                return String(s.guru_id) === String(currentUser.id) || s.username_guru === currentUser.username;
              });

              const sortedUserSchedules = [...userSchedules].sort((a, b) => {
                const dDiff = (dayOrder[a.hari] || 9) - (dayOrder[b.hari] || 9);
                if (dDiff !== 0) return dDiff;
                return (a.waktu_mulai || '').localeCompare(b.waktu_mulai || '');
              });

              const filteredUserSchedules = sortedUserSchedules.filter(s => {
                if (selectedDayFilter === 'Semua') return true;
                return s.hari === selectedDayFilter;
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
                    <div>
                      <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                        <span>Jadwal Mengajar Saya</span>
                      </h4>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {currentUser.role === 'admin' 
                          ? 'Menampilkan seluruh pemetaan mata pelajaran aktif di sekolah.' 
                          : `Menampilkan jadwal mengajar terdaftar untuk guru bernama ${currentUser.nama}.`}
                      </p>
                    </div>
                    <span className="self-start md:self-auto px-2.5 py-1 bg-[#0f1219] text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/10 font-mono">
                      {userSchedules.length} SESI BELAJAR
                    </span>
                  </div>

                  {/* Day Pills Filter Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-900/40">
                    {['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                      const count = sortedUserSchedules.filter(s => day === 'Semua' || s.hari === day).length;
                      const isActive = selectedDayFilter === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDayFilter(day)}
                          className={`px-3 py-1.5 text-3xs font-bold font-mono rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 font-extrabold shadow-md'
                              : 'bg-[#0f1219] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span>{day.toUpperCase()}</span>
                          {count > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                              isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {loadingSchedules ? (
                    <div className="py-10 text-center text-slate-500 text-xs">Memuat daftar tugas mengajar...</div>
                  ) : filteredUserSchedules.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-800/80 rounded-2xl text-center text-slate-500 text-xs leading-relaxed space-y-1 bg-[#161b22]">
                      <p className="font-semibold text-slate-400 text-xs text-center">Tidak ada jadwal mengajar pada hari {selectedDayFilter === 'Semua' ? 'yang dipilih' : selectedDayFilter}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono font-bold text-center">Harap hubungi Administrator jika terjadi kesalahan jadwal.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUserSchedules.map((s) => (
                        <div key={s.id} className="bg-[#0f1219] p-4.5 rounded-2xl border border-slate-850 hover:border-slate-800/80 transition-all flex flex-col justify-between space-y-3 shadow-md group">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-500/10 rounded-md text-[10px] font-extrabold font-mono uppercase tracking-wider leading-none">
                                {s.hari}
                              </span>
                              <span className="text-3xs font-semibold font-mono text-slate-500">
                                {s.waktu_mulai} - {s.waktu_selesai}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-extrabold text-slate-200 group-hover:text-slate-100 transition truncate text-sm">{s.mata_pelajaran}</h5>
                              <p className="text-xs font-semibold text-indigo-400 mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                                Kelas: <strong className="font-bold">{s.nama_kelas}</strong>
                              </p>
                            </div>
                            
                            {currentUser.role === 'admin' && (
                              <div className="text-4xs font-mono text-slate-500 pt-1 border-t border-slate-900 leading-none">
                                GURU: <span className="font-bold text-slate-400">{s.nama_guru} ({s.username_guru})</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/60">
                            <button
                              onClick={() => onNavigateToTab('absensi', s.kelas_id)}
                              className="py-1.5 px-2.5 bg-blue-900/40 hover:bg-blue-900/70 text-blue-400 border border-blue-500/10 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              <span>Mulai Absensi</span>
                            </button>
                            <button
                              onClick={() => onNavigateToTab('nilai', s.kelas_id)}
                              className="py-1.5 px-2.5 bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-400 border border-indigo-500/10 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                              <span>Input Nilai</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Quick Guide and Manual entry cards */}
          <div className={`grid grid-cols-1 ${currentUser.role === 'admin' ? 'sm:grid-cols-2' : ''} gap-4`}>
            {currentUser.role === 'admin' && (
              <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex items-start space-x-3.5 shadow-md">
                <div className="bg-blue-600/20 text-blue-400 border border-blue-500/20 p-2.5 rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-200 text-sm">Ingin Tambah Satu per Satu?</h5>
                  <p className="text-slate-400 text-xs leading-relaxed">Klik tombol floating action (+) di bawah untuk menambah kelas baru atau entri siswa mandiri lewat formulir cepat.</p>
                </div>
              </div>
            )}

            <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex items-start space-x-3.5 shadow-md">
              <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 p-2.5 rounded-2xl">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-slate-200 text-sm">Sinkronisasi Siap Offline</h5>
                <p className="text-slate-400 text-xs leading-relaxed">Tiap absensi dan nilai yang diubah diinstalasi dengan timestamp lokal otomatis untuk mendeteksi status bentrok data.</p>
              </div>
            </div>
          </div>
        </div>
      
  );
}
