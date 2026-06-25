import React, { useState } from 'react';
import { X, Layers, UserPlus, Info } from 'lucide-react';
import { Kelas } from '../types';

interface ModalsProps {
  classes: Kelas[];
  showAddKelas: boolean;
  showAddSiswa: boolean;
  onClose: () => void;
  onSuccessAddKelas: () => void;
  onSuccessAddSiswa: () => void;
}

export default function Modals({
  classes,
  showAddKelas,
  showAddSiswa,
  onClose,
  onSuccessAddKelas,
  onSuccessAddSiswa,
}: ModalsProps) {
  // Add Kelas State
  const [kelasName, setKelasName] = useState<string>('');
  const [sekolahName, setSekolahName] = useState<string>('SMKS Islam Bustanul Ulum');
  const [loadingKelas, setLoadingKelas] = useState<boolean>(false);
  const [errKelas, setErrKelas] = useState<string>('');

  // Add Siswa State
  const [siswaNis, setSiswaNis] = useState<string>('');
  const [siswaNama, setSiswaNama] = useState<string>('');
  const [siswaJk, setSiswaJk] = useState<'L' | 'P'>('L');
  const [siswaKelasId, setSiswaKelasId] = useState<string>('');
  const [loadingSiswa, setLoadingSiswa] = useState<boolean>(false);
  const [errSiswa, setErrSiswa] = useState<string>('');

  const handleAddKelasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasName.trim()) {
      setErrKelas('Nama kelas wajib diisi');
      return;
    }
    setLoadingKelas(true);
    setErrKelas('');
    try {
      const resp = await fetch('/api/kelas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama_kelas: kelasName.trim(),
          sekolah: sekolahName.trim() || 'SMKS Islam Bustanul Ulum',
        }),
      });

      if (resp.ok) {
        setKelasName('');
        onSuccessAddKelas();
      } else {
        const errorData = await resp.json();
        setErrKelas(errorData.error || 'Gagal menambahkan kelas');
      }
    } catch (err: any) {
      setErrKelas(err.message);
    } finally {
      setLoadingKelas(false);
    }
  };

  const handleAddSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaNis.trim() || !siswaNama.trim() || !siswaKelasId) {
      setErrSiswa('Semua kolom data siswa wajib diisi');
      return;
    }
    setLoadingSiswa(true);
    setErrSiswa('');
    try {
      const resp = await fetch('/api/siswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nis: siswaNis.trim(),
          nama: siswaNama.trim(),
          jenis_kelamin: siswaJk,
          kelas_id: Number(siswaKelasId),
        }),
      });

      if (resp.ok) {
        setSiswaNis('');
        setSiswaNama('');
        setSiswaJk('L');
        onSuccessAddSiswa();
      } else {
        const errorData = await resp.json();
        setErrSiswa(errorData.error || 'Gagal menyimpan data siswa');
      }
    } catch (err: any) {
      setErrSiswa(err.message);
    } finally {
      setLoadingSiswa(false);
    }
  };

  if (!showAddKelas && !showAddSiswa) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
      
      {showAddKelas && (
        <div className="bg-[#161b22] rounded-3xl w-full max-w-sm overflow-hidden border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-[#111622] px-5 py-4 text-slate-100 flex justify-between items-center border-b border-slate-800">
            <h4 className="font-extrabold flex items-center space-x-2 text-xs uppercase tracking-wider text-slate-200 font-mono">
              <Layers className="w-4 h-4 text-blue-450" />
              <span>Tambah Kelas Baru</span>
            </h4>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition cursor-pointer">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            </button>
          </div>

          <form onSubmit={handleAddKelasSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Nama Kelas</label>
              <input
                type="text"
                value={kelasName}
                onChange={(e) => setKelasName(e.target.value)}
                placeholder="Contoh: XI DKV 1"
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Instansi Sekolah</label>
              <input
                type="text"
                value={sekolahName}
                onChange={(e) => setSekolahName(e.target.value)}
                placeholder="Contoh: SMK Ibu"
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
              />
            </div>

            {errKelas && (
              <span className="text-xs font-bold text-rose-400 block">{errKelas}</span>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-center border border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800/40 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingKelas || !kelasName.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingKelas ? 'Menyimpan...' : 'Simpan Kelas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddSiswa && (
        <div className="bg-[#161b22] rounded-3xl w-full max-w-sm overflow-hidden border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-[#111622] px-5 py-4 text-slate-100 flex justify-between items-center border-b border-slate-800">
            <h4 className="font-extrabold flex items-center space-x-2 text-xs uppercase tracking-wider text-slate-200 font-mono">
              <UserPlus className="w-4 h-4 text-blue-450" />
              <span>Tambah Siswa Baru</span>
            </h4>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition cursor-pointer">
              <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            </button>
          </div>

          <form onSubmit={handleAddSiswaSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Nomor Induk Siswa (NIS)</label>
              <input
                type="text"
                value={siswaNis}
                onChange={(e) => setSiswaNis(e.target.value)}
                placeholder="Contoh: 1025"
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-mono font-semibold text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={siswaNama}
                onChange={(e) => setSiswaNama(e.target.value)}
                placeholder="Contoh: Muhammad Farhan"
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Jenis Kelamin</label>
              <div className="flex bg-[#0f1219] border border-slate-800 p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setSiswaJk('L')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    siswaJk === 'L' ? 'bg-[#161b22] border border-blue-500/30 text-blue-400 shadow-md' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  L (Laki-laki)
                </button>
                <button
                  type="button"
                  onClick={() => setSiswaJk('P')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    siswaJk === 'P' ? 'bg-[#161b22] border border-pink-500/30 text-pink-400 shadow-md' : 'text-slate-500 hover:text-slate-355'
                  }`}
                >
                  P (Perempuan)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">Kelas Penempatan</label>
              <select
                value={siswaKelasId}
                onChange={(e) => setSiswaKelasId(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-300"
              >
                <option value="" className="bg-[#161b22] text-slate-400">-- Hubungkan Kelas --</option>
                {classes.map((k) => (
                  <option key={k.id} value={k.id} className="bg-[#161b22] text-slate-200">
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            {errSiswa && (
              <span className="text-xs font-bold text-rose-455 block">{errSiswa}</span>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-center border border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800/40 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingSiswa || !siswaNis.trim() || !siswaNama.trim() || !siswaKelasId}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loadingSiswa ? 'Menyimpan...' : 'Simpan Siswa'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
