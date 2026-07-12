import { useState, useEffect } from 'react';
import { Printer, Download, BookOpen, Calendar, Award, Loader2, RefreshCw, CheckCircle2, FileSpreadsheet, FileText, LogOut, Check, BarChart3 } from 'lucide-react';
import { Kelas } from '../../types';
import * as XLSX from 'xlsx';
import { initAuth, googleSignIn, logoutWorkspace } from '../../lib/workspaceAuth';
import { exportToGoogleSheets, exportToGoogleDocs } from '../../lib/workspaceExport';
import { useDialog } from '../../components/DialogProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RekapViewProps {
  classes: Kelas[];
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
}

interface AbsensiSummary {
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  rate: number;
}

interface AbsensiSiswaRow {
  nis: string;
  nama: string;
  jenis_kelamin: string;
  summary: AbsensiSummary;
  details: Record<string, string>;
}

interface NilaiSiswaRow {
  nis: string;
  nama: string;
  jenis_kelamin: string;
  average: number;
  grades: Record<number, number>;
  notes: Record<number, string>;
}

interface Aktivitas {
  id: number;
  nama_aktivitas: string;
  tanggal: string;
  kkm?: number;
}

export default function RekapView({
  classes,
  loadingClasses,
  selectedClassId,
  onClassChange,
}: RekapViewProps) {
  const { showAlert } = useDialog();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light');
  const [activeSubTab, setActiveSubTab] = useState<'absensi' | 'nilai'>('absensi');
  
  // State for Absensi recap
  const [absDates, setAbsDates] = useState<string[]>([]);
  const [absStudents, setAbsStudents] = useState<AbsensiSiswaRow[]>([]);
  const [loadingAbs, setLoadingAbs] = useState<boolean>(false);

  // State for Nilai recap
  const [activities, setActivities] = useState<Aktivitas[]>([]);
  const [nilaiStudents, setNilaiStudents] = useState<NilaiSiswaRow[]>([]);
  const [loadingNilai, setLoadingNilai] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paperSize, setPaperSize] = useState<'A4' | 'F4' | 'Auto'>('A4');
  const [printFontSize, setPrintFontSize] = useState<'small' | 'normal' | 'large'>('normal');

  // Google Workspace states
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(true);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isExportingGoogle, setIsExportingGoogle] = useState<boolean>(false);
  const [googleExportResult, setGoogleExportResult] = useState<{ type: 'sheet' | 'doc'; url: string; title: string } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsGoogleAuth(false);
        setGoogleError(null);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setNeedsGoogleAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setNeedsGoogleAuth(false);
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      setGoogleError('Gagal masuk dengan Google: ' + err.message);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutWorkspace();
      setGoogleUser(null);
      setGoogleToken(null);
      setNeedsGoogleAuth(true);
      setGoogleExportResult(null);
      setGoogleError(null);
    } catch (err: any) {
      console.error('Google logout failed:', err);
    }
  };

  // Google Sheets Export
  const handleExportToGoogleSheets = async () => {
    if (!googleToken) {
      showAlert('Sesi Google tidak ditemukan. Harap login kembali.', 'Sesi Habis', 'warning');
      return;
    }
    setGoogleError(null);
    setGoogleExportResult(null);
    setIsExportingGoogle(true);

    try {
      const className = getSelectedClassName();
      const title = `SIM-IBU Rekap ${activeSubTab === 'absensi' ? 'Presensi' : 'Nilai'} - ${className} (${new Date().toLocaleDateString('id-ID')})`;
      
      let headers: string[] = [];
      let rows: any[][] = [];

      if (activeSubTab === 'absensi') {
        if (absStudents.length === 0) {
          throw new Error('Tidak ada data presensi yang tersedia untuk diekspor.');
        }
        headers = ['No', 'NIS', 'Nama Siswa', 'L/P', ...absDates, 'H', 'I', 'S', 'A', '% Kehadiran'];
        rows = absStudents.map((s, idx) => [
          idx + 1,
          s.nis,
          s.nama,
          s.jenis_kelamin,
          ...absDates.map(date => s.details[date] || '-'),
          s.summary.hadir,
          s.summary.izin,
          s.summary.sakit,
          s.summary.alfa,
          `${s.summary.rate}%`
        ]);
      } else {
        if (nilaiStudents.length === 0) {
          throw new Error('Tidak ada data nilai yang tersedia untuk diekspor.');
        }
        headers = ['No', 'NIS', 'Nama Siswa', 'L/P', ...activities.map(a => a.nama_aktivitas), 'Rata-Rata', 'Status'];
        rows = nilaiStudents.map((s, idx) => {
          const averageKkm = activities.length > 0
            ? activities.reduce((acc, curr) => acc + (curr.kkm ?? 75), 0) / activities.length
            : 75;
          return [
            idx + 1,
            s.nis,
            s.nama,
            s.jenis_kelamin,
            ...activities.map(a => s.grades[a.id] !== undefined ? s.grades[a.id] : '-'),
            s.average,
            s.average >= averageKkm ? 'Tuntas' : 'Remedial'
          ];
        });
      }

      const result = await exportToGoogleSheets(googleToken, title, headers, rows);
      setGoogleExportResult({
        type: 'sheet',
        url: result.spreadsheetUrl,
        title: title
      });
    } catch (err: any) {
      console.error(err);
      setGoogleError(err.message || 'Gagal mengekspor data ke Google Sheets.');
    } finally {
      setIsExportingGoogle(false);
    }
  };

  // Google Docs Export
  const handleExportToGoogleDocs = async () => {
    if (!googleToken) {
      showAlert('Sesi Google tidak ditemukan. Harap login kembali.', 'Sesi Habis', 'warning');
      return;
    }
    setGoogleError(null);
    setGoogleExportResult(null);
    setIsExportingGoogle(true);

    try {
      const className = getSelectedClassName();
      const schoolName = getSelectedClassSekolah();
      const title = `SIM-IBU Laporan Akademis Kelas ${className} (${new Date().toLocaleDateString('id-ID')})`;
      
      let metricsSummary = '';
      let details: string[] = [];

      if (activeSubTab === 'absensi') {
        if (absStudents.length === 0) {
          throw new Error('Tidak ada data presensi yang tersedia untuk diekspor.');
        }
        const avgAttendance = Math.round(absStudents.reduce((acc, curr) => acc + curr.summary.rate, 0) / absStudents.length);
        metricsSummary = `Rata-rata persentase kehadiran seluruh kelas: ${avgAttendance}%\nTotal pertemuan: ${absDates.length} hari`;
        details = absStudents.map(s => `${s.nama} (${s.nis}) - Tingkat Kehadiran: ${s.summary.rate}%, Hadir: ${s.summary.hadir}, Izin: ${s.summary.izin}, Sakit: ${s.summary.sakit}, Alfa: ${s.summary.alfa}`);
      } else {
        if (nilaiStudents.length === 0) {
          throw new Error('Tidak ada data nilai yang tersedia untuk diekspor.');
        }
        const classAverage = (nilaiStudents.reduce((acc, curr) => acc + curr.average, 0) / nilaiStudents.length).toFixed(1);
        metricsSummary = `Rata-rata nilai akademis seluruh kelas: ${classAverage}\nTotal tugas/ujian kompetensi: ${activities.length} aktivitas`;
        details = nilaiStudents.map(s => {
          const averageKkm = activities.length > 0
            ? activities.reduce((acc, curr) => acc + (curr.kkm ?? 75), 0) / activities.length
            : 75;
          return `${s.nama} (${s.nis}) - Rata-rata nilai: ${s.average} (${s.average >= averageKkm ? 'Tuntas KKM' : 'Perlu Remedial'})`;
        });
      }

      const result = await exportToGoogleDocs(googleToken, title, {
        className,
        schoolName,
        type: activeSubTab === 'absensi' ? 'Buku Presensi Kehadiran' : 'Kumpulan Nilai Ujian & KKM',
        totalStudents: activeSubTab === 'absensi' ? absStudents.length : nilaiStudents.length,
        metricsSummary,
        details
      });

      setGoogleExportResult({
        type: 'doc',
        url: result.documentUrl,
        title: title
      });
    } catch (err: any) {
      console.error(err);
      setGoogleError(err.message || 'Gagal mengekspor data ke Google Docs.');
    } finally {
      setIsExportingGoogle(false);
    }
  };

  // Fetch Absensi matrix
  const loadAbsensiMatrix = async (classId: number) => {
    setLoadingAbs(true);
    try {
      const res = await fetch(`/api/rekap/absensi/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setAbsDates(data.dates || []);
        setAbsStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching attendance recap:', err);
    } finally {
      setLoadingAbs(false);
    }
  };

  // Fetch Nilai matrix
  const loadNilaiMatrix = async (classId: number) => {
    setLoadingNilai(true);
    try {
      const res = await fetch(`/api/rekap/nilai/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setNilaiStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching grade recap:', err);
    } finally {
      setLoadingNilai(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      if (activeSubTab === 'absensi') {
        loadAbsensiMatrix(selectedClassId);
      } else {
        loadNilaiMatrix(selectedClassId);
      }
    }
  }, [selectedClassId, activeSubTab]);

  const handleRefresh = () => {
    if (selectedClassId) {
      if (activeSubTab === 'absensi') {
        loadAbsensiMatrix(selectedClassId);
      } else {
        loadNilaiMatrix(selectedClassId);
      }
    }
  };

  const getSelectedClassName = () => {
    const cl = classes.find(c => c.id === selectedClassId);
    return cl ? cl.nama_kelas : 'Tidak Diketahui';
  };

  const getSelectedClassSekolah = () => {
    const cl = classes.find(c => c.id === selectedClassId);
    return cl ? cl.sekolah || 'SMKS Islam Bustanul Ulum' : 'SMKS Islam Bustanul Ulum';
  };

  // Export Absensi to Excel
  const exportAbsensiXLS = () => {
    try {
      if (absStudents.length === 0) {
        showAlert('Tidak ada data absensi untuk diekspor.', 'Ekspor Gagal', 'warning');
        return;
      }

      const className = getSelectedClassName();
      const schoolName = getSelectedClassSekolah();

      // Flat data construction
      const exportRows = absStudents.map((s, index) => {
        const base: Record<string, any> = {
          "No": index + 1,
          "NIS": s.nis,
          "Nama Siswa": s.nama,
          "L/P": s.jenis_kelamin
        };

        // Add daily status columns
        absDates.forEach(date => {
          const parts = date.split('-');
          const formattedHeader = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}` : date;
          base[formattedHeader] = s.details[date] || '-';
        });

        // Add summaries
        base["Hadir (H)"] = s.summary.hadir;
        base["Izin (I)"] = s.summary.izin;
        base["Sakit (S)"] = s.summary.sakit;
        base["Alfa (A)"] = s.summary.alfa;
        base["Total Hari"] = s.summary.total;
        base["% Kehadiran"] = `${s.summary.rate}%`;

        return base;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi");

      // Auto column widths
      if (exportRows.length > 0) {
        const colWidths = Object.keys(exportRows[0] || {}).map(key => {
          const maxLen = Math.max(
            key.length,
            ...exportRows.map(row => String(row[key] || '').length)
          );
          return { wch: maxLen + 3 };
        });
        worksheet['!cols'] = colWidths;
      }

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `rekap_presensi_${className.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert(`Gagal mengekspor data: ${err.message}`, 'Kesalahan Ekspor', 'danger');
    }
  };

  // Export Nilai to Excel
  const exportNilaiXLS = () => {
    try {
      if (nilaiStudents.length === 0) {
        showAlert('Tidak ada data nilai untuk diekspor.', 'Ekspor Gagal', 'warning');
        return;
      }

      const className = getSelectedClassName();

      // Flat data construction for grading
      const exportRows = nilaiStudents.map((s, index) => {
        const base: Record<string, any> = {
          "No": index + 1,
          "NIS": s.nis,
          "Nama Siswa": s.nama,
          "L/P": s.jenis_kelamin
        };

        // Add grading columns
        activities.forEach(act => {
          const score = s.grades[act.id];
          const parts = (act.tanggal || '').split('-');
          const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}` : act.tanggal;
          base[`${act.nama_aktivitas} (${formattedDate})`] = score !== undefined ? score : '-';
        });

        const averageKkm = activities.length > 0
          ? activities.reduce((acc, curr) => acc + (curr.kkm ?? 75), 0) / activities.length
          : 75;

        base["Rata-rata"] = s.average;
        base["Keterangan KKM"] = s.average >= averageKkm ? 'Tuntas' : 'Remedial';

        return base;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Penilaian");

      // Auto column widths
      if (exportRows.length > 0) {
        const colWidths = Object.keys(exportRows[0] || {}).map(key => {
          const maxLen = Math.max(
            key.length,
            ...exportRows.map(row => String(row[key] || '').length)
          );
          return { wch: maxLen + 3 };
        });
        worksheet['!cols'] = colWidths;
      }

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `rekap_nilai_kelas_${className.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert(`Gagal mengekspor data: ${err.message}`, 'Kesalahan Ekspor', 'danger');
    }
  };

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  const filteredAbsStudents = absStudents.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  const filteredNilaiStudents = nilaiStudents.filter(s =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  // ============================================================================
  // PERSIAPAN DATA VISUALISASI KEHADIRAN (RECHARTS BAR CHART)
  // Maksud Bisnis: Menyusun data kehadiran harian kelas secara agregat
  // agar dapat dirender ke dalam diagram batang bertumpuk (stacked bar chart).
  // Hal ini memudahkan guru melihat tren harian ketidakhadiran (alfa, sakit, izin)
  // dan tingkat kehadiran total per pertemuan.
  // ============================================================================
  const getDailyAttendanceChartData = () => {
    if (!absDates.length || !absStudents.length) return [];
    
    return absDates.map((date) => {
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;
      
      absStudents.forEach((student) => {
        const status = student.details[date];
        if (status === 'Hadir') hadir++;
        else if (status === 'Izin') izin++;
        else if (status === 'Sakit') sakit++;
        else if (status === 'Alfa') alfa++;
      });
      
      // Memformat tanggal agar lebih pendek (dd/mm), contoh: "2024-10-25" -> "25/10"
      const parts = date.split('-');
      const labelSederhana = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      
      return {
        tanggal: labelSederhana,
        'Hadir (H)': hadir,
        'Izin (I)': izin,
        'Sakit (S)': sakit,
        'Alfa (A)': alfa,
        'Total Siswa': hadir + izin + sakit + alfa
      };
    });
  };

  const attendanceChartData = getDailyAttendanceChartData();

  // Menghitung statistik akumulatif untuk widget ringkasan di samping grafik
  const getCumulativeAttendanceStats = () => {
    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlfa = 0;

    absStudents.forEach((s) => {
      totalHadir += s.summary.hadir;
      totalIzin += s.summary.izin;
      totalSakit += s.summary.sakit;
      totalAlfa += s.summary.alfa;
    });

    const grandTotal = totalHadir + totalIzin + totalSakit + totalAlfa;
    const avgRate = absStudents.length > 0 
      ? Math.round(absStudents.reduce((acc, curr) => acc + curr.summary.rate, 0) / absStudents.length)
      : 0;

    return {
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlfa,
      grandTotal,
      avgRate
    };
  };

  const attendanceStats = getCumulativeAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Stylesheet specifically designed for high-resolution standard landscape report printing */}
      <style>{`
        @media print {
          /* ============================================================================
             PENGATURAN HALAMAN & TATA LETAK CETAK (Buku Presensi & Buku Nilai)
             Maksud Bisnis: Memastikan dokumen dicetak dalam posisi lanskap yang rapi,
             bersih, tanpa warna latar gelap (untuk menghemat tinta), serta presisi di kertas.
             ============================================================================ */
          @page {
            size: ${paperSize === 'A4' ? 'A4 landscape' : paperSize === 'F4' ? '215mm 330mm landscape' : 'landscape'};
            margin: 8mm 10mm;
          }
          
          /* Sembunyikan elemen navigasi, tombol, header, footer, dan dekorasi non-cetak */
          nav, header, footer, button, select, input, .no-print, #fab-master-btn, .fixed, .absolute-nav {
            display: none !important;
          }

          /* Atur ulang warna background global html dan body agar murni putih */
          html, body, #root, #root > div, main {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: economy !important;
            print-color-adjust: economy !important;
          }

          /* Force container cetak utama agar bersih dari background gelap dan beralih ke teks hitam */
          .print-container, 
          .print-container *,
          .rekap-print-title,
          .rekap-print-title * {
            background: transparent !important;
            background-color: transparent !important;
            color: #000000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            border-color: #000000 !important;
          }

          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 5px !important;
          }

          .rekap-print-title {
            display: block !important;
            font-family: Arial, sans-serif;
            text-align: center;
            margin-bottom: 20px;
          }

          /* Atur standard tabel cetak laporan */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            color: #000000 !important;
            font-family: Arial, sans-serif;
            font-size: ${printFontSize === 'small' ? '8.5px' : printFontSize === 'large' ? '11px' : '9.5px'} !important;
            line-height: 1.2 !important;
          }

          th, td {
            border: 1px solid #000000 !important;
            padding: ${printFontSize === 'small' ? '3px 4px' : printFontSize === 'large' ? '5px 7px' : '4px 5px'} !important;
            text-align: left !important;
          }

          /* Header tabel menggunakan warna abu-abu lembut untuk pemisah visual */
          th, thead th {
            background-color: #f2f2f2 !important;
            color: #000000 !important;
            font-weight: bold !important;
            border: 1px solid #000000 !important;
          }

          /* Penyesuaian indikator nilai/status */
          .text-rose-400, .text-rose-450 {
            color: #b91c1c !important; /* Merah pekat untuk cetak */
            font-weight: bold !important;
          }

          .text-emerald-400 {
            color: #047857 !important; /* Hijau pekat untuk cetak */
            font-weight: bold !important;
          }

          .text-slate-500, .text-slate-400 {
            color: #374151 !important; /* Ubah abu-abu terang ke gelap agar terbaca jelas saat dicetak */
          }

          .rounded-3xl, .rounded-2xl, .rounded-xl {
            border-radius: 0 !important;
          }
          
          /* Pastikan tidak ada border melengkung tebal */
          table, tr, td, th {
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* Title block */}
      <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl no-print">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-blue-400" />
            <span>Rekapitulasi Data Kelas</span>
          </h4>
          <p className="text-xs text-slate-500">
            Tinjau seluruh matrix presensi dan penilaian mata pelajaran siswa secara makro untuk dicetak atau diunduh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClassId || ''}
            onChange={(e) => onClassChange(Number(e.target.value))}
            className="px-3.5 py-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 focus:outline-none"
          >
            <option value="" className={isLight ? 'bg-white text-slate-800' : 'bg-[#161b22] text-slate-300'}>-- Pilih Kelas --</option>
            {classes.map((k) => (
              <option key={k.id} value={k.id} className={isLight ? 'bg-white text-slate-800' : 'bg-[#161b22] text-slate-300'}>{k.nama_kelas}</option>
            ))}
          </select>

          {selectedClassId && (
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectedClassId ? (
        <div className="space-y-6 print-container">
          
          {/* Printable Header - hidden on screen, visible only when printing */}
          <div className="hidden rekap-print-title">
            <h2 className="text-xl font-extrabold uppercase tracking-wide">LAPORAN REKAPITULASI DATA BELAJAR</h2>
            <h3 className="text-lg font-bold text-gray-700 mt-1">{getSelectedClassSekolah()}</h3>
            <p className="text-xs mt-2 text-gray-600">
              Kelas: <strong>{getSelectedClassName()}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500">Tipe Laporan: {activeSubTab === 'absensi' ? 'Buku Presensi Kehadiran' : 'Kumpulan Nilai Ujian & KKM'}</p>
            <hr className="my-4 border-gray-400" />
          </div>

          {/* Sub Navbar Selector and Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#161b22] p-4 rounded-3xl border border-slate-800 shadow-lg no-print items-center sm:items-stretch">
            {/* Left side toggle */}
            <div className="flex bg-[#0f1219] p-1.5 rounded-2xl border border-slate-800 shrink-0 self-start sm:self-center">
              <button
                onClick={() => setActiveSubTab('absensi')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all ${
                  activeSubTab === 'absensi'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <div className="flex flex-col items-start leading-tight">
                  <span>Buku</span>
                  <span>Presensi</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('nilai')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all ${
                  activeSubTab === 'nilai'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <div className="flex flex-col items-start leading-tight">
                  <span>Buku</span>
                  <span>Nilai</span>
                </div>
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                {/* Paper Selector Dropdown */}
                <div className="flex items-center space-x-1.5 bg-[#0f1219] px-3 py-2 rounded-xl border border-slate-800 text-xs shrink-0">
                  <span className="text-3xs font-extrabold uppercase text-slate-500 font-mono tracking-wider">Kertas:</span>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as any)}
                    className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="A4" className="bg-[#161b22] text-slate-200">A4 Landscape</option>
                    <option value="F4" className="bg-[#161b22] text-slate-200">F4 Lanskap (33cm)</option>
                    <option value="Auto" className="bg-[#161b22] text-slate-200">Otomatis</option>
                  </select>
                </div>

                {/* Table Spacing / Font size selector */}
                <div className="flex items-center space-x-1.5 bg-[#0f1219] px-3 py-2 rounded-xl border border-slate-800 text-xs shrink-0">
                  <span className="text-3xs font-extrabold uppercase text-slate-500 font-mono tracking-wider">Ukuran Tabel:</span>
                  <select
                    value={printFontSize}
                    onChange={(e) => setPrintFontSize(e.target.value as any)}
                    className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="small" className="bg-[#161b22] text-slate-200">Kecil (8.5px)</option>
                    <option value="normal" className="bg-[#161b22] text-slate-200">Sedang (9.5px)</option>
                    <option value="large" className="bg-[#161b22] text-slate-200">Besar (11px)</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Cari nama / NIS siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-[#0f1219] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-slate-700 w-full sm:w-[200px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={activeSubTab === 'absensi' ? exportAbsensiXLS : exportNilaiXLS}
                  className="flex items-center space-x-2 text-xs font-bold bg-[#0f1219] border border-emerald-500/25 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-900/40 transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Google Workspace Integration Panel */}
          <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 shadow-xl no-print space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.344 14.5c.344-.606.344-1.394 0-2l-2.688-4.594c-.344-.606-1.031-1-1.719-1H9.063c-.688 0-1.375.394-1.719 1L4.656 12.5c-.344.606-.344 1.394 0 2l2.688 4.594c.344.606 1.031 1 1.719 1h5.875c.688 0 1.375-.394 1.719-1l2.688-4.594zM12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Integrasi Google Workspace
                    <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">Real-time Sync</span>
                  </h5>
                  <p className="text-3xs text-slate-500">
                    Ekspor rekap absen langsung ke Google Sheets (Spreadsheets) atau laporan narasi belajar ke Google Docs secara instan.
                  </p>
                </div>
              </div>

              {/* Status Badge & Logout */}
              {!needsGoogleAuth && googleUser ? (
                <div className="flex items-center space-x-2 bg-[#0f1219] border border-slate-800 px-3 py-1.5 rounded-xl text-3xs font-medium text-slate-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Terhubung: {googleUser.email}</span>
                  <button
                    onClick={handleGoogleLogout}
                    className="ml-2 p-1 text-rose-450 hover:bg-rose-950/20 rounded-md transition cursor-pointer"
                    title="Putuskan sambungan"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-3xs bg-slate-800 text-slate-400 px-2.5 py-1.5 rounded-full font-medium">
                  Belum Terhubung
                </span>
              )}
            </div>

            {googleError && (
              <div className="bg-rose-950/15 border border-rose-500/20 text-rose-450 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
                <span>⚠️</span>
                <span>{googleError}</span>
              </div>
            )}

            {googleExportResult && (
              <div className="bg-emerald-950/15 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <Check className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-bold">Dokumen Berhasil Dibuat!</p>
                    <p className="text-3xs text-slate-400 mt-0.5 font-mono">"{googleExportResult.title}"</p>
                  </div>
                </div>
                <a
                  href={googleExportResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-3xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <span>Buka Dokumen</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {needsGoogleAuth ? (
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center space-x-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Hubungkan ke Akun Google</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportToGoogleSheets}
                    disabled={isExportingGoogle}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    <span>Ekspor ke Google Sheets</span>
                  </button>

                  <button
                    onClick={handleExportToGoogleDocs}
                    disabled={isExportingGoogle}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600/10 border border-sky-500/20 text-sky-400 hover:bg-sky-600/20 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>Buat Laporan Google Docs</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Matrix data presentation table */}
          {activeSubTab === 'absensi' ? (
            <div className="space-y-6">
              {/* === VISUALISASI DIAGRAM BATANG RECHARTS (TREN KEHADIRAN KELAS) === */}
              <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h5 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span>Analisis &amp; Tren Kehadiran Harian</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Visualisasi grafik kehadiran harian siswa di kelas {getSelectedClassName()} berdasarkan sesi absensi aktif.
                    </p>
                  </div>
                  
                  {/* Badge Rata-Rata Kehadiran Kelas */}
                  <div className="flex items-center space-x-2 bg-blue-950/40 border border-blue-500/25 px-3 py-1.5 rounded-xl self-start sm:self-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rata-Rata Kelas:</span>
                    <span className="text-xs font-mono font-extrabold text-blue-400">{attendanceStats.avgRate}%</span>
                  </div>
                </div>

                {loadingAbs ? (
                  <div className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-500 mb-2" />
                    <p className="text-xs">Memuat data grafik...</p>
                  </div>
                ) : attendanceChartData.length === 0 ? (
                  <div className="py-12 text-center text-slate-550 text-xs italic">
                    Belum ada data absensi untuk memetakan grafik tren harian.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                    {/* Kolom Kiri: Bar Chart */}
                    <div className="lg:col-span-3 bg-[#0f1219]/60 border border-slate-800/80 p-4 rounded-2xl h-[320px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={attendanceChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.4} />
                          <XAxis 
                            dataKey="tanggal" 
                            stroke="#6b7280" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              borderColor: '#374151', 
                              borderRadius: '12px',
                              color: '#f3f4f6',
                              fontSize: '11px',
                              fontFamily: 'sans-serif'
                            }} 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                          />
                          {/* Bar Stacked representation */}
                          <Bar dataKey="Hadir (H)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Hadir" />
                          <Bar dataKey="Izin (I)" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Izin" />
                          <Bar dataKey="Sakit (S)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Sakit" />
                          <Bar dataKey="Alfa (A)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Alfa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Kolom Kanan: Ringkasan Total Akumulatif */}
                    <div className="flex flex-col justify-between space-y-3 bg-[#0f1219]/30 border border-slate-850 p-4 rounded-2xl">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ringkasan Total</span>
                        <h6 className="text-xs text-slate-400 leading-normal">
                          Total akumulasi status kehadiran dari seluruh siswa di kelas {getSelectedClassName()} selama periode ini:
                        </h6>
                      </div>

                      <div className="space-y-2">
                        {/* Hadir */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/10 border border-emerald-500/10">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-slate-300">Hadir</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-emerald-400">{attendanceStats.totalHadir}</span>
                        </div>

                        {/* Izin */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/10 border border-amber-500/10">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <span className="text-xs text-slate-300">Izin</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-amber-500">{attendanceStats.totalIzin}</span>
                        </div>

                        {/* Sakit */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-blue-950/10 border border-blue-500/10">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-slate-300">Sakit</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-blue-400">{attendanceStats.totalSakit}</span>
                        </div>

                        {/* Alfa */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/10 border border-rose-500/10">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                            <span className="text-xs text-slate-300">Alfa</span>
                          </div>
                          <span className="text-xs font-mono font-extrabold text-rose-450">{attendanceStats.totalAlfa}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Total Presensi:</span>
                        <span className="font-mono font-bold text-slate-300">{attendanceStats.grandTotal}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 no-print">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Matrix Kehadiran Siswa Kelas {getSelectedClassName()}
                </span>
                <span className="text-3xs font-mono font-bold bg-[#0f1219] px-2.5 py-1 text-slate-500 border border-slate-800 rounded-full">
                  {absDates.length} Hari Pertemuan Tercetak
                </span>
              </div>

              {loadingAbs ? (
                <div className="py-24 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-7 h-7 mx-auto animate-spin text-blue-500" />
                  <p className="text-xs">Mengkalkulasi persentase data absensi kelas...</p>
                </div>
              ) : absStudents.length === 0 ? (
                <div className="py-20 text-center text-slate-550 text-sm">
                  Belum ada data riwayat absensi kelas atau siswa terdaftar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-300 min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#0f1219] text-slate-400 font-bold">
                        <th className="p-3 font-semibold text-center w-[50px] no-print">No</th>
                        <th className="p-3 font-semibold">NIS</th>
                        <th className="p-3 font-semibold">Nama Siswa</th>
                        <th className="p-3 font-semibold text-center w-[60px]">L/P</th>
                        
                        {/* Daily dates header */}
                        {absDates.map((date) => (
                          <th key={date} className="p-2 text-center text-[10px] font-mono min-w-[75px]">
                            {(() => {
                              const parts = date.replace(/-/g, '/').split('/');
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
                            })()}
                          </th>
                        ))}

                        <th className="p-3 text-center text-emerald-400 font-semibold bg-emerald-950/10 border-l border-slate-800">H</th>
                        <th className="p-3 text-center text-amber-400 font-semibold bg-amber-950/10">I</th>
                        <th className="p-3 text-center text-blue-400 font-semibold bg-blue-950/10">S</th>
                        <th className="p-3 text-center text-rose-455 font-semibold bg-rose-950/10">A</th>
                        <th className="p-3 text-center font-bold text-slate-200 border-l border-slate-800">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAbsStudents.map((siswa, i) => (
                        <tr key={siswa.nis} className="hover:bg-slate-900/35 transition duration-150">
                          <td className="p-3 text-center text-slate-500 font-mono no-print">{i + 1}</td>
                          <td className="p-3 font-mono text-slate-400">{siswa.nis}</td>
                          <td className="p-3 font-bold text-slate-200">{siswa.nama}</td>
                          <td className="p-3 text-center font-semibold text-slate-400">{siswa.jenis_kelamin}</td>

                          {/* Daily attendance markers */}
                          {absDates.map((date) => {
                            const stat = siswa.details[date];
                            const badgeColor = 
                              stat === 'Hadir' ? 'text-emerald-400 font-bold bg-emerald-950/20 px-1 py-0.5 rounded' :
                              stat === 'Izin' ? 'text-amber-500 font-bold bg-amber-950/20 px-1 py-0.5 rounded' :
                              stat === 'Sakit' ? 'text-blue-400 font-bold bg-blue-950/20 px-1 py-0.5 rounded' :
                              stat === 'Alfa' ? 'text-rose-450 font-bold bg-rose-950/20 px-1 py-0.5 rounded' : 'text-slate-600';
                            return (
                              <td key={date} className="p-2 text-center font-bold text-[11px]">
                                <span className={badgeColor}>
                                  {stat ? stat[0] : '-'}
                                </span>
                              </td>
                            );
                          })}

                          {/* Summaries */}
                          <td className="p-3 text-center font-mono font-bold text-emerald-400 bg-emerald-990/5 border-l border-slate-850">{siswa.summary.hadir}</td>
                          <td className="p-3 text-center font-mono font-bold text-amber-500 bg-amber-990/5">{siswa.summary.izin}</td>
                          <td className="p-3 text-center font-mono font-bold text-blue-400 bg-blue-990/5">{siswa.summary.sakit}</td>
                          <td className="p-3 text-center font-mono font-bold text-rose-455 bg-rose-990/5">{siswa.summary.alfa}</td>
                          <td className="p-3 text-center font-mono font-extrabold text-blue-400 border-l border-slate-850 bg-blue-950/10">
                            {siswa.summary.rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 no-print">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  Matrix Penilaian Akademis &amp; Capaian KKM Kelas {getSelectedClassName()}
                </span>
                <span className="text-3xs font-mono font-bold bg-[#0f1219] px-2.5 py-1 text-slate-500 border border-slate-800 rounded-full">
                  {activities.length} Kegiatan Tugas/Ujian Tercatat
                </span>
              </div>

              {loadingNilai ? (
                <div className="py-24 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-7 h-7 mx-auto animate-spin text-blue-500" />
                  <p className="text-xs">Menyusun matrix akumulasi rincian kompetensi siswa...</p>
                </div>
              ) : nilaiStudents.length === 0 ? (
                <div className="py-20 text-center text-slate-550 text-sm">
                  Belum ada data nilai ulangan/kegiatan terdaftar untuk kelas ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-300 min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#0f1219] text-slate-400 font-bold">
                        <th className="p-3 font-semibold text-center w-[50px] no-print">No</th>
                        <th className="p-3 font-semibold">NIS</th>
                        <th className="p-3 font-semibold">Nama Siswa</th>
                        <th className="p-3 font-semibold text-center w-[60px]">L/P</th>

                        {/* Activities columns */}
                        {activities.map(act => (
                          <th key={act.id} className="p-2 text-center text-[10.5px] font-sans min-w-[100px] leading-tight">
                            <span className="block truncate max-w-[120px] mx-auto" title={act.nama_aktivitas}>
                              {act.nama_aktivitas}
                            </span>
                            <span className="block text-[9px] font-mono text-slate-550 mt-0.5">
                              {(() => {
                                const parts = act.tanggal.replace(/-/g, '/').split('/');
                                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : act.tanggal;
                              })()}
                            </span>
                          </th>
                        ))}

                        <th className="p-3 text-center font-extrabold text-slate-100 bg-blue-950/20 border-l border-slate-800 min-w-[80px]">Rata-rata</th>
                        <th className="p-3 text-center font-bold text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredNilaiStudents.map((siswa, i) => {
                        const averageKkm = activities.length > 0
                          ? activities.reduce((acc, curr) => acc + (curr.kkm ?? 75), 0) / activities.length
                          : 75;
                        const isUnderKkm = siswa.average < averageKkm;
                        return (
                          <tr key={siswa.nis} className="hover:bg-slate-900/35 transition duration-150">
                            <td className="p-3 text-center text-slate-500 font-mono no-print">{i + 1}</td>
                            <td className="p-3 font-mono text-slate-400">{siswa.nis}</td>
                            <td className="p-3 font-bold text-slate-200">{siswa.nama}</td>
                            <td className="p-3 text-center font-semibold text-slate-400">{siswa.jenis_kelamin}</td>

                            {/* Scores */}
                            {activities.map(act => {
                              const score = siswa.grades[act.id];
                              const remark = siswa.notes[act.id];
                              const activityKkm = act.kkm ?? 75;
                              const lowScore = score !== undefined && score < activityKkm;
                              return (
                                <td key={act.id} className="p-2 text-center">
                                  <span className={`block font-mono font-bold text-sm ${
                                    lowScore ? 'text-rose-450' : score !== undefined ? 'text-emerald-400' : 'text-slate-600'
                                  }`}>
                                    {score !== undefined ? score : '-'}
                                  </span>
                                  {remark && (
                                    <span className="block text-[8.5px] text-slate-500 italic truncate max-w-[100px] mx-auto no-print" title={remark}>
                                      "{remark}"
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Aggregates */}
                            <td className={`p-3 text-center font-mono font-extrabold text-sm border-l border-slate-850 ${
                              isUnderKkm ? 'text-rose-400 bg-rose-950/10' : 'text-emerald-400 bg-emerald-950/10'
                            }`}>
                              {siswa.average}
                            </td>

                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isUnderKkm 
                                  ? 'bg-rose-950/30 text-rose-450 border-rose-500/20' 
                                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {isUnderKkm ? 'Remedial' : 'Tuntas'}
                              </span>
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

          {/* Simple Printable Sign-off area */}
          <div className="hidden sm:block md:hidden lg:hidden xl:hidden print:flex justify-between items-center mt-12 text-xs pt-12 border-t border-gray-300 font-sans print:text-black">
            <div className="text-center w-[200px]">
              <p>Mengetahui,</p>
              <p className="font-bold mt-16">Kepala Sekolah {getSelectedClassSekolah()}</p>
              <div className="border-b border-black w-40 mx-auto mt-4"></div>
              <p className="text-[10px] mt-1">NIP. ..................................</p>
            </div>
            <div className="text-center w-[200px]">
              <p>Guru Kelas / Penguji,</p>
              <p className="font-bold mt-16">Guru Bidang Studi</p>
              <div className="border-b border-black w-40 mx-auto mt-4"></div>
              <p className="text-[10px] mt-1">NIP. ..................................</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-[#161b22] p-12 text-center rounded-3xl border border-dashed border-slate-800 text-slate-550 text-sm">
          Silakan pilih kelas terlebih dahulu untuk mempersiapkan lembar rekapitulasi data.
        </div>
      )}
    </div>
  );
}
