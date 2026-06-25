import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Calendar, AlertTriangle, TrendingUp, CheckCircle2, 
  HelpCircle, User as UserIcon, BookOpen, ShieldAlert, Sparkles, Star, TrendingDown
} from 'lucide-react';
import { Kelas, Pengguna, Jadwal } from '../../types';

import WaliKelasValidasi from './WaliKelasValidasi';

interface WaliKelasViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
  onNavigateToTab: (tab: string, classId?: number) => void;
}

interface StudentStat {
  nis: string;
  nama: string;
  attendance_rate: number;
  absence_rate: number;
  average_grade: number;
}

export default function WaliKelasView({ currentUser, classes, onNavigateToTab }: WaliKelasViewProps) {
  // Find which class is managed by this user
  const myClasses = classes.filter(c => c.walikelas_id === currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [schedules, setSchedules] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'siswa' | 'diagnosa' | 'jadwal' | 'validasi'>('siswa');

  useEffect(() => {
    if (myClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(myClasses[0].id);
    }
  }, [classes, currentUser]);

  const activeClass = classes.find(c => c.id === selectedClassId);

  // Fetch Class Stats & Schedules
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch class performance stats
        const statsRes = await fetch(`/api/class-stats/${selectedClassId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStudentStats(statsData);
        }

        // Fetch school-wide schedules and filter for this class
        const schedulesRes = await fetch('/api/jadwal');
        if (schedulesRes.ok) {
          const schedData: Jadwal[] = await schedulesRes.json();
          setSchedules(schedData.filter(s => s.kelas_id === selectedClassId));
        }
      } catch (err) {
        console.error('Error fetching Wali Kelas data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClassId]);

  if (myClasses.length === 0) {
    return (
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-2xl my-12">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-tight">Akses Menu Wali Kelas Terkunci</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Akun Anda (<strong className="text-slate-200">{currentUser.nama}</strong>) saat ini belum bimbing atau ditugaskan sebagai Wali Kelas untuk kelas bimbingan manapun. Hubungi <strong>Administrator Utama</strong> di panel manajemen untuk mendaftarkan bimbingan wali kelas.
          </p>
        </div>
        <button
          onClick={() => onNavigateToTab('beranda')}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-350 hover:text-slate-100 rounded-xl transition cursor-pointer hover:border-slate-700"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Derived metrics
  const totalStudents = studentStats.length;
  const averageClassGrade = totalStudents > 0 
    ? Math.round((studentStats.reduce((sum, s) => sum + s.average_grade, 0) / totalStudents) * 10) / 10 
    : 0;
  const averageClassAttendance = totalStudents > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.attendance_rate, 0) / totalStudents)
    : 100;

  // Alerts for students needing support
  const lowAttendanceStudents = studentStats.filter(s => s.attendance_rate < 85);
  const lowGradeStudents = studentStats.filter(s => s.average_grade < 75);
  
  // High performers
  const topPerformers = [...studentStats]
    .sort((a, b) => b.average_grade - a.average_grade)
    .slice(0, 3)
    .filter(s => s.average_grade >= 80);

  return (
    <div className="space-y-6">
      
      {/* Upper Class Selection Greeting Bar */}
      <div className="bg-[#161b22] px-6 py-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h4 className="text-lg font-bold text-slate-100">Portal Wali Kelas</h4>
            <span className="bg-blue-950/40 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              {activeClass?.nama_kelas}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Selamat bertugas sebagai Wali Homeroom kelas <strong className="text-slate-200">{activeClass?.nama_kelas}</strong>, tingkatkan ketuntasan siswa bimbingan Anda.
          </p>
        </div>

        {/* Multi-class selector (if Assigned to more than 1 class) */}
        {myClasses.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Ganti Kelas:</span>
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="bg-[#0f1219] text-xs font-semibold text-slate-300 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {myClasses.map(c => (
                <option key={c.id} value={c.id}>{c.nama_kelas}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Key Performance Indicators - Dapat diklik/disentuh untuk beralih tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Students Card */}
        <div 
          onClick={() => setActiveSubTab('siswa')}
          className="bg-[#161b22] p-5 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:border-blue-500/30 hover:bg-[#1a212b]/80 active:scale-98 transition-all duration-300 group"
        >
          <div className="space-y-1">
            <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider font-mono block group-hover:text-blue-400 transition-colors">Peserta Didik Bimbingan</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-100 tracking-tight">{totalStudents}</span>
              <span className="text-2xs font-semibold text-slate-400">Siswa Aktif</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>
 
        {/* Attendance Rate Code Card */}
        <div 
          onClick={() => setActiveSubTab('diagnosa')}
          className="bg-[#161b22] p-5 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:border-emerald-500/30 hover:bg-[#1a212b]/80 active:scale-98 transition-all duration-300 group"
        >
          <div className="space-y-1">
            <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider font-mono block group-hover:text-emerald-400 transition-colors">Rerata Presensi Kelas</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">{averageClassAttendance}%</span>
              <span className="text-3xs font-bold text-emerald-500/80 uppercase">Target &gt;90%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>
 
        {/* Average Grade Card */}
        <div 
          onClick={() => setActiveSubTab('diagnosa')}
          className="bg-[#161b22] p-5 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:border-indigo-500/30 hover:bg-[#1a212b]/80 active:scale-98 transition-all duration-300 group"
        >
          <div className="space-y-1">
            <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider font-mono block group-hover:text-indigo-400 transition-colors">IP Kelas / Rerata Nilai</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-indigo-400 tracking-tight">{averageClassGrade}</span>
              <span className="text-3xs font-bold text-indigo-500/80 uppercase">KKM 75</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <Award className="w-5.5 h-5.5" />
          </div>
        </div>
 
      </div>

      {/* Sub tabs navigations menu */}
      <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-slate-800 gap-2 select-none overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('siswa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'siswa' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Siswa ({totalStudents})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagnosa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'diagnosa' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Diagnosa &amp; Statistik Bimbingan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('jadwal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'jadwal' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Pelajaran Kelas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('validasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'validasi' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Validasi Absensi</span>
        </button>
      </div>

      {/* Main tab panel renders */}
      {loading ? (
        <div className="bg-[#161b22] border border-slate-800 rounded-3xl py-12 text-center text-slate-500 text-xs">
          Mengambil data kelas bimbingan...
        </div>
      ) : (
        <>
          {/* Sub Tab: SIWA LIST */}
          {activeSubTab === 'siswa' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-200 text-sm">Rincian Siswa Kelas Bimbingan</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Daftar Prestasi &amp; Presensi Harian</p>
                </div>
              </div>

              {studentStats.length === 0 ? (
                <div className="py-8 text-center text-slate-550 text-xs">Belum ada data siswa di kelas ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-350">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 uppercase tracking-wider font-bold font-mono text-3xs">
                        <th className="pb-2.5 font-medium">Siswa</th>
                        <th className="pb-2.5 font-medium text-center">Rerata Nilai</th>
                        <th className="pb-2.5 font-medium text-center">Ketuntasan KKM</th>
                        <th className="pb-2.5 font-medium text-center">Presensi Harian</th>
                        <th className="pb-2.5 font-medium text-right">Diagnosa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {studentStats.map((s, idx) => {
                        const isGraded = s.average_grade > 0;
                        const isPassing = s.average_grade >= 75;
                        const isGoodPresence = s.attendance_rate >= 85;

                        return (
                          <tr key={s.nis} className="hover:bg-slate-900/40 group transition">
                            {/* Profile Name & NIS */}
                            <td className="py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-blue-400 group-hover:border-blue-500/30 transition text-2xs">
                                  {idx + 1}
                                </div>
                                <div 
                                  className="space-y-0.5 cursor-pointer"
                                  onClick={() => (window as any).showStudentProfile?.(s.nis)}
                                  title="Klik untuk detail siswa"
                                >
                                  <span className="font-bold text-slate-200 block text-xs group-hover:text-blue-400 group-hover:underline transition">{s.nama}</span>
                                  <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider group-hover:text-blue-400 transition">NIS: {s.nis} &bull; Detail &rarr;</span>
                                </div>
                              </div>
                            </td>

                            {/* Average Grade */}
                            <td className="py-3 text-center">
                              {isGraded ? (
                                <span className={`font-mono font-bold text-xs ${isPassing ? 'text-indigo-400' : 'text-rose-450'}`}>
                                  {s.average_grade}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-xs">N/A</span>
                              )}
                            </td>

                            {/* passing KKM Status badge */}
                            <td className="py-3 text-center">
                              {isGraded ? (
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border leading-none ${
                                  isPassing 
                                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/10' 
                                    : 'bg-rose-955/20 text-rose-400 border-rose-500/10'
                                }`}>
                                  {isPassing ? 'TUNTAS' : 'BIMBINGAN'}
                                </span>
                              ) : (
                                <span className="text-slate-655 text-[10px]">No Records</span>
                              )}
                            </td>

                            {/* Attendance Rate percentage bar representation */}
                            <td className="py-3 text-center">
                              <div className="flex flex-col items-center max-w-[100px] mx-auto space-y-1">
                                <span className={`font-mono font-bold text-xs ${isGoodPresence ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {s.attendance_rate}%
                                </span>
                                <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${isGoodPresence ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${s.attendance_rate}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Action Indicators */}
                            <td className="py-3 text-right">
                              {(!isPassing && isGraded) || !isGoodPresence ? (
                                <span className="text-amber-450 font-semibold flex items-center justify-end gap-1 font-sans text-[10px]" title="Perlu Pendampingan Khusus">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="hidden sm:inline">Perlu Bimbingan</span>
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-semibold flex items-center justify-end gap-1 font-sans text-[10px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="hidden sm:inline">Normal</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: BIMBINGAN DIGANOSA STATS */}
          {activeSubTab === 'diagnosa' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left hand details (Diagnosa bimbingan) */}
              <div className="md:col-span-12 lg:col-span-7 bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                <div>
                  <h5 className="font-bold text-slate-200 text-sm">Dashboard Tindak Lanjut Wali Kelas</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Daftar Pengawasan Akademik &amp; Absensi Khusus</p>
                </div>

                {/* Warning lists if students need attention */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Attendance Alert Panel */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">Presensi Rendah (&lt;85%)</span>
                    </div>

                     {lowAttendanceStudents.length === 0 ? (
                      <div className="py-4 text-center text-slate-600 text-[11px] font-medium">Bagus! Seluruh siswa bimbingan rajin hadir.</div>
                    ) : (
                      <div className="space-y-2">
                        {lowAttendanceStudents.map(s => (
                          <div 
                            key={s.nis} 
                            onClick={() => (window as any).showStudentProfile?.(s.nis)}
                            className="flex justify-between items-center text-xs p-2.5 bg-[#0f1219] hover:bg-slate-800/60 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer group"
                            title="Klik untuk detail"
                          >
                            <span className="font-semibold text-slate-300 truncate max-w-[140px] group-hover:text-blue-400 transition-colors">{s.nama}</span>
                            <span className="font-mono text-amber-400 font-extrabold text-[11px]">{s.attendance_rate}% hadir</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Academics Alert Panel */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center font-bold">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">Nilai di Bawah KKM (&lt;75)</span>
                    </div>

                    {lowGradeStudents.length === 0 ? (
                      <div className="py-4 text-center text-slate-600 text-[11px] font-medium">Luar biasa! Tidak ada siswa di bawah KKM.</div>
                    ) : (
                      <div className="space-y-2">
                        {lowGradeStudents.map(s => (
                          <div 
                            key={s.nis} 
                            onClick={() => (window as any).showStudentProfile?.(s.nis)}
                            className="flex justify-between items-center text-xs p-2.5 bg-[#0f1219] hover:bg-slate-800/60 rounded-xl border border-slate-850 hover:border-slate-700 transition cursor-pointer group"
                            title="Klik untuk detail"
                          >
                            <span className="font-semibold text-slate-300 truncate max-w-[140px] group-hover:text-blue-400 transition-colors">{s.nama}</span>
                            <span className="font-mono text-rose-400 font-extrabold text-[11px]">{s.average_grade} IP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* General Advice checklist for Wali Kelas action */}
                <div className="p-4 bg-blue-950/10 border border-blue-500/20 rounded-2xl space-y-2.5">
                  <span className="text-xs font-extrabold uppercase text-blue-400 tracking-wider font-mono flex items-center gap-1.5 leading-none">
                    <Sparkles className="w-4 h-4" />
                    <span>Langkah Pendampingan Direkomendasikan</span>
                  </span>
                  <ul className="text-slate-400 text-xs space-y-1.5 list-disc pl-5 font-medium leading-relaxed">
                    {lowAttendanceStudents.length > 0 && (
                      <li>Panggil siswa dengan persentase kehadiran rendah untuk konseling preventif.</li>
                    )}
                    {lowGradeStudents.length > 0 && (
                      <li>Koordinasikan dengan guru pengajar terkait pemberian program remedial untuk siswa di bawah KKM.</li>
                    )}
                    <li>Gunakan menu <strong>Rekap Laporan</strong> di beranda navigasi bawah untuk mencetak buku laporan evaluasi wali kelas.</li>
                  </ul>
                </div>
              </div>

              {/* Right hand layout (Bento highlights list eg Top Performers) */}
              <div className="md:col-span-12 lg:col-span-5 bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                <div>
                  <h5 className="font-bold text-slate-200 text-sm">Apresiasi Prestasi Kelas</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Penghargaan 3 Siswa dengan IP Sempurna</p>
                </div>

                {topPerformers.length === 0 ? (
                  <div className="py-12 bg-slate-900/40 border border-slate-850 border-dashed rounded-2xl text-center text-slate-550 text-xs text-medium">
                    Belum ada siswa dengan rata-rata nilai istimewa (&gt;=80) pada semester ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.map((s, idx) => (
                      <div 
                        key={s.nis}
                        className="p-4 bg-gradient-to-r from-blue-950/20 to-indigo-950/10 border border-blue-500/20 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition duration-300"
                      >
                        {/* Background subtle star outline */}
                        <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:scale-110 transition duration-300">
                          <Star className="w-24 h-24 text-blue-400" />
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm border shadow-sm shrink-0 ${
                            idx === 0 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : idx === 1 
                                ? 'bg-slate-350/10 text-slate-300 border-slate-400/20' 
                                : 'bg-orange-800/10 text-orange-400 border-orange-700/20'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block text-xs group-hover:text-blue-400 transition">{s.nama}</span>
                            <span className="text-[10px] font-mono text-slate-505 block leading-none mt-1">Siswa Berprestasi</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-blue-450 font-mono tracking-tight">{s.average_grade}</span>
                          <span className="text-4xs block font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">Skor IP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Sub Tab: EXCLUSIVE CLASS SCHEDULES */}
          {activeSubTab === 'jadwal' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div>
                <h5 className="font-bold text-slate-200 text-sm">Jadwal Belajar Kelas</h5>
                <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Jadwal Mingguan Mata Pelajaran yang Terpetakan</p>
              </div>

              {schedules.length === 0 ? (
                <div className="py-12 text-center text-slate-550 text-xs border border-dashed border-slate-800 rounded-2xl">
                  Tidak ada jadwal mata pelajaran untuk siswa kelas bimbingan ini hari ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                  {schedules.map(s => (
                    <div 
                      key={s.id}
                      className="p-4 bg-[#0f1219] border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wide">
                            {s.hari}
                          </span>
                          <span className="text-2xs font-bold text-slate-500 font-mono">
                            {s.waktu_mulai} - {s.waktu_selesai}
                          </span>
                        </div>
                        <h6 className="font-extrabold text-slate-100 text-xs leading-snug">{s.mata_pelajaran}</h6>
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] font-medium text-slate-450">
                        <span className="truncate max-w-[130px]" title={s.nama_guru}>Guru: {s.nama_guru}</span>
                        <span className="text-slate-550 font-mono uppercase text-3xs">{s.username_guru}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'validasi' && activeClass && (
            <WaliKelasValidasi kelasId={activeClass.id} />
          )}
        </>
      )}

    </div>
  );
}
