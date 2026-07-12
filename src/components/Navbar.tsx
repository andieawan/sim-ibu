// ============================================================================
// SIM-IBU (SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM) - COMPONENT
// FILE: src/components/Navbar.tsx
// 
// Catatan Pengembang:
// Komponen Navbar ini terletak di bagian bawah layar (fixed bottom) yang dirancang
// khusus dengan pendekatan mobile-first. Navigasi ini secara otomatis merender item menu
// berdasarkan hak akses (Role-based Access) dari pengguna yang sedang masuk.
// ============================================================================

import { Home, CalendarCheck, Award, BarChart3, Settings, FileSpreadsheet, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;          // Tab aktif saat ini (contoh: 'beranda', 'absensi')
  setTab: (tab: string) => void;// Fungsi setter untuk mengubah tab aktif di komponen induk (App.tsx)
  isAdmin?: boolean;           // Apakah pengguna aktif memiliki peran Administrator
  isWaliKelas?: boolean;       // Apakah pengguna aktif menjabat sebagai Wali Kelas
  isWaliMurid?: boolean;       // Apakah pengguna aktif adalah Wali Murid
  isBk?: boolean;              // Apakah pengguna aktif adalah Guru BK (Bimbingan Konseling)
  isKajur?: boolean;           // Apakah pengguna aktif adalah Kepala Jurusan (Kajur)
  isKepsek?: boolean;          // Apakah pengguna aktif adalah Kepala Sekolah (Kepsek)
}

export default function Navbar({ currentTab, setTab, isAdmin, isWaliKelas, isWaliMurid, isBk, isKajur, isKepsek }: NavbarProps) {
  // Secara default, semua peran pengguna memiliki akses ke tab Beranda.
  // Untuk Wali Murid, label diubah menjadi "Monitor Anak" demi kejelasan kontekstual.
  let navItems = [
    { id: 'beranda', label: isWaliMurid ? 'Monitor Anak' : 'Beranda', icon: Home },
  ];

  // Wali Murid dibatasi secara ketat hanya bisa melihat dashboard monitoring anak asuhannya
  if (!isWaliMurid) {
    // Guru, Admin, BK, Kajur, dan Kepsek memiliki akses dasar ke pengelolaan absensi, nilai, dan rekap
    navItems.push(
      { id: 'absensi', label: 'Absensi', icon: CalendarCheck },
      { id: 'nilai', label: 'Nilai', icon: Award }
    );
    navItems.push({ id: 'rekap', label: 'Rekap', icon: FileSpreadsheet });

    // Menu tambahan sesuai hak akses spesifik (Privilese):
    if (isAdmin) {
      // Administrator mendapatkan akses ke Panel Manajemen Pengguna, Kelas, dan Sistem
      navItems.push({ id: 'admin', label: 'Manajemen', icon: Settings });
    }
    if (isBk) {
      // Guru Bimbingan Konseling mendapatkan akses ke Panel Catatan Pembinaan dan Surat BK
      navItems.push({ id: 'bk', label: 'Bimbingan', icon: UserCheck });
    }
    if (isKajur) {
      // Kepala Jurusan mendapatkan akses ke Panel Monitoring Kompetensi Kejuruan
      navItems.push({ id: 'kajur', label: 'Kejuruan', icon: BarChart3 });
    }
    if (isKepsek) {
      // Kepala Sekolah mendapatkan akses ke Laporan Eksekutif dan Statistik Komprehensif
      navItems.push({ id: 'kepsek', label: 'Laporan', icon: BarChart3 });
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0f1219] border-t border-slate-800 flex justify-around items-stretch z-50 shadow-2xl px-4 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => setTab(item.id)}
            // Desain Interaktif: Efek sentuh taktil, highlight biru ketika aktif, area sentuh minim 44px
            className={`flex-1 min-w-0 flex flex-col items-center justify-center px-1 sm:px-6 transition-all duration-300 relative ${
              isActive 
                ? 'text-blue-500 border-t-2 border-blue-500 bg-blue-500/5 font-semibold' 
                : 'text-slate-500 hover:text-slate-200 border-t-2 border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
