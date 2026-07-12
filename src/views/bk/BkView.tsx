import React, { useState, useEffect } from 'react';
import { CatatanWaliKelas, Pengguna, Siswa } from '../../types';
import { UserCheck, Award, AlertTriangle, Search, FileText, Plus, Save, Trash, BookOpen, BarChart2, Download, TrendingUp, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import BkSurat from './BkSurat';
import { useDialog } from '../../components/DialogProvider';

// ============================================================================
// KOMPONEN: BkView
// Maksud Bisnis: Menyediakan antarmuka dashboard terpadu bagi Guru Bimbingan Konseling (BK).
//                Membantu memantau catatan kasus siswa dari Wali Kelas, membuat catatan bimbingan baru,
//                serta mengelola penerbitan Surat Pemanggilan, Teguran, dan Peringatan.
// ============================================================================

interface BkViewProps {
  currentUser: Pengguna;
}

export default function BkView({ currentUser }: BkViewProps) {
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<'rekap' | 'monitoring' | 'surat'>('rekap');
  const [catatan, setCatatan] = useState<CatatanWaliKelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [suratList, setSuratList] = useState<any[]>([]);
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

      // Mengambil daftar seluruh kelas
      const resKelas = await fetch('/api/kelas');
      if (resKelas.ok) {
        const data = await resKelas.json();
        setKelasList(data);
      }

      // Mengambil data surat BK
      const resSurat = await fetch('/api/surat_bk');
      if (resSurat.ok) {
        const data = await resSurat.json();
        setSuratList(data);
      }
    } catch (e) {
      console.error('Gagal memuat data di panel BK:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handler pengiriman catatan baru dari Guru BK
  const handleSubmitCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.siswa_nis || !newCatatan.catatan) {
      showAlert('Mohon lengkapi semua bidang form.', 'Formulir Belum Lengkap', 'warning');
      return;
    }

    // Temukan data siswa terpilih untuk memperoleh kelas_id miliknya
    const selectedSiswa = siswaList.find(s => s.nis === newCatatan.siswa_nis);
    if (!selectedSiswa) {
      showAlert('Siswa tidak valid.', 'Siswa Tidak Valid', 'danger');
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
        showAlert('Gagal menyimpan catatan baru.', 'Kesalahan Simpan', 'danger');
      }
    } catch (error) {
      console.error('Error saat menyimpan catatan:', error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Handler penghapusan catatan bimbingan
  const handleDeleteCatatan = async (id: number) => {
    const confirmed = await showConfirm(
      'Apakah Anda yakin ingin menghapus catatan bimbingan ini?',
      'Hapus Catatan',
      'danger',
      'Ya, Hapus',
      'Batal'
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/catatan_walikelas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        showAlert('Gagal menghapus catatan bimbingan.', 'Kesalahan Hapus', 'danger');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCatatan = catatan.filter(c => 
    filterKategori === 'Semua' ? true : c.kategori === filterKategori
  );

  const handleExportCatatanXLSX = () => {
    try {
      const exportRows = catatan.map((c, i) => {
        const cls = kelasList.find(k => k.id === c.kelas_id);
        const className = cls ? cls.nama_kelas : '-';
        return {
          "No": i + 1,
          "Tanggal": c.tanggal,
          "NIS Siswa": c.siswa_nis,
          "Nama Siswa": c.nama_siswa || '-',
          "Kelas": className,
          "Kategori": c.kategori,
          "Pelapor/Guru": c.nama_guru || '-',
          "Isi Catatan": c.catatan || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Jurnal Bimbingan");

      if (exportRows.length > 0) {
        const colWidths = Object.keys(exportRows[0] || {}).map(key => {
          const maxLen = Math.max(
            key.length,
            ...exportRows.map(row => String((row as any)[key] || '').length)
          );
          return { wch: maxLen + 3 };
        });
        worksheet['!cols'] = colWidths;
      }

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = 'Rekap_Jurnal_Bimbingan_Konseling.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert(`Gagal mengekspor data: ${err.message}`, 'Kesalahan Ekspor', 'danger');
    }
  };

  const handleExportSuratXLSX = () => {
    try {
      const exportRows = suratList.map((s, i) => ({
        "No": i + 1,
        "Tanggal": s.tanggal,
        "NIS Siswa": s.siswa_nis,
        "Nama Siswa": s.nama_siswa || '-',
        "Jenis Surat": s.jenis_surat,
        "Keterangan/Alasan": s.keterangan || '-',
        "Status": s.status || 'Tercetak',
        "Guru BK": s.nama_guru || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Panggilan");

      if (exportRows.length > 0) {
        const colWidths = Object.keys(exportRows[0] || {}).map(key => {
          const maxLen = Math.max(
            key.length,
            ...exportRows.map(row => String((row as any)[key] || '').length)
          );
          return { wch: maxLen + 3 };
        });
        worksheet['!cols'] = colWidths;
      }

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = 'Rekap_Surat_Panggilan_BK.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showAlert(`Gagal mengekspor data: ${err.message}`, 'Kesalahan Ekspor', 'danger');
    }
  };

  // Recharts Data Calculation
  const categoriesList = ['Indisipliner', 'Konseling', 'Prestasi', 'Umum'];
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#6b7280'];
  const categoryData = categoriesList.map(cat => ({
    name: cat,
    value: catatan.filter(c => c.kategori === cat).length
  })).filter(d => d.value > 0);

  const classStatsMap: { [key: string]: number } = {};
  catatan.forEach(c => {
    const cls = kelasList.find(k => k.id === c.kelas_id);
    const className = cls ? cls.nama_kelas : `Kelas #${c.kelas_id}`;
    classStatsMap[className] = (classStatsMap[className] || 0) + 1;
  });
  const classData = Object.keys(classStatsMap).map(name => ({
    name,
    Kasus: classStatsMap[name]
  })).sort((a, b) => b.Kasus - a.Kasus).slice(0, 8);

  const studentMap: { [nis: string]: { nis: string; nama: string; total: number; indisipliner: number; konseling: number } } = {};
  catatan.forEach(c => {
    if (!c.siswa_nis) return;
    if (!studentMap[c.siswa_nis]) {
      studentMap[c.siswa_nis] = {
        nis: c.siswa_nis,
        nama: c.nama_siswa || 'Siswa',
        total: 0,
        indisipliner: 0,
        konseling: 0
      };
    }
    studentMap[c.siswa_nis].total += 1;
    if (c.kategori === 'Indisipliner') studentMap[c.siswa_nis].indisipliner += 1;
    if (c.kategori === 'Konseling') studentMap[c.siswa_nis].konseling += 1;
  });
  const topStudents = Object.values(studentMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Tab Navigasi Menu BK */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rekap' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Rekap &amp; Statistik Laporan</span>
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'monitoring' 
              ? 'bg-[#0f1219] text-blue-400 border border-blue-500/20 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Monitoring Laporan &amp; Catatan</span>
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
          <span>Surat Pemanggilan &amp; Peringatan</span>
        </button>
      </div>

      {/* Konten Tab Rekap & Statistik */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Total Jurnal BK</p>
                <p className="text-3xl font-black text-blue-400">{catatan.length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Kasus Indisipliner</p>
                <p className="text-3xl font-black text-rose-400">{catatan.filter(c => c.kategori === 'Indisipliner').length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Sesi Konseling</p>
                <p className="text-3xl font-black text-emerald-400">{catatan.filter(c => c.kategori === 'Konseling').length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-3xs font-bold text-slate-500 uppercase">Surat Panggilan BK</p>
                <p className="text-3xl font-black text-purple-400">{suratList.length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Visual Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 space-y-4">
              <div>
                <h6 className="font-bold text-slate-200 text-xs uppercase tracking-wider font-mono">Frekuensi Kasus per Kelas (Top 8)</h6>
                <p className="text-3xs text-slate-500">Jumlah laporan bimbingan &amp; indisipliner berdasarkan kelas siswa</p>
              </div>
              <div className="h-64">
                {classData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">Belum ada data kelas</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis dataKey="name" stroke="#8b949e" fontSize={10} />
                      <YAxis stroke="#8b949e" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f1219', borderColor: '#30363d', fontSize: '11px', borderRadius: '8px' }} />
                      <Bar dataKey="Kasus" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 space-y-4">
              <div>
                <h6 className="font-bold text-slate-200 text-xs uppercase tracking-wider font-mono">Distribusi Kategori Jurnal</h6>
                <p className="text-3xs text-slate-500">Presentase sebaran laporan bimbingan konseling dan kasus</p>
              </div>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
                {categoryData.length === 0 ? (
                  <div className="text-xs text-slate-500">Belum ada data kategori</div>
                ) : (
                  <>
                    <div className="w-1/2 h-full min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => {
                              const itemColor = COLORS[categoriesList.indexOf(entry.name)] || '#6b7280';
                              return <Cell key={`cell-${index}`} fill={itemColor} />;
                            })}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f1219', borderColor: '#30363d', fontSize: '11px', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 shrink-0">
                      {categoryData.map((entry) => {
                        const itemColor = COLORS[categoriesList.indexOf(entry.name)] || '#6b7280';
                        return (
                          <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: itemColor }}></span>
                            <span className="text-slate-300 font-medium">{entry.name}:</span>
                            <strong className="text-slate-100">{entry.value}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top Students Requiring Attention */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
              <div>
                <h6 className="font-bold text-slate-200 text-xs uppercase tracking-wider font-mono">Siswa dengan Intensitas Laporan Tertinggi</h6>
                <p className="text-3xs text-slate-500">Daftar siswa yang memerlukan pendampingan bimbingan/tindakan lebih lanjut</p>
              </div>

              {topStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada catatan yang terdaftar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0f1219] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[10px]">Nama Siswa (NIS)</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-center">Indisipliner</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-center">Konseling</th>
                        <th className="px-4 py-3 font-bold text-[10px] text-center">Total Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {topStudents.map((s) => (
                        <tr key={s.nis} className="hover:bg-[#0f1219]/40">
                          <td className="px-4 py-3.5">
                            <span 
                              className="font-bold text-slate-200 hover:text-blue-400 cursor-pointer block"
                              onClick={() => (window as any).showStudentProfile?.(s.nis)}
                            >
                              {s.nama}
                            </span>
                            <span className="text-3xs text-slate-500 font-mono block mt-0.5">{s.nis}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-rose-400 font-bold font-mono">{s.indisipliner}</td>
                          <td className="px-4 py-3.5 text-center text-blue-400 font-bold font-mono">{s.konseling}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px] font-mono">
                              {s.total}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Export Report Section */}
            <div className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h6 className="font-bold text-slate-200 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-blue-400">
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap Laporan BK</span>
                </h6>
                <p className="text-3xs text-slate-400 leading-relaxed">
                  Ekspor database bimbingan konseling dan riwayat penerbitan surat panggilan ke dalam format file Microsoft Excel (.xlsx) untuk keperluan pelaporan instansi dan arsip BK.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/60">
                <button
                  onClick={handleExportCatatanXLSX}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Cetak Jurnal Bimbingan (.XLSX)</span>
                </button>

                <button
                  onClick={handleExportSuratXLSX}
                  className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 border border-slate-750 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Cetak Rekap Surat BK (.XLSX)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

