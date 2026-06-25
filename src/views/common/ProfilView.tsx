import { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Percent, 
  Info, 
  RefreshCw, 
  UserX, 
  BarChart3,
  X,
  Search,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProfilModals from './ProfilModals';
import { Kelas, Pengguna, Jadwal } from '../../types';

interface StatsModel {
  total_kelas: number;
  total_siswa: number;
  total_l: number;
  total_p: number;
  total_absensi: number;
  rata_rata_nilai: number;
  total_jarang_masuk?: number;
  total_siswa_binaan?: number;
  persen_remedial: number;
  total_remedial: number;
  classes_breakdown?: Array<{
    id: number;
    nama_kelas: string;
    sekolah: string;
    total_siswa: number;
    total_l: number;
    total_p: number;
    total_jarang_masuk?: number;
    total_siswa_binaan?: number;
    rata_rata_nilai: number;
    total_remedial: number;
    persen_remedial: number;
  }>;
}

interface ProfilViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
  onRefreshClasses: () => Promise<void>;
  onNavigateToTab: (tab: string, classId?: number) => void;
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
  onLogout: () => void;
  schoolIdentity?: {
    nama_sekolah: string;
    motto: string;
    alamat: string;
    npsn: string;
    kepala_sekolah: string;
  };
  activeTheme?: string;
  onThemeChange?: (theme: string) => void;
}

