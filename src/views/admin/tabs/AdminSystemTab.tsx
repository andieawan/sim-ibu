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
          
          {/* Student Promotion Tool Section */}
          <div className="p-6 bg-[#161b22] border border-slate-800 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                <GraduationCap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="font-bold text-slate-100 text-sm">Pemeliharaan Akhir Tahun (Promosi & Kelulusan)</h5>
                <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Student Lifecycle & Promotion Engineering</p>
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

            <div className="flex justify-end">
              <button
                onClick={handleBulkAction}
                disabled={promoting || !promotionSourceClass}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  promoting || !promotionSourceClass
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : promotionMode === 'promote'
                      ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-400/20'
                      : 'bg-rose-600 text-white hover:bg-rose-500 border border-rose-400/20'
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
              <p className="text-[10px] text-blue-400 leading-relaxed font-medium">
                <strong>Tips:</strong> Untuk mengubah nama kelas secara global (misalnya dari "X DKV 1" menjadi "XI DKV 1"), Anda dapat melakukannya di tab Katalog. Gunakan alat ini khusus untuk memindahkan <strong>penduduk siswa</strong> dari satu ID kelas ke ID kelas lainnya yang sudah ada.
              </p>
            </div>
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

            {/* Column 2: System Patches & Version Repairs (7 cols wide on large screens) */}
            <div className="lg:col-span-7 bg-[#161b22] border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden">
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
                  <span className="px-3 py-1 bg-[#0f1219] border border-slate-800 rounded-full text-3xs font-bold text-blue-400 font-mono">
                    v1.4.0-STABLE
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
                    <p className="font-bold">{patchAlert.type === 'success' ? 'Berhasil menerapkan patch!' : 'Penerapan patch gagal'}</p>
                    <p className="text-3xs text-slate-400 leading-relaxed">{patchAlert.message}</p>
                  </div>
                  <button onClick={() => setPatchAlert(null)} className="text-slate-500 hover:text-slate-350 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Drag & Drop Patch File Uploader */}
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
                      Seret & jatuhkan file ZIP di sini atau klik untuk menelusuri penyimpanan lokal
                    </span>
                  </div>
                </label>
              </div>

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
                          <span className="px-2 py-0.5 bg-[#161b22] border border-slate-800 rounded-full text-[9px] font-extrabold text-slate-450 font-mono">
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
