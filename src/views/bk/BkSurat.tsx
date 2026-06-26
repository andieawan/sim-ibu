import React, { useState, useEffect } from 'react';
import { SuratBk, Pengguna, Siswa } from '../../types';
import { Plus, Save, FileText, Trash, Printer } from 'lucide-react';

interface BkSuratProps {
  currentUser: Pengguna;
}

export default function BkSurat({ currentUser }: BkSuratProps) {
  const [suratList, setSuratList] = useState<SuratBk[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newSurat, setNewSurat] = useState({
    siswa_nis: '',
    jenis_surat: 'Pemanggilan',
    keterangan: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students for dropdown
      const resSiswa = await fetch('/api/siswa-all');
      if (resSiswa.ok) {
        const data = await resSiswa.json();
        setSiswaList(data);
      }
      
      // Fetch surat
      const resSurat = await fetch('/api/surat_bk');
      if (resSurat.ok) {
        const data = await resSurat.json();
        setSuratList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurat.siswa_nis || !newSurat.jenis_surat || !newSurat.keterangan) return;
    
    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/surat_bk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSurat,
          guru_id: currentUser.id
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewSurat({ siswa_nis: '', jenis_surat: 'Pemanggilan', keterangan: '' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus surat ini?')) return;
    try {
      const res = await fetch(`/api/surat_bk/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const printSurat = (surat: SuratBk) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Surat - ${surat.jenis_surat}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .title { font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; text-decoration: underline; text-transform: uppercase; }
              .content { margin-bottom: 40px; }
              .footer { display: flex; justify-content: flex-end; margin-top: 50px; }
              .signature { text-align: center; width: 250px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>SMK IBU</h2>
              <p>Jl. Pendidikan No. 1, Kota Pelajar</p>
            </div>
            <div class="title">SURAT ${surat.jenis_surat}</div>
            <div class="content">
              <p>Diberitahukan kepada siswa/i:</p>
              <table>
                <tr><td width="100">Nama</td><td>: ${surat.nama_siswa}</td></tr>
                <tr><td>NIS</td><td>: ${surat.siswa_nis}</td></tr>
              </table>
              <p>Agar dapat menemui Guru Bimbingan Konseling pada jam kerja untuk menindaklanjuti hal berikut:</p>
              <p><strong>Keterangan:</strong><br/>${surat.keterangan}</p>
              <p>Demikian surat ini disampaikan agar dapat menjadi perhatian.</p>
            </div>
            <div class="footer">
              <div class="signature">
                <p>Mengetahui,</p>
                <br/><br/><br/>
                <p><strong>${surat.nama_guru}</strong><br/>Guru BK</p>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#161b22] p-5 rounded-2xl border border-slate-800">
        <div>
          <h5 className="font-bold text-slate-200 text-sm">Manajemen Surat BK</h5>
          <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">Pemanggilan & Peringatan Siswa</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>Buat Surat</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h6 className="font-bold text-slate-200 text-sm mb-4 border-b border-slate-800 pb-3">Form Pembuatan Surat</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pilih Siswa</label>
              <select
                required
                value={newSurat.siswa_nis}
                onChange={e => setNewSurat({ ...newSurat, siswa_nis: e.target.value })}
                className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(s => (
                  <option key={s.nis} value={s.nis}>{s.nama} ({s.nis})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Jenis Surat</label>
              <select
                required
                value={newSurat.jenis_surat}
                onChange={e => setNewSurat({ ...newSurat, jenis_surat: e.target.value })}
                className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="Pemanggilan">Surat Pemanggilan</option>
                <option value="Teguran">Surat Teguran</option>
                <option value="Peringatan 1">Surat Peringatan 1 (SP1)</option>
                <option value="Peringatan 2">Surat Peringatan 2 (SP2)</option>
                <option value="Peringatan 3">Surat Peringatan 3 (SP3)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Keterangan / Alasan</label>
            <textarea
              required
              rows={3}
              value={newSurat.keterangan}
              onChange={e => setNewSurat({ ...newSurat, keterangan: e.target.value })}
              className="w-full bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              placeholder="Contoh: Terlambat 3 hari berturut-turut..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  <span>Simpan & Buat</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {loading && !suratList.length ? (
        <div className="py-12 text-center text-slate-500 text-xs">Memuat data surat...</div>
      ) : suratList.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-[#161b22]">
          Belum ada riwayat surat BK yang dibuat.
        </div>
      ) : (
        <div className="bg-[#161b22] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1219] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Siswa</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Jenis Surat</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Keterangan</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {suratList.map((s) => (
                  <tr key={s.id} className="hover:bg-[#0f1219] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-mono text-[10px]">
                      {new Date(s.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-200">{s.nama_siswa}</p>
                      <p className="text-3xs text-slate-500 font-mono mt-0.5">{s.siswa_nis}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${
                        s.jenis_surat.includes('Peringatan') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        s.jenis_surat === 'Teguran' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {s.jenis_surat}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 min-w-[200px]">
                      <p className="line-clamp-2" title={s.keterangan}>{s.keterangan}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => printSurat(s)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                        title="Cetak Surat"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                        title="Hapus Surat"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
