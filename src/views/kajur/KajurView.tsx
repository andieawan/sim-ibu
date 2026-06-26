import React, { useState, useEffect } from 'react';
import { Kelas, Pengguna } from '../../types';
import { BarChart3, Users, Briefcase } from 'lucide-react';

interface KajurViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
}

export default function KajurView({ currentUser, classes }: KajurViewProps) {
  const [jurusanClasses, setJurusanClasses] = useState<Kelas[]>([]);

  useEffect(() => {
    // Filter classes by this Kajur's jurusan
    if (currentUser.jurusan) {
      setJurusanClasses(classes.filter(c => c.jurusan === currentUser.jurusan));
    }
  }, [classes, currentUser]);

  return (
    <div className="space-y-6">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-6 shadow-xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">Kepala Jurusan {currentUser.jurusan || '???'}</h2>
          <p className="text-sm text-slate-400 mt-1">Monitoring dan Evaluasi Kompetensi Keahlian</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 text-center min-w-[100px]">
            <p className="text-3xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rombel</p>
            <p className="text-2xl font-black text-blue-400">{jurusanClasses.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jurusanClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-[#0f1219]">
            Belum ada kelas yang terdaftar pada jurusan ini.
          </div>
        ) : (
          jurusanClasses.map(c => (
            <div key={c.id} className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-slate-200 text-lg">{c.nama_kelas}</h5>
                    <p className="text-xs text-slate-400 mt-1">Wali: {c.nama_walikelas || '-'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => {
                    // Navigate to class detail or show PKL readiness
                    alert('Fitur rekomendasi PKL akan segera hadir.');
                  }}
                  className="w-full py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tinjau Kelayakan PKL
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
