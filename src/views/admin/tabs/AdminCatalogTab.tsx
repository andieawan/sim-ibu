import React, { useEffect } from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';
import { AdminTabProps } from '../types';

export default function AdminCatalogTab(props: AdminTabProps) {
  const {
    classes, onRefreshClasses, onRefreshUsers, currentUser,
    users, loadingUsers, userSuccessMsg, userErrorMsg, editingUserId,
    formUsername, formPassword, formNama, formRole, formKelasId, showAddForm, stats, loadingStats,
    catalogSiswa, loadingCatalog, searchQuery, selectedClassFilter, selectedClassForImport, csvFile, csvPreview, parsedSiswaList, importStatus, promoting, promotionTargetClass, promotionSourceClass, promotionMode,
    schedules, loadingSchedules, scheduleAlert, editingScheduleId, scheduleDeleteConfirmId, newSchedClassId, newSchedGuruId, newSchedMatpel, newSchedHari, newSchedMulai, newSchedSelesai, schedViewMode, schedSearchQuery,
    systemAlert, schoolIdentity, loadingIdentity, identityAlert, systemPatches, loadingPatches, diagnostics, runningDiagnostics, patchActionLoading, patchAlert, isDragging, uploadingPatch,
    setFormUsername, setFormPassword, setFormNama, setFormRole, setFormKelasId, setShowAddForm, setEditingUserId, handleUserSubmit, handleEditClick, handleDeleteUser, resetUserForm, 
    setSearchQuery, setSelectedClassFilter, setSelectedClassForImport, handleFileChange, handleUploadCSV, setCsvFile, setCsvPreview, setParsedSiswaList, setImportStatus, handleDeleteStudent, handleDeleteClass, setPromoting, setPromotionMode, setPromotionSourceClass, setPromotionTargetClass, handleBulkAction,
    setSchedViewMode, setSchedSearchQuery, setNewSchedClassId, setNewSchedGuruId, setNewSchedMatpel, setNewSchedHari, setNewSchedMulai, setNewSchedSelesai, setEditingScheduleId, setScheduleDeleteConfirmId, handleAddSchedule, handleEditScheduleClick, handleDeleteSchedule, resetScheduleForm,
    setSchoolIdentity, handleSaveSchoolIdentity, runSystemDiagnostics, handleApplyAllPatches, handleDragOver, handleDragLeave, handleDrop, handlePatchUpload, handleResetDatabase,
    downloadSampleCSV, exportStudentsToExcel, filteredSiswa, setScheduleAlert, setPatchAlert, setCatalogSiswa
  } = props;

  // State local untuk menyembunyikan/menampilkan Direktori Kelas Aktif
  const [isClassesHidden, setIsClassesHidden] = React.useState(false);

  // State local untuk manajemen modal edit informasi siswa
  const [editingStudent, setEditingStudent] = React.useState<any | null>(null);
  const [editNama, setEditNama] = React.useState('');
  const [editJk, setEditJk] = React.useState('L');
  const [editKelasId, setEditKelasId] = React.useState<number | ''>('');
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState('');

  // Maksud Bisnis: Mengontrol scroll-lock pada body document untuk mencegah double-scrolling ketika modal edit siswa aktif
  useEffect(() => {
    if (editingStudent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingStudent]);

  const handleEditStudentClick = (student: any) => {
    setEditingStudent(student);
    setEditNama(student.nama);
    setEditJk(student.jenis_kelamin);
    setEditKelasId(student.kelas_id || '');
    setEditError('');
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNama.trim() || !editKelasId) {
      setEditError('Nama dan Kelas wajib diisi');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const resp = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: editingStudent.nis,
          nama: editNama.trim(),
          jenis_kelamin: editJk,
          kelas_id: Number(editKelasId)
        })
      });
      if (resp.ok) {
        const updatedSiswa = {
          ...editingStudent,
          nama: editNama.trim(),
          jenis_kelamin: editJk,
          kelas_id: Number(editKelasId)
        };
        // Perbarui catalog siswa di state induk (parent) secara langsung demi instant feedback
        setCatalogSiswa(prev => prev.map(s => s.nis === editingStudent.nis ? updatedSiswa : s));
        setEditingStudent(null);
      } else {
        const data = await resp.json();
        setEditError(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">

          {/* ============================================================================
              PEMBERITAHUAN NAVIGASI MENU UPLOAD DEDIKASI (BAHASA INDONESIA)
              Maksud Bisnis: Memberikan petunjuk transisi visual kepada administrator bahwa
              fitur impor data masal telah dipindahkan ke menu tab khusus "Upload" demi kerapian
              tampilan direktori katalog.
              ============================================================================ */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl shrink-0">
                <Upload className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Menu Impor Data Dipindahkan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Fitur unggah data siswa via Excel/CSV kini memiliki tab menu khusus yang lebih lengkap.</p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg font-bold">MANDIRI</span>
          </div>
          {/* === AKHIR DARI PEMBERITAHUAN NAVIGASI === */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Class directory catalog list */}
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-200 text-sm">Direktori Kelas Aktif</h5>
                  <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Penghapusan Kelas Berdaya Tinggi</p>
                </div>
                {/* Tombol Sembunyikan untuk menghemat ruang gulir di layar banyak kelas */}
                <button 
                  onClick={() => setIsClassesHidden(!isClassesHidden)}
                  className="text-2xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/40 px-2.5 py-1.5 rounded-xl border border-blue-500/10 cursor-pointer transition flex items-center gap-1"
                >
                  {isClassesHidden ? 'Tampilkan' : 'Sembunyikan'}
                </button>
              </div>

              {isClassesHidden ? (
                <div className="py-12 text-center text-slate-500 text-xs italic bg-[#0f1219] rounded-2xl border border-slate-850/80 border-dashed">
                  Direktori kelas aktif disembunyikan untuk mempercepat navigasi.
                </div>
              ) : classes.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">Belum ada daftar kelas di database.</div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
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
                          <div className="mt-2 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
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
                                      if (onRefreshUsers) onRefreshUsers();
                                    } else {
                                      alert('Gagal mengupdate Wali Kelas');
                                    }
                                  } catch (err: any) {
                                    alert('Error: ' + err.message);
                                  }
                                }}
                                className={`bg-[#161b22] border px-1.5 py-0.5 rounded text-[10px] focus:outline-none focus:border-blue-500 font-semibold cursor-pointer max-w-[140px] truncate ${
                                  users.find(u => u.id === k.walikelas_id)?.is_cuti === 1
                                    ? 'border-rose-500/50 text-rose-400 bg-rose-950/20'
                                    : 'border-slate-800 text-slate-350'
                                }`}
                              >
                                <option value="">-- Belum Ditentukan --</option>
                                {users.filter(u => u.role === 'guru').map(u => (
                                  <option key={u.id} value={u.id} className={u.is_cuti === 1 ? 'text-rose-400 bg-rose-950/30 font-semibold' : ''}>
                                    {u.nama} {u.is_cuti === 1 ? ' (🔴 Cuti)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Peringatan jika Wali Kelas Sedang Cuti */}
                            {(() => {
                              const currentWali = users.find(u => u.id === k.walikelas_id);
                              if (currentWali && currentWali.is_cuti === 1) {
                                return (
                                  <div className="mt-1 p-1.5 bg-rose-950/35 border border-rose-500/25 rounded-xl text-rose-400 text-[9px] leading-snug animate-pulse max-w-[170px]">
                                    ⚠️ <strong>Wali Kelas ({currentWali.nama})</strong> sedang cuti! Mohon ganti dengan wali pengganti sementara.
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(k.id, k.nama_kelas);
                          }}
                          className="p-2 hover:bg-rose-950/40 text-slate-550 hover:text-rose-455 rounded-xl transition cursor-pointer shrink-0 align-self-start"
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
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredSiswa.map(s => {
                    const cl = classes.find(c => c.id === s.kelas_id);
                    return (
                      <div 
                        key={s.nis}
                        className="p-3 bg-[#0f1219] border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition animate-in fade-in duration-100"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className="text-slate-200 truncate block max-w-[150px]">{s.nama}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              s.jenis_kelamin === 'L' 
                                ? 'bg-blue-950/40 text-blue-400 border border-blue-500/10' 
                                : 'bg-pink-950/40 text-pink-400 border border-pink-500/10'
                            }`} title={s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}>
                              {s.jenis_kelamin === 'L' ? 'L (Laki-laki)' : 'P (Perempuan)'}
                            </span>
                          </div>
                          {/* Aliran Data: Menyajikan informasi NIS, Kelas Penempatan, dan Kompetensi Jurusan terpadu */}
                          <p className="text-[10px] font-mono font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                            <span>NIS: <strong className="text-slate-400">{s.nis}</strong></span>
                            <span>&bull;</span>
                            <span className="text-indigo-400 font-sans font-bold">{cl ? cl.nama_kelas : 'Tanpa Kelas'}</span>
                            <span>&bull;</span>
                            <span className="text-emerald-400 font-sans font-medium text-[9px] bg-emerald-950/20 border border-emerald-500/10 px-1.5 py-0.2 rounded">
                              Jurusan: {cl?.jurusan || 'Desain Komunikasi Visual'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Tombol Edit Siswa sesuai Request User */}
                          <button
                            onClick={() => handleEditStudentClick(s)}
                            className="p-1.5 hover:bg-blue-950/40 text-slate-400 hover:text-blue-400 rounded-lg transition cursor-pointer"
                            title="Edit Informasi Siswa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteStudent(s.nis)}
                            className="p-1.5 hover:bg-rose-950/40 text-slate-550 hover:text-rose-450 rounded-lg transition cursor-pointer"
                            title="Hapus Siswa Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Modal Edit Siswa Popup */}
          {editingStudent && (
            <div className="fixed inset-0 bg-[#090d16]/90 backdrop-blur-md z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10">
              <div 
                className="bg-[#161b22] border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 relative my-auto animate-in zoom-in-95 duration-150 scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-800 relative z-10">
                  <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Edit className="w-4 h-4 text-blue-450" />
                    <span>Edit Data Siswa</span>
                  </span>
                  <button
                    onClick={() => setEditingStudent(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditStudentSubmit} className="space-y-4 mt-4 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Nomor Induk Siswa (NIS)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-400 cursor-not-allowed"
                      value={editingStudent.nis}
                      disabled
                      title="NIS adalah Primary Key unik dan tidak dapat diubah"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                      placeholder="Masukkan nama lengkap siswa..."
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Jenis Kelamin</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="editJk"
                          value="L"
                          checked={editJk === 'L'}
                          onChange={() => setEditJk('L')}
                          className="accent-blue-500"
                        />
                        <span>Laki-laki (L)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="editJk"
                          value="P"
                          checked={editJk === 'P'}
                          onChange={() => setEditJk('P')}
                          className="accent-pink-500"
                        />
                        <span>Perempuan (P)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Penempatan Kelas Aktif</label>
                    <select
                      className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-350"
                      value={editKelasId}
                      onChange={(e) => setEditKelasId(parseInt(e.target.value) || '')}
                      required
                    >
                      <option value="">-- Pilih Kelas Penempatan --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.nama_kelas} - {cls.sekolah}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editError && (
                    <div className="p-3 bg-rose-950/20 border border-rose-500/25 rounded-xl text-rose-400 text-xs flex gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="flex-1 py-2.5 text-center border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-850/40 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-500 transition cursor-pointer disabled:opacity-50"
                    >
                      {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      
  );
}
