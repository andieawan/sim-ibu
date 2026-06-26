import { useState, useEffect, lazy, Suspense } from 'react';
import { Layers, Plus, X, GraduationCap, Sparkles, BookOpen, LogOut, Palette, Sun, Moon, BarChart3, User as UserIcon } from 'lucide-react';
import { Kelas, Pengguna } from './types';
import Navbar from './components/Navbar';
import HomeView from './views/common/HomeView';
import ProfilView from './views/common/ProfilView';
import Modals from './components/Modals';
import LoginView from './views/common/LoginView';
import ProfileMenu from './components/ProfileMenu';
import PwaInstall from './components/PwaInstall';
import { AnimatePresence } from 'motion/react';
import StudentDetailModal from './components/StudentDetailModal';
import ChangelogModal from './components/ChangelogModal';

// ============================================================================
// OPTIMASI LAZY LOADING KOMPONEN UTAMA (PERFORMA & MOBILE-FIRST)
// Maksud Bisnis: Memuat halaman-halaman dengan kapasitas kueri dan aset yang berat secara
// asinkronus (on-demand) guna memangkas ukuran initial bundle file. Hal ini meningkatkan
// kecepatan akses pertama (Load Time) secara drastif pada perangkat seluler dengan kuota data terbatas.
// ============================================================================
const AbsensiView = lazy(() => import('./views/guru/AbsensiView'));
const NilaiView = lazy(() => import('./views/guru/NilaiView'));
const RekapView = lazy(() => import('./views/guru/RekapView'));
const AdminView = lazy(() => import('./views/admin/AdminView'));
const WaliMuridView = lazy(() => import('./views/wali-murid/WaliMuridView'));
const BkView = lazy(() => import('./views/bk/BkView'));
const KajurView = lazy(() => import('./views/kajur/KajurView'));
const KepsekView = lazy(() => import('./views/kepsek/KepsekView'));

// Loader Fallback minimalis dengan efek rotasi spinner dan teks berkedip (pulse)
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4 select-none">
    <div className="w-10 h-10 rounded-full border-2 border-blue-500/10 border-t-blue-500 animate-spin" />
    <span className="text-[10px] font-mono font-extrabold tracking-widest text-slate-500 uppercase animate-pulse">Memuat Halaman...</span>
  </div>
);
// === AKHIR BLOK OPTIMASI LAZY LOADING ===

// ============================================================================
// SIM-IBU (SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM) - CORE FRONTEND COMPONENT
// FILE: src/App.tsx
// 
// Developer Note:
// Komponen App ini bertindak sebagai "Router Utama" SPA (Single Page Application).
// Kami melacak state auth (currentUser), classes data, dan "activeTab", lalu merender 
// komponen tampilan (`views/*`) yang tepat berdasarkan tab aktif dan tipe role dari user.
// ============================================================================