export default function ProfilView({
  currentUser,
  classes,
  onRefreshClasses,
  onNavigateToTab,
  loadingClasses,
  selectedClassId,
  onClassChange,
  onLogout,
  schoolIdentity,
  activeTheme = 'dark',
  onThemeChange
}: ProfilViewProps) {
  const [stats, setStats] = useState<StatsModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<Jadwal[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?guru_id=${currentUser.id}&role=${currentUser.role}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/jadwal');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules inside ProfilView:', error);
    }
  };

  const [activeModal, setActiveModal] = useState<'classes' | 'all_students' | 'rare_attendance' | 'remedial' | 'binaan' | null>(null);
  const [selectedClassIdForModal, setSelectedClassIdForModal] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const openClassFilteredModal = (classId: number, modalType: 'all_students' | 'rare_attendance' | 'remedial' | 'binaan') => {
    setSelectedClassIdForModal(classId);
    setActiveModal(modalType);
  };

  useEffect(() => {
    fetchStats();
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (!activeModal) {
      setSelectedClassIdForModal(null);
    }
    if (!activeModal || activeModal === 'classes') {
      setModalData([]);
      setSearchQuery('');
      return;
    }

    const fetchModalData = async () => {
      setModalLoading(true);
      try {
        const typeParam = activeModal === 'all_students' ? 'all' : activeModal;
        let url = `/api/stats/students?guru_id=${currentUser.id}&role=${currentUser.role}&type=${typeParam}`;
        if (selectedClassIdForModal) {
          url += `&kelas_id=${selectedClassIdForModal}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setModalData(data);
        }
      } catch (err) {
        console.error('Error fetching detail modal data:', err);
      } finally {
        setModalLoading(false);
      }
    };

    fetchModalData();
    setSearchQuery('');
  }, [activeModal, selectedClassIdForModal, currentUser.id, currentUser.role]);

  const targetClass = stats?.classes_breakdown?.find(c => Number(c.id) === Number(selectedClassIdForModal));
  const classSuffix = targetClass ? ` - ${targetClass.nama_kelas}` : '';

  return (
    <div className="space-y-6">
      {/* Search/Summary Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
           <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2.5">
             <BarChart3 className="w-5 h-5 text-blue-500" />
             Rangkuman Statistik Sekolah
           </h3>
           <p className="text-xs text-slate-500 font-medium mt-1">Data real-time berdasarkan aktivitas presensi dan penilaian guru.</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          Segarkan Data
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-[#161b22] border border-slate-800 rounded-3xl" />
            ))}
          </div>
        ) : !stats ? (
          <div className="py-12 text-center text-slate-500 bg-[#161b22] rounded-3xl border border-slate-800 text-sm italic">
            Gagal mengambil rangkuman statistik. Periksa koneksi database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class counts */}
            <div 
              onClick={() => setActiveModal('classes')}
              className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-md hover:border-blue-500/30 hover:bg-[#1a212b]/80 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Total Kelas</span>
                <div className="p-1.5 bg-blue-950/40 text-blue-400 border border-blue-500/10 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold font-sans text-slate-100 block leading-none">{stats.total_kelas}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 inline-block font-medium">Beban kerja kelas terdaftar &bull; <span className="text-blue-400 font-bold hover:underline">Detail &rarr;</span></span>
              </div>
            </div>

            {/* Student counts (Binaan) */}
            <div 
              onClick={() => setActiveModal('all_students')}
              className="bg-[#161b22] px-6 py-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-md hover:border-indigo-500/30 hover:bg-[#1a212b]/80 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Total Peserta Didik</span>
                <div className="p-1.5 bg-indigo-950/40 text-indigo-400 border border-indigo-500/10 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold font-sans text-slate-100 block leading-none">{stats.total_siswa}</span>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
                    <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">L: {stats.total_l}</div>
                    <div className="px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-md">P: {stats.total_p}</div>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold hover:underline">Detail &rarr;</span>
                </div>
              </div>
            </div>

            {/* Jarang Masuk */}
            <div 
              onClick={() => setActiveModal('rare_attendance')}
              className="bg-[#161b22] px-6 py-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-md hover:border-amber-500/30 hover:bg-[#1a212b]/80 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider font-mono">Indeks Presensi Buruk</span>
                <div className="p-1.5 bg-amber-950/40 text-amber-400 border border-amber-500/10 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                  <UserX className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-sans text-slate-100 leading-none">{stats.total_jarang_masuk ?? 0}</span>
                  <span className="text-[11px] font-bold text-amber-400 font-mono">
                    ({stats.total_siswa > 0 ? Math.round(((stats.total_jarang_masuk ?? 0) / stats.total_siswa) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${stats.total_siswa > 0 ? Math.round(((stats.total_jarang_masuk ?? 0) / stats.total_siswa) * 100) : 0}%` }} 
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 inline-block font-medium">Siswa jarang hadir &bull; <span className="text-amber-400 font-bold hover:underline font-bold">Detail &rarr;</span></span>
              </div>
            </div>

            {/* Remedial Ratio */}
            <div 
              onClick={() => setActiveModal('remedial')}
              className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-md hover:border-rose-500/30 hover:bg-[#1a212b]/80 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Persentase Remedial</span>
                <div className="p-1.5 bg-rose-950/40 text-rose-400 border border-rose-500/10 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-sans text-slate-100 leading-none">{stats.persen_remedial}%</span>
                  <span className="text-[11px] font-bold text-rose-400 font-mono">({stats.total_remedial} Siswa)</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats.persen_remedial}%` }} />
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 inline-block font-medium">Siswa butuh remedi &bull; <span className="text-rose-400 font-bold hover:underline font-bold">Detail &rarr;</span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown per Kelas */}
      {stats && stats.classes_breakdown && stats.classes_breakdown.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
             <h4 className="text-xs font-extrabold text-slate-500 tracking-widest uppercase font-mono">Breakdown Detail Per Kelas</h4>
             <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">ANALISIS KINERJA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stats.classes_breakdown.map((item) => {
              const passPct = 100 - item.persen_remedial;
              const needsPembinaan = passPct < 85;
              return (
                <div key={item.id} className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all opacity-20 ${needsPembinaan ? 'bg-amber-500/30 group-hover:bg-amber-500/50' : 'bg-emerald-500/30 group-hover:bg-emerald-500/50'}`} />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h5 className="font-extrabold text-slate-100 text-xl leading-tight">{item.nama_kelas}</h5>
                      <span className="text-[11px] text-slate-400 font-bold font-mono tracking-wider">{item.sekolah}</span>
                    </div>
                     <div 
                      onClick={() => openClassFilteredModal(item.id, 'all_students')}
                      className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800/60 text-center min-w-[70px] cursor-pointer hover:border-blue-500/40 hover:bg-[#12161f]/85 active:scale-95 transition-all duration-200 group/siswa"
                    >
                      <span className="text-xl font-extrabold text-slate-200 font-mono block leading-none group-hover/siswa:text-blue-400 transition-colors">{item.total_siswa}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Siswa</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div 
                      onClick={() => openClassFilteredModal(item.id, 'all_students')}
                      className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-emerald-500/40 hover:bg-[#12161f]/85 active:scale-98 transition-all duration-300 group/rata"
                    >
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Rata-rata Nilai</span>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight group-hover/rata:text-emerald-300 transition-colors">{item.rata_rata_nilai || '0'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">/ 100</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${item.rata_rata_nilai || 0}%` }} 
                        />
                      </div>
                    </div>
                    <div 
                      onClick={() => openClassFilteredModal(item.id, 'binaan')}
                      className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-blue-500/40 hover:bg-[#12161f]/85 active:scale-98 transition-all duration-300 group/binaan"
                    >
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Siswa Binaan</span>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-extrabold text-blue-400 font-mono tracking-tight group-hover/binaan:text-blue-300 transition-colors">
                          {item.total_siswa_binaan ?? 0}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">({item.total_siswa > 0 ? Math.round(((item.total_siswa_binaan ?? 0) / item.total_siswa) * 100) : 0}%)</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${item.total_siswa > 0 ? Math.round(((item.total_siswa_binaan ?? 0) / item.total_siswa) * 100) : 0}%` }} 
                        />
                      </div>
                    </div>
                    <div 
                      onClick={() => openClassFilteredModal(item.id, 'remedial')}
                      className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-rose-500/40 hover:bg-[#12161f]/85 active:scale-98 transition-all duration-300 group/remedial"
                    >
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Remedial</span>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-extrabold text-rose-450 font-mono tracking-tight group-hover/remedial:text-rose-400 transition-colors">
                          {item.total_remedial}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">({item.persen_remedial}%)</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full" 
                          style={{ width: `${item.persen_remedial}%` }} 
                        />
                      </div>
                    </div>
                    <div 
                      onClick={() => openClassFilteredModal(item.id, 'rare_attendance')}
                      className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800/80 cursor-pointer hover:border-amber-500/40 hover:bg-[#12161f]/85 active:scale-98 transition-all duration-300 group/jarang"
                    >
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Jarang Masuk</span>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight group-hover/jarang:text-amber-300 transition-colors">
                          {item.total_jarang_masuk ?? 0}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">({item.total_siswa > 0 ? Math.round(((item.total_jarang_masuk ?? 0) / item.total_siswa) * 100) : 0}%)</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${item.total_siswa > 0 ? Math.round(((item.total_jarang_masuk ?? 0) / item.total_siswa) * 100) : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end items-center pt-3 relative z-10">
                    <span className={`text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg border ${needsPembinaan ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                      {needsPembinaan ? '⚠️ BUTUH PEMBINAAN' : '🔥 SANGAT TUNTAS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
         <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold italic">Rangkuman ini dihasilkan secara otomatis dari data semester berjalan.</span>
         </div>
      </div>

      {/* Dynamic Popups inside ProfilView.tsx */}
      <ProfilModals 
        activeModal={activeModal} setActiveModal={setActiveModal} 
        modalData={modalData} modalLoading={modalLoading}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        onNavigateToTab={onNavigateToTab} 
        stats={stats} onClassChange={(classId) => { setActiveModal(null); onNavigateToTab('kelas', classId); }} 
        classSuffix={classSuffix} targetClass={targetClass}
      />
    </div>
  );
}
