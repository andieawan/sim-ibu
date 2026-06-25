import React from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';
import { AdminTabProps } from '../types';

export default function AdminCatalogTab(props: AdminTabProps) {
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

          {/* Spreadsheet Upload Section */}
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span>Unggah Daftar Siswa (Spreadsheet Excel / CSV)</span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">Tambah hingga puluhan siswa sekaligus ke kelas tertentu lewat file .xlsx, .xls, atau .csv.</p>
              </div>
              <button 
                onClick={downloadSampleCSV}
                className="flex items-center space-x-1.5 text-xs text-blue-400 bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-xl hover:bg-blue-900/50 font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format Excel (.xlsx)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select target class */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">1. Pilih Kelas Target</label>
                <select
                  value={selectedClassForImport}
                  onChange={(e) => setSelectedClassForImport(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Pilih Kelas Target --</option>
                  {classes.map((k) => (
                    <option key={k.id} value={k.id} className="bg-[#0f1219] text-slate-300">{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              {/* Upload file button replacement */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">2. Ambil File Spreadsheet (.xlsx, .xls, .csv)</label>
                <div className="relative">
                  <input
                    type="file"
                    id="admin-csv-file-input"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#8fa0ba]">
                    <span className="truncate font-medium max-w-[200px] text-slate-350">
                      {csvFile ? csvFile.name : 'Pilih file excel / csv...'}
                    </span>
                    <Upload className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* CSV File Parser Preview */}
            {csvPreview.length > 0 && (
              <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Pratinjau Data (Maks. 5 baris pertama)</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="pb-1.5 font-medium">NIS</th>
                        <th className="pb-1.5 font-medium">Nama Siswa</th>
                        <th className="pb-1.5 font-medium text-center font-mono">L/P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {csvPreview.map((item, idx) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="py-2 font-mono text-slate-400">{item.nis}</td>
                          <td className="py-2 font-semibold text-slate-200">{item.nama}</td>
                          <td className="py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-3xs font-bold leading-none ${
                              item.jenis_kelamin === 'L' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/20' : 'bg-pink-900/40 text-pink-400 border border-pink-500/20'
                            }`} title={item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}>
                              {item.jenis_kelamin}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button action */}
            <button
              onClick={handleUploadCSV}
              disabled={!csvFile || !selectedClassForImport}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition duration-300 text-xs ${
                csvFile && selectedClassForImport
                  ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
                  : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Spreadsheet ke Database</span>
            </button>

            {importStatus.message && (
              <div className={`p-4 rounded-xl border text-xs flex items-start space-x-2.5 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
              }`}>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                  importStatus.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                }`} />
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Class directory catalog list */}
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div>
                <h5 className="font-bold text-slate-200 text-sm">Direktori Kelas Aktif</h5>
                <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Penghapusan Kelas Berdaya Tinggi</p>
              </div>
              {classes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">Belum ada daftar kelas di database.</div>
              ) : (
                <div className="space-y-2">
                  {classes.map(k => {
                    const isSelected = selectedClassFilter === String(k.id);
                    return (
                      <div 
                        key={k.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedClassFilter('');
                          } else {
                            setSelectedClassFilter(String(k.id));
                          }
                        }}
                        className={`p-3 rounded-2xl flex items-center justify-between transition relative border cursor-pointer select-none group ${
                          isSelected 
                            ? 'bg-blue-950/20 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' 
                            : 'bg-[#0f1219] border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-4 flex-1">
                          <div className="flex items-center gap-2">
                            <h6 className={`font-bold text-xs truncate transition ${
                              isSelected ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'
                            }`}>{k.nama_kelas}</h6>
                            {isSelected && (
                              <span className="text-[8px] bg-blue-500/20 text-blue-400 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider animate-pulse">Terpilih</span>
                            )}
                          </div>
                          <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{k.sekolah}</span>
                          
                          {/* Wali Kelas Selector */}
                          <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wali:</span>
                            <select
                              value={k.walikelas_id || ''}
                              onChange={async (e) => {
                                const val = e.target.value;
                                const walikelas_id = val ? parseInt(val) : null;
                                try {
                                  const response = await fetch(`/api/kelas/${k.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ walikelas_id })
                                  });
                                  if (response.ok) {
                                    await onRefreshClasses();
                                  } else {
                                    alert('Gagal mengupdate Wali Kelas');
                                  }
                                } catch (err: any) {
                                  alert('Error: ' + err.message);
                                }
                              }}
                              className="bg-[#161b22] border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-350 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer max-w-[140px] truncate"
                            >
                              <option value="">-- Belum Ditentukan --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(k.id, k.nama_kelas);
                          }}
                          className="p-2 hover:bg-rose-950/40 text-slate-550 hover:text-rose-450 rounded-xl transition cursor-pointer shrink-0 align-self-start"
                          title="Hapus Kelas & Seluruh Isinya"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Students directory list search */}
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-200 text-sm">Direktori Siswa Nasional</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Pencarian &amp; Admin Siswa</p>
                </div>
                <button
                  onClick={exportStudentsToExcel}
                  className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-990/30 border border-emerald-500/25 px-3 py-2 rounded-xl hover:bg-emerald-900/50 font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
                  title="Ekspor daftar siswa saat ini ke Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
              </div>

              {/* Filtering utility tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex bg-[#0f1219] border border-slate-800 px-3 py-1.5 rounded-xl gap-2 items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-200 placeholder:text-slate-600"
                    placeholder="Cari NIS / Nama Siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="bg-[#0f1219] border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-blue-500 font-semibold"
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              {loadingCatalog ? (
                <div className="py-8 text-center text-slate-500 text-xs">Membaca katalog siswa sekolah...</div>
              ) : filteredSiswa.length === 0 ? (
                <div className="py-8 text-center text-slate-550 text-xs">Siswa tidak ditemukan.</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredSiswa.map(s => {
                    const cl = classes.find(c => c.id === s.kelas_id);
                    return (
                      <div 
                        key={s.nis}
                        className="p-3 bg-[#0f1219] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className="text-slate-250 truncate block max-w-[120px]">{s.nama}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              s.jenis_kelamin === 'L' 
                                ? 'bg-blue-950/40 text-blue-400 border border-blue-500/10' 
                                : 'bg-pink-950/40 text-pink-400 border border-pink-500/10'
                            }`}>
                              {s.jenis_kelamin}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono font-medium text-slate-500">
                            NIS: {s.nis} | <span className="text-indigo-400 font-sans">{cl ? cl.nama_kelas : 'Tanpa Kelas'}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteStudent(s.nis)}
                          className="p-1.5 hover:bg-rose-950/40 text-slate-550 hover:text-rose-450 rounded-lg transition cursor-pointer"
                          title="Hapus Siswa Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      
  );
}
