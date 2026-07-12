// ============================================================================
// Nama File : NilaiView.tsx
// Lokasi    : /src/views/guru/NilaiView.tsx
// Peran     : Halaman manajemen nilai dan KKM guru. Memungkinkan guru membuat aktivitas 
//             penilaian, memberikan nilai, mengatur batas KKM, dan melihat riwayat nilai.
// Dependency: react, lucide-react, formatIndoDate, useDialog, types
// ============================================================================

import { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldAlert, History, ArrowLeft, Loader2, Save, Sparkles, BookOpen, Check } from 'lucide-react';
import { Kelas, Siswa } from '../../types';
import NilaiHistoryModal from './NilaiHistoryModal';
import { formatIndoDate } from '../../utils';
import { useDialog } from '../../components/DialogProvider';
import { NilaiViewProps, NilaiHistoryRecord, NilaiDetailRecord } from './types';
import { useGuruNilai } from './hooks/useGuruNilai';

export default function NilaiView({
  classes,
  loadingClasses,
  selectedClassId,
  onClassChange,
}: NilaiViewProps) {
  const { showAlert } = useDialog();
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light');

  const [activityName, setActivityName] = useState<string>('Ulangan Harian 1');
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [kkm, setKkm] = useState<number>(75);

  const {
    students,
    loadingStudents,
    grades,
    setGrades,
    notes,
    setNotes,
    history,
    loadingHistory,
    selectedHistorySession,
    setSelectedHistorySession,
    historyDetails,
    loadingDetails,
    saving,
    updating,
    saveStatus,
    setSaveStatus,
    loadStudents,
    loadHistory,
    handleSaveGrades,
    loadHistoryDetails,
    handleUpdateGrades
  } = useGuruNilai(selectedClassId, kkm);

  // History editing states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editActivityName, setEditActivityName] = useState<string>('');
  const [editActivityDate, setEditActivityDate] = useState<string>('');
  const [editKkm, setEditKkm] = useState<number>(75);
  const [editGrades, setEditGrades] = useState<Record<string, number>>({});
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
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
  }, [selectedClassId, loadStudents, loadHistory, setSelectedHistorySession]);

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

  const onHistoryDetailSelected = (session: NilaiHistoryRecord) => {
    loadHistoryDetails(session, (sess, details) => {
      setEditActivityName(sess.nama_aktivitas);
      setEditActivityDate(sess.tanggal);
      setEditKkm(sess.kkm ?? 75);
      
      const tempGrades: Record<string, number> = {};
      const tempNotes: Record<string, string> = {};
      details.forEach((det: NilaiDetailRecord) => {
        tempGrades[det.siswa_nis] = det.nilai;
        tempNotes[det.siswa_nis] = det.catatan || '';
      });
      setEditGrades(tempGrades);
      setEditNotes(tempNotes);
    });
  };

  const onUpdateGradesClick = () => {
    if (!editActivityName.trim()) {
      showAlert("Nama aktivitas wajib diisi!", "Validasi Form", "warning");
      return;
    }
    handleUpdateGrades(
      editActivityName,
      editActivityDate,
      editKkm,
      editGrades,
      editNotes,
      () => setIsEditing(false),
      (msg) => showAlert(msg, "Kesalahan Simpan", "danger")
    );
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
                  onClick={() => handleSaveGrades(activityName, activityDate)}
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
                    onClick={() => onHistoryDetailSelected(record)}
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
          handleUpdateGrades={onUpdateGradesClick}
          setWarningMessage={setWarningMessage}
        />
      )}
    </div>
  );
}
