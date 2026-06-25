import React, { useState } from 'react';
import { 
  Upload, Download, CheckCircle2, ShieldAlert, FileSpreadsheet, 
  Layers, UserCheck, HelpCircle, ArrowRight, GraduationCap, 
  RotateCcw, Plus, Wrench, Cpu, Activity, Settings, X, Calendar, Users
} from 'lucide-react';
import { AdminTabProps } from '../types';
import { useMultiSpreadsheetImport } from '../hooks/useMultiSpreadsheetImport';

// ============================================================================
// ADMIN UPLOAD TAB COMPONENT (PUSAT UNGGAH & OPERASI MASSAL DATA SELESAI)
// Maksud Bisnis: Mengonsolidasikan semua proses unggah berkas, impor data,
// serta eksekusi manipulasi data massal (Siswa, Guru, Jadwal, Wali Kelas,
// Kenaikan Kelas, dan Patch Update) ke dalam satu modul navigasi tunggal
// demi kepuasan & kemudahan administrator sekolah.
//
// Aliran Data:
// - Input: Berkas Excel/XLSX/CSV (Siswa, Guru, Jadwal, Wali Kelas),
//           ID kelas target/asal (Promosi/Kelulusan), Berkas JSON/SQL (Patch).
// - Output: Sinkronisasi database instansi sekolah secara real-time.
// ============================================================================

