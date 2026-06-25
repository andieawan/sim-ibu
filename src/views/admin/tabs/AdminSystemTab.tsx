import React from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';
import { AdminTabProps } from '../types';

export default function AdminSystemTab(props: AdminTabProps) {
  const {
    classes, onRefreshClasses, currentUser,
    users, loadingUsers, userSuccessMsg, userErrorMsg, editingUserId,
    formUsername, formPassword, formNama, formRole, formKelasId, showAddForm, stats, loadingStats,
    catalogSiswa, loadingCatalog, searchQuery, selectedClassFilter, selectedClassForImport, csvFile, csvPreview, parsedSiswaList, importStatus, promoting, promotionTargetClass, promotionSourceClass, promotionMode,
    schedules, loadingSchedules, scheduleAlert, editingScheduleId, scheduleDeleteConfirmId, newSchedClassId, newSchedGuruId, newSchedMatpel, newSchedHari, newSchedMulai, newSchedSelesai, schedViewMode, schedSearchQuery,
    systemAlert, schoolIdentity, loadingIdentity, identityAlert, systemPatches, loadingPatches, diagnostics, runningDiagnostics, patchActionLoading, patchAlert, isDragging, uploadingPatch,
    setFormUsername, setFormPassword, setFormNama, setFormRole, setFormKelasId, setShowAddForm, setEditingUserId, handleUserSubmit, handleEditClick, handleDeleteUser, resetUserForm, 
    setSearchQuery, setSelectedClassFilter, setSelectedClassForImport, handleFileChange, handleUploadCSV, setCsvFile, setCsvPreview, setParsedSiswaList, setImportStatus, handleDeleteStudent, handleDeleteClass, setPromoting, setPromotionMode, setPromotionSourceClass, setPromotionTargetClass, handleBulkAction,
    setSchedViewMode, setSchedSearchQuery, setNewSchedClassId, setNewSchedGuruId, setNewSchedMatpel, setNewSchedHari, setNewSchedMulai, setNewSchedSelesai, setEditingScheduleId, setScheduleDeleteConfirmId, handleAddSchedule, handleEditScheduleClick, handleDeleteSchedule, resetScheduleForm,
    setSchoolIdentity, handleSaveSchoolIdentity, runSystemDiagnostics, handleApplyAllPatches, handleDragOver, handleDragLeave, handleDrop, handlePatchUpload, handleResetDatabase,
    downloadSampleCSV, exportStudentsToExcel, filteredSiswa, setScheduleAlert, setPatchAlert
  } = props;

  return (
    <div className="space-y-6">
          
          {/* Student Promotion Tool Section - Consolidated Notice */}
          <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl shrink-0">
                <GraduationCap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="font-bold text-slate-100 text-sm">Pemeliharaan Kenaikan Kelas &amp; Pelulusan</h5>
                <p className="text-xs text-slate-400 mt-1">
                  Fitur kenaikan kelas masal &amp; pelulusan siswa telah dipindahkan ke tab menu utama <strong className="text-blue-400">Upload</strong> untuk mempermudah alur kerja.
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl font-bold font-mono shrink-0">DIPINDAHKAN</span>
          </div>

          {/* Metadata Cards */}
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-md">
                <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block font-mono">Grup Kelas</span>
                <strong className="text-2xl font-bold font-mono text-blue-400 block">{stats.classes}</strong>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-md">
                <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block font-mono">Siswa Bina</span>
                <strong className="text-2xl font-bold font-mono text-purple-400 block">{stats.students}</strong>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-md">
                <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block font-mono">Nilai Terinput</span>
                <strong className="text-2xl font-bold font-mono text-indigo-400 block">{stats.grades}</strong>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-md">
                <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block font-mono">Data Absensi</span>
                <strong className="text-2xl font-bold font-mono text-emerald-400 block">{stats.attendance}</strong>
              </div>

              <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-md">
                <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block font-mono">User Aktif</span>
                <strong className="text-2xl font-bold font-mono text-amber-500 block">{stats.users}</strong>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
              Membaca status rincian database server...
            </div>
          )}

          {/* Bento Grid: Diagnostics & System Patches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: System Diagnostics (5 cols wide on large screens) */}
            <div className="lg:col-span-5 bg-[#161b22] border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-100 text-sm">Diagnosis & Kesehatan Sistem</h5>
                      <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Automated Real-time Health Monitor</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/api/system/backup"
                      download
                      className="p-2 bg-[#0f1219] hover:bg-[#1a202c] border border-slate-800 rounded-xl text-slate-400 hover:text-blue-400 transition-colors cursor-pointer flex items-center justify-center"
                      title="Unduh Backup Database (JSON)"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={runSystemDiagnostics}
                      disabled={runningDiagnostics}
                      className="p-2 bg-[#0f1219] hover:bg-[#1a202c] border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Pindai Ulang Sistem"
                    >
                      <RotateCcw className={`w-4 h-4 ${runningDiagnostics ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {runningDiagnostics ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RotateCcw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs text-slate-450 font-bold font-mono">Memindai komponen server...</span>
                  </div>
                ) : diagnostics ? (
                  <div className="space-y-4">
                    {/* Score Bar */}
                    <div className="bg-[#0f1219] border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-3xs font-extrabold uppercase text-slate-500 tracking-wider font-mono block">Skor Integrasi</span>
                        <span className="text-2xs text-slate-400 font-medium">Kondisi kesehatan instansi server</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <strong className={`text-3xl font-extrabold font-mono ${diagnostics.score >= 90 ? 'text-emerald-400' : diagnostics.score >= 75 ? 'text-amber-400' : 'text-rose-500'}`}>
                          {diagnostics.score}
                        </strong>
                        <span className="text-xs text-slate-550 font-mono">/100</span>
                      </div>
                    </div>

                    {/* Scan Item List */}
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      {diagnostics.checks.map((check, idx) => (
                        <div key={idx} className="p-3 bg-[#0f1219]/60 border border-slate-850/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-2xs font-extrabold text-slate-350">{check.komponen}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full font-mono uppercase ${
                              check.status === 'sehat' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : check.status === 'peringatan' || check.status === 'beban_tinggi'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {check.status === 'beban_tinggi' ? 'Beban Tinggi' : check.status}
                            </span>
                          </div>
                          <p className="text-3xs text-slate-500 font-medium leading-relaxed">{check.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Gagal memuat diagnostics sistem.
                  </div>
                )}
              </div>
              
              {diagnostics && (
                <div className="border-t border-slate-850 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>WAKTU PINDAI</span>
                  <span className="font-bold text-slate-400">{new Date(diagnostics.scanned_at).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Column 2: System Patches consolidated notice */}
            <div className="lg:col-span-7 bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                    <Wrench className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm">Pembaruan &amp; Patch Sistem</h5>
                    <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Unified Patching &amp; Update System</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seluruh modul pembaruan basis data (Hotfix, Bugfix, SQL patches, dan file update registri) kini dipusatkan di bawah tab menu utama <strong className="text-blue-400">Upload</strong>.
                </p>

                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl flex gap-2.5 text-[10px] text-slate-450">
                  <Cpu className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <p className="leading-normal font-medium">
                    Ini membantu administrator mengelola seluruh unggahan sistem, restorasi database, dan perbaikan basis data secara terpadu tanpa berpindah-pindah menu.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-slate-850 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>STATUS MODUL</span>
                <span className="font-bold text-emerald-400">AKTIF / TERPUSAT</span>
              </div>
            </div>

          </div>

          {/* Identitas Sekolah Edit Card */}
          <div className="bg-[#161b22] border border-slate-850 p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <GraduationCap className="w-16 h-16 text-blue-500/5 pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h5 className="font-extrabold text-blue-400 text-base flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '40s' }} />
                Manajemen Identitas Sekolah
              </h5>
              <p className="text-xs text-slate-400 font-medium">
                Ubah nama instansi sekolah, motto sistem, alamat penandatangan, nomor registrasi, dan nama kepala sekolah terdata.
              </p>
            </div>

            <form onSubmit={handleSaveSchoolIdentity} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase">NAMA SEKOLAH / INSTANSI</label>
                  <input
                    type="text"
                    required
                    value={schoolIdentity.nama_sekolah}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, nama_sekolah: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans font-bold"
                    placeholder="Contoh: SMKS Islam Bustanul Ulum"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase font-sans">TAHUN PELAJARAN</label>
                  <input
                    type="text"
                    value={schoolIdentity.tahun_pelajaran}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, tahun_pelajaran: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-all font-bold"
                    placeholder="Contoh: 2024/2025"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase">SEMESTER</label>
                  <select
                    value={schoolIdentity.semester}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, semester: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-all font-bold"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase">MOTTO / SUB-HEADER SISTEM</label>
                  <input
                    type="text"
                    value={schoolIdentity.motto}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, motto: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-[#cdd9e5] text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    placeholder="Contoh: SIM-IBU - SMKS Islam Bustanul Ulum"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase">NOMOR REGISTRASI (NPSN)</label>
                  <input
                    type="text"
                    value={schoolIdentity.npsn}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, npsn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-[#cdd9e5] text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    placeholder="Contoh: 12345678"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase font-sans">NAMA KEPALA SEKOLAH (PENANDATANGAN)</label>
                  <input
                    type="text"
                    value={schoolIdentity.kepala_sekolah}
                    onChange={(e) => setSchoolIdentity({ ...schoolIdentity, kepala_sekolah: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    placeholder="Nama Lengkap Beserta Gelar..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase">ALAMAT LENGKAP INSTANSI SEKOLAH</label>
                <input
                  type="text"
                  value={schoolIdentity.alamat}
                  onChange={(e) => setSchoolIdentity({ ...schoolIdentity, alamat: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-[#cdd9e5] text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  placeholder="Nama jalan, nomor RT/RW, kecamatan dsb..."
                />
              </div>

              {identityAlert.message && (
                <div className={`p-4 rounded-2xl text-xs flex gap-2.5 border ${
                  identityAlert.type === 'success' 
                    ? 'bg-emerald-950/35 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-950/35 border-rose-500/20 text-[#ff5555]'
                }`}>
                  {identityAlert.type === 'success' ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 animate-bounce" />
                  ) : (
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  )}
                  <span>{identityAlert.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingIdentity}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs shadow-md hover:scale-[1.01] active:scale-95 transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loadingIdentity ? 'Menyimpan...' : 'Simpan Identitas Sekolah'}</span>
              </button>
            </form>
          </div>

          {/* Wipe data / System Alert Box */}
          <div className="bg-[#161b22] border border-slate-850 p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Database className="w-16 h-16 text-rose-500/10" />
            </div>

            <div className="space-y-1.5 max-w-lg">
              <h5 className="font-extrabold text-rose-400 text-base flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <RotateCcw className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                Utilitas Reset Sekolah (Wipe Out)
              </h5>
              <p className="text-xs text-slate-400 leading-normal">
                Menu ini digunakan untuk mengosongkan seluruh riwayat belajar, menghapus daftar absensi harian dan rekap ulangan di semua kelas, lalu mengunduh sample demo siswa default (15+ siswa teladan terdata) dari katalog sekolah.
              </p>
            </div>

            <div className="p-4.5 bg-rose-950/20 border border-rose-500/20 rounded-2xl max-w-2xl space-y-2">
              <div className="flex items-start gap-2 text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Informasi Penting Sebelum Melakukan Reset</span>
              </div>
              <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-1 leading-snug">
                <li>Seluruh kelas (X DKV 1, dsb.) akan dikembalikan ke data default pabrik instansi SMKS Islam Bustanul Ulum.</li>
                <li>Setiap absensi harian siswa yang telah dicentang guru akan dimusnahkan.</li>
                <li>Data akun pengguna terdaftar (selain guru / admin primer) <strong>tetap dipertahankan</strong> agar Anda tidak keluar dari sesi login ini secara tidak sengaja.</li>
              </ul>
            </div>

            {systemAlert && (
              <div className={`p-4 rounded-2xl max-w-2xl text-xs flex gap-2.5 border ${
                systemAlert.type === 'success' 
                  ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-950/30 border-rose-500/20 text-rose-400'
              }`}>
                {systemAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                )}
                <span>{systemAlert.message}</span>
              </div>
            )}

            <button
              onClick={handleResetDatabase}
              className="px-6 py-3.5 bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-rose-500 hover:scale-[1.02] transition cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Bersihkan &amp; Seeding Ulang Database SQL</span>
            </button>
          </div>
        </div>
  );
}
