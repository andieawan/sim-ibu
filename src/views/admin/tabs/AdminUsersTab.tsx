import React, { useEffect } from 'react';
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
    classes, onRefreshClasses, onRefreshUsers, currentUser,
    users, loadingUsers, userSuccessMsg, userErrorMsg, editingUserId,
    formUsername, formPassword, formNama, formRole, formKelasId, formJurusan, formNip, formJabatan, formIsCuti, showAddForm, stats, loadingStats,
    catalogSiswa, loadingCatalog, searchQuery, selectedClassFilter, selectedClassForImport, csvFile, csvPreview, parsedSiswaList, importStatus, promoting, promotionTargetClass, promotionSourceClass, promotionMode,
    schedules, loadingSchedules, scheduleAlert, editingScheduleId, scheduleDeleteConfirmId, newSchedClassId, newSchedGuruId, newSchedMatpel, newSchedHari, newSchedMulai, newSchedSelesai, schedViewMode, schedSearchQuery,
    systemAlert, schoolIdentity, loadingIdentity, identityAlert, systemPatches, loadingPatches, diagnostics, runningDiagnostics, patchActionLoading, patchAlert, isDragging, uploadingPatch,
    setFormUsername, setFormPassword, setFormNama, setFormRole, setFormKelasId, setFormJurusan, setFormNip, setFormJabatan, setFormIsCuti, setShowAddForm, setEditingUserId, handleUserSubmit, handleEditClick, handleDeleteUser, resetUserForm, 
    setSearchQuery, setSelectedClassFilter, setSelectedClassForImport, handleFileChange, handleUploadCSV, setCsvFile, setCsvPreview, setParsedSiswaList, setImportStatus, handleDeleteStudent, handleDeleteClass, setPromoting, setPromotionMode, setPromotionSourceClass, setPromotionTargetClass, handleBulkAction,
    setSchedViewMode, setSchedSearchQuery, setNewSchedClassId, setNewSchedGuruId, setNewSchedMatpel, setNewSchedHari, setNewSchedMulai, setNewSchedSelesai, setEditingScheduleId, setScheduleDeleteConfirmId, handleAddSchedule, handleEditScheduleClick, handleDeleteSchedule, resetScheduleForm,
    setSchoolIdentity, handleSaveSchoolIdentity, runSystemDiagnostics, handleApplyAllPatches, handleDragOver, handleDragLeave, handleDrop, handlePatchUpload, handleResetDatabase,
    downloadSampleCSV, exportStudentsToExcel, filteredSiswa, setScheduleAlert, setPatchAlert
  } = props;

  // Maksud Bisnis: Mengontrol scroll-lock pada body document untuk mencegah double-scrolling ketika modal aktif
  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddForm]);

  // Ekstrak jurusan unik dari daftar kelas untuk "kepala jurusan tergantung banyaknya jurusan yang ada"
  const uniqueJurusans = Array.from(new Set(classes.map(c => c.jurusan).filter(Boolean)));
  const availableJurusans = uniqueJurusans.length > 0 ? uniqueJurusans : ['Desain Komunikasi Visual', 'Rekayasa Perangkat Lunak', 'Teknik Komputer & Jaringan', 'Akuntansi'];

  // Fitur Impor Guru secara massal via Excel telah dipindahkan dan dipusatkan ke tab "Upload"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
            
            {/* User list - Diperluas menjadi lebar penuh (Full-Width) untuk kelegaan visual */}
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-200 text-sm">Akun Pengguna Terdaftar</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Daftar Akun Server</p>
                </div>
                
                <button
                  onClick={() => { resetUserForm(); setShowAddForm(true); }}
                  className="bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Guru/Admin</span>
                </button>
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-500 text-xs">Mengambil list user...</div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">Belum ada akun guru terdaftar.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map(u => (
                    <div 
                      key={u.id}
                      className="p-4 bg-[#0f1219] border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200 text-sm truncate max-w-[120px] sm:max-w-none">{u.nama}</span>
                          <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded font-mono border ${
                            u.role === 'admin' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' 
                              : u.role === 'wali_murid'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/10'
                              : u.role === 'bk'
                              ? 'bg-purple-950/40 text-purple-400 border-purple-500/10'
                              : u.role === 'kajur'
                              ? 'bg-teal-950/40 text-teal-400 border-teal-500/10'
                              : u.role === 'kepsek'
                              ? 'bg-rose-950/40 text-rose-400 border-rose-500/10'
                              : 'bg-indigo-950/40 text-indigo-400 border-indigo-500/10'
                          }`}>
                            {u.role === 'wali_murid' ? 'wali murid' : u.role === 'bk' ? 'guru bk' : u.role === 'kajur' ? 'kepala jurusan' : u.role === 'kepsek' ? 'kepala sekolah' : u.role}
                          </span>
                          
                          {u.is_cuti === 1 && (
                            <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded font-mono border bg-rose-950/60 text-rose-400 border-rose-500/20">
                              SEDANG CUTI
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-slate-500 font-mono truncate">
                          Username: <strong className="text-slate-400">{u.username}</strong>
                        </p>
                        {u.nip && (
                          <p className="text-2xs text-slate-400 font-mono truncate">
                            NIP: <span className="text-slate-300">{u.nip}</span>
                          </p>
                        )}
                        {u.jabatan && (
                          <p className="text-2xs text-slate-400 font-medium truncate">
                            Jabatan: <span className="text-slate-300">{u.jabatan}</span>
                          </p>
                        )}
                        {u.role === 'wali_murid' && u.nama_kelas && (
                          <p className="text-2xs text-amber-500 font-semibold truncate">
                            Memantau Kelas: <span className="underline">{u.nama_kelas}</span>
                          </p>
                        )}
                        {u.role === 'kajur' && u.jurusan && (
                          <p className="text-2xs text-teal-400 font-semibold truncate">
                            Kepala Jurusan: <span className="underline">{u.jurusan}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
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

            {/* User Form Modal - Ditampilkan di Tengah Layar dengan Backdrop Blur */}
            {showAddForm && (
              <div className="fixed inset-0 bg-[#090d16]/90 backdrop-blur-md z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10">
                {/* Animasi membal keluar (zoom-in) menggunakan framer-motion/motion */}
                <div 
                  className="bg-[#161b22] border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative my-auto animate-in zoom-in-95 duration-150 scrollbar-thin"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 relative z-10">
                    <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      {editingUserId ? <Edit className="w-4 h-4 text-blue-400" /> : <Plus className="w-4 h-4 text-blue-400" />}
                      <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Penggurus Baru'}</span>
                    </span>
                    <button
                      onClick={resetUserForm}
                      className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <form onSubmit={handleUserSubmit} className="space-y-4 mt-4 relative z-10">
                    <div className="space-y-1.5">
                      <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Nama Lengkap</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                        placeholder="Masukkan nama lengkap..."
                        value={formNama}
                        onChange={(e) => setFormNama(e.target.value)}
                        required
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
                        required
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
                        required={!editingUserId}
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
                        <option value="bk">Guru BK (Bimbingan Konseling)</option>
                        <option value="kajur">Kepala Jurusan (Kajur)</option>
                        <option value="kepsek">Kepala Sekolah (Kepsek)</option>
                        <option value="admin">Administrator (Akses Penuh Kelola Akun &amp; DB)</option>
                        <option value="wali_murid">Wali Murid / Orang Tua (Akses Monitoring Siswa)</option>
                      </select>
                    </div>

                    {['guru', 'bk', 'kajur', 'kepsek'].includes(formRole) && (
                      <>
                        <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                          <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">NIP (Nomor Induk Pegawai)</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                            placeholder="Masukkan NIP resmi..."
                            value={formNip}
                            onChange={(e) => setFormNip(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                          <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Jabatan / Spesialisasi</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                            placeholder="Contoh: Guru Matematika, Staf BK..."
                            value={formJabatan}
                            onChange={(e) => setFormJabatan(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                          <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Status Keaktifan / Cuti</label>
                          <select
                            className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                            value={formIsCuti}
                            onChange={(e) => setFormIsCuti(parseInt(e.target.value) || 0)}
                          >
                            <option value={0}>Aktif (Sedang Bertugas)</option>
                            <option value={1}>Cuti (Tidak Bertugas / Libur Sementara)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {formRole === 'kepsek' && (
                      <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-blue-400 text-2xs leading-relaxed animate-in fade-in-50 duration-200">
                        <strong>Informasi Penunjukan Kepala Sekolah:</strong> Kepala sekolah ditunjuk secara eksklusif untuk maksimal 1 guru. Memilih atau menyimpan akun ini dengan role Kepala Sekolah akan otomatis memindahkan status Kepala Sekolah dari akun sebelumnya ke akun ini.
                      </div>
                    )}

                    {formRole === 'kajur' && (
                      <div className="space-y-1.5 dynamic-student-link transition-all duration-300 animate-in fade-in-50">
                        <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Kepala Jurusan Untuk</label>
                        <select
                          className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                          value={formJurusan}
                          onChange={(e) => setFormJurusan(e.target.value)}
                          required
                        >
                          <option value="">-- Pilih Jurusan (Tergantung banyaknya jurusan) --</option>
                          {availableJurusans.map((jur, idx) => (
                            <option key={idx} value={jur}>
                              {jur}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formRole === 'wali_murid' && (
                      <div className="space-y-1.5 dynamic-student-link transition-all duration-300 animate-in fade-in-50">
                        <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Kelas yang Diawasi</label>
                        <select
                          className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                          value={formKelasId}
                          onChange={(e) => setFormKelasId(parseInt(e.target.value) || '')}
                          required
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
              </div>
            )}
      </div>

      {/* INFORMASI KONSOLIDASI MENU IMPOR DATA */}
      {/* Maksud Bisnis: Memberitahu administrator bahwa seluruh fitur impor data (Siswa, Guru, Jadwal, Wali Kelas) */}
      {/* telah digabung ke tab Upload untuk efisiensi workflow kerja mereka. */}
      <div className="bg-[#161b22] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <UserCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h5 className="font-bold text-slate-100 text-sm">Impor Guru Massal Terpusat</h5>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Seluruh modul impor akun guru via file Excel (.xlsx) kini disatukan di bawah tab menu utama <strong className="text-blue-400">Upload</strong>.
            </p>
          </div>
        </div>
        <div className="text-2xs font-mono font-bold text-indigo-400 bg-indigo-950/40 px-3 py-1.5 border border-indigo-500/10 rounded-xl shrink-0">
          STATUS: AKTIF DI MENU UPLOAD
        </div>
      </div>
    </div>
  );
}