export default function AdminUploadTab(props: AdminTabProps) {
  const {
    classes,
    selectedClassForImport,
    setSelectedClassForImport,
    csvFile,
    csvPreview,
    importStatus,
    handleFileChange,
    handleUploadCSV,
    downloadSampleCSV,
    
    // Props untuk Promosi & Kelulusan (Pemeliharaan Akhir Tahun)
    promoting,
    promotionTargetClass,
    promotionSourceClass,
    promotionMode,
    setPromotionMode,
    setPromotionSourceClass,
    setPromotionTargetClass,
    handleBulkAction,

    // Props untuk System Patches (Pembaruan & Perbaikan)
    systemPatches,
    loadingPatches,
    patchActionLoading,
    patchAlert,
    isDragging,
    uploadingPatch,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePatchUpload,
    handleApplyAllPatches,
    setPatchAlert,

    // Codebase update props
    codebaseCheckResult,
    setCodebaseCheckResult,
    uploadedBase64Zip,
    setUploadedBase64Zip,
    applyingCodebaseUpdate,
    handleApplyCodebaseUpdate
  } = props;

  // Memanggil hook multi spreadsheet import lokal untuk Guru, Jadwal, dan Wali Kelas
  const {
    guruFile, guruPreview, parsedGuruList, guruImportStatus, handleGuruFileChange, handleUploadGuru, downloadSampleGuruExcel,
    jadwalFile, jadwalPreview, parsedJadwalList, jadwalImportStatus, handleJadwalFileChange, handleUploadJadwal, downloadSampleJadwalExcel,
    waliFile, waliPreview, parsedWaliList, waliImportStatus, handleWaliFileChange, handleUploadWali, downloadSampleWaliExcel
  } = useMultiSpreadsheetImport(() => {
    // Memberikan delay 1.5 detik pasca sukses unggah sebelum menyegarkan halaman untuk sinkronisasi state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  });

  // Sub-menu lokal di dalam Tab Upload untuk mempermudah navigasi admin
  const [activeSubTab, setActiveSubTab] = useState<'siswa' | 'guru' | 'jadwal' | 'walikelas' | 'promosi' | 'patch'>('siswa');
  const [dragActive, setDragActive] = useState(false);

  // Penanganan Drag & Drop berkas Excel/CSV untuk Siswa
  const handleSiswaDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleSiswaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const mockEvent = {
        target: {
          files: e.dataTransfer.files
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(mockEvent);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER NAVIGASI SUB-TAB UNGGUL/OPERASI MASSAL */}
      <div className="bg-[#161b22] border border-slate-800 p-2 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shadow-md">
        <button
          onClick={() => setActiveSubTab('siswa')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'siswa' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>Impor Siswa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('guru')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'guru' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Impor Guru</span>
        </button>

        <button
          onClick={() => setActiveSubTab('jadwal')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'jadwal' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Impor Jadwal</span>
        </button>

        <button
          onClick={() => setActiveSubTab('walikelas')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'walikelas' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Impor Wali Kelas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('promosi')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'promosi' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Kenaikan Kelas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('patch')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center ${
            activeSubTab === 'patch' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span>Sistem Patch</span>
        </button>
      </div>

      {/* ==================== SUB-TAB 1: IMPOR SISWA (EXCEL/CSV) ==================== */}
      {activeSubTab === 'siswa' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          
          {/* Panduan Impor */}
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative flex flex-col md:flex-row gap-5 items-start justify-between">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <span>Panduan &amp; Standarisasi Impor Siswa</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan template standar Excel/CSV untuk mendaftarkan puluhan siswa dalam satu langkah. Sistem akan mendeteksi baris secara otomatis dan membuat akun Wali Murid baru secara aman.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#0f1219] p-3 rounded-2xl border border-slate-850">
                    <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase">Kolom 1: NIS</span>
                    <p className="text-[10px] text-slate-400 mt-1">Nomor Induk unik berbasis angka (Contoh: 10245).</p>
                  </div>
                  <div className="bg-[#0f1219] p-3 rounded-2xl border border-slate-850">
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">Kolom 2: Nama</span>
                    <p className="text-[10px] text-slate-400 mt-1">Nama lengkap siswa (Contoh: Ahmad Subarjo).</p>
                  </div>
                  <div className="bg-[#0f1219] p-3 rounded-2xl border border-slate-850">
                    <span className="text-[10px] font-mono text-pink-400 font-extrabold uppercase">Kolom 3: JK</span>
                    <p className="text-[10px] text-slate-400 mt-1">Kode jenis kelamin tunggal <strong className="text-slate-200">L</strong> atau <strong className="text-slate-200">P</strong>.</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 border border-blue-500/20 px-4 py-3 rounded-2xl hover:bg-blue-900/40 font-bold transition duration-300 cursor-pointer self-stretch md:self-auto text-center justify-center shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-extrabold text-slate-200">Unduh Berkas Contoh</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">Format Impor Siswa (.xlsx)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Grid Layout Formulir dan Pratinjau */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Kiri: Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Panel Unggah File</h4>
                  <p className="text-xs text-slate-400 mt-1">Lengkapi parameter berikut untuk mulai memproses pengunggahan.</p>
                </div>

                <div className="space-y-4">
                  {/* Kelas Target */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-mono font-black">1</span>
                      Tentukan Kelas Target
                    </label>
                    <select
                      value={selectedClassForImport}
                      onChange={(e) => setSelectedClassForImport(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium transition cursor-pointer"
                    >
                      <option value="">-- Silakan Pilih Kelas Tujuan --</option>
                      {classes.map((k) => (
                        <option key={k.id} value={k.id} className="bg-[#0f1219] text-slate-300">{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-mono font-black">2</span>
                      Pilih atau Seret Berkas Spreadsheet
                    </label>
                    
                    <div 
                      className={`relative border-2 border-dashed rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center transition duration-300 ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-950/10' 
                          : csvFile 
                            ? 'border-emerald-500/50 bg-[#0f1219]' 
                            : 'border-slate-800 hover:border-slate-700 bg-[#0f1219]'
                      }`}
                      onDragEnter={handleSiswaDrag}
                      onDragOver={handleSiswaDrag}
                      onDragLeave={handleSiswaDrag}
                      onDrop={handleSiswaDrop}
                    >
                      <input
                        type="file"
                        id="admin-upload-tab-file-input"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      
                      <div className="space-y-3 z-10 select-none">
                        <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border transition ${
                          csvFile 
                            ? 'bg-emerald-650/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-800/20 border-slate-750 text-slate-400'
                        }`}>
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">
                            {csvFile ? csvFile.name : 'Seret & letakkan file Anda di sini'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {csvFile 
                              ? `${(csvFile.size / 1024).toFixed(1)} KB | Format terdeteksi`
                              : 'atau klik untuk mencari berkas lokal (.xlsx, .xls, .csv)'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Eksekusi */}
                  <button
                    onClick={handleUploadCSV}
                    disabled={!csvFile || !selectedClassForImport}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 text-xs cursor-pointer ${
                      csvFile && selectedClassForImport
                        ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/10'
                        : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Mulai Eksekusi Unggah Database</span>
                  </button>

                  {/* Status Respons */}
                  {importStatus.message && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-350 ${
                      importStatus.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
                    }`}>
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                        importStatus.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                      }`} />
                      <div>
                        <strong className="font-extrabold block uppercase tracking-wide text-[10px] mb-0.5">
                          {importStatus.type === 'success' ? 'Berhasil' : 'Kesalahan Impor'}
                        </strong>
                        <span className="leading-relaxed font-semibold">{importStatus.message}</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Kanan: Pratinjau */}
            <div className="space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pratinjau Sinkronisasi</h4>
                    <p className="text-xs text-slate-400 mt-1">Konversi data baris spreadsheet (maksimal 5 teratas).</p>
                  </div>

                  {csvPreview.length > 0 ? (
                    <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-850 space-y-3 flex-1 overflow-auto max-h-[350px]">
                      <table className="w-full text-left text-xs select-none">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800 font-extrabold text-[10px]">
                            <th className="pb-2">NIS</th>
                            <th className="pb-2">Nama Lengkap</th>
                            <th className="pb-2 text-center font-mono">JK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-semibold">
                          {csvPreview.map((item, idx) => (
                            <tr key={idx} className="text-slate-300 hover:bg-slate-800/10">
                              <td className="py-2.5 font-mono text-slate-400 text-3xs">{item.nis}</td>
                              <td className="py-2.5 text-slate-200 truncate max-w-[120px]" title={item.nama}>{item.nama}</td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold leading-none ${
                                  item.jenis_kelamin === 'L' 
                                    ? 'bg-blue-950/40 text-blue-400 border border-blue-500/10' 
                                    : 'bg-pink-950/40 text-pink-400 border border-pink-500/10'
                                }`}>
                                  {item.jenis_kelamin}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-[#0f1219] py-14 px-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-2 border-dashed">
                      <Layers className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Belum Ada Data</p>
                        <p className="text-[10px] text-slate-500 max-w-[160px] mx-auto mt-0.5">Unggah berkas spreadsheet di sebelah kiri untuk melihat hasil konversi kolom data di sini.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Catatan Kepatuhan Keamanan */}
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex gap-2.5 text-[10px] text-slate-400 font-medium">
                  <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="leading-relaxed">
                    <span className="font-bold text-slate-200">Keamanan Enkripsi:</span> Seluruh NIS yang diunggah otomatis didaftarkan sebagai username akun Wali Murid baru dengan kata sandi bawaan NIS tersebut demi kemudahan login murid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: IMPOR GURU (EXCEL/XLSX) ==================== */}
      {activeSubTab === 'guru' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative flex flex-col md:flex-row gap-5 items-start justify-between">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>Impor Akun Guru via Spreadsheet Excel</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unggah berkas Excel (.xlsx) untuk meregistrasikan puluhan guru/pengajar baru secara instan. Username dan kata sandi otomatis didaftarkan sesuai dengan data baris file.
                </p>
              </div>
              
              <button 
                onClick={downloadSampleGuruExcel}
                className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-4 py-3 rounded-2xl hover:bg-indigo-900/40 font-bold transition duration-300 cursor-pointer self-stretch md:self-auto text-center justify-center shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-extrabold text-slate-200">Unduh Format Guru</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">format_impor_guru.xlsx</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pilih File Spreadsheet Guru</h4>
                  <p className="text-xs text-slate-400 mt-1">Sistem mendukung tipe file biner berekstensi .xlsx, .xls, atau .csv.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">Ambil File Spreadsheet (.xlsx)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleGuruFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-[#0f1219] border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-[#8fa0ba]">
                        <span className="truncate font-medium max-w-[320px] text-slate-300">
                          {guruFile ? guruFile.name : 'Pilih file excel / csv guru...'}
                        </span>
                        <Upload className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadGuru}
                    disabled={!guruFile}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 text-xs cursor-pointer ${
                      guruFile
                        ? 'bg-indigo-650 hover:bg-indigo-600 text-white hover:shadow-indigo-500/10'
                        : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Mulai Unggah Akun Guru</span>
                  </button>

                  {guruImportStatus.message && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-350 ${
                      guruImportStatus.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <strong className="font-extrabold block uppercase tracking-wide text-[10px] mb-0.5">Status</strong>
                        <span className="leading-relaxed font-semibold">{guruImportStatus.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pratinjau Guru */}
            <div>
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pratinjau Impor Guru</h4>
                  
                  {guruPreview.length > 0 ? (
                    <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-850 space-y-3 overflow-auto max-h-[300px]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800 font-extrabold text-[10px]">
                            <th className="pb-1.5">Nama</th>
                            <th className="pb-1.5 font-mono">User</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {guruPreview.map((item, idx) => (
                            <tr key={idx} className="text-slate-350">
                              <td className="py-2 font-bold truncate max-w-[120px]" title={item.nama}>{item.nama}</td>
                              <td className="py-2 font-mono text-3xs text-indigo-400">{item.username}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-[#0f1219] py-14 px-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-2 border-dashed">
                      <Layers className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Belum Ada Data</p>
                        <p className="text-[10px] text-slate-500">Unggah berkas untuk pratinjau.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: IMPOR SESI JADWAL (EXCEL/XLSX) ==================== */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative flex flex-col md:flex-row gap-5 items-start justify-between">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Impor Jadwal Pelajaran Massal</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unggah file Excel penugasan jadwal belajar per kelas secara massal untuk menghindari input satu per satu secara manual.
                </p>
              </div>
              
              <button 
                onClick={downloadSampleJadwalExcel}
                className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 border border-blue-500/20 px-4 py-3 rounded-2xl hover:bg-blue-900/40 font-bold transition duration-300 cursor-pointer self-stretch md:self-auto text-center justify-center shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-extrabold text-slate-200">Unduh Format Jadwal</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">format_impor_jadwal.xlsx</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pilih File Jadwal</h4>
                  <p className="text-xs text-slate-400 mt-1">Impor berkas Excel jadwal dengan format kolom yang sesuai.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">Unggah Berkas (.xlsx)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleJadwalFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-[#0f1219] border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-300">
                        <span className="truncate font-medium max-w-[320px]">
                          {jadwalFile ? jadwalFile.name : 'Pilih file excel jadwal...'}
                        </span>
                        <Upload className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadJadwal}
                    disabled={!jadwalFile}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 text-xs cursor-pointer ${
                      jadwalFile
                        ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/10'
                        : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Proses Impor Jadwal</span>
                  </button>

                  {jadwalImportStatus.message && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-350 ${
                      jadwalImportStatus.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <strong className="font-extrabold block uppercase tracking-wide text-[10px] mb-0.5">Status</strong>
                        <span className="leading-relaxed font-semibold">{jadwalImportStatus.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pratinjau Jadwal */}
            <div>
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pratinjau Impor Jadwal</h4>
                  
                  {jadwalPreview.length > 0 ? (
                    <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-850 space-y-3 overflow-auto max-h-[300px]">
                      <table className="w-full text-left text-xs select-none">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800 font-extrabold text-[10px]">
                            <th className="pb-1.5">Kelas</th>
                            <th className="pb-1.5">Matpel</th>
                            <th className="pb-1.5">Hari</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {jadwalPreview.map((item, idx) => (
                            <tr key={idx} className="text-slate-300">
                              <td className="py-2 font-bold">{item.nama_kelas}</td>
                              <td className="py-2 text-xs truncate max-w-[100px]" title={item.mata_pelajaran}>{item.mata_pelajaran}</td>
                              <td className="py-2 font-mono text-3xs text-blue-400">{item.hari}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-[#0f1219] py-14 px-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-2 border-dashed">
                      <Layers className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Belum Ada Data</p>
                        <p className="text-[10px] text-slate-500">Unggah berkas untuk pratinjau.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: IMPOR WALI KELAS (EXCEL/XLSX) ==================== */}
      {activeSubTab === 'walikelas' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative flex flex-col md:flex-row gap-5 items-start justify-between">
              <div className="space-y-2 max-w-2xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Impor Wali Kelas secara Instan</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unggah berkas pemetaan guru menjadi wali kelas per lokal secara otomatis untuk mempermudah pendaftaran kepengurusan kelas.
                </p>
              </div>
              
              <button 
                onClick={downloadSampleWaliExcel}
                className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-4 py-3 rounded-2xl hover:bg-emerald-900/40 font-bold transition duration-300 cursor-pointer self-stretch md:self-auto text-center justify-center shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-extrabold text-slate-200">Unduh Format Wali Kelas</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">format_impor_walikelas.xlsx</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pilih File Wali Kelas</h4>
                  <p className="text-xs text-slate-400 mt-1">Impor berkas Excel wali kelas untuk diproses ke database.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 block">Pilih Berkas (.xlsx)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleWaliFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-[#0f1219] border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-300">
                        <span className="truncate font-medium max-w-[320px]">
                          {waliFile ? waliFile.name : 'Pilih file excel wali kelas...'}
                        </span>
                        <Upload className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUploadWali}
                    disabled={!waliFile}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 text-xs cursor-pointer ${
                      waliFile
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/10'
                        : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Mulai Impor Wali Kelas</span>
                  </button>

                  {waliImportStatus.message && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 animate-in fade-in duration-350 ${
                      waliImportStatus.type === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <strong className="font-extrabold block uppercase tracking-wide text-[10px] mb-0.5">Status</strong>
                        <span className="leading-relaxed font-semibold">{waliImportStatus.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pratinjau Wali Kelas */}
            <div>
              <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl h-full flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Pratinjau Wali Kelas</h4>
                  
                  {waliPreview.length > 0 ? (
                    <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-850 space-y-3 overflow-auto max-h-[300px]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-800 font-extrabold text-[10px]">
                            <th className="pb-1.5">Kelas</th>
                            <th className="pb-1.5">Wali (User)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {waliPreview.map((item, idx) => (
                            <tr key={idx} className="text-slate-300">
                              <td className="py-2 font-bold">{item.nama_kelas}</td>
                              <td className="py-2 font-mono text-emerald-400">{item.username_guru}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-[#0f1219] py-14 px-4 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-2 border-dashed">
                      <Layers className="w-8 h-8 text-slate-600 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Belum Ada Data</p>
                        <p className="text-[10px] text-slate-500">Unggah berkas untuk pratinjau.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: PROMOSI & KELULUSAN (KENAIKAN KELAS MASAL) ==================== */}
      {activeSubTab === 'promosi' && (
        <div className="p-6 bg-[#161b22] border border-slate-800 rounded-3xl space-y-5 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h5 className="font-bold text-slate-100 text-sm">Pemeliharaan Akhir Tahun (Promosi & Kelulusan Masal)</h5>
              <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Student Lifecycle & Bulk Promotion Module</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Aksi Manajemen</label>
              <select
                className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                value={promotionMode}
                onChange={(e) => setPromotionMode(e.target.value as any)}
              >
                <option value="promote">Naikkan Kelas (Promosi)</option>
                <option value="graduate">Luluskan Siswa (Set Alumni)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Kelas Asal (Sumber)</label>
              <select
                className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                value={promotionSourceClass}
                onChange={(e) => setPromotionSourceClass(e.target.value)}
              >
                <option value="">-- Pilih Kelas Asal --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nama_kelas}</option>
                ))}
              </select>
            </div>

            {promotionMode === 'promote' && (
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Kelas Target (Tujuan Naik)</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                  value={promotionTargetClass}
                  onChange={(e) => setPromotionTargetClass(e.target.value)}
                >
                  <option value="">-- Pilih Kelas Target --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.nama_kelas}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleBulkAction}
              disabled={promoting || !promotionSourceClass}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                promoting || !promotionSourceClass
                  ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                  : promotionMode === 'promote'
                    ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-400/20 hover:shadow-blue-500/10'
                    : 'bg-rose-600 text-white hover:bg-rose-500 border border-rose-400/20 hover:shadow-rose-500/10'
              }`}
            >
              {promoting ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : promotionMode === 'promote' ? (
                <Plus className="w-4 h-4" />
              ) : (
                <GraduationCap className="w-4 h-4" />
              )}
              <span>{promoting ? 'Memproses...' : promotionMode === 'promote' ? 'Eksekusi Kenaikan Kelas' : 'Eksekusi Pelulusan Siswa'}</span>
            </button>
          </div>

          <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
            <p className="text-[10px] text-blue-400 leading-relaxed font-semibold">
              <strong>Maksud Bisnis:</strong> Utilitas ini digunakan khusus untuk memindahkan <strong>seluruh populasi murid</strong> dari kelas lama ke kelas baru yang lebih tinggi secara bersamaan di akhir tahun ajaran baru, atau meluluskan mereka menjadi alumni tanpa menghapus riwayat nilai masa lalu.
            </p>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 6: PEMBARUAN SISTEM (PATCH UPDATE FILE) ==================== */}
      {activeSubTab === 'patch' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                  <Wrench className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">Pembaruan & Perbaikan Sistem (Patch Update)</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">System Patch Registry & Interactive Hotfixes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* === UPDATE VERSI SISTEM KE v2.2.0 === */}
                {/* Maksud Bisnis: Menunjukkan status build server terakhir yang tervalidasi dan siap patch. */}
                <span className="px-3 py-1 bg-[#0f1219] border border-slate-800 rounded-full text-3xs font-bold text-blue-400 font-mono">
                  v2.2.0-STABLE
                </span>
                {systemPatches.filter(p => p.status === 'pending').length > 0 && (
                  <button
                    onClick={handleApplyAllPatches}
                    disabled={patchActionLoading !== null}
                    className={`px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-550 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-450/25 transition-all shadow-md cursor-pointer ${
                      patchActionLoading === 'ALL' ? 'opacity-70' : ''
                    }`}
                  >
                    {patchActionLoading === 'ALL' ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5" />
                    )}
                    <span>{patchActionLoading === 'ALL' ? 'Menerapkan...' : 'Terapkan Semua Patch'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Patch Alerts */}
            {patchAlert && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 border text-xs font-semibold ${
                patchAlert.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
              }`}>
                <div className="mt-0.5">
                  {patchAlert.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-bold">{patchAlert.type === 'success' ? 'Notifikasi Sistem' : 'Penerapan patch gagal'}</p>
                  <p className="text-3xs text-slate-400 leading-relaxed">{patchAlert.message}</p>
                </div>
                <button onClick={() => setPatchAlert(null)} className="text-slate-500 hover:text-slate-350 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Codebase Check Results Analysis Report */}
            {codebaseCheckResult && (
              <div className="p-5 bg-[#0f1219]/90 border border-slate-850 rounded-2xl space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h6 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span>Hasil Analisis Berkas Pembaruan (.ZIP)</span>
                    </h6>
                    <p className="text-3xs text-slate-400 mt-1 leading-relaxed">
                      Laporan perbandingan kode sumber lokal dengan paket pembaruan baru yang diunggah.
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setCodebaseCheckResult(null);
                        setUploadedBase64Zip('');
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#161b22] border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-[#1a202c] hover:border-slate-700 transition-all cursor-pointer text-center"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApplyCodebaseUpdate}
                      disabled={applyingCodebaseUpdate}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-550 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      {applyingCodebaseUpdate ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menerapkan Kode...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Proses Pembaruan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Grid Ringkasan Perubahan */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#161b22]/70 border border-slate-800 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Total File</span>
                    <span className="text-base font-black text-slate-200 mt-1 block">{codebaseCheckResult.stats.totalChanges}</span>
                  </div>
                  <div className="p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block font-mono">Berkas Baru</span>
                    <span className="text-base font-black text-emerald-400 mt-1 block">+{codebaseCheckResult.stats.added}</span>
                  </div>
                  <div className="p-3 bg-amber-950/15 border border-amber-500/10 rounded-xl text-center">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block font-mono">Modifikasi</span>
                    <span className="text-base font-black text-amber-400 mt-1 block">~{codebaseCheckResult.stats.modified}</span>
                  </div>
                </div>

                {/* List Berkas Perubahan */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono mb-2">Rincian Perubahan Berkas</span>
                  {codebaseCheckResult.changedFiles.map((file: any, index: number) => (
                    <div key={index} className="p-3 bg-[#161b22]/50 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs transition-all">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full font-mono uppercase ${
                            file.status === 'added' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {file.status === 'added' ? 'Baru' : 'Modifikasi'}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-full font-mono uppercase ${
                            file.semanticType === 'bugfix'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : file.semanticType === 'feature'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : file.semanticType === 'refactor'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {file.semanticType === 'bugfix' ? 'Bug Fix' : file.semanticType === 'feature' ? 'Fitur' : file.semanticType === 'refactor' ? 'Refactor' : 'Umum'}
                          </span>
                        </div>
                        <p className="font-mono text-3xs text-slate-300 truncate mt-1">{file.path}</p>
                        <p className="text-3xs text-slate-500 leading-relaxed">{file.summaryOfChange}</p>
                      </div>
                      <div className="text-right font-mono text-3xs text-slate-550 whitespace-nowrap">
                        {Math.round(file.size / 1024 * 100) / 100} KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & Drop Patch File Uploader */}
            {!codebaseCheckResult && (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-450' 
                    : 'border-slate-800 bg-[#0f1219]/60 hover:border-slate-700 hover:bg-[#0f1219] text-slate-400'
                }`}
              >
                <input 
                  type="file" 
                  id="patch-file-input"
                  accept=".json,.sql,.zip"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handlePatchUpload(files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label htmlFor="patch-file-input" className="cursor-pointer block space-y-2">
                  <div className="flex justify-center">
                    <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                      <Upload className={`w-5 h-5 text-blue-400 ${uploadingPatch ? 'animate-bounce' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {uploadingPatch ? 'Sedang memproses berkas patch...' : 'Unggah / Daftarkan Patch Baru (.zip / .json / .sql)'}
                    </span>
                    <span className="text-3xs text-slate-500 font-medium block mt-1">
                      Seret & jatuhkan file ZIP kode di sini atau klik untuk mencari berkas lokal
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* List Patch */}
            {loadingPatches ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RotateCcw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-450 font-bold font-mono">Menyelaraskan registri patch...</span>
              </div>
            ) : systemPatches.length > 0 ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {systemPatches.map((patch) => (
                  <div 
                    key={patch.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      patch.status === 'applied'
                        ? 'bg-[#0f1219]/40 border-slate-850/80'
                        : 'bg-[#0f1219] border-slate-800 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#161b22] border border-slate-800 rounded-full text-[9px] font-extrabold text-slate-455 font-mono">
                          {patch.id}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full font-mono uppercase ${
                          patch.kategori === 'Database'
                            ? 'bg-purple-550/10 text-purple-400 border border-purple-500/20'
                            : patch.kategori === 'Bug Fix'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : patch.kategori === 'Keamanan'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {patch.kategori}
                        </span>
                      </div>
                      <h6 className="font-bold text-slate-200 text-xs">{patch.nama_patch}</h6>
                      <p className="text-3xs text-slate-500 leading-relaxed">{patch.deskripsi}</p>
                      
                      {patch.status === 'applied' && patch.applied_at && (
                        <p className="text-[9px] text-slate-550 font-mono">
                          DITERAPKAN: {new Date(patch.applied_at).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      {patch.status === 'applied' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/20 border border-amber-500/25 rounded-xl text-amber-400 text-xs font-bold">
                          <RotateCcw className={`w-3.5 h-3.5 ${patchActionLoading === 'ALL' || patchActionLoading === patch.id ? 'animate-spin' : ''}`} />
                          <span>Menunggu</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada repositori patch sistem yang tersedia saat ini.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// === AKHIR DARI LAYANAN UPLOAD DATA INDUK ===
