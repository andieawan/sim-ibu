import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, 
  Clock, RefreshCw, HeartPulse, ShieldCheck, ArrowLeft, Loader2
} from 'lucide-react';
import { Pengguna } from '../../types';
import { formatIndoDate } from '../../utils';

interface WaliMuridViewProps {
  currentUser: Pengguna;
  theme?: 'light' | 'dark';
}

interface ClassData {
  classInfo: {
    id: number;
    nama_kelas: string;
    sekolah: string;
    nama_walikelas?: string | null;
    total_siswa: number;
  };
  attendance: Array<{
    id: number;
    tanggal: string;
    count_hadir: number;
    count_izin: number;
    count_sakit: number;
    count_alfa: number;
  }>;
}

export default function WaliMuridView({ currentUser, theme = 'dark' }: WaliMuridViewProps) {
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAbsensiId, setSelectedAbsensiId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Array<any>>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const fetchMonitoringData = async () => {
    if (!currentUser.kelas_id) {
      setError('Akun Anda belum terhubung dengan kelas mana pun. Hubungi Administrator Sekolah.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wali-murid/monitoring/${currentUser.kelas_id}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`
        }
      });
      if (!res.ok) {
        throw new Error('Gagal memuat data monitoring kelas anak Anda.');
      }
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [currentUser.kelas_id]);

  const handleSessionClick = async (absensiId: number) => {
    setSelectedAbsensiId(absensiId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/absensi-detail/${absensiId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`
        }
      });
      if (res.ok) {
        const jsonData = await res.json();
        setSessionDetails(jsonData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Sedang memuat informasi data kelas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-8 bg-slate-900 border border-slate-850 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-950/40 text-rose-500 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-100">Informasi Monitoring</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || 'Data kelas tidak ditemukan.'}
        </p>
        <button 
          onClick={fetchMonitoringData}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center mx-auto gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>
    );
  }

  const { classInfo, attendance } = data;
  const totalAbsen = attendance.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-0">
      <div className="relative p-6 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b]/50 to-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="md:flex md:items-center md:justify-between relative z-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xs font-extrabold uppercase bg-emerald-950/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15 tracking-wider">
                  Real-Time Validasi
                </span>
                <span className="text-2xs font-extrabold uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded tracking-wider">
                  Portal Orang Tua
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Kelas: {classInfo.nama_kelas}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                <p>Total Siswa: <strong className="text-indigo-300">{classInfo.total_siswa} Orang</strong></p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 p-4 bg-slate-900/60 border border-slate-800 rounded-xl max-w-xs md:text-right">
            <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Wali Kelas Pengajar</p>
            <p className="text-xs font-bold text-slate-200 mt-1">{classInfo.nama_walikelas || 'Belum Ditentukan'}</p>
            <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">{classInfo.sekolah}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-5 bg-[#0a0d14] border border-slate-800 rounded-2xl space-y-4">
        <div className="border-b border-slate-850 pb-3 flex items-center justify-between sticky top-0 bg-[#0a0d14] z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold uppercase text-slate-350 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Log Rekapitulasi Kehadiran Kelas (Divalidasi Wali Kelas)</span>
            </h3>
          </div>
          <span className="text-2xs font-bold text-slate-500">{totalAbsen} Catatan Log</span>
        </div>

        {attendance.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Clock className="w-8 h-8 mb-3 opacity-20" />
            <p>Belum ada data absensi yang divalidasi oleh Wali Kelas pada semester ini.</p>
          </div>
        ) : selectedAbsensiId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <button 
                onClick={() => setSelectedAbsensiId(null)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </button>
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-200 tracking-wider">
                  Detail Kehadiran Kelas
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {formatIndoDate(attendance.find(a => a.id === selectedAbsensiId)?.tanggal || '')}
                </p>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-xs mt-3 text-slate-500 font-mono">Memuat detail siswa...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f1219]">
                    <tr className="text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3">Siswa</th>
                      <th className="py-2.5 px-3 w-32 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {sessionDetails.map((d, index) => (
                      <tr key={d.id} className="hover:bg-slate-900/40">
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
                          <div className={`px-2 py-1 rounded-lg text-center font-bold text-[10px] uppercase tracking-wider ${
                            d.status === 'Hadir' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' :
                            d.status === 'Izin' ? 'bg-blue-950/20 text-blue-400 border border-blue-500/20' :
                            d.status === 'Sakit' ? 'bg-yellow-950/20 text-yellow-500 border border-yellow-500/20' :
                            'bg-rose-950/20 text-rose-450 border border-rose-500/20'
                          }`}>
                            {d.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {attendance.map((att) => (
              <div 
                key={att.id} 
                onClick={() => handleSessionClick(att.id)}
                className="p-4 bg-[#0c0f16] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-700 cursor-pointer hover:bg-[#11141d]"
              >
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase">Tanggal Presensi / Pertemuan</p>
                  <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    {formatIndoDate(att.tanggal)}
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 rounded uppercase tracking-wider font-bold">Valid</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 bg-emerald-950/20 border border-emerald-500/10 rounded-lg text-center min-w-[60px]">
                    <p className="text-lg font-bold text-emerald-400 leading-none">{att.count_hadir}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Hadir</p>
                  </div>
                  <div className="px-3 py-2 bg-blue-950/20 border border-blue-500/10 rounded-lg text-center min-w-[60px]">
                    <p className="text-lg font-bold text-blue-400 leading-none">{att.count_izin}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Izin</p>
                  </div>
                  <div className="px-3 py-2 bg-yellow-950/20 border border-yellow-500/10 rounded-lg text-center min-w-[60px]">
                    <p className="text-lg font-bold text-yellow-500 leading-none">{att.count_sakit}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Sakit</p>
                  </div>
                  <div className="px-3 py-2 bg-rose-950/20 border border-rose-500/10 rounded-lg text-center min-w-[60px]">
                    <p className="text-lg font-bold text-rose-450 leading-none">{att.count_alfa}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Alfa</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
