import React, { useState, useEffect } from 'react';
import { CatatanWaliKelas, Pengguna, Siswa } from '../../types';
import { UserCheck, Award, AlertTriangle, Search, FileText, Plus, Save, Trash, BookOpen } from 'lucide-react';
import BkSurat from './BkSurat';

// ============================================================================
// KOMPONEN: BkView
// Maksud Bisnis: Menyediakan antarmuka dashboard terpadu bagi Guru Bimbingan Konseling (BK).
//                Membantu memantau catatan kasus siswa dari Wali Kelas, membuat catatan bimbingan baru,
//                serta mengelola penerbitan Surat Pemanggilan, Teguran, dan Peringatan.
// Aliran Data:
//   - Input: Props 'currentUser' (data pengguna BK yang sedang aktif)
//   - Proses: 
//       - Memuat data catatan/laporan siswa secara global dari server.
//       - Memuat seluruh data siswa untuk keperluan form pembuatan catatan baru.
//       - Mengirimkan data catatan bimbingan baru ke server.
//       - Mengizinkan penghapusan catatan bimbingan yang relevan.
//   - Output: Dashboard navigasi tab ("Monitoring Laporan" dan "Surat Pemanggilan & Peringatan")
// ============================================================================

interface BkViewProps {
  currentUser: Pengguna;
}

