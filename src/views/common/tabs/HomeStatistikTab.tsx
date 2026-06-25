import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Kelas, Pengguna } from '../../../types';
import ProfilView from '../ProfilView';

// ============================================================================
// KOMPONEN: HomeStatistikTab
// Maksud Bisnis: Menampilkan tab khusus dashboard statistik akademis dan diagnosa 
// siswa (siswa binaan, remedial, absensi) secara terintegrasi tanpa perlu tombol 
// collapse/sembunyikan karena halaman ini sudah menjadi tab mandiri.
//
// Aliran Data:
// - Input (Props): data pengguna aktif (currentUser), daftar kelas (classes), 
//   identitas sekolah (schoolIdentity), preferensi tema (theme), fungsi navigasi,
//   dan pemuat data kelas.
// - Output: Render visualisasi dashboard statistik yang bersih dan ramah tema.
// ============================================================================
export default function HomeStatistikTab(props: any) {
  const {
    currentUser, classes, schoolIdentity, theme, onNavigateToTab,
    loadingClasses, selectedClassForView, setSelectedClassForView, handleViewSiswa,
    onRefreshClasses
  } = props;

  return (
    <div className="space-y-6">
      {/* Container Dashboard Utama - Menggunakan skema adaptif warna */}
      <div className="bg-[#111622] border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              {/* text-slate-100 digunakan menggantikan text-[#f1f5f9] agar terkonversi otomatis ke warna gelap di mode terang */}
              <h4 className="text-sm font-extrabold text-slate-100 tracking-tight">
                Diagnosa & Statistik Akademik
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Laporan siswa binaan, remedial, absensi buruk, dan status belajar per kelas.
              </p>
            </div>
          </div>
        </div>

        {/* Garis pembatas visual */}
        <div className="border-t border-slate-800/50 pt-5 relative z-10">
          {/* Render langsung ProfilView yang memuat grafik D3/Recharts utama */}
          <ProfilView
            currentUser={currentUser}
            classes={classes}
            onRefreshClasses={async () => { if (onRefreshClasses) await onRefreshClasses(); }}
            onNavigateToTab={onNavigateToTab}
            loadingClasses={loadingClasses}
            selectedClassId={selectedClassForView}
            onClassChange={(id) => {
              if (setSelectedClassForView) setSelectedClassForView(id);
              if (handleViewSiswa) handleViewSiswa(id);
            }}
            schoolIdentity={schoolIdentity as any}
            activeTheme={theme}
            onLogout={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
// === AKHIR DARI KOMPONEN STATISTIK TAB ===
