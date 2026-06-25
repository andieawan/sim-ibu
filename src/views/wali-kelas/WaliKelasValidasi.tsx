import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, History, AlertTriangle, ArrowLeft, Loader2, Save, Edit, RefreshCw, X
} from 'lucide-react';
import { formatIndoDate } from '../../utils';

interface WaliKelasValidasiProps {
  kelasId: number;
}

interface AbsensiHistory {
  id: number;
  tanggal: string;
  is_approved_by_walikelas: number;
  count_hadir: number;
  count_izin: number;
  count_sakit: number;
  count_alfa: number;
  total_siswa: number;
}

interface DetailRec {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at: string;
}

export default function WaliKelasValidasi({ kelasId }: WaliKelasValidasiProps) {
  const getAuthHeader = () => ({ });

  const [history, setHistory] = useState<AbsensiHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AbsensiHistory | null>(null);
  
  const [details, setDetails] = useState<DetailRec[]>([]);
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-history/${kelasId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [kelasId]);

  const handleSelectSession = async (session: AbsensiHistory) => {
    setSelectedSession(session);
    setLoadingDetails(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/absensi-detail/${session.id}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data: DetailRec[] = await res.json();
        setDetails(data);
        const map: Record<string, any> = {};
        data.forEach(d => { map[d.siswa_nis] = d.status; });
        setLocalStatuses(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveValidasi = async () => {
    if (!selectedSession) return;
    setSaving(true);
    setMessage(null);

    const records = details.map(d => ({
      nis: d.siswa_nis,
      status: localStatuses[d.siswa_nis] || 'Hadir'
    }));

    try {
      const res = await fetch('/api/walikelas/absensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          kelas_id: kelasId,
          tanggal: selectedSession.tanggal,
          records
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      setMessage({ type: 'success', text: 'Absensi harian kelas ini berhasil divalidasi dan diubah bila ada pembaruan.' });
      await fetchHistory(); // refresh history
      
      // Update selectedSession locally so UI reflects approval
      setSelectedSession({ ...selectedSession, is_approved_by_walikelas: 1 });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (selectedSession) {
    return (
      <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedSession(null)}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
            <div className="space-y-0.5">
              <h5 className="font-bold text-slate-100 text-sm">Validasi Absensi Kelas</h5>
              <div className="flex items-center gap-2">
                <p className="text-3xs text-slate-500 font-mono">
                  {formatIndoDate(selectedSession.tanggal)}
                </p>
                {selectedSession.is_approved_by_walikelas ? (
                  <span className="text-[9px] px-1.5 py-0.5 uppercase font-bold rounded bg-emerald-950/30 text-emerald-400 border border-emerald-500/10 tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tervalidasi
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 uppercase font-bold rounded bg-amber-950/30 text-amber-500 border border-amber-500/10 tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" /> Menunggu Validasi
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {message && (
          <div className={`p-3 text-xs font-semibold rounded-xl border flex items-start gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-950/20 text-rose-450 border-rose-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{message.text}</span>
            <button className="ml-auto" onClick={() => setMessage(null)}><X className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        {loadingDetails ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
            <p className="mt-3 text-xs text-slate-500 font-mono">Memuat detail presensi...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-medium">
              Sesuaikan absensi jika ada perubahan informasi dari Wali Murid, lalu simpan untuk memvalidasi absensi ini (Data tervalidasi akan tampil di Portal Wali Murid).
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f1219]">
                  <tr className="text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Siswa</th>
                    <th className="py-2.5 px-3 w-48">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {details.map((d, index) => (
                    <tr key={d.siswa_nis} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xs font-mono text-slate-600">{index + 1}</span>
                          <div>
                            <p className="font-bold text-slate-200">{d.nama}</p>
                            <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">NIS: {d.siswa_nis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={localStatuses[d.siswa_nis]}
                          onChange={(e) => setLocalStatuses(prev => ({ ...prev, [d.siswa_nis]: e.target.value as any }))}
                          className={`w-full text-xs font-bold px-2 py-1.5 rounded-lg border focus:outline-none appearance-none cursor-pointer ${
                            localStatuses[d.siswa_nis] === 'Hadir' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                            localStatuses[d.siswa_nis] === 'Izin' ? 'bg-blue-950/20 border-blue-500/20 text-blue-400' :
                            localStatuses[d.siswa_nis] === 'Sakit' ? 'bg-yellow-950/20 border-yellow-500/20 text-yellow-500' :
                            'bg-rose-950/20 border-rose-500/20 text-rose-450'
                          }`}
                        >
                          <option value="Hadir">Hadir</option>
                          <option value="Izin">Izin</option>
                          <option value="Sakit">Sakit</option>
                          <option value="Alfa">Alfa</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSaveValidasi}
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition duration-150 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Validasi & Simpan Perubahan'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
      <div>
        <h5 className="font-bold text-slate-200 text-sm">Riwayat &amp; Validasi Absensi Form</h5>
        <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
          Pilih rekap pertemuan yang telah dibuat oleh guru untuk divalidasi.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="py-10 border border-slate-800 border-dashed rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-medium">Belum ada catatan pertemuan kelas dibuat sama sekali.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {history.map((record) => (
            <div 
              key={record.id}
              onClick={() => handleSelectSession(record)}
              className="p-3 bg-[#0c0f16] border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-300">
                  {formatIndoDate(record.tanggal)}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-2xs text-slate-500 font-mono uppercase tracking-tight">
                  <span className="text-emerald-500">{record.count_hadir} H</span>
                  <span className="text-blue-500">{record.count_izin} I</span>
                  <span className="text-yellow-500">{record.count_sakit} S</span>
                  <span className="text-rose-500">{record.count_alfa} A</span>
                </div>
              </div>
              
              <div>
                {record.is_approved_by_walikelas ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-950/40 text-amber-500 border border-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
