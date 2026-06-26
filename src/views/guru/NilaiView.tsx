import { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldAlert, History, ArrowLeft, Loader2, Save, Sparkles, BookOpen, Check } from 'lucide-react';
import { Kelas, Siswa } from '../../types';
import NilaiHistoryModal from './NilaiHistoryModal';
import { formatIndoDate } from '../../utils';

interface NilaiViewProps {
  classes: Kelas[];
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
}

interface NilaiHistoryRecord {
  id: number;
  nama_aktivitas: string;
  tanggal: string;
  rata_rata: number;
  count_remedial: number;
  total_siswa: number;
  kkm?: number;
}

interface NilaiDetailRecord {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  nilai: number;
  catatan: string;
}

export default function NilaiView({
  classes,
  loadingClasses,
  selectedClassId,
  onClassChange,
}: NilaiViewProps) {
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light');
  const getAuthHeader = () => {
    try {
      // Aliran Data: Mengambil data token pengguna (simibu_user) dari localStorage atau sessionStorage untuk otentikasi API Nilai Guru
      const saved = localStorage.getItem('simibu_user') || sessionStorage.getItem('simibu_user');
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
  const [activityName, setActivityName] = useState<string>('Ulangan Harian 1');
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [kkm, setKkm] = useState<number>(75);
  
  // Grade states
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [history, setHistory] = useState<NilaiHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<NilaiHistoryRecord | null>(null);
  const [historyDetails, setHistoryDetails] = useState<NilaiDetailRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // History editing states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editActivityName, setEditActivityName] = useState<string>('');
  const [editActivityDate, setEditActivityDate] = useState<string>('');
  const [editKkm, setEditKkm] = useState<number>(75);
  const [editGrades, setEditGrades] = useState<Record<string, number>>({});
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

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
        
        // Initialize default scores
        const initialGrades: Record<string, number> = {};
        const initialNotes: Record<string, string> = {};
        activeStudents.forEach(s => {
          initialGrades[s.nis] = 80; // default passing value to be polite
          initialNotes[s.nis] = 80 >= kkm ? 'Tuntas' : 'Remedial';
        });
        setGrades(initialGrades);
        setNotes(initialNotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadHistory = async (classId: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/nilai-history/${classId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const rawData = await res.json();
        const data = rawData.map((record: any) => ({ ...record, tanggal: record.tanggal ? record.tanggal.replace(/\//g, '-') : '' }));
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGradeChange = (nis: string, value: string) => {
    let numericVal = parseFloat(value);
    if (isNaN(numericVal)) {
      setGrades(prev => ({
        ...prev,
        [nis]: 0
      }));
      return;
    }

    if (numericVal > 100) {
      setWarningMessage("Nilai siswa tidak boleh melebihi 100!");
      numericVal = 100;
    } else if (numericVal < 0) {
      setWarningMessage("Nilai siswa tidak boleh kurang dari 0!");
      numericVal = 0;
    }

    const score = numericVal;
    setGrades(prev => ({
      ...prev,
      [nis]: score
    }));

    // Auto update notes based on KKM if it matches default/blank or tuntas/remedial
    setNotes(prev => {
      const currentNote = prev[nis] || '';
      if (!currentNote || currentNote === 'Remedial' || currentNote === 'Tuntas' || currentNote === 'Belum Tuntas' || currentNote.toLowerCase().includes('remedial') || currentNote.toLowerCase().includes('tuntas') || currentNote.toLowerCase().includes('belum tuntas')) {
        return {
          ...prev,
          [nis]: score >= kkm ? 'Tuntas' : 'Remedial'
        };
      }
      return prev;
    });
  };

  const handleNoteChange = (nis: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [nis]: value
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId || !activityName.trim() || students.length === 0) {
      setSaveStatus({ type: 'error', message: 'Silakan isi Nama Aktivitas dan pastikan siswa terdaftar.' });
      return;
    }
    setSaving(true);
    setSaveStatus({ type: '', message: '' });

    const records = students.map((s) => ({
      nis: s.nis,
      nilai: grades[s.nis] ?? 0,
      catatan: notes[s.nis] || ''
    }));

    try {
      const response = await fetch('/api/nilai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          kelas_id: selectedClassId,
          nama_aktivitas: activityName.trim(),
          tanggal: activityDate,
          kkm,
          records
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: 'Laporan Nilai & Pencapaian KKM berhasil diposkan ke database SQLite!'
        });
        loadHistory(selectedClassId);
      } else {
        setSaveStatus({
          type: 'error',
          message: resData.error || 'Terjadi kesalahan saat menyimpan nilai.'
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

  const loadHistoryDetails = async (session: NilaiHistoryRecord) => {
    setSelectedHistorySession(session);
    setLoadingDetails(true);
    setIsEditing(false); // Reset edit state on switch
    try {
      const res = await fetch(`/api/nilai-detail/${session.id}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setHistoryDetails(data);
        
        // Initialize edit states
        setEditActivityName(session.nama_aktivitas);
        setEditActivityDate(session.tanggal);
        setEditKkm(session.kkm ?? 75);
        
        const tempGrades: Record<string, number> = {};
        const tempNotes: Record<string, string> = {};
        data.forEach((det: NilaiDetailRecord) => {
          tempGrades[det.siswa_nis] = det.nilai;
          tempNotes[det.siswa_nis] = det.catatan || '';
        });
        setEditGrades(tempGrades);
        setEditNotes(tempNotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateGrades = async () => {
    if (!selectedHistorySession) return;
    if (!editActivityName.trim()) {
      alert("Nama aktivitas wajib diisi!");
      return;
    }

    setUpdating(true);
    const records = historyDetails.map((det) => ({
      nis: det.siswa_nis,
      nilai: editGrades[det.siswa_nis] ?? 0,
      catatan: editNotes[det.siswa_nis] || ''
    }));

    try {
      const response = await fetch(`/api/nilai/${selectedHistorySession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          nama_aktivitas: editActivityName.trim(),
          tanggal: editActivityDate,
          kkm: editKkm,
          records
        })
      });

      if (response.ok) {
        setIsEditing(false);
        if (selectedClassId) {
          loadHistory(selectedClassId);
          // Reload fresh details
          const resDetail = await fetch(`/api/nilai-detail/${selectedHistorySession.id}`, { headers: getAuthHeader() });
          if (resDetail.ok) {
            const freshDetails = await resDetail.json();
            setHistoryDetails(freshDetails);
          }
          // Update selected session info locally
          setSelectedHistorySession(prev => prev ? {
            ...prev,
            nama_aktivitas: editActivityName.trim(),
            tanggal: editActivityDate,
            kkm: editKkm,
          } : null);
        }
      } else {
        const errData = await response.json();
        alert(errData.error || "Gagal memperbarui nilai.");
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {warningMessage && (
        <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-3xl text-sm flex items-start space-x-2.5 text-amber-400 shadow-lg animate-pulse">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <span className="font-bold">Peringatan Input:</span> {warningMessage}
          </div>
          <button 
            onClick={() => setWarningMessage('')} 
            className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-xl text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-slate-100">Manajemen Penilaian &amp; KKM</h4>
          <p className="text-xs text-slate-500">Input nilai aktivitas, uji kelulusan KKM (75), dan simpan riwayat belajar.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Activity name input */}
          <input
            type="text"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Judul Ulangan / Tugas"
            className="px-3 py-2 bg-[#0f1219] border border-slate-800 rounded-xl text-xs font-semibold text-slate-350 focus:outline-none focus:border-blue-500 min-w-[160px]"
          />

          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="px-3 py-2 bg-[#0f1219] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
          />

          <div className="flex items-center space-x-1 px-3 py-2 bg-[#0f1219] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">KKM:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={kkm}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) {
                  setKkm(0);
                  return;
                }
                if (val > 100) {
                  setWarningMessage("Batas Nilai KKM maksimal adalah 100!");
                  val = 100;
                } else if (val < 0) {
                  setWarningMessage("Batas Nilai KKM minimal adalah 0!");
                  val = 0;
                }
                const newKkm = val;
                setKkm(newKkm);
                // Auto update notes on KKM change
                setNotes(prev => {
                  const updated = { ...prev };
                  students.forEach(s => {
                    const studentGrade = grades[s.nis] ?? 0;
                    const currentNote = updated[s.nis] || '';
                    if (!currentNote || currentNote === 'Remedial' || currentNote === 'Tuntas' || currentNote === 'Belum Tuntas' || currentNote.toLowerCase().includes('remedial') || currentNote.toLowerCase().includes('tuntas') || currentNote.toLowerCase().includes('belum tuntas')) {
                      updated[s.nis] = studentGrade >= newKkm ? 'Tuntas' : 'Remedial';
                    }
                  });
                  return updated;
                });
              }}
              className="w-10 bg-transparent text-xs font-extrabold text-blue-400 text-center focus:outline-none"
            />
          </div>

          <select
            value={selectedClassId || ''}
            onChange={(e) => onClassChange(Number(e.target.value))}
            className="px-3 py-2 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 focus:outline-none"
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
          {/* Active grade panel */}
          <div className="lg:col-span-8 bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-slate-300 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-blue-450" />
                <span className="truncate max-w-[200px] md:max-w-[400px]">Aktivitas: {activityName || '(Ketik judul)'}</span>
              </span>

              <span className="text-3xs font-bold bg-amber-950/40 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                KKM Target: {kkm}
              </span>
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
                {students.map((s) => {
                  const studentGrade = grades[s.nis] ?? 0;
                  const isRemedial = studentGrade < kkm;

                  return (
                    <div
                      key={s.nis}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        isRemedial
                          ? 'border-rose-955 bg-rose-950/10'
                          : 'border-slate-850 bg-[#0f1219]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div 
                          className="min-w-0 cursor-pointer group"
                          onClick={() => (window as any).showStudentProfile?.(s.nis)}
                          title="Klik untuk detail riwayat & nilai siswa"
                        >
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <h5 className="font-bold text-slate-200 text-sm truncate group-hover:text-blue-400 group-hover:underline transition-colors">{s.nama}</h5>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isRemedial
                                ? 'bg-rose-950/40 text-rose-450 border-rose-500/20'
                                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isRemedial ? 'Remedial' : 'Tuntas (Pass)'}
                            </span>
                          </div>
                          <span className="font-mono text-3xs text-slate-500 font-bold mt-0.5 inline-block group-hover:text-blue-400 transition-colors">
                            NIS: {s.nis} &bull; Lihat detail &rarr;
                          </span>
                        </div>

                        {/* Numeric Grade Input - Turns RED and bold if under 75 */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <label className="text-2xs font-bold text-slate-500 mr-1.5 uppercase">Nilai:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={grades[s.nis] ?? ''}
                            onChange={(e) => handleGradeChange(s.nis, e.target.value)}
                            className={`w-14 px-2 py-1.5 rounded-xl border text-center font-bold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isRemedial
                                ? 'border-rose-550/40 text-rose-400 bg-rose-955/20'
                                : 'border-slate-800 text-slate-200 bg-[#161b22]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Catatan / Remarks input */}
                      <input
                        type="text"
                        value={notes[s.nis] || ''}
                        onChange={(e) => handleNoteChange(s.nis, e.target.value)}
                        placeholder="Tambahkan catatan pencapaian siswa..."
                        className="w-full px-3 py-1.5 bg-[#161b22] border border-slate-800 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-slate-705"
                      />
                    </div>
                  );
                })}

                <button
                  onClick={handleSaveGrades}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-500 transition cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sedang Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Simpan &amp; Posting Nilai Kelas</span>
                    </>
                  )}
                </button>

                {saveStatus.message && (
                  <div className={`p-4 rounded-2xl border text-sm flex items-start space-x-2.5 ${
                    saveStatus.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-450'
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

          {/* Right column: activity logs history */}
          <div className="lg:col-span-4 space-y-4">
            <h5 className="font-bold text-slate-300 flex items-center space-x-2">
              <History className="w-4.5 h-4.5 text-slate-500" />
              <span>Daftar Aktivitas Nilai</span>
            </h5>

            {loadingHistory ? (
              <div className="bg-[#161b22] p-12 text-center text-slate-500 rounded-3xl border border-slate-800">
                Tunggu sebentar...
              </div>
            ) : history.length === 0 ? (
              <div className="bg-[#161b22] p-12 text-center text-slate-550 text-xs rounded-3xl border border-dashed border-slate-800">
                Belum ada rincian ulangan tersimpan di kelas ini.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => loadHistoryDetails(record)}
                    className={`bg-[#161b22] p-4.5 rounded-2xl border cursor-pointer hover:border-slate-700 transition-all ${
                      selectedHistorySession?.id === record.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <h6 className="font-bold text-slate-200 text-xs truncate">
                          {record.nama_aktivitas}
                        </h6>
                        <span className="text-[10px] text-slate-500">Tanggal: {formatIndoDate(record.tanggal)}</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-[#0f1219] text-slate-400 rounded-full shrink-0 border border-slate-800">
                        {record.total_siswa} Siswa
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-2xs">
                      <div>
                        <span className="text-slate-500">Rataan: </span>
                        <strong className="text-slate-300 font-mono text-[11px]">{record.rata_rata}</strong>
                        <span className="text-slate-500 ml-2">KKM: </span>
                        <strong className="text-blue-450 font-mono text-[11px]">{record.kkm ?? 75}</strong>
                      </div>

                      {record.count_remedial > 0 ? (
                        <span className="text-rose-450 font-bold flex items-center space-x-1">
                          <span>{record.count_remedial} Remedial</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                          <Check className="w-3 h-3 stroke-[3px]" />
                          <span>Mulus 100%</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#161b22] p-12 text-center rounded-3xl border border-dashed border-slate-800 text-slate-550 text-sm">
          Silakan pilih kelas terlebih dahulu untuk melihat dan menginput nilai.
        </div>
      )}

      {/* Popover Grade Records slide over */}
      {selectedHistorySession && (
        <NilaiHistoryModal 
          selectedHistorySession={selectedHistorySession}
          setSelectedHistorySession={setSelectedHistorySession}
          loadingDetails={loadingDetails}
          historyDetails={historyDetails}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editActivityName={editActivityName}
          setEditActivityName={setEditActivityName}
          editActivityDate={editActivityDate}
          setEditActivityDate={setEditActivityDate}
          editKkm={editKkm}
          setEditKkm={setEditKkm}
          editGrades={editGrades}
          setEditGrades={setEditGrades}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          updating={updating}
          handleUpdateGrades={handleUpdateGrades}
          setWarningMessage={setWarningMessage}
        />
      )}
    </div>
  );
}
