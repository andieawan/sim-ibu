import React from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';
import { AdminTabProps } from '../types';
import { useMultiSpreadsheetImport } from '../hooks/useMultiSpreadsheetImport';

export default function AdminJadwalTab(props: AdminTabProps) {
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

  // Fitur Impor Jadwal dan Impor Wali Kelas via Excel telah dipindahkan dan dipusatkan ke tab "Upload"

  return (
    <div className="space-y-6">
      {/* SEKSI FORM INPUT MANUAL JADWAL */}
      {/* Maksud Bisnis: Memungkinkan admin memetakan jadwal mengajar guru secara manual satu per satu */}
      <div id="form-jadwal" className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <Calendar className="w-16 h-16 text-blue-500/5" />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>{editingScheduleId !== null ? 'Ubah Sesi Jadwal Pelajaran' : 'Petakan Jadwal Mengajar Guru'}</span>
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              {editingScheduleId !== null 
                ? 'Modifikasi data mata pelajaran, hari, waktu belajar, dan guru untuk sesi jadwal terpilih.'
                : 'Petakan mata pelajaran, hari, waktu belajar, dan guru pengajar pada masing-masing kelas.'}
            </p>
          </div>
          {editingScheduleId !== null && (
            <button
              type="button"
              onClick={resetScheduleForm}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleAddSchedule} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select target class */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Pilih Kelas</label>
            <select
              value={newSchedClassId}
              onChange={(e) => setNewSchedClassId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((k) => (
                <option key={k.id} value={k.id} className="bg-[#0f1219] text-slate-300">{k.nama_kelas}</option>
              ))}
            </select>
          </div>

          {/* Select Guru */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Guru Pengajar</label>
            <select
              value={newSchedGuruId}
              onChange={(e) => setNewSchedGuruId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">-- Pilih Guru --</option>
              {users.filter(u => u.role === 'guru').map((g) => (
                <option key={g.id} value={g.id} className="bg-[#0f1219] text-slate-300">{g.nama} ({g.username})</option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Mata Pelajaran</label>
            <input
              type="text"
              placeholder="Misal: Pemrograman Web, Fisika..."
              value={newSchedMatpel}
              onChange={(e) => setNewSchedMatpel(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Hari */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Hari</label>
            <select
              value={newSchedHari}
              onChange={(e) => setNewSchedHari(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
            >
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Waktu Mulai */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Waktu Mulai</label>
            <input
              type="text"
              placeholder="Misal: 07:30"
              value={newSchedMulai}
              onChange={(e) => setNewSchedMulai(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono font-medium"
            />
          </div>

          {/* Waktu Selesai */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Waktu Selesai</label>
            <input
              type="text"
              placeholder="Misal: 09:00"
              value={newSchedSelesai}
              onChange={(e) => setNewSchedSelesai(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono font-medium"
            />
          </div>

          {/* Submit button */}
          <div className="md:col-span-3 pt-2 flex gap-3">
            {editingScheduleId !== null && (
              <button
                type="button"
                onClick={resetScheduleForm}
                className="flex-1 py-3 border border-slate-800 hover:bg-slate-850 rounded-xl font-bold text-xs text-slate-300 transition duration-300 cursor-pointer text-center"
              >
                Batal Edit
              </button>
            )}
            <button
              type="submit"
              className={`py-3 bg-blue-600 text-white hover:bg-blue-500 rounded-xl font-bold text-xs transition duration-300 flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg active:scale-95 ${editingScheduleId !== null ? 'flex-[2]' : 'w-full'}`}
            >
              {editingScheduleId !== null ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingScheduleId !== null ? 'Simpan Perubahan Sesi Jadwal' : 'Tambahkan Jadwal Mengajar'}</span>
            </button>
          </div>
        </form>

        {scheduleAlert.message && (
          <div className={`p-4 rounded-xl border text-xs flex items-start space-x-2.5 ${
            scheduleAlert.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
          }`}>
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
              scheduleAlert.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
            }`} />
            <span>{scheduleAlert.message}</span>
          </div>
        )}
      </div>

      {/* SEKSI DIREKTORI JADWAL AKTIF */}
      <div className="space-y-4">
        <div className="bg-[#161b22] px-6 py-4.5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
          <div>
            <h5 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Direktori Jadwal Aktif Sekolah</span>
            </h5>
            <p className="text-3xs text-slate-500 font-extrabold uppercase tracking-widest font-mono mt-0.5">
              Total Terpetakan: {schedules.length} Sesi Belajar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Cari matpel, guru, hari..."
                value={schedSearchQuery}
                onChange={(e) => setSchedSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0f1219] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-600 transition"
              />
              {schedSearchQuery && (
                <button
                  onClick={() => setSchedSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 text-3xs font-mono font-bold"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="bg-[#0f1219] p-1 border border-slate-800 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSchedViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  schedViewMode === 'grid'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tampilan Per-Kelas
              </button>
              <button
                type="button"
                onClick={() => setSchedViewMode('flat')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  schedViewMode === 'flat'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daftar Semua
              </button>
            </div>
          </div>
        </div>

        {loadingSchedules ? (
          <div className="bg-[#161b22] p-12 rounded-3xl border border-slate-800 text-center text-slate-500 text-xs font-medium">
            Memuat jadwal mengajar guru...
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-[#161b22] p-12 border-2 border-dashed border-slate-800/60 rounded-3xl text-center text-slate-500 text-xs font-semibold">
            Belum ada jadwal mengajar yang dikonfigurasikan di sekolah.
          </div>
        ) : schedViewMode === 'grid' ? (
          /* Grouped by Class Grid Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((k) => {
              const filtered = schedules.filter(s => {
                const matchClass = s.kelas_id === k.id;
                if (!matchClass) return false;
                if (!schedSearchQuery) return true;
                const q = schedSearchQuery.toLowerCase();
                return (
                  s.mata_pelajaran.toLowerCase().includes(q) ||
                  s.hari.toLowerCase().includes(q) ||
                  (s.nama_guru && s.nama_guru.toLowerCase().includes(q))
                );
              });

              return (
                <div key={k.id} className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl hover:border-slate-700 transition">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div>
                      <h6 className="font-bold text-slate-200 text-xs">{k.nama_kelas}</h6>
                      <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{k.sekolah}</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-extrabold font-mono bg-blue-950/40 px-2 py-0.5 border border-blue-500/10 rounded-lg">
                      {filtered.length} Sesi
                    </span>
                  </div>

                  <div className="space-y-2">
                    {filtered.length === 0 ? (
                      <div className="py-4 text-center text-slate-600 text-3xs italic">Belum ada sesi di kelas ini.</div>
                    ) : (
                      filtered.map(s => (
                        <div key={s.id} className="p-3 bg-[#0f1219] border border-slate-850 hover:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-2xs transition">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-500/10 rounded text-3xs font-bold leading-none font-mono">{s.hari}</span>
                              <span className="text-3xs text-slate-500 font-mono font-semibold">{s.waktu_mulai} - {s.waktu_selesai}</span>
                            </div>
                            <h6 className="font-extrabold text-slate-150 italic truncate">{s.mata_pelajaran}</h6>
                            <p className="text-3xs text-slate-400 font-semibold truncate">Mengajar: {s.nama_guru}</p>
                          </div>

                          {/* Actions inside compact item */}
                          <div className="shrink-0 flex items-center">
                            {scheduleDeleteConfirmId === s.id ? (
                              <div className="flex items-center gap-1 bg-[#161b22] px-2 py-1 border border-rose-500/20 rounded-xl animate-in fade-in zoom-in-95 duration-100">
                                <span className="text-rose-450 text-4xs font-bold font-mono">Hapus?</span>
                                <button
                                  onClick={() => handleDeleteSchedule(s.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 text-white rounded-md text-[9px] font-extrabold cursor-pointer hover:bg-rose-500 transition active:scale-95 leading-none"
                                >
                                  YA
                                </button>
                                <button
                                  onClick={() => setScheduleDeleteConfirmId(null)}
                                  className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[9px] font-extrabold cursor-pointer hover:bg-slate-700 transition leading-none"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEditScheduleClick(s)}
                                  className="p-1.5 bg-blue-950/20 hover:bg-blue-950/40 text-blue-400 border border-slate-850 hover:border-blue-500/10 rounded-lg transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setScheduleDeleteConfirmId(s.id)}
                                  className="p-1.5 bg-rose-955/20 hover:bg-rose-955/40 text-rose-450 border border-slate-850 hover:border-rose-500/10 rounded-lg transition cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Standard Table Mode */
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-3 font-semibold pl-2">Hari</th>
                  <th className="pb-3 font-semibold text-center">Waktu</th>
                  <th className="pb-3 font-semibold pl-4">Kelas</th>
                  <th className="pb-3 font-semibold">Mata Pelajaran</th>
                  <th className="pb-3 font-semibold">Guru Pengajar</th>
                  <th className="pb-3 font-semibold text-right pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {schedules
                  .filter(s => {
                    if (!schedSearchQuery) return true;
                    const q = schedSearchQuery.toLowerCase();
                    return (
                      s.mata_pelajaran.toLowerCase().includes(q) ||
                      s.hari.toLowerCase().includes(q) ||
                      (s.nama_kelas && s.nama_kelas.toLowerCase().includes(q)) ||
                      (s.nama_guru && s.nama_guru.toLowerCase().includes(q))
                    );
                  })
                  .map((s) => (
                    <tr key={s.id} className="text-slate-350 hover:bg-[#0f1219] transition">
                      <td className="py-3 pl-2 font-bold text-slate-250">
                        <span className="px-2 py-1 bg-blue-950/40 text-blue-400 border border-blue-500/10 rounded-lg text-3xs font-mono font-bold leading-none">
                          {s.hari}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-3xs text-indigo-400 font-semibold">
                        {s.waktu_mulai} - {s.waktu_selesai}
                      </td>
                      <td className="py-3 pl-4 font-bold text-indigo-300">
                        {s.nama_kelas}
                      </td>
                      <td className="py-3 font-extrabold text-slate-100 italic">
                        {s.mata_pelajaran}
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-slate-200">{s.nama_guru}</div>
                        <div className="text-4xs font-mono text-slate-500 uppercase tracking-widest font-extrabold">Username: {s.username_guru}</div>
                      </td>
                      <td className="py-3 text-right pr-2">
                        {scheduleDeleteConfirmId === s.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-105">
                            <span className="text-rose-450 text-[10px] font-bold font-mono">Hapus?</span>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition active:scale-95 duration-100"
                              title="Konfirmasi Hapus"
                            >
                              YA
                            </button>
                            <button
                              onClick={() => setScheduleDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-755 text-slate-350 rounded-lg text-[10px] font-extrabold cursor-pointer transition duration-100"
                              title="Batal Hapus"
                            >
                              BATAL
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditScheduleClick(s)}
                              className="p-2 bg-blue-950/20 hover:bg-blue-950/40 text-blue-400 hover:text-blue-300 border border-slate-800 hover:border-blue-500/20 rounded-xl transition cursor-pointer"
                              title="Edit Jadwal"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setScheduleDeleteConfirmId(s.id)}
                              className="p-2 bg-rose-955/20 hover:bg-rose-950/40 text-slate-550 hover:text-rose-450 border border-slate-800 hover:border-rose-500/20 rounded-xl transition cursor-pointer"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INFORMASI KONSOLIDASI MENU IMPOR DATA */}
      {/* Maksud Bisnis: Menyediakan info pemusatan seluruh modul import data Excel agar administrator tidak bingung */}
      <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 pb-12 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h5 className="font-bold text-slate-100 text-sm">Impor Jadwal &amp; Wali Kelas Massal Terpusat</h5>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Seluruh modul impor data Sesi Jadwal Pelajaran dan Wali Kelas via berkas Excel (.xlsx) kini disatukan di bawah tab menu utama <strong className="text-blue-400">Upload</strong>.
            </p>
          </div>
        </div>
        <div className="text-2xs font-mono font-bold text-blue-400 bg-blue-950/40 px-3 py-1.5 border border-blue-500/10 rounded-xl shrink-0">
          STATUS: AKTIF DI MENU UPLOAD
        </div>
      </div>
    </div>
  );
}
