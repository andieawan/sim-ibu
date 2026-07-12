// ============================================================================
// Nama File : HomeKelasTab.tsx
// Lokasi    : /src/views/dashboard/tabs/HomeKelasTab.tsx
// Peran     : Component for Class and Student Management with Excel/CSV Import.
// ============================================================================

import React, { useState } from 'react';
import { 
  Layers, Users, Trash2, UserPlus, CheckCircle2, UserX, UserCheck, 
  Upload, Download, FileSpreadsheet, RefreshCw, X, AlertCircle, Info
} from 'lucide-react';
import { Kelas, Siswa, Pengguna } from '../../../types';
import * as XLSX from 'xlsx';
import { useDialog } from '../../../components/DialogProvider';

interface HomeKelasTabProps {
  currentUser: Pengguna;
  classes: Kelas[];
  loadingClasses: boolean;
  displayedClasses: Kelas[];
  selectedClassForView: number | null;
  setSelectedClassForView: (id: number | null) => void;
  siswaListForView: Siswa[];
  setSiswaListForView: (list: Siswa[]) => void;
  handleViewSiswa: (classId: number) => void;
  handleDeleteKelas: (id: number) => void;
  classStats: any[]; // represented as Recharts compatible array in useClassStats
  loadingSiswa: boolean;
  handleDeactivateSiswa: (nis: string) => void;
  handleReactivateSiswa: (nis: string) => void;
  onOpenAddKelasModal: () => void;
  onOpenAddSiswaModal: () => void;
  onRefreshClasses: () => void;
}

