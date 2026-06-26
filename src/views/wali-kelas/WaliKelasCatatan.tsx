import React, { useState, useEffect } from 'react';
import { CatatanWaliKelas, Pengguna, Siswa } from '../../types';
import { Save, Plus, AlertTriangle, BookOpen, Trash } from 'lucide-react';

// ============================================================================
// KOMPONEN: WaliKelasCatatan
// Maksud Bisnis: Mengelola buku catatan & bimbingan khusus siswa oleh Wali Kelas.
// Aliran Data:
//   - Input: Props 'currentUser' (Pengguna login) dan 'kelasId' (ID kelas binaan)
//   - Proses: Mengambil daftar siswa per kelas dan menyimpan catatan bimbingan baru ke DB
//   - Output: Form interaktif untuk pembuatan catatan dan visualisasi daftar kartu catatan harian
// ============================================================================

interface WaliKelasCatatanProps {
  currentUser: Pengguna;
  kelasId: number;
}

export default function WaliKelasCatatan({ currentUser, kelasId }: WaliKelasCatatanProps) {
  const [catatanList, setCatatanList] = useState<CatatanWaliKelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatatan, setNewCatatan] = useState({
    siswa_nis: '',
    kategori: 'Umum',
    catatan: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students for dropdown
      const resSiswa = await fetch(`/api/kelas/${kelasId}/siswa`);
      if (resSiswa.ok) {
        const data = await resSiswa.json();
        setSiswaList(data);
      }
      
      // Fetch catatan
      const resCatatan = await fetch(`/api/catatan_walikelas?kelas_id=${kelasId}`);
      if (resCatatan.ok) {
        const data = await resCatatan.json();
        setCatatanList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kelasId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.siswa_nis || !newCatatan.catatan) return;
    
    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/catatan_walikelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCatatan,
          kelas_id: kelasId,
          guru_id: currentUser.id
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewCatatan({ siswa_nis: '', kategori: 'Umum', catatan: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      const res = await fetch(`/api/catatan_walikelas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !catatanList.length) {
    return <div className="text-center p-5 text-slate-500">Memuat catatan...</div>;
  }

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h5 className="font-bold text-slate-200 text-sm">Catatan Wali Kelas</h5>
          <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Buku Kasus & Bimbingan Khusus</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>Buat Catatan</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#0f1219] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Siswa</label>
              <select
                required
                value={newCatatan.siswa_nis}
                onChange={e => setNewCatatan({ ...newCatatan, siswa_nis: e.target.value })}
                className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => (
                  <option key={s.nis} value={s.nis}>{s.nama} ({s.nis})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
              <select
                required
                value={newCatatan.kategori}
                onChange={e => setNewCatatan({ ...newCatatan, kategori: e.target.value })}
                className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="Umum">Umum</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Indisipliner">Indisipliner (Kasus)</option>
                <option value="Konseling">Konseling</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Isi Catatan</label>
            <textarea
              required
              rows={3}
              value={newCatatan.catatan}
              onChange={e => setNewCatatan({ ...newCatatan, catatan: e.target.value })}
              className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              placeholder="Deskripsi bimbingan / kasus / prestasi siswa..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loadingSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSubmit ? 'Menyimpan...' : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5px]" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {catatanList.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0f1219]">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-bold">Belum ada catatan wali kelas</p>
          <p className="text-slate-500 text-[10px] mt-1">Silakan tambahkan catatan baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catatanList.map((c) => (
            <div key={c.id} className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-0.5">
                  <h6 className="font-bold text-slate-200 text-xs">{c.nama_siswa}</h6>
                  <div className="flex gap-2 items-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none border ${
                      c.kategori === 'Prestasi' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      c.kategori === 'Indisipliner' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      c.kategori === 'Konseling' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {c.kategori}
                    </span>
                    <span className="text-[9px] text-slate-500">{new Date(c.tanggal).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Hapus Catatan"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3 whitespace-pre-wrap">{c.catatan}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === AKHIR DARI LOGIKA KOMPONEN CATATAN WALI KELAS ===
