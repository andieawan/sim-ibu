import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Layers, Upload, Download, Users, Trash2, ArrowRight, CheckCircle2, UserPlus, Info, Calendar, UserX, UserCheck, BarChart3 } from 'lucide-react';
import { Kelas, Siswa, Pengguna, Jadwal } from '../../types';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import ProfilView from './ProfilView';
import WaliKelasView from '../wali-kelas/WaliKelasView';
import HomeSekolahTab from './tabs/HomeSekolahTab';
import HomeWaliKelasTab from './tabs/HomeWaliKelasTab';
import HomeKelasTab from './tabs/HomeKelasTab';
import HomeStatistikTab from './tabs/HomeStatistikTab';
import * as XLSX from 'xlsx';

interface HomeViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
  loadingClasses: boolean;
  onRefreshClasses: () => void;
  onNavigateToTab: (tab: string, classId?: number) => void;
  onOpenAddKelasModal: () => void;
  onOpenAddSiswaModal: () => void;
  schoolIdentity?: {
    nama_sekolah: string;
    motto: string;
    alamat: string;
    npsn: string;
    kepala_sekolah: string;
    tahun_pelajaran?: string;
    semester?: string;
  };
  theme?: string;
}

export default function HomeView({
  currentUser,
  classes,
  loadingClasses,
  onRefreshClasses,
  onNavigateToTab,
  onOpenAddKelasModal,
  onOpenAddSiswaModal,
  schoolIdentity,
  theme = 'dark'
}: HomeViewProps) {
  const isWaliKelas = classes.some(c => c.walikelas_id === currentUser.id);
  const [activeSubTab, setActiveSubTab] = useState<'sekolah' | 'kelas' | 'walikelas' | 'statistik'>(
    isWaliKelas ? 'walikelas' : 'sekolah'
  );
  const [showStats, setShowStats] = useState<boolean>(true);
  const [selectedClassForImport, setSelectedClassForImport] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ nis: string; nama: string; jenis_kelamin: string }>>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [selectedClassForView, setSelectedClassForView] = useState<number | null>(null);
  const [siswaListForView, setSiswaListForView] = useState<Siswa[]>([]);
  const [loadingSiswa, setLoadingSiswa] = useState<boolean>(false);
  const [classStats, setClassStats] = useState<Array<{
    name: string;
    fullName: string;
    'Kehadiran (%)': number;
    'Tugas Kosong': number;
  }>>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Schedules state for home view
  const [schedules, setSchedules] = useState<Jadwal[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Semua');

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await fetch('/api/jadwal');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (e) {
      console.error('Error fetching schedules at HomeView:', e);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Filter classes taught by teacher (if not admin)
  const taughtClassIds = new Set(
    schedules
      .filter(s => String(s.guru_id) === String(currentUser.id) || s.username_guru === currentUser.username)
      .map(s => s.kelas_id)
  );
  
  const displayedClasses = currentUser.role === 'admin'
    ? classes
    : classes.filter(k => taughtClassIds.has(k.id));

  // Parse CSV client side to preview and validate
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length > 1) {
        const preview: typeof csvPreview = [];
        let delimiter = ',';
        if (lines[0].includes(';') && !lines[0].includes(',')) {
          delimiter = ';';
        }
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        const nisIdx = headers.findIndex(h => h.includes('nis'));
        const namaIdx = headers.findIndex(h => h.includes('nama'));
        const jkIdx = headers.findIndex(h => h.includes('jenis') || h.includes('kelamin') || h.includes('jk') || h.includes('gender'));

        if (nisIdx === -1 || namaIdx === -1) {
          setImportStatus({
            type: 'error',
            message: 'Kolom CSV tidak valid. Harus ada header "NIS" dan "Nama".',
          });
          return;
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              cols.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          cols.push(currentVal.trim());

          if (cols.length > Math.max(nisIdx, namaIdx)) {
            const nis = cols[nisIdx];
            const nama = cols[namaIdx];
            let jk = cols[jkIdx] || 'L';
            jk = jk.toUpperCase().startsWith('P') || jk.toLowerCase().includes('perempuan') ? 'P' : 'L';
            
            if (nis && nama) {
              preview.push({ nis, nama, jenis_kelamin: jk });
            }
          }
        }
        setCsvPreview(preview.slice(0, 5)); // show first 5 preview rows
      }
    };
    reader.readAsText(file);
  };

  const handleUploadCSV = async () => {
    if (!csvFile) {
      setImportStatus({ type: 'error', message: 'Silakan pilih file CSV terlebih dahulu.' });
      return;
    }
    if (!selectedClassForImport) {
      setImportStatus({ type: 'error', message: 'Silakan hubungkan file dengan kelas terlebih dahulu.' });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result as string;
        const response = await fetch(`/api/import-siswa/${selectedClassForImport}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: text,
        });

        const resData = await response.json();
        if (response.ok) {
          setImportStatus({ type: 'success', message: resData.message || 'Data siswa berhasil diimpor!' });
          setCsvFile(null);
          setCsvPreview([]);
          // clear input
          const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          if (selectedClassForView === parseInt(selectedClassForImport)) {
            handleViewSiswa(parseInt(selectedClassForImport));
          }
        } else {
          setImportStatus({ type: 'error', message: resData.error || 'Gagal mengimpor file.' });
        }
      };
      reader.readAsText(csvFile);
    } catch (error: any) {
      setImportStatus({ type: 'error', message: `Kesalahan: ${error.message}` });
    }
  };

  const downloadSampleCSV = () => {
    // ============================================================================
    // UNDUH FORMAT EXCEL TEMPLATE (.xlsx) UNTUK SISWA
    // Maksud Bisnis: Menghasilkan berkas template spreadsheet berformat .xlsx (Excel)
    // asli agar memudahkan guru/admin menginput data siswa dengan kolom yang sudah terstandarisasi.
    //
    // Aliran Data:
    // - Input: Array of Objects berisi kolom template (NIS, Nama Lengkap, Jenis Kelamin).
    // - Output: File biner .xlsx yang otomatis diunduh oleh browser pengguna.
    // ============================================================================
    try {
      const data = [
        { "NIS": "1001", "Nama Lengkap": "Budi Santoso", "Jenis Kelamin": "L" },
        { "NIS": "1002", "Nama Lengkap": "Siti Aminah", "Jenis Kelamin": "P" },
        { "NIS": "1003", "Nama Lengkap": "Doni Setiawan", "Jenis Kelamin": "L" },
        { "NIS": "1004", "Nama Lengkap": "Amelia Kusuma", "Jenis Kelamin": "P" }
      ];

      // Buat worksheet baru dari objek JSON
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Buat workbook baru
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Impor Siswa");

      // Tulis workbook menjadi array buffer biner
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Buat blob biner bertipe data spreadsheet openxml
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Buat tautan unduhan dinamis
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "format_impor_siswa.xlsx");
      document.body.appendChild(link);
      link.click();
      
      // Bersihkan elemen tautan dari dokumen
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Gagal membuat template Excel:', error);
    }
    // === AKHIR DARI LOGIKA UNDUH TEMPLATE EXCEL ===
  };

  const handleViewSiswa = async (classId: number) => {
    setSelectedClassForView(classId);
    setLoadingSiswa(true);
    setLoadingStats(true);

    try {
      const res = await fetch(`/api/siswa/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSiswaListForView(data);
      }

      const statsRes = await fetch(`/api/class-stats/${classId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const mapped = statsData.map((d: any) => ({
          name: d.nama.split(' ').slice(0, 2).join(' '),
          fullName: d.nama,
          'Rasio Absen (%)': d.absence_rate,
          'Rata-rata Nilai': d.average_grade
        }));
        setClassStats(mapped);
      } else {
        setClassStats([]);
      }
    } catch (err) {
      console.error('Error fetching class stats:', err);
      setClassStats([]);
    } finally {
      setLoadingSiswa(false);
      setLoadingStats(false);
    }
  };

  const handleDeactivateSiswa = async (nis: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan siswa ini? (Siswa Berhenti / Pindah)')) return;
    try {
      const res = await fetch(`/api/siswa/${nis}`, { method: 'DELETE' });
      if (res.ok) {
        setSiswaListForView(prev => prev.map(s => s.nis === nis ? { ...s, status_aktif: 0 } : s));
        if (selectedClassForView) {
          const statsRes = await fetch(`/api/class-stats/${selectedClassForView}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const mapped = statsData.map((d: any) => ({
              name: d.nama.split(' ').slice(0, 2).join(' '),
              fullName: d.nama,
              'Kehadiran (%)': d.attendance_rate,
              'Tugas Kosong': d.missing_grades
            }));
            setClassStats(mapped);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReactivateSiswa = async (nis: string) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan kembali siswa ini?')) return;
    try {
      const res = await fetch(`/api/siswa/${nis}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status_aktif: 1 }),
      });
      if (res.ok) {
        setSiswaListForView(prev => prev.map(s => s.nis === nis ? { ...s, status_aktif: 1 } : s));
        if (selectedClassForView) {
          const statsRes = await fetch(`/api/class-stats/${selectedClassForView}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const mapped = statsData.map((d: any) => ({
              name: d.nama.split(' ').slice(0, 2).join(' '),
              fullName: d.nama,
              'Kehadiran (%)': d.attendance_rate,
              'Tugas Kosong': d.missing_grades
            }));
            setClassStats(mapped);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteKelas = async (id: number) => {
    if (!confirm('Menghapus kelas akan menghapus semua siswa dan riwayat di dalamnya. Anda yakin?')) return;
    try {
      const res = await fetch(`/api/kelas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshClasses();
        if (selectedClassForView === id) {
          setSelectedClassForView(null);
          setSiswaListForView([]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };


  // Prop object for tabs
  const tabProps = {
    currentUser, classes, schoolIdentity, theme, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal,
    loadingClasses, displayedClasses, selectedClassForView, setSelectedClassForView, setSiswaListForView, handleViewSiswa, handleDeleteKelas,
    classStats, loadingSiswa, siswaListForView, handleDeactivateSiswa, handleReactivateSiswa,
    schedules, selectedDayFilter, setSelectedDayFilter, loadingSchedules,
    showStats, setShowStats, onRefreshClasses
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-full mx-auto space-y-6 pb-24">
      {/* Header and SubTabs */}
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="flex items-center gap-3 relative">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
            <School className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400">Ringkasan Aktivitas &amp; Informasi Sekolah</p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0f1219] p-1.5 rounded-2xl border border-slate-800 relative z-10">
          <button
            onClick={() => setActiveSubTab('sekolah')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'sekolah'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 transition-transform ${activeSubTab === 'sekolah' ? 'scale-110 text-white' : 'text-slate-400'}`} />
            Jadwal Sekolah
          </button>
          
          {isWaliKelas && (
            <button
              onClick={() => setActiveSubTab('walikelas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'walikelas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 transition-transform ${activeSubTab === 'walikelas' ? 'scale-110 text-white' : 'text-slate-400'}`} />
              Wali Kelas
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('kelas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'kelas'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 transition-transform ${activeSubTab === 'kelas' ? 'scale-110 text-white' : 'text-slate-400'}`} />
            Daftar Kelas
          </button>

          <button
            onClick={() => setActiveSubTab('statistik')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'statistik'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 transition-transform ${activeSubTab === 'statistik' ? 'scale-110 text-white' : 'text-slate-400'}`} />
            Statistik
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'sekolah' && <HomeSekolahTab {...tabProps} />}
          {activeSubTab === 'walikelas' && isWaliKelas && <HomeWaliKelasTab {...tabProps} />}
          {activeSubTab === 'kelas' && <HomeKelasTab {...tabProps} />}
          {activeSubTab === 'statistik' && <HomeStatistikTab {...tabProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
