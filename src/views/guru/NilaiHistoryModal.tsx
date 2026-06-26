import React, { useEffect } from 'react';
import { X, Loader2, Save, ArrowLeft } from 'lucide-react';
import { formatIndoDate } from '../../utils';

export default function NilaiHistoryModal(props: any) {
  const { 
    selectedHistorySession, 
    setSelectedHistorySession, 
    loadingDetails, 
    historyDetails, 
    isEditing, 
    setIsEditing, 
    editActivityName, 
    setEditActivityName, 
    editActivityDate, 
    setEditActivityDate, 
    editKkm, 
    setEditKkm, 
    editGrades, 
    setEditGrades, 
    editNotes, 
    setEditNotes, 
    updating, 
    handleUpdateGrades,
    setWarningMessage
  } = props;

  // Maksud Bisnis: Mengontrol scroll-lock pada body document untuk mencegah double-scrolling ketika detail riwayat nilai aktif
  useEffect(() => {
    if (selectedHistorySession) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedHistorySession]);

  return (

        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex justify-end z-[55]">
          <div className="bg-[#161b22] w-full max-w-md h-full shadow-2xl flex flex-col p-6 border-l border-slate-800 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800 mb-4 animate-in">
              <div className="flex-1 min-w-0 pr-2">
                <button
                  onClick={() => {
                    setSelectedHistorySession(null);
                    setIsEditing(false);
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-450 font-bold hover:underline mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Judul Aktivitas</label>
                    <input
                      type="text"
                      value={editActivityName}
                      onChange={(e) => setEditActivityName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0f1219] border border-slate-800 rounded-xl text-sm font-semibold text-slate-205 focus:outline-none focus:border-blue-500"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500">Tanggal</label>
                        <input
                          type="date"
                          value={editActivityDate}
                          onChange={(e) => setEditActivityDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500">Target KKM</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editKkm}
                          onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) {
                              setEditKkm(0);
                              return;
                            }
                            if (val > 100) {
                              setWarningMessage("Batas Nilai KKM maksimal adalah 100!");
                              val = 100;
                            } else if (val < 0) {
                              setWarningMessage("Batas Nilai KKM minimal adalah 0!");
                              val = 0;
                            }
                            setEditKkm(val);
                            // Also update editNotes
                            setEditNotes(prev => {
                              const updated = { ...prev };
                              historyDetails.forEach(det => {
                                const score = editGrades[det.siswa_nis] ?? 0;
                                const currentNote = updated[det.siswa_nis] || '';
                                if (!currentNote || currentNote === 'Remedial' || currentNote === 'Tuntas' || currentNote === 'Belum Tuntas' || currentNote.toLowerCase().includes('remedial') || currentNote.toLowerCase().includes('tuntas') || currentNote.toLowerCase().includes('belum tuntas')) {
                                  updated[det.siswa_nis] = score >= val ? 'Tuntas' : 'Remedial';
                                }
                              });
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-1.5 bg-[#0f1219] border border-slate-800 rounded-xl text-xs font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-lg font-bold text-slate-100 truncate">{selectedHistorySession.nama_aktivitas}</h4>
                    <p className="text-xs text-slate-550 mt-1">Tanggal: {formatIndoDate(selectedHistorySession.tanggal)} | Rata-rata: {selectedHistorySession.rata_rata} | KKM: {selectedHistorySession.kkm ?? 75}</p>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedHistorySession(null);
                  setIsEditing(false);
                }}
                className="text-slate-500 text-sm font-semibold hover:text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
              {loadingDetails ? (
                <div className="py-20 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  <span>Sedang mengambil rincian nilai...</span>
                </div>
              ) : historyDetails.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">Tidak ada data rincian nilai siswa.</div>
              ) : (
                historyDetails.map((det) => {
                  const activityKkm = isEditing ? editKkm : (det.kkm ?? selectedHistorySession.kkm ?? 75);
                  const currentScore = isEditing ? (editGrades[det.siswa_nis] ?? 0) : det.nilai;
                  const isRemedial = currentScore < activityKkm;
                  
                  return (
                    <div
                      key={det.siswa_nis}
                      className={`p-3 rounded-xl border flex flex-col space-y-2.5 ${
                        isRemedial
                          ? 'border-rose-955 bg-rose-950/15'
                          : 'border-slate-805 bg-[#0f1219]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                            <h5 className="font-bold text-slate-200 text-sm truncate">{det.nama}</h5>
                            {isRemedial && (
                              <span className="text-[9px] font-bold bg-rose-950/40 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/10">
                                Remedial
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-3xs text-slate-550 mt-0.5">NIS: {det.siswa_nis}</p>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center space-x-1 shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mr-1">NILAI:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editGrades[det.siswa_nis] ?? ''}
                              onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val)) {
                                  setEditGrades(prev => ({ ...prev, [det.siswa_nis]: 0 }));
                                  return;
                                }
                                if (val > 100) {
                                  setWarningMessage("Nilai edit siswa tidak boleh melebihi 100!");
                                  val = 100;
                                } else if (val < 0) {
                                  setWarningMessage("Nilai edit siswa tidak boleh kurang dari 0!");
                                  val = 0;
                                }
                                const score = val;
                                setEditGrades(prev => ({ ...prev, [det.siswa_nis]: score }));
                                
                                // Auto update editNotes
                                setEditNotes(prev => {
                                  const currentNote = prev[det.siswa_nis] || '';
                                  if (!currentNote || currentNote === 'Remedial' || currentNote === 'Tuntas' || currentNote === 'Belum Tuntas' || currentNote.toLowerCase().includes('remedial') || currentNote.toLowerCase().includes('tuntas') || currentNote.toLowerCase().includes('belum tuntas')) {
                                    return {
                                      ...prev,
                                      [det.siswa_nis]: score >= editKkm ? 'Tuntas' : 'Remedial'
                                    };
                                  }
                                  return prev;
                                });
                              }}
                              className={`w-14 px-1.5 py-1 text-xs rounded-lg text-center font-bold focus:outline-none border ${
                                isRemedial
                                  ? 'border-rose-500 bg-rose-950/40 text-rose-400'
                                  : 'border-slate-800 bg-[#161b22] text-slate-200'
                              }`}
                            />
                          </div>
                        ) : (
                          <span className={`w-11 py-1.5 text-center text-sm font-bold rounded-lg font-mono shrink-0 border ${
                            isRemedial 
                              ? 'text-rose-400 bg-rose-950/30 border-rose-500/10' 
                              : 'text-emerald-400 bg-emerald-950/30 border-emerald-500/10'
                          }`}>
                            {det.nilai}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes[det.siswa_nis] || ''}
                          onChange={(e) => setEditNotes(prev => ({ ...prev, [det.siswa_nis]: e.target.value }))}
                          placeholder="Masukkan catatan baru..."
                          className="w-full px-2.5 py-1.5 bg-[#161b22] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                        />
                      ) : det.catatan ? (
                        <p className="text-2xs text-slate-400 italic font-medium bg-[#161b22] px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
                          "{det.catatan}"
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            {!loadingDetails && historyDetails.length > 0 && (
              <div className="pt-3 border-t border-slate-800 shrink-0">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={updating}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleUpdateGrades}
                      disabled={updating}
                      className="py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Edit Aktivitas &amp; Nilai Siswa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
  );
}
