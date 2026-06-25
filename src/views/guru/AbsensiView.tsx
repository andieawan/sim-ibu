import { useState, useEffect } from 'react';
import { Calendar, UserCheck, CheckCircle2, History, Check, ShieldAlert, ArrowLeft, Loader2, Save, Edit } from 'lucide-react';
import { Kelas, Siswa } from '../../types';
import { formatIndoDate } from '../../utils';

interface AbsensiViewProps {
  classes: Kelas[];
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
}

interface AbsensiHistoryRecord {
  id: number;
  tanggal: string;
  count_hadir: number;
  count_izin: number;
  count_sakit: number;
  count_alfa: number;
  total_siswa: number;
}

interface AbsensiDetailRecord {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at: string;
}

export default function AbsensiView({
  classes,
  loadingClasses,
  selectedClassId,
  onClassChange,
}: AbsensiViewProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light');
  const getAuthHeader = () => {
    try {
      const saved = sessionStorage.getItem('simibu_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.token) {
          return { 'Authorization': `Bearer ${u.token}` };
        }
      }
    } catch (_) {}
    return {};
  };

  const [students, setStudents] = useState<Siswa[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>>({});
  const [history, setHistory] = useState<AbsensiHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<AbsensiHistoryRecord | null>(null);
  const [historyDetails, setHistoryDetails] = useState<AbsensiDetailRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const [isEditingSession, setIsEditingSession] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);

  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
      loadHistory(selectedClassId);
      setSelectedHistorySession(null);
    }
  }, [selectedClassId]);

  const loadStudents = async (classId: number) => {
    setLoadingStudents(true);
    setSaveStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/siswa/${classId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data: Siswa[] = await res.json();
        const activeStudents = data.filter(s => s.status_aktif !== 0);
        setStudents(activeStudents);
        
        // Let's not run override straight away here, because loadHistory will run and determine if there's already an existing record on the attendanceDate.
        const initialMap: typeof attendanceStatuses = {};
        activeStudents.forEach(s => {
          initialMap[s.nis] = 'Hadir';
        });
        setAttendanceStatuses(initialMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadHistory = async (classId: number, targetDate?: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/absensi-history/${classId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const rawData = await res.json();
        const data = rawData.map((h: any) => ({ ...h, tanggal: h.tanggal ? h.tanggal.replace(/\//g, '-') : '' }));
        setHistory(data);
        
        // Check if there is an existing record on the targeted date
        const queryDate = targetDate || attendanceDate;
        const existing = data.find((h: any) => h.tanggal === queryDate);
        if (existing) {
          setIsEditingSession(true);
          setEditingSessionId(existing.id);
          const detailRes = await fetch(`/api/absensi-detail/${existing.id}`, { headers: getAuthHeader() });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const statusMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'> = {};
            detailData.forEach((det: any) => {
              statusMap[det.siswa_nis] = det.status;
            });
            setAttendanceStatuses(statusMap);
          }
        } else {
          setIsEditingSession(false);
          setEditingSessionId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setAttendanceDate(newDate);
    if (!selectedClassId) return;

    // Check if there's existing recorded session for this new date
    const existing = history.find(h => h.tanggal === newDate);
    if (existing) {
      setIsEditingSession(true);
      setEditingSessionId(existing.id);
      try {
        const res = await fetch(`/api/absensi-detail/${existing.id}`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          const statusMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'> = {};
          data.forEach((det: any) => {
            statusMap[det.siswa_nis] = det.status;
          });
          setAttendanceStatuses(statusMap);
          setSaveStatus({
            type: 'success',
            message: `Memuat data absensi tanggal ${formatIndoDate(newDate)}. Anda berada dalam Mode Edit Pembetulan.`
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsEditingSession(false);
      setEditingSessionId(null);
      setSaveStatus({ type: '', message: '' });
      // Reset to default
      const initialMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'> = {};
      students.forEach(s => {
        initialMap[s.nis] = 'Hadir';
      });
      setAttendanceStatuses(initialMap);
    }
  };

  const handleStatusChange = (nis: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa') => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [nis]: status
    }));
  };

  const handleSetAllPresent = () => {
    const allPresent: typeof attendanceStatuses = {};
    students.forEach((s) => {
      allPresent[s.nis] = 'Hadir';
    });
    setAttendanceStatuses(allPresent);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);
    setSaveStatus({ type: '', message: '' });

    // Format records with local updated_at sync points
    const records = students.map((s) => ({
      nis: s.nis,
      status: attendanceStatuses[s.nis] || 'Hadir',
      updated_at: new Date().toISOString()
    }));

    try {
      const response = await fetch('/api/absensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          kelas_id: selectedClassId,
          tanggal: attendanceDate,
          records
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: isEditingSession 
            ? 'Perubahan Absensi berhasil disimpan dan disinkronisasikan ke database!'
            : 'Laporan Absensi berhasil disimpan dan disematkan ke database SQLite!'
        });
        loadHistory(selectedClassId, attendanceDate);
      } else {
        setSaveStatus({
          type: 'error',
          message: resData.error || 'Terjadi kesalahan saat menyimpan absensi.'
        });
      }
    } catch (error: any) {
      setSaveStatus({
        type: 'error',
        message: `Gagal mengirim data: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const loadHistoryDetails = async (session: AbsensiHistoryRecord) => {
    setSelectedHistorySession(session);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/absensi-detail/${session.id}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setHistoryDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditFromHistory = (session: AbsensiHistoryRecord, details: AbsensiDetailRecord[]) => {
    setAttendanceDate(session.tanggal);
    setIsEditingSession(true);
    setEditingSessionId(session.id);
    
    // Map details to statuses
    const statusMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'> = {};
    details.forEach(det => {
      statusMap[det.siswa_nis] = det.status;
    });
    setAttendanceStatuses(statusMap);
    
    // Close the slide-over details
    setSelectedHistorySession(null);
    
    // Show feedback
    setSaveStatus({
      type: 'success',
      message: `Berhasil memuat data absensi ${formatIndoDate(session.tanggal)} ke panel utama! Silakan lakukan penyesuaian dan simpan.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Selection zone header */}
      <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-slate-100">Manajemen Absensi Kelas</h4>
          <p className="text-xs text-slate-500">Isi status presensi harian siswa atau tinjau buku riwayat kehadiran.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar picker */}
          <div className="relative">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 bg-[#0f1219] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          <select
            value={selectedClassId || ''}
            onChange={(e) => onClassChange(Number(e.target.value))}
            className="px-3 py-2 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="" className={isLight ? 'bg-white text-slate-800' : 'bg-[#161b22] text-slate-300'}>-- Pilih Kelas --</option>
            {classes.map((k) => (
              <option key={k.id} value={k.id} className={isLight ? 'bg-white text-slate-800' : 'bg-[#161b22] text-slate-300'}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClassId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active input panel */}
          <div className="lg:col-span-8 bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-slate-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Tanggal: {formatIndoDate(attendanceDate)}</span>
              </span>

              <button
                type="button"
                onClick={handleSetAllPresent}
                disabled={students.length === 0}
                className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  students.length > 0
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/10 shadow-md cursor-pointer'
                    : 'border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Set Semua Hadir</span>
              </button>
            </div>

            {loadingStudents ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p className="text-sm">Silakan tunggu, sedang mengambil data siswa...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                Belum ada siswa terdaftar di kelas ini. Tambahkan data di Beranda.
              </div>
            ) : (
              <div className="space-y-4">
                {isEditingSession && (
                  <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse mt-1 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-400">Mode Pembetulan / Edit Absensi</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                          Menampilkan data absensi tersimpan kelas ini. Sempurnakan status kehadiran siswa seperti izin, sakit, dsb, lalu klik Simpan Perubahan.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSession(false);
                        setEditingSessionId(null);
                        const defaultMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'> = {};
                        students.forEach(s => {
                          defaultMap[s.nis] = 'Hadir';
                        });
                        setAttendanceStatuses(defaultMap);
                        setSaveStatus({ type: '', message: '' });
                      }}
                      className="shrink-0 text-xs font-bold text-slate-350 hover:text-slate-100 bg-[#0f1219] px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition active:scale-95 cursor-pointer"
                    >
                      Batal Edit Sesi
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  {students.map((s) => {
                    const currentStatus = attendanceStatuses[s.nis] || 'Hadir';
                    return (
                      <div
                        key={s.nis}
                        className="p-3.5 bg-[#0f1219] rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div 
                          className="min-w-0 flex-1 cursor-pointer group"
                          onClick={() => (window as any).showStudentProfile?.(s.nis)}
                          title="Klik untuk detail riwayat & nilai siswa"
                        >
                          <span className="font-mono text-2xs text-slate-500 font-bold block group-hover:text-blue-400 transition-colors">NIS: {s.nis} &bull; Lihat detail &rarr;</span>
                          <h5 className="font-bold text-slate-200 text-sm truncate group-hover:text-blue-400 transition-colors group-hover:underline">{s.nama}</h5>
                          <p className="text-3xs font-semibold uppercase tracking-wider text-slate-500">
                            Gender: {s.jenis_kelamin}
                          </p>
                        </div>

                        {/* Interactive toggle buttons */}
                        <div className="flex bg-[#161b22] p-0.5 rounded-xl border border-slate-800">
                          {(['Hadir', 'Izin', 'Sakit', 'Alfa'] as const).map((status) => {
                            const isSelected = currentStatus === status;
                            const colorClasses = {
                              Hadir: isSelected ? 'bg-emerald-600/35 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-500 hover:text-emerald-400',
                              Izin: isSelected ? 'bg-amber-600/35 text-amber-400 border border-amber-500/30 shadow-md' : 'text-slate-500 hover:text-amber-500',
                              Sakit: isSelected ? 'bg-blue-600/35 text-blue-400 border border-blue-500/30 shadow-md' : 'text-slate-500 hover:text-blue-400',
                              Alfa: isSelected ? 'bg-rose-600/35 text-rose-455 border border-rose-500/30 shadow-md' : 'text-slate-500 hover:text-rose-455',
                            };
                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(s.nis, status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${colorClasses[status]}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className={`w-full text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg transition duration-200 active:scale-[0.99] cursor-pointer ${
                    isEditingSession 
                      ? 'bg-amber-600 hover:bg-amber-500' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sedang Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      {isEditingSession ? (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Simpan Perubahan Absensi</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Simpan Presensi Hari Ini</span>
                        </>
                      )}
                    </>
                  )}
                </button>

                {saveStatus.message && (
                  <div className={`p-4 rounded-2xl border text-sm flex items-start space-x-2.5 ${
                    saveStatus.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-455'
                  }`}>
                    {saveStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Historical logs */}
          <div className="lg:col-span-4 space-y-4">
            <h5 className="font-bold text-slate-300 flex items-center space-x-2">
              <History className="w-4.5 h-4.5 text-slate-500" />
              <span>Riwayat Absensi</span>
            </h5>

            {loadingHistory ? (
              <div className="bg-[#161b22] p-12 text-center text-slate-500 rounded-3xl border border-slate-800">
                Mengambil riwayat...
              </div>
            ) : history.length === 0 ? (
              <div className="bg-[#161b22] p-12 text-center text-slate-500 text-xs rounded-3xl border border-dashed border-slate-800">
                Belum ada berkas riwayat tersimpan untuk kelas ini.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => loadHistoryDetails(record)}
                    className={`bg-[#161b22] p-4 rounded-2xl border cursor-pointer hover:border-slate-700 transition-all ${
                      selectedHistorySession?.id === record.id ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-xs font-semibold text-slate-200">Tanggal: {formatIndoDate(record.tanggal)}</span>
                      <span className="text-3xs font-bold px-2 py-0.5 bg-[#0f1219] rounded-full text-slate-400 border border-slate-800">
                        {record.total_siswa} Siswa
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center font-bold text-3xs">
                      <div className="bg-emerald-950/20 text-emerald-400 px-1 py-1 rounded-md border border-emerald-500/10">
                        H: {record.count_hadir}
                      </div>
                      <div className="bg-amber-950/20 text-amber-400 px-1 py-1 rounded-md border border-amber-500/10">
                        I: {record.count_izin}
                      </div>
                      <div className="bg-blue-950/20 text-blue-400 px-1 py-1 rounded-md border border-blue-500/10">
                        S: {record.count_sakit}
                      </div>
                      <div className="bg-rose-950/20 text-rose-455 px-1 py-1 rounded-md border border-rose-500/10">
                        A: {record.count_alfa}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#161b22] p-12 text-center rounded-3xl border border-dashed border-slate-800 text-slate-550 text-sm">
          Silakan pilih kelas terlebih dahulu untuk melihat dan menginput absensi.
        </div>
      )}

      {/* History Details Slide-over Modal */}
      {selectedHistorySession && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex justify-end z-[55]">
          <div className="bg-[#161b22] w-full max-w-md h-full shadow-2xl flex flex-col p-6 border-l border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div>
                <button
                  onClick={() => setSelectedHistorySession(null)}
                  className="flex items-center space-x-1 text-xs text-blue-450 font-bold hover:underline mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <h4 className="text-lg font-bold text-slate-100 font-sans">Rincian Presensi</h4>
                <p className="text-xs text-slate-500">Tanggal: {formatIndoDate(selectedHistorySession.tanggal)}</p>
              </div>
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="text-slate-500 text-sm font-semibold hover:text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingDetails ? (
                <div className="py-20 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  <span>Loading rincian...</span>
                </div>
              ) : historyDetails.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">Tidak ada data rincian siswa.</div>
              ) : (
                historyDetails.map((det) => {
                  const statusColors = {
                    Hadir: 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20',
                    Izin: 'bg-amber-950/30 text-amber-400 border-amber-500/20',
                    Sakit: 'bg-blue-950/30 text-blue-400 border-blue-500/20',
                    Alfa: 'bg-rose-950/30 text-rose-450 border-rose-500/20',
                  };
                  return (
                    <div
                      key={det.siswa_nis}
                      className="p-3 bg-[#0f1219] rounded-xl border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-bold text-slate-200 text-sm">{det.nama}</h5>
                        <p className="font-mono text-3xs text-slate-500 mt-0.5">NIS: {det.siswa_nis}</p>
                        {det.updated_at && (
                          <span className="text-[9px] text-slate-500 block mt-1">
                            Disinkronisasi: {new Date(det.updated_at).toLocaleTimeString('id-ID')}
                          </span>
                        )}
                      </div>

                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${statusColors[det.status]}`}>
                        {det.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {!loadingDetails && historyDetails.length > 0 && (
              <div className="pt-4 border-t border-slate-800 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditFromHistory(selectedHistorySession, historyDetails)}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.98] cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>Ubah / Edit Absensi Sesi Ini</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