export default function HomeKelasTab({
  currentUser,
  classes,
  loadingClasses,
  displayedClasses,
  selectedClassForView,
  setSelectedClassForView,
  siswaListForView,
  setSiswaListForView,
  handleViewSiswa,
  handleDeleteKelas,
  loadingSiswa,
  handleDeactivateSiswa,
  handleReactivateSiswa,
  onOpenAddKelasModal,
  onOpenAddSiswaModal,
  onRefreshClasses
}: HomeKelasTabProps) {
  const { showAlert } = useDialog();
  const isAdmin = currentUser.role === 'admin';

  // Import local states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Array<{ nis: string; nama: string; jenis_kelamin: string }>>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx' && extension !== 'xls') {
      setImportStatus({
        type: 'error',
        message: 'Format berkas tidak didukung. Harap unggah berkas .csv atau .xlsx!'
      });
      return;
    }

    setImportFile(file);
    setImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    
    if (extension === 'csv') {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length > 1) {
          const preview: typeof importPreview = [];
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
              message: 'Kolom CSV tidak valid. Harus ada header "NIS" dan "Nama".'
            });
            return;
          }

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = parseCsvLine(line, delimiter);
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
          setImportPreview(preview.slice(0, 5));
        }
      };
      reader.readAsText(file);
    } else {
      // Excel Reader
      reader.onload = (event) => {
        try {
          const bstr = event.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (rawData.length > 1) {
            const headers = rawData[0].map((h: any) => String(h).trim().toLowerCase());
            const nisIdx = headers.findIndex(h => h.includes('nis'));
            const namaIdx = headers.findIndex(h => h.includes('nama'));
            const jkIdx = headers.findIndex(h => h.includes('jenis') || h.includes('kelamin') || h.includes('jk') || h.includes('gender'));

            if (nisIdx === -1 || namaIdx === -1) {
              setImportStatus({
                type: 'error',
                message: 'Kolom Excel tidak valid. Harus ada header "NIS" dan "Nama".'
              });
              return;
            }

            const preview: typeof importPreview = [];
            for (let i = 1; i < rawData.length; i++) {
              const row = rawData[i];
              if (!row || row.length === 0) continue;

              const nis = String(row[nisIdx] || '').trim();
              const nama = String(row[namaIdx] || '').trim();
              let jk = String(row[jkIdx] || 'L').trim();
              jk = jk.toUpperCase().startsWith('P') || jk.toLowerCase().includes('perempuan') ? 'P' : 'L';

              if (nis && nama) {
                preview.push({ nis, nama, jenis_kelamin: jk });
              }
            }
            setImportPreview(preview.slice(0, 5));
          }
        } catch (err: any) {
          setImportStatus({ type: 'error', message: `Gagal membaca berkas Excel: ${err.message}` });
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const parseCsvLine = (line: string, delimiter: string): string[] => {
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
    return cols;
  };

  const handleUploadCSV = async () => {
    if (!importFile) {
      setImportStatus({ type: 'error', message: 'Silakan pilih file CSV/Excel terlebih dahulu.' });
      return;
    }
    if (!selectedClassForView) {
      setImportStatus({ type: 'error', message: 'Silakan pilih kelas bimbingan terlebih dahulu.' });
      return;
    }

    setImporting(true);
    setImportStatus({ type: '', message: '' });

    try {
      // We will parse all records to create a standard CSV string to submit to the import API
      let csvContent = "nis,nama,jenis_kelamin\n";
      
      const processUpload = async (textData: string) => {
        const response = await fetch(`/api/import-siswa/${selectedClassForView}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: textData,
        });

        const resData = await response.json();
        if (response.ok) {
          setImportStatus({ type: 'success', message: resData.message || 'Data siswa berhasil diimpor ke kelas!' });
          setImportFile(null);
          setImportPreview([]);
          // Refresh list of students and class list
          handleViewSiswa(selectedClassForView);
          onRefreshClasses();
        } else {
          setImportStatus({ type: 'error', message: resData.error || 'Gagal mengimpor data.' });
        }
      };

      const extension = importFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        const reader = new FileReader();
        reader.onload = async () => {
          await processUpload(reader.result as string);
        };
        reader.readAsText(importFile);
      } else {
        // Read spreadsheet and format into standard CSV text
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const bstr = reader.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            if (rawData.length > 1) {
              const headers = rawData[0].map((h: any) => String(h).trim().toLowerCase());
              const nisIdx = headers.findIndex(h => h.includes('nis'));
              const namaIdx = headers.findIndex(h => h.includes('nama'));
              const jkIdx = headers.findIndex(h => h.includes('jenis') || h.includes('kelamin') || h.includes('jk') || h.includes('gender'));

              let formattedCsv = "nis,nama,jenis_kelamin\n";
              for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const nis = String(row[nisIdx] || '').trim();
                const nama = String(row[namaIdx] || '').trim().replace(/"/g, '""');
                let jk = String(row[jkIdx] || 'L').trim();
                jk = jk.toUpperCase().startsWith('P') || jk.toLowerCase().includes('perempuan') ? 'P' : 'L';

                if (nis && nama) {
                  formattedCsv += `"${nis}","${nama}","${jk}"\n`;
                }
              }
              await processUpload(formattedCsv);
            }
          } catch (err: any) {
            setImportStatus({ type: 'error', message: `Gagal membaca Excel: ${err.message}` });
          }
        };
        reader.readAsBinaryString(importFile);
      }
    } catch (error: any) {
      setImportStatus({ type: 'error', message: `Kesalahan: ${error.message}` });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleXLSX = () => {
    try {
      const data = [
        { "NIS": "1001", "Nama Lengkap": "Budi Santoso", "Jenis Kelamin": "L" },
        { "NIS": "1002", "Nama Lengkap": "Siti Aminah", "Jenis Kelamin": "P" },
        { "NIS": "1003", "Nama Lengkap": "Doni Setiawan", "Jenis Kelamin": "L" },
        { "NIS": "1004", "Nama Lengkap": "Amelia Kusuma", "Jenis Kelamin": "P" }
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Impor Siswa");

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "format_impor_siswa.xlsx");
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Gagal membuat template Excel:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Action Bar */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] p-4.5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Panel khusus Administrator untuk manajemen data kelas &amp; siswa.</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenAddKelasModal}
              className="px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tambah Kelas</span>
            </button>
            <button
              onClick={onOpenAddSiswaModal}
              className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/25 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Classes */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Daftar Kelas Aktif ({displayedClasses.length})</span>
        </h3>

        {loadingClasses ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span>Memuat daftar kelas bimbingan...</span>
          </div>
        ) : displayedClasses.length === 0 ? (
          <div className="bg-[#161b22] p-10 border border-dashed border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
            Tidak ada kelas bimbingan yang terdaftar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayedClasses.map((c) => {
              const isSelected = selectedClassForView === c.id;
              return (
                <div 
                  key={c.id} 
                  className={`bg-[#161b22] p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg group ${
                    isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-100 group-hover:text-blue-400 transition text-sm">{c.nama_kelas}</h4>
                        <p className="text-4xs text-slate-500 font-mono tracking-wider uppercase mt-0.5">{c.sekolah}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-500/10 rounded-md text-[10px] font-extrabold font-mono shrink-0">
                        {c.total_siswa} SISWA
                      </span>
                    </div>

                    <div className="text-3xs text-slate-400">
                      Wali Kelas:{' '}
                      <strong className="text-slate-300">
                        {c.nama_walikelas || 'Belum Ditugaskan'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900/40">
                    <button
                      onClick={() => handleViewSiswa(c.id)}
                      className="flex-1 py-1.5 px-3 bg-blue-900/30 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/15 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Melihat Siswa' : 'Kelola Siswa'}</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteKelas(c.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/15 rounded-xl transition cursor-pointer active:scale-95"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Class Panel */}
      {selectedClassForView && (
        <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100">
                  Manajemen Siswa Kelas: {classes.find(c => c.id === selectedClassForView)?.nama_kelas}
                </h3>
                <p className="text-4xs text-slate-500 uppercase tracking-widest font-mono font-bold mt-0.5">
                  ID KELAS: {selectedClassForView} &bull; {siswaListForView.length} TOTAL SISWA TERDAFTAR
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedClassForView(null);
                setSiswaListForView([]);
              }}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
            {/* Student Table / List (lg:col-span-8) */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Daftar Anggota Kelas</h4>
              
              {loadingSiswa ? (
                <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center gap-2 bg-[#0f1219] rounded-2xl border border-slate-900">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Memuat daftar siswa kelas...</span>
                </div>
              ) : siswaListForView.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs bg-[#0f1219] rounded-2xl border border-dashed border-slate-800">
                  Belum ada siswa yang dimasukkan ke kelas ini.
                </div>
              ) : (
                <div className="bg-[#0f1219] rounded-2xl border border-slate-900 overflow-hidden shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-[10px] uppercase font-mono tracking-wider bg-slate-950/50 text-slate-450 border-b border-slate-900">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">NIS</th>
                          <th className="px-4 py-3 font-extrabold">Nama Lengkap</th>
                          <th className="px-4 py-3 font-extrabold text-center">JK</th>
                          <th className="px-4 py-3 font-extrabold text-center">Status</th>
                          <th className="px-4 py-3 font-extrabold text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-950/30">
                        {siswaListForView.map((s) => {
                          const isActive = s.status_aktif !== 0;
                          return (
                            <tr key={s.nis} className="hover:bg-slate-900/40 transition">
                              <td className="px-4 py-3 font-mono font-bold text-slate-400">{s.nis}</td>
                              <td className="px-4 py-3">
                                <span className={`font-semibold ${isActive ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                  {s.nama}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                                {s.jenis_kelamin}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase tracking-wider ${
                                  isActive 
                                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/10' 
                                    : 'bg-rose-950/50 text-rose-400 border border-rose-500/10'
                                }`}>
                                  {isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isActive ? (
                                  <button
                                    onClick={() => handleDeactivateSiswa(s.nis)}
                                    className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-lg text-3xs font-bold transition cursor-pointer active:scale-95"
                                  >
                                    Nonaktifkan
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivateSiswa(s.nis)}
                                    className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-3xs font-bold transition cursor-pointer active:scale-95"
                                  >
                                    Aktifkan
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Excel / CSV Student Importer (lg:col-span-4) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#0f1219] p-5 border border-slate-900 rounded-2xl shadow-inner space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Impor Siswa Massal (Excel / CSV)</span>
                  </h4>
                  <button
                    onClick={downloadSampleXLSX}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-mono uppercase cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Template</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gunakan template Excel/CSV yang sudah disesuaikan untuk memasukkan data siswa massal secara efisien. Kolom yang dibutuhkan: <strong className="text-slate-300">NIS</strong>, <strong className="text-slate-300">Nama Lengkap</strong>, dan <strong className="text-slate-300">Jenis Kelamin</strong> (L/P).
                </p>

                {/* Drag and Drop Zone */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : importFile 
                        ? 'border-emerald-500/30 bg-[#161b22]/50' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                  }`}
                >
                  <input
                    type="file"
                    id="excel-file-input"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInputChange}
                    accept=".csv,.xlsx,.xls"
                  />
                  
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-emerald-600/10 border border-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    {importFile ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400 truncate max-w-xs mx-auto">{importFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-300">Seret file ke sini atau klik untuk memilih</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mendukung file .xlsx, .xls, .csv</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Table */}
                {importPreview.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider">Pratinjau Data (Maksimal 5 baris)</h5>
                    <div className="bg-[#161b22] border border-slate-850 rounded-xl overflow-hidden text-2xs divide-y divide-slate-850">
                      {importPreview.map((row, idx) => (
                        <div key={idx} className="px-3 py-1.5 flex items-center justify-between font-mono">
                          <span className="text-slate-500 text-3xs font-bold">{row.nis}</span>
                          <span className="text-slate-300 truncate max-w-[120px] font-sans font-semibold">{row.nama}</span>
                          <span className="text-slate-500 text-3xs font-bold">{row.jenis_kelamin}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Banners */}
                {importStatus.message && (
                  <div className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-950/30 text-rose-400 border-rose-500/20'
                  }`}>
                    {importStatus.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    )}
                    <span className="font-semibold leading-relaxed">{importStatus.message}</span>
                  </div>
                )}

                {/* Submit button */}
                {importFile && (
                  <button
                    onClick={handleUploadCSV}
                    disabled={importing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    {importing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    <span>{importing ? 'Sedang Mengimpor...' : 'Unggah &amp; Impor Sekarang'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
