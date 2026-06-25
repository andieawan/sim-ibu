import React from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';
import { AdminTabProps } from '../types';
import { useMultiSpreadsheetImport } from '../hooks/useMultiSpreadsheetImport';

export default function AdminUsersTab(props: AdminTabProps) {
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

  const {
    guruFile, guruPreview, parsedGuruList, guruImportStatus, handleGuruFileChange, handleUploadGuru, downloadSampleGuruExcel
  } = useMultiSpreadsheetImport(() => {
    // Callback ketika impor guru sukses, refresh halaman agar state ter-render ulang bersih dari database
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* User list */}
            <div className="lg:col-span-7 bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-200 text-sm">Akun Pengguna Terdaftar</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Daftar Akun Server</p>
                </div>
                
                {!showAddForm && (
                  <button
                    onClick={() => { resetUserForm(); setShowAddForm(true); }}
                    className="bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Guru/Admin</span>
                  </button>
                )}
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-500 text-xs">Mengambil list user...</div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">Belum ada akun guru terdaftar.</div>
              ) : (
                <div className="space-y-2.5">
                  {users.map(u => (
                    <div 
                      key={u.id}
                      className="p-4 bg-[#0f1219] border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{u.nama}</span>
                          <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded font-mono border ${
                            u.role === 'admin' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                              : u.role === 'wali_murid'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/10'
                              : 'bg-indigo-950/40 text-indigo-400 border-indigo-500/10'
                          }`}>
                            {u.role === 'wali_murid' ? 'wali murid' : u.role}
                          </span>
                        </div>
                        <p className="text-2xs text-slate-500 font-mono">
                          Username: <strong className="text-slate-400">{u.username}</strong>
                        </p>
                        {u.role === 'wali_murid' && u.nama_kelas && (
                          <p className="text-2xs text-amber-500 font-semibold">
                            Memantau Kelas: <span className="underline">{u.nama_kelas}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-slate-250 rounded-xl transition cursor-pointer"
                          title="Edit Profil/Password"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.username === 'admin' || u.id === currentUser.id}
                          className="p-2 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-xl transition cursor-pointer disabled:opacity-20"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Form Box */}
            <div className="lg:col-span-5">
              {showAddForm ? (
                <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      {editingUserId ? <Edit className="w-4 h-4 text-blue-400" /> : <Plus className="w-4 h-4 text-blue-400" />}
                      <span>{editingUserId ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna'}</span>
                    </span>
                    <button
                      onClick={resetUserForm}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Nama Lengkap</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                        placeholder="Masukkan nama lengkap..."
                        value={formNama}
                        onChange={(e) => setFormNama(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Username login</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                        placeholder="Masukkan username unik..."
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        disabled={editingUserId !== null && formUsername === 'admin'} // lock core admin rename
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                        Password {editingUserId && '(Kosongkan jika tidak diganti)'}
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                        placeholder={editingUserId ? "Biarkan kosong..." : "Masukkan password baru..."}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Role Kewenangan</label>
                      <select
                        className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as any)}
                        disabled={editingUserId !== null && formUsername === 'admin'} // lock core admin role change
                      >
                        <option value="guru">Guru (Hanya Kelas Bimbingan &amp; Nilai)</option>
                        <option value="admin">Administrator (Akses Penuh Kelola Akun &amp; DB)</option>
                        <option value="wali_murid">Wali Murid / Orang Tua (Akses Monitoring Siswa)</option>
                      </select>
                    </div>

                    {formRole === 'wali_murid' && (
                      <div className="space-y-1.5 dynamic-student-link transition-all duration-300">
                        <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Kelas yang Diawasi</label>
                        <select
                          className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                          value={formKelasId}
                          onChange={(e) => setFormKelasId(parseInt(e.target.value) || '')}
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.nama_kelas} - {cls.sekolah}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {userErrorMsg && (
                      <div className="p-3 bg-rose-950/20 border border-rose-500/25 rounded-xl text-rose-455 text-xs flex gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{userErrorMsg}</span>
                      </div>
                    )}

                    {userSuccessMsg && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{userSuccessMsg}</span>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetUserForm}
                        className="flex-1 py-2.5 text-center border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-850/40 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-500 transition cursor-pointer"
                      >
                        {editingUserId ? 'Simpan Perubahan' : 'Simpan User'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 border-dashed text-center text-slate-500 text-xs space-y-2">
                  <Settings className="w-8 h-8 text-slate-600 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
                  <p>Pilih atau edit salah satu akun user guru di samping, atau tambahkan akun pengajar baru ke server.</p>
                </div>
              )}
            </div>
      </div>

      {/* SPREADSHEET BULK GURU UPLOAD SECTION */}
      {/* Maksud Bisnis: Menyediakan form unggah data guru massal via Excel untuk mempermudah pendaftaran pengajar baru */}
      <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>Unggah Daftar Akun Guru (Spreadsheet Excel / XLSX)</span>
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">Daftarkan hingga puluhan guru baru ke database server secara massal.</p>
          </div>
          <button 
            onClick={downloadSampleGuruExcel}
            className="flex items-center space-x-1.5 text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-xl hover:bg-indigo-900/50 font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Format Guru (.xlsx)</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 block">Ambil File Spreadsheet (.xlsx, .xls, .csv)</label>
          <div className="relative">
            <input
              type="file"
              id="admin-guru-file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleGuruFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-[#8fa0ba]">
              <span className="truncate font-medium max-w-[400px] text-slate-300">
                {guruFile ? guruFile.name : 'Pilih file excel / csv guru...'}
              </span>
              <Upload className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Guru File Parser Preview */}
        {guruPreview.length > 0 && (
          <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in duration-350">
            <span className="text-2xs font-bold uppercase tracking-wider text-indigo-500">Pratinjau Data Guru (Maks. 5 baris pertama)</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-1.5 font-medium">Nama Lengkap</th>
                    <th className="pb-1.5 font-medium">Username</th>
                    <th className="pb-1.5 font-medium">Role</th>
                    <th className="pb-1.5 font-medium">NIP</th>
                    <th className="pb-1.5 font-medium">Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {guruPreview.map((item, idx) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="py-2 font-semibold text-slate-200">{item.nama}</td>
                      <td className="py-2 font-mono text-slate-400">{item.username}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-indigo-900/40 text-indigo-400 border border-indigo-500/20">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-slate-400">{item.nip || '-'}</td>
                      <td className="py-2 text-slate-400">{item.jabatan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleUploadGuru}
          disabled={!guruFile}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition duration-300 text-xs ${
            guruFile
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
              : 'bg-[#111622] border border-slate-850 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Unggah Spreadsheet Guru ke Database</span>
        </button>

        {guruImportStatus.message && (
          <div className={`p-4 rounded-xl border text-xs flex items-start space-x-2.5 ${
            guruImportStatus.type === 'success'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
          }`}>
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
              guruImportStatus.type === 'success' ? 'text-emerald-500' : 'text-rose-500'
            }`} />
            <span>{guruImportStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
