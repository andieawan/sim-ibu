import React from 'react';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench, FileSpreadsheet, Link2, Link2Off, Check
} from 'lucide-react';
import { AdminTabProps } from '../types';
import { useDialog } from '../../../components/DialogProvider';

export default function AdminSystemTab(props: AdminTabProps) {
  const { showAlert, showConfirm } = useDialog();
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

  const [backupConfig, setBackupConfig] = React.useState<any>(null);
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [runningBackup, setRunningBackup] = React.useState(false);
  const [backupAlert, setBackupAlert] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchBackupConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch('/api/system/backup/google/config');
      if (res.ok) {
        const data = await res.json();
        setBackupConfig(data);
      }
    } catch (err) {
      console.error('Error fetching backup config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const [apiConfig, setApiConfig] = React.useState<{ enabled: boolean; token: string } | null>(null);
  const [loadingApiConfig, setLoadingApiConfig] = React.useState(true);
  const [apiAlert, setApiAlert] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  const fetchApiConfig = async () => {
    try {
      setLoadingApiConfig(true);
      const res = await fetch('/api/system/external-api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApiConfig(data.config);
        }
      }
    } catch (err) {
      console.error('Error fetching API config:', err);
    } finally {
      setLoadingApiConfig(false);
    }
  };

  const handleToggleApi = async (enabled: boolean) => {
    try {
      setApiAlert(null);
      const res = await fetch('/api/system/external-api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApiConfig(data.config);
          setApiAlert({ message: enabled ? 'Layanan Secure API eksternal telah diaktifkan.' : 'Layanan Secure API eksternal telah dinonaktifkan.', type: 'success' });
        }
      }
    } catch (err: any) {
      setApiAlert({ message: err.message || 'Gagal mengubah status Secure API.', type: 'error' });
    }
  };

  const handleRegenerateToken = async () => {
    const confirmed = await showConfirm(
      'Apakah Anda yakin ingin membuat ulang API Key baru? Integrasi di aplikasi luar Anda akan terputus sampai Anda memperbarui token di aplikasi tersebut.',
      'Buat Ulang API Key',
      'warning',
      'Ya, Buat Ulang',
      'Batal'
    );
    if (!confirmed) {
      return;
    }
    try {
      setRegenerating(true);
      setApiAlert(null);
      const res = await fetch('/api/system/external-api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApiConfig(data.config);
          setApiAlert({ message: 'API Key baru berhasil dibuat. Harap segera perbarui kunci di aplikasi eksternal Anda.', type: 'success' });
        }
      }
    } catch (err: any) {
      setApiAlert({ message: err.message || 'Gagal meregenerasi API Key.', type: 'error' });
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (!apiConfig?.token) return;
    navigator.clipboard.writeText(apiConfig.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    fetchBackupConfig();
    fetchApiConfig();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setBackupAlert(null);
      const { googleSignIn } = await import('../../../lib/workspaceAuth');
      const authResult = await googleSignIn();
      if (!authResult) return;

      const res = await fetch('/api/system/backup/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          email: authResult.user.email,
          enabled: true
        })
      });

      if (res.ok) {
        setBackupAlert({ message: 'Akun Google berhasil terhubung dan Auto-Backup mingguan diaktifkan!', type: 'success' });
        fetchBackupConfig();
      } else {
        const err = await res.json();
        setBackupAlert({ message: err.error || 'Gagal menyimpan konfigurasi backup.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setBackupAlert({ message: err.message || 'Gagal menghubungkan akun Google.', type: 'error' });
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    try {
      setBackupAlert(null);
      const res = await fetch('/api/system/backup/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (res.ok) {
        setBackupAlert({ message: enabled ? 'Auto-Backup mingguan diaktifkan.' : 'Auto-Backup mingguan dinonaktifkan.', type: 'success' });
        fetchBackupConfig();
      }
    } catch (err) {
      console.error('Error toggling schedule:', err);
    }
  };

  const handleRunBackup = async () => {
    try {
      setRunningBackup(true);
      setBackupAlert(null);

      const { getAccessToken } = await import('../../../lib/workspaceAuth');
      const token = await getAccessToken();

      const res = await fetch('/api/system/backup/google/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token || undefined })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setBackupAlert({ message: 'Backup data ke Google Sheets berhasil diselesaikan!', type: 'success' });
        fetchBackupConfig();
      } else {
        setBackupAlert({ message: result.error || 'Gagal menjalankan backup. Silakan coba hubungkan ulang akun Google Anda.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Backup run error:', err);
      setBackupAlert({ message: err.message || 'Gagal menjalankan backup.', type: 'error' });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    const confirmed = await showConfirm(
      'Apakah Anda yakin ingin memutuskan akun Google dan menonaktifkan jadwal auto-backup?',
      'Putuskan Akun Google',
      'warning',
      'Ya, Putuskan',
      'Batal'
    );
    if (!confirmed) return;
    try {
      setBackupAlert(null);
      const res = await fetch('/api/system/backup/google/disconnect', { method: 'POST' });
      if (res.ok) {
        setBackupAlert({ message: 'Koneksi akun Google berhasil diputuskan.', type: 'success' });
        fetchBackupConfig();
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

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
              {/* Logo Upload Section */}
              <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {schoolIdentity.logo ? (
                    <img 
                      src={schoolIdentity.logo} 
                      alt="Logo Sekolah" 
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <GraduationCap className="w-10 h-10 text-slate-700" />
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase font-sans">LOGO SEKOLAH / INSTANSI</label>
                  <p className="text-3xs text-slate-500 mb-2">Unggah berkas gambar (PNG, JPG, maks. 1MB). Logo akan ditampilkan di header atas aplikasi.</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-3xs font-bold border border-blue-500/20 cursor-pointer transition active:scale-95 flex items-center">
                      <span>Pilih Gambar</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 1 * 1024 * 1024) {
                              showAlert("Ukuran gambar melebihi batas 1MB.", "Batas Ukuran Logo", "danger");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setSchoolIdentity({ ...schoolIdentity, logo: event.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {schoolIdentity.logo && (
                      <button
                        type="button"
                        onClick={() => setSchoolIdentity({ ...schoolIdentity, logo: '' })}
                        className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-3xs font-bold border border-rose-500/20 cursor-pointer transition active:scale-95"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

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

          {/* Google Sheets Backup & Sync Card */}
          <div className="bg-[#161b22] border border-slate-850 p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <FileSpreadsheet className="w-16 h-16 text-emerald-500/5 pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h5 className="font-extrabold text-emerald-400 text-base flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <FileSpreadsheet className="w-5 h-5" />
                Google Sheets Auto-Backup &amp; Sync
              </h5>
              <p className="text-xs text-slate-400 font-medium">
                Cadangkan data instansi secara berkala ke Google Sheets. Seluruh data guru, siswa, kelas, presensi, dan nilai akan disinkronisasikan secara terpadu.
              </p>
            </div>

            {loadingConfig ? (
              <div className="py-6 flex items-center gap-2 justify-center text-xs text-slate-550 font-mono">
                <RotateCcw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Memuat konfigurasi pencadangan...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Connection Status Panel */}
                <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      backupConfig?.google_backup_user 
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                    }`}>
                      {backupConfig?.google_backup_user ? (
                        <Link2 className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Link2Off className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-3xs font-extrabold uppercase text-slate-500 tracking-wider font-mono block">Status Integrasi</span>
                      <strong className={`text-xs ${backupConfig?.google_backup_user ? 'text-slate-100' : 'text-slate-450'}`}>
                        {backupConfig?.google_backup_user 
                          ? `Terhubung dengan ${backupConfig.google_backup_user}` 
                          : 'Belum Terhubung dengan Google'}
                      </strong>
                    </div>
                  </div>

                  {!backupConfig?.google_backup_user ? (
                    <button
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition cursor-pointer"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Hubungkan Akun Google &amp; Aktifkan</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-4 py-2 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/5 text-rose-400 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Link2Off className="w-4 h-4" />
                      <span>Putuskan Akun Google</span>
                    </button>
                  )}
                </div>

                {/* Configuration Options (Visible when Connected) */}
                {backupConfig?.google_backup_user && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Schedule Option */}
                    <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="autoBackupCheckbox"
                        checked={backupConfig?.backup_schedule_enabled}
                        onChange={(e) => handleToggleSchedule(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-emerald-500 text-emerald-600 rounded bg-[#0f1219] border-slate-800"
                      />
                      <label htmlFor="autoBackupCheckbox" className="select-none cursor-pointer space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">Jadwalkan Auto-Backup Mingguan</span>
                        <span className="text-3xs text-slate-450 font-medium block">
                          Mengatur sinkronisasi otomatis seluruh database ke Google Sheets setiap hari <strong>Sabtu pukul 23:55 WIB</strong>.
                        </span>
                      </label>
                    </div>

                    {/* Metadata and Quick Actions */}
                    <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-3xs font-mono">
                        <span className="text-slate-500 uppercase font-bold">KONDISI AUTO-BACKUP</span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold uppercase ${
                          backupConfig?.backup_schedule_enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            : 'bg-slate-800/60 text-slate-500 border border-slate-750'
                        }`}>
                          {backupConfig?.backup_schedule_enabled ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="text-3xs text-slate-500 font-mono block">SINKRONISASI TERAKHIR</span>
                          <span className="text-slate-300 font-bold">
                            {backupConfig?.last_backup_time 
                              ? new Date(backupConfig.last_backup_time).toLocaleString('id-ID') 
                              : '-'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-3xs text-slate-500 font-mono block">STATUS TERAKHIR</span>
                          <span className={`font-extrabold uppercase ${
                            backupConfig?.last_backup_status === 'Sukses' 
                              ? 'text-emerald-400' 
                              : backupConfig?.last_backup_status?.startsWith('Gagal')
                                ? 'text-rose-400'
                                : 'text-slate-450'
                          }`}>
                            {backupConfig?.last_backup_status || 'Belum Terjadwal'}
                          </span>
                        </div>
                      </div>

                      {backupConfig?.google_backup_spreadsheet_url && (
                        <div className="pt-2 border-t border-slate-850/80 flex items-center justify-between">
                          <span className="text-3xs text-slate-500 font-mono">EXCEL/SPREADSHEET BACKUP:</span>
                          <a
                            href={backupConfig.google_backup_spreadsheet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:text-emerald-350 font-bold flex items-center gap-1 hover:underline transition-all"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Buka Spreadsheet</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Execution Actions */}
                {backupConfig?.google_backup_user && (
                  <div className="pt-2 border-t border-slate-850/50 flex gap-2">
                    <button
                      onClick={handleRunBackup}
                      disabled={runningBackup}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.01] active:scale-95 transition disabled:opacity-60 cursor-pointer"
                    >
                      <RotateCcw className={`w-4 h-4 ${runningBackup ? 'animate-spin' : ''}`} />
                      <span>{runningBackup ? 'Memproses Sync...' : 'Backup Sekarang ke Google Sheets'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {backupAlert && (
              <div className={`p-4 rounded-2xl text-xs flex gap-2.5 border ${
                backupAlert.type === 'success' 
                  ? 'bg-emerald-950/35 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-950/35 border-rose-500/20 text-[#ff5555]'
              }`}>
                {backupAlert.type === 'success' ? (
                  <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                )}
                <span>{backupAlert.message}</span>
              </div>
            )}
          </div>

          {/* Secure External REST API Section */}
          <div className="bg-[#161b22] border border-slate-850 p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Key className="w-16 h-16 text-blue-500/5 pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h5 className="font-extrabold text-blue-400 text-base flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Shield className="w-5 h-5 text-blue-500" />
                Integrasi REST API Eksternal &amp; Pengamanan Aplikasi
              </h5>
              <p className="text-xs text-slate-400 font-medium">
                Aktifkan dan kelola API Key terenkripsi agar sistem luar (aplikasi seluler, website alumni, atau sistem dapodik eksternal) dapat membaca dan menulis data siswa secara aman.
              </p>
            </div>

            {loadingApiConfig ? (
              <div className="py-6 flex items-center gap-2 justify-center text-xs text-slate-550 font-mono">
                <RotateCcw className="w-4 h-4 animate-spin text-blue-500" />
                <span>Memuat konfigurasi Secure API...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* API Status and Credentials Panel */}
                <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-2xl flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        apiConfig?.enabled 
                          ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' 
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-3xs font-extrabold uppercase text-slate-500 tracking-wider font-mono block">Status Layanan API</span>
                        <strong className={`text-xs ${apiConfig?.enabled ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {apiConfig?.enabled ? 'AKTIF (Siap Menerima Koneksi Luar)' : 'NON-AKTIF (Seluruh Akses Luar Ditutup)'}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleApi(!apiConfig?.enabled)}
                      className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 ${
                        apiConfig?.enabled
                          ? 'bg-rose-900/20 text-rose-400 border border-rose-800/40 hover:bg-rose-900/40'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {apiConfig?.enabled ? 'Nonaktifkan REST API' : 'Aktifkan REST API'}
                    </button>
                  </div>

                  {apiConfig?.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-3xs font-extrabold text-slate-500 tracking-wider block font-mono uppercase mb-1">SECURE API KEY / BEARER TOKEN</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={apiConfig?.token || ''}
                            className="w-full px-4 py-2.5 bg-[#0f1219] border border-slate-800 rounded-2xl text-blue-400 font-mono text-xs focus:outline-none tracking-wider font-semibold"
                          />
                          <button
                            onClick={handleCopyToken}
                            className="px-4 py-2.5 bg-[#161b22] border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-2xl text-xs transition active:scale-95 shrink-0"
                          >
                            {copied ? 'Tersalin!' : 'Salin Token'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          Gunakan token di atas dalam format header HTTP: <code className="text-blue-400 font-mono">Authorization: Bearer [TOKEN]</code> atau header kustom <code className="text-blue-400 font-mono">x-api-key: [TOKEN]</code>.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleRegenerateToken}
                          disabled={regenerating}
                          className="px-4 py-2 text-rose-400 hover:text-rose-350 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-55 shrink-0"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                          <span>Regenerasi API Key Baru</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* API Endpoint Documentation & Live Samples */}
                {apiConfig?.enabled && (
                  <div className="p-5 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                    <h6 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Panduan Teknis Integrasi &amp; Endpoint REST API
                    </h6>

                    <div className="space-y-3">
                      {/* Endpoints Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-3xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                              <th className="pb-2 font-extrabold">METODE</th>
                              <th className="pb-2 font-extrabold">ENDPOINT PATH</th>
                              <th className="pb-2 font-extrabold">FUNGSI &amp; AKSES DATA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-slate-300">
                            <tr>
                              <td className="py-2.5 font-bold text-emerald-400">GET</td>
                              <td className="py-2.5 font-semibold text-slate-100">/api/external/v1/siswa</td>
                              <td className="py-2.5 text-slate-400">Mengambil daftar seluruh siswa aktif beserta info kelas</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 font-bold text-emerald-400">GET</td>
                              <td className="py-2.5 font-semibold text-slate-100">/api/external/v1/siswa/:nis</td>
                              <td className="py-2.5 text-slate-400">Mengambil biodata lengkap siswa spesifik berdasarkan NIS</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 font-bold text-blue-400">POST</td>
                              <td className="py-2.5 font-semibold text-slate-100">/api/external/v1/siswa</td>
                              <td className="py-2.5 text-slate-400">Menyimpan siswa baru dari sistem lain (JSON Payload)</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 font-bold text-amber-400">PUT</td>
                              <td className="py-2.5 font-semibold text-slate-100">/api/external/v1/siswa/:nis</td>
                              <td className="py-2.5 text-slate-400">Memperbarui informasi biodata siswa terdaftar</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 font-bold text-rose-400">DELETE</td>
                              <td className="py-2.5 font-semibold text-slate-100">/api/external/v1/siswa/:nis</td>
                              <td className="py-2.5 text-slate-400">Menghapus data siswa dari database sekolah</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Code Examples */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/40">
                        <span className="text-3xs font-extrabold text-slate-500 tracking-wider font-mono block">CONTOH AKSES (CURL &amp; JAVASCRIPT FETCH)</span>
                        
                        <div className="bg-[#0f1219] p-3 rounded-xl border border-slate-850 text-[10px] font-mono text-slate-300 overflow-x-auto space-y-2">
                          <div>
                            <span className="text-slate-550 block select-none">// 1. Menggunakan cURL (Command Line)</span>
                            <code className="text-blue-300 select-all block">
                              {`curl -X GET "${window.location.origin}/api/external/v1/siswa" \\\n  -H "Authorization: Bearer ${apiConfig?.token || 'TOKEN'}"`}
                            </code>
                          </div>
                          <div className="pt-2 border-t border-slate-850/50">
                            <span className="text-slate-550 block select-none">// 2. Menggunakan JavaScript Fetch</span>
                            <pre className="text-emerald-300 select-all overflow-x-auto leading-normal">
{`fetch("${window.location.origin}/api/external/v1/siswa", {
  method: "GET",
  headers: {
    "Authorization": "Bearer ${apiConfig?.token || 'YOUR_TOKEN'}",
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(data => console.log(data));`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {apiAlert && (
              <div className={`p-4 rounded-2xl text-xs flex gap-2.5 border ${
                apiAlert.type === 'success' 
                  ? 'bg-emerald-950/35 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-950/35 border-rose-500/20 text-[#ff5555]'
              }`}>
                {apiAlert.type === 'success' ? (
                  <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                )}
                <span>{apiAlert.message}</span>
              </div>
            )}
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
