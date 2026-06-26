import React, { useState, useEffect } from 'react';
import { Kelas, Pengguna } from '../../types';
import { Users, BookOpen, AlertTriangle, Briefcase, Award } from 'lucide-react';

interface KepsekViewProps {
  classes: Kelas[];
  currentUser: Pengguna;
}

export default function KepsekView({ classes, currentUser }: KepsekViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?guru_id=${currentUser.id}&role=${currentUser.role}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Memuat Laporan Eksekutif...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/40 to-[#161b22] border border-blue-900/30 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-black text-white">Laporan Eksekutif Kepala Sekolah</h2>
        <p className="text-sm text-blue-200/60 mt-1">Ringkasan operasional dan akademik sekolah.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 mx-auto bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-100">{stats?.total_siswa || 0}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Siswa</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 mx-auto bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-100">{classes.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Kelas</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 mx-auto bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-100">{stats?.total_kelas || 0}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Guru Aktif</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 text-center">
          <div className="w-10 h-10 mx-auto bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-slate-100">Baik</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Status Akademik</p>
        </div>
      </div>

      <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800">
        <h3 className="font-bold text-slate-200 text-sm mb-4">Distribusi Siswa per Kelas</h3>
        <div className="space-y-3">
          {stats?.classes_breakdown?.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-[#0f1219] rounded-xl border border-slate-800">
              <span className="font-bold text-xs text-slate-300">{c.nama_kelas}</span>
              <div className="flex gap-4">
                <span className="text-xs text-slate-400">{c.total_siswa} Siswa</span>
                <span className={`text-xs font-bold ${c.average_kehadiran >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  Presensi {c.average_kehadiran}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