export default function App() {
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('simibu_theme');
    if (saved) return saved;
    return 'dark';
  });

  const [appEnv, setAppEnv] = useState<'dev' | 'pub'>('dev');

  const [schoolIdentity, setSchoolIdentity] = useState({
    nama_sekolah: 'SMKS Islam Bustanul Ulum',
    motto: 'SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM',
    alamat: 'Jl. Pendidikan No. 45, Kecamatan Bojong',
    npsn: '12345678',
    kepala_sekolah: 'Drs. H. Ahmad Sudrajat, M.Pd',
    tahun_pelajaran: '2024/2025',
    semester: 'Ganjil'
  });

  const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => {
    // Aliran Data: Membaca status login pengguna dari penyimpanan lokal atau sesi untuk standardisasi simibu_user
    const saved = localStorage.getItem('simibu_user') || sessionStorage.getItem('simibu_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Modal displays
  const [showAddKelas, setShowAddKelas] = useState<boolean>(false);
  const [showAddSiswa, setShowAddSiswa] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  
  // FAB overlay menu state
  const [showFabMenu, setShowFabMenu] = useState<boolean>(false);

  // State detail profil siswa interaktif
  const [selectedStudentNis, setSelectedStudentNis] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);

  const fetchSchoolIdentity = async () => {
    try {
      const res = await fetch('/api/school-identity');
      if (res.ok) {
        const data = await res.json();
        setSchoolIdentity(data);
      }
    } catch (err) {
      console.error('Error fetching global school identity:', err);
    }
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch('/api/kelas');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.appEnv === 'pub' || data.appEnv === 'publish') {
            setAppEnv('pub');
          } else {
            setAppEnv('dev');
          }
        }
      } catch (err) {
        console.error('Error fetching system config:', err);
      }
    };
    fetchConfig();
    fetchClasses();
    fetchSchoolIdentity();

    // Daftarkan fungsi pemanggil profil siswa secara global agar dapat diakses oleh komponen anak manapun
    (window as any).showStudentProfile = (nis: string) => {
      setSelectedStudentNis(nis);
      setIsStudentModalOpen(true);
    };

    return () => {
      delete (window as any).showStudentProfile;
    };
  }, []);

  // ============================================================================
  // SINKRONISASI TEMA AKTIF KE ROOT <html>
  // Penjelasan: Ini sangat penting untuk memastikan browser atau kontainer iframe 
  // merender warna latar belakang yang tepat saat digulir ke batas maksimal (overscroll) 
  // agar tidak menyisakan area strip putih mengganggu di bagian bawah layar.
  // ============================================================================
  useEffect(() => {
    const root = document.documentElement;
    // Bersihkan semua kelas tema yang terdaftar sebelumnya pada root
    root.classList.forEach((cls) => {
      if (cls.startsWith('theme-')) {
        root.classList.remove(cls);
      }
    });
    // Tambahkan kelas tema aktif
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const handleNavigateToTab = (tab: string, classId?: number) => {
    if (tab === 'profil' || tab === 'statistik') {
      setCurrentTab('beranda');
      if (classId) {
        setSelectedClassId(classId);
      }
      return;
    }
    setCurrentTab(tab);
    if (classId) {
      setSelectedClassId(classId);
    }
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'beranda':
        return 'Beranda';
      case 'absensi':
        return 'Absensi Kehadiran';
      case 'nilai':
        return 'Rekap Nilai & KKM';
      case 'rekap':
        return 'Rekapitulasi Data Sekolah';
      case 'profil':
        return 'Statistik & Diagnosa';
      case 'admin':
        return 'Panel Admin';
      case 'walikelas':
        return 'Evaluasi Wali Kelas';
      case 'bk':
        return 'Bimbingan Konseling';
      case 'kajur':
        return 'Kepala Jurusan';
      case 'kepsek':
        return 'Kepala Sekolah';
      default:
        return 'SIM-IBU';
    }
  };

  const getHeaderSub = () => {
    const academicInfo = `[${schoolIdentity.tahun_pelajaran} - ${schoolIdentity.semester}]`;
    switch (currentTab) {
      case 'beranda':
        if (currentUser?.role === 'wali_murid') {
          const waliMuridClass = classes.find(c => c.id === currentUser?.kelas_id);
          return `${academicInfo} Selamat Datang, Wali Murid Kelas ${waliMuridClass?.nama_kelas || '...'}`;
        }
        return `${academicInfo} Selamat bertugas kembali, ${currentUser?.nama || currentUser?.username} (${currentUser?.role === 'admin' ? 'Administrator' : 'Guru'})!`;
      case 'absensi':
        return `${academicInfo} Memantau presensi harian kelas bimbingan`;
      case 'nilai':
        return `${academicInfo} Penilaian tuntas dengan pengaturan KKM mandiri oleh pengajar`;
      case 'rekap':
        return `${academicInfo} Unduh berkas Excel laporan & cetak kelulusan semester`;
      case 'profil':
        return `${academicInfo} Statistik rekapitulasi database sekolah`;
      case 'admin':
        return `${academicInfo} Pengelolaan akun pengguna dan server sekolah`;
      case 'walikelas':
        return `${academicInfo} Dashboard khusus monitor kinerja presensi dan IP nilai siswa bimbingan`;
      case 'bk':
        return `${academicInfo} Memantau kedisiplinan dan prestasi siswa`;
      case 'kajur':
        return `${academicInfo} Evaluasi kelayakan program keahlian dan PKL`;
      case 'kepsek':
        return `${academicInfo} Laporan eksekutif ringkasan akademik sekolah`;
      default:
        return academicInfo;
    }
  };

  if (!currentUser) {
    return (
      <LoginView
        appEnv={appEnv}
        onLoginSuccess={(user) => {
          // Aliran Data: Menyimpan data pengguna ke localStorage dan sessionStorage setelah sukses login
          setCurrentUser(user);
          localStorage.setItem('simibu_user', JSON.stringify(user));
          sessionStorage.setItem('simibu_user', JSON.stringify(user));
        }}
      />
    );
  }

  const isWaliKelas = classes.some(c => c.walikelas_id === currentUser?.id);
  const kelasMengajar = currentUser?.role === 'admin' ? classes : classes.filter(c => c.is_mengajar === 1);

  return (
    <div className={`min-h-screen theme-${theme} bg-[#0b0e14] text-slate-200 font-sans pb-28 antialiased selection:bg-blue-600/20 selection:text-blue-400`}>
      
      {/* Top Header Card */}
      <header className="bg-[#0f1219] border-b border-slate-800 sticky top-0 z-40 px-5 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center font-bold shadow-md">
            <GraduationCap className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-extrabold text-slate-100 leading-none uppercase tracking-tight">{getHeaderTitle()}</h1>
              {appEnv === 'dev' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 leading-none">
                  DEV
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                  PUB
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1.5">{getHeaderSub()}</p>
          </div>
        </div>

        {/* User Identity and Theme / Logout */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div 
            onClick={() => setShowProfileMenu(true)}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group hover:bg-slate-800/40 px-3 py-1.5 rounded-2xl transition active:scale-95 border border-transparent hover:border-slate-800"
            title="Pengaturan Profil"
          >
            <div className="hidden md:flex flex-col text-right pr-1">
              <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition leading-none">{currentUser.nama}</span>
              <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest leading-none mt-1 group-hover:text-blue-300 transition">{currentUser.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs ring-4 ring-blue-600/5 group-hover:ring-blue-600/15 transition">
              {currentUser.nama.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Suspense fallback={<LoadingFallback />}>
          {currentTab === 'beranda' && (
            currentUser?.role === 'wali_murid' ? (
              <WaliMuridView currentUser={currentUser} theme={theme as any} />
            ) : (
              <HomeView
                currentUser={currentUser!}
                classes={classes}
                loadingClasses={loadingClasses}
                onRefreshClasses={fetchClasses}
                onNavigateToTab={handleNavigateToTab}
                onOpenAddKelasModal={() => { setShowAddKelas(true); setShowFabMenu(false); }}
                onOpenAddSiswaModal={() => { setShowAddSiswa(true); setShowFabMenu(false); }}
                schoolIdentity={schoolIdentity}
                theme={theme}
              />
            )
          )}

          {currentTab === 'absensi' && (
            <AbsensiView
              classes={kelasMengajar}
              loadingClasses={loadingClasses}
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
            />
          )}

          {currentTab === 'nilai' && (
            <NilaiView
              classes={kelasMengajar}
              loadingClasses={loadingClasses}
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
            />
          )}

          {currentTab === 'rekap' && (
            <RekapView
              classes={kelasMengajar}
              loadingClasses={loadingClasses}
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
            />
          )}

          {currentTab === 'admin' && (
            <AdminView
              classes={classes}
              onRefreshClasses={fetchClasses}
              currentUser={currentUser}
              onNavigateToTab={handleNavigateToTab}
            />
          )}

          {currentTab === 'bk' && (
            <BkView currentUser={currentUser} />
          )}

          {currentTab === 'kajur' && (
            <KajurView currentUser={currentUser} classes={classes} />
          )}

          {currentTab === 'kepsek' && (
            <KepsekView currentUser={currentUser} classes={classes} />
          )}
        </Suspense>
      </main>

      {/* Blue Floating Action Button (+) */}
      {currentUser.role === 'admin' && (
        <div className="fixed bottom-24 right-5 sm:right-8 z-40 flex flex-col items-center space-y-3">
          {/* FAB Overlay menu with transition */}
          {showFabMenu && (
            <div className="bg-[#161b22] rounded-2xl border border-slate-800 p-2.5 shadow-2xl flex flex-col space-y-1.5 animate-in slide-in-from-bottom-6 fade-in duration-200 text-xs font-bold leading-none select-none">
              <button
                onClick={() => {
                  setShowAddKelas(true);
                  setShowFabMenu(false);
                }}
                className="flex items-center space-x-2 text-slate-300 hover:text-blue-400 hover:bg-[#1a212d] transition-all p-2 rounded-xl"
              >
                <div className="bg-blue-900/40 text-blue-400 border border-blue-500/30 p-1 rounded-lg shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
                <span className="pr-1 text-[11px]">Tambah Kelas Baru</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAddSiswa(true);
                  setShowFabMenu(false);
                }}
                disabled={classes.length === 0}
                className="flex items-center space-x-2 text-slate-300 hover:text-blue-400 hover:bg-[#1a212d] transition-all p-2 rounded-xl disabled:opacity-50"
              >
                <div className="bg-indigo-900/40 text-indigo-400 border border-indigo-500/30 p-1 rounded-lg shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
                <span className="pr-1 text-[11px]">Tambah Siswa Baru</span>
              </button>
            </div>
          )}

          {/* Master click button */}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            id="fab-master-btn"
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 shadow-2xl border-4 border-slate-900 ring-4 ring-blue-600/20 ${
              showFabMenu 
                ? 'bg-rose-600 rotate-45 transform scale-105' 
                : 'bg-blue-600 hover:bg-blue-500 hover:scale-105'
            }`}
            title="Tambah Data Guru"
          >
            {showFabMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6 stroke-[2.5px]" />}
          </button>
        </div>
      )}

      {/* Fast modular modals injection */}
      <Modals
        classes={classes}
        showAddKelas={showAddKelas}
        showAddSiswa={showAddSiswa}
        onClose={() => {
          setShowAddKelas(false);
          setShowAddSiswa(false);
        }}
        onSuccessAddKelas={() => {
          setShowAddKelas(false);
          fetchClasses();
        }}
        onSuccessAddSiswa={() => {
          setShowAddSiswa(false);
          fetchClasses();
        }}
      />

      {/* Modal Detail Profil Siswa Komprehensif (Wajib untuk semua role: Admin, Guru, Wali Kelas, Wali Murid) */}
      <StudentDetailModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        nis={selectedStudentNis}
        theme={theme}
      />

      {/* Global Bot navigational bar */}
      <Navbar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isAdmin={currentUser.role === 'admin'} 
        isWaliKelas={isWaliKelas} 
        isWaliMurid={currentUser.role === 'wali_murid'}
        isBk={currentUser.role === 'bk'}
        isKajur={currentUser.role === 'kajur'}
        isKepsek={currentUser.role === 'kepsek'}
      />

      {/* Profile Sidebar Menu */}
      <AnimatePresence>
        {showProfileMenu && (
          <ProfileMenu
            user={currentUser}
            theme={theme}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              localStorage.setItem('simibu_theme', newTheme);
            }}
            onClose={() => setShowProfileMenu(false)}
            onOpenChangelog={() => {
              setShowProfileMenu(false);
              setIsChangelogOpen(true);
            }}
            onUpdateUser={(updatedUser) => {
              // Aliran Data: Memperbarui data pengguna secara sinkron di kedua penyimpanan (localStorage & sessionStorage)
              const fullUser = { ...currentUser, ...updatedUser };
              setCurrentUser(fullUser);
              localStorage.setItem('simibu_user', JSON.stringify(fullUser));
              sessionStorage.setItem('simibu_user', JSON.stringify(fullUser));
            }}
            onLogout={() => {
              // Aliran Data: Menghapus data login dari kedua penyimpanan pada saat logout
              setCurrentUser(null);
              localStorage.removeItem('simibu_user');
              sessionStorage.removeItem('simibu_user');
              setCurrentTab('beranda');
              setShowProfileMenu(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* PWA Floating Badge and Dialog */}
      <PwaInstall appEnv={appEnv} />

      {/* Modal Versi & Log Pembaruan (Changelog) */}
      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
        theme={theme} 
      />

    </div>
  );
}