export default function BkView({ currentUser }: BkViewProps) {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'surat'>('monitoring');
  const [catatan, setCatatan] = useState<CatatanWaliKelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // State untuk form tambah catatan baru oleh Guru BK
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatatan, setNewCatatan] = useState({
    siswa_nis: '',
    kategori: 'Konseling', // Default ke Konseling untuk BK
    catatan: ''
  });

  // Memuat data catatan bimbingan dan daftar siswa
  const fetchData = async () => {
    setLoading(true);
    try {
      // Mengambil seluruh catatan bimbingan/kasus siswa
      const resCatatan = await fetch('/api/catatan_walikelas');
      if (resCatatan.ok) {
        const data = await resCatatan.json();
        setCatatan(data);
      }

      // Mengambil daftar seluruh siswa untuk keperluan dropdown form BK
      const resSiswa = await fetch('/api/siswa-all');
      if (resSiswa.ok) {
        const data = await resSiswa.json();
        setSiswaList(data);
      }
    } catch (e) {
      console.error('Gagal memuat data di panel BK:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchData();
    }
  }, [activeTab]);

  // Handler pengiriman catatan baru dari Guru BK
  const handleSubmitCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.siswa_nis || !newCatatan.catatan) {
      alert('Mohon lengkapi semua bidang form.');
      return;
    }

    // Temukan data siswa terpilih untuk memperoleh kelas_id miliknya
    const selectedSiswa = siswaList.find(s => s.nis === newCatatan.siswa_nis);
    if (!selectedSiswa) {
      alert('Siswa tidak valid.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/catatan_walikelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa_nis: newCatatan.siswa_nis,
          kelas_id: selectedSiswa.kelas_id,
          guru_id: currentUser.id,
          kategori: newCatatan.kategori,
          catatan: newCatatan.catatan
        })
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewCatatan({ siswa_nis: '', kategori: 'Konseling', catatan: '' });
        fetchData();
      } else {
        alert('Gagal menyimpan catatan baru.');
      }
    } catch (error) {
      console.error('Error saat menyimpan catatan:', error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Handler penghapusan catatan bimbingan
  const handleDeleteCatatan = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan bimbingan ini?')) return;
    try {
      const res = await fetch(`/api/catatan_walikelas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal menghapus catatan bimbingan.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCatatan = catatan.filter(c => 
    filterKategori === 'Semua' ? true : c.kategori === filterKategori
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigasi Menu BK */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'monitoring' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Monitoring Laporan & Catatan</span>
        </button>
        <button
          onClick={() => setActiveTab('surat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'surat' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Surat Pemanggilan & Peringatan</span>
        </button>
      </div>

      {/* Konten Tab Monitoring Laporan & Catatan */}
      {activeTab === 'monitoring' && (
        <>
          {/* Dashboard Statistik Cepat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Total Kasus Indisipliner</p>
                <p className="text-3xl font-black text-rose-400">{catatan.filter(c => c.kategori === 'Indisipliner').length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Total Sesi Konseling</p>
                <p className="text-3xl font-black text-blue-400">{catatan.filter(c => c.kategori === 'Konseling').length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Total Siswa Berprestasi</p>
                <p className="text-3xl font-black text-emerald-400">{catatan.filter(c => c.kategori === 'Prestasi').length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Form Tambah Catatan Khusus oleh Guru BK */}
          {showAddForm && (
            <form onSubmit={handleSubmitCatatan} className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h6 className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-800 pb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Buat Catatan Kasus / Bimbingan Konseling Baru</span>
              </h6>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Siswa Terkait</label>
                  <select
                    required
                    value={newCatatan.siswa_nis}
                    onChange={e => setNewCatatan({ ...newCatatan, siswa_nis: e.target.value })}
                    className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {siswaList.map(s => (
                      <option key={s.nis} value={s.nis}>{s.nama} ({s.nis})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori Kasus / Bimbingan</label>
                  <select
                    required
                    value={newCatatan.kategori}
                    onChange={e => setNewCatatan({ ...newCatatan, kategori: e.target.value })}
                    className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="Konseling">Konseling (Bimbingan)</option>
                    <option value="Indisipliner">Indisipliner (Kasus Pelanggaran)</option>
                    <option value="Prestasi">Prestasi (Laporan Khusus)</option>
                    <option value="Umum">Umum (Catatan Eksternal/Lainnya)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Isi Laporan / Catatan BK</label>
                <textarea
                  required
                  rows={4}
                  value={newCatatan.catatan}
                  onChange={e => setNewCatatan({ ...newCatatan, catatan: e.target.value })}
                  className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  placeholder="Deskripsikan kasus siswa secara lengkap, laporan dari guru lain, atau kejadian luar sekolah yang bersangkutan..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
                      <span>Simpan Catatan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* List/Daftar Catatan & Laporan Siswa */}
          <div className="bg-[#161b22] rounded-3xl border border-slate-800 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h5 className="font-bold text-slate-200 text-sm">Monitoring & Jurnal Bimbingan Siswa</h5>
                <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono">Laporan Wali Kelas & Guru BK</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <select 
                  value={filterKategori}
                  onChange={e => setFilterKategori(e.target.value)}
                  className="bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Indisipliner">Indisipliner</option>
                  <option value="Konseling">Konseling</option>
                  <option value="Prestasi">Prestasi</option>
                  <option value="Umum">Umum</option>
                </select>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5px]" />
                  <span>Tambah Catatan</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Memuat data...</div>
            ) : filteredCatatan.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Belum ada data laporan bimbingan atau kasus yang tercatat.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatatan.map(c => (
                  <div key={c.id} className="bg-[#0f1219] p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h6 className="font-bold text-slate-200 text-sm hover:text-blue-400 transition" onClick={() => (window as any).showStudentProfile?.(c.siswa_nis)} style={{cursor: 'pointer'}}>{c.nama_siswa}</h6>
                          <p className="text-3xs text-slate-500 font-mono mt-0.5">Dilaporkan oleh: {c.nama_guru}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded border ${
                            c.kategori === 'Prestasi' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            c.kategori === 'Indisipliner' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            c.kategori === 'Konseling' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                          {c.kategori}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{c.catatan}</p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-500">{new Date(c.tanggal).toLocaleDateString('id-ID')}</span>
                      
                      {/* Izinkan Guru BK menghapus catatan yang dibuatnya sendiri atau semua jika admin/BK berkuasa */}
                      {(c.guru_id === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'bk') && (
                        <button
                          onClick={() => handleDeleteCatatan(c.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus Catatan Laporan"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'surat' && (
        <BkSurat currentUser={currentUser} />
      )}
    </div>
  );
}

// === AKHIR DARI LOGIKA KOMPONEN BK VIEW ===

