import { useState, useEffect } from 'react';
import { Printer, Download, BookOpen, Calendar, Award, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Kelas } from '../../types';
import * as XLSX from 'xlsx';

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
        alert('Tidak ada data absensi untuk diekspor.');
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
      alert(`Gagal mengekspor data: ${err.message}`);
    }
  };

  // Export Nilai to Excel
  const exportNilaiXLS = () => {
    try {
      if (nilaiStudents.length === 0) {
        alert('Tidak ada data nilai untuk diekspor.');
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
      alert(`Gagal mengekspor data: ${err.message}`);
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

          {/* Matrix data presentation table */}
          {activeSubTab === 'absensi' ? (
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
