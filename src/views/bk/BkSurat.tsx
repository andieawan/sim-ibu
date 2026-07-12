import React, { useState, useEffect } from 'react';
import { SuratBk, Pengguna, Siswa } from '../../types';
import { Plus, Save, FileText, Trash, Printer, Search, Check } from 'lucide-react';
import { useDialog } from '../../components/DialogProvider';

interface BkSuratProps {
  currentUser: Pengguna;
}

export default function BkSurat({ currentUser }: BkSuratProps) {
  const { showAlert, showConfirm } = useDialog();
  const [suratList, setSuratList] = useState<SuratBk[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const [schoolIdentity, setSchoolIdentity] = useState({
    nama_sekolah: 'SMK IBU',
    motto: '',
    alamat: 'Jl. Pendidikan No. 1, Kota Pelajar',
    npsn: '',
    kepala_sekolah: '',
    tahun_pelajaran: '',
    semester: '',
    logo: ''
  });

  const [newSurat, setNewSurat] = useState({
    siswa_nis: '',
    jenis_surat: 'Pemanggilan',
    keterangan: ''
  });

  const [selectedSuratForPrint, setSelectedSuratForPrint] = useState<SuratBk | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    nomorSurat: '',
    lampiran: '-',
    perihal: 'Undangan Wali Murid',
    hariTanggal: '',
    jam: '08.00 WIB',
    menemui: 'Wali Kelas dan BK',
    tempat: 'Ruang BK atau Kesiswaan',
    nb: 'MEMBAWA FC KK DAN KTP ORANGTUA/WALI',
    sertakanKeterangan: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch school identity
      const resSchool = await fetch('/api/school-identity');
      if (resSchool.ok) {
        const schoolData = await resSchool.json();
        setSchoolIdentity(schoolData);
      }

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

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/surat_bk/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      } else {
        showAlert('Gagal memperbarui status surat.', 'Kesalahan', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm('Apakah Anda yakin ingin menghapus surat ini?', 'Hapus Surat', 'danger', 'Ya, Hapus', 'Batal');
    if (!confirmed) return;
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

  const handleOpenPrintModal = (surat: SuratBk) => {
    setSelectedSuratForPrint(surat);
    
    // Default meeting date: 3 days after today or letter date
    const letterDate = surat.tanggal ? new Date(surat.tanggal) : new Date();
    const meetingDate = new Date(letterDate);
    meetingDate.setDate(meetingDate.getDate() + 3);
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formattedMeetingDate = meetingDate.toLocaleDateString('id-ID', options);

    let defaultPerihal = 'Undangan Wali Murid';
    if (surat.jenis_surat?.includes('Peringatan')) {
      defaultPerihal = `Panggilan Orang Tua (${surat.jenis_surat})`;
    } else if (surat.jenis_surat === 'Teguran') {
      defaultPerihal = 'Surat Teguran / Panggilan Orang Tua';
    }

    const paddedId = String(surat.id || '22').padStart(3, '0');
    const randomNum = Math.floor(Math.random() * 150) + 50;
    const year = new Date(letterDate).getFullYear();
    const waliKelasText = surat.nama_walikelas ? `Wali Kelas ( ${surat.nama_walikelas} ) dan BK` : 'Wali Kelas dan BK';

    setPrintConfig({
      nomorSurat: `400.3.8.1/${paddedId}.   ${randomNum}  /101.6.20570966/${year}`,
      lampiran: '-',
      perihal: defaultPerihal,
      hariTanggal: formattedMeetingDate,
      jam: '08.00 WIB',
      menemui: waliKelasText,
      tempat: 'Ruang BK atau Kesiswaan',
      nb: 'MEMBAWA FC KK DAN KTP ORANGTUA/WALI',
      sertakanKeterangan: false
    });
    setShowPrintModal(true);
  };

  const printSurat = (surat: SuratBk, config: typeof printConfig) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Surat - ${surat.jenis_surat}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body { 
                font-family: 'Times New Roman', Times, serif; 
                line-height: 1.5; 
                color: #000; 
                background-color: #fff;
                padding: 0;
                margin: 0;
              }
              .kop-table {
                width: 100%;
                border-collapse: collapse;
              }
              .kop-logo {
                width: 90px;
                text-align: left;
                vertical-align: middle;
              }
              .kop-logo img {
                max-width: 85px;
                max-height: 85px;
                object-fit: contain;
              }
              .kop-text {
                text-align: center;
                vertical-align: middle;
              }
              .yis-title {
                font-size: 15px;
                font-weight: bold;
                text-transform: uppercase;
                margin: 0;
              }
              .motto-title {
                font-size: 14px;
                font-weight: bold;
                margin: 2px 0;
              }
              .school-title {
                font-size: 20px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.2px;
                margin: 0;
              }
              .npsn-text {
                font-size: 12px;
                font-weight: bold;
                margin: 3px 0;
              }
              .kelompok-text {
                font-size: 11px;
                font-weight: bold;
                margin: 2px 0;
              }
              .address-text {
                font-size: 11px;
                font-weight: bold;
                margin: 2px 0;
              }
              .double-line {
                border-top: 3px solid #000;
                border-bottom: 1.5px solid #000;
                height: 2px;
                margin: 5px 0 20px 0;
              }
              .meta-table {
                width: 100%;
                font-size: 13.5px;
                margin-bottom: 25px;
              }
              .meta-left {
                width: 60%;
                vertical-align: top;
              }
              .meta-left table {
                width: 100%;
                border-collapse: collapse;
              }
              .meta-left td {
                padding: 2px 0;
              }
              .meta-right {
                width: 40%;
                vertical-align: top;
                padding-left: 30px;
              }
              .salutation {
                font-size: 13.5px;
                margin-bottom: 15px;
              }
              .body-paragraph {
                font-size: 13.5px;
                text-align: justify;
                text-indent: 40px;
                margin-bottom: 15px;
              }
              .details-table {
                width: 90%;
                margin: 15px 0 15px 50px;
                font-size: 13.5px;
                border-collapse: collapse;
              }
              .details-table td {
                padding: 4px 0;
              }
              .signature-table {
                width: 100%;
                font-size: 13.5px;
                margin-top: 30px;
                border-collapse: collapse;
              }
              .footer-line {
                border-top: 3px solid #000;
                border-bottom: 1.5px solid #000;
                height: 2px;
                margin-top: 50px;
                margin-bottom: 6px;
              }
              .nb-text {
                font-size: 12px;
                font-weight: bold;
                font-style: italic;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <table class="kop-table">
              <tr>
                <td class="kop-logo">
                  <img src="${schoolIdentity.logo || '/logo.png'}" />
                </td>
                <td class="kop-text" style="padding-right: 90px;">
                  <div class="yis-title">YAYASAN PENDIDIKAN ISLAM</div>
                  <div class="motto-title">“ BUSTANUL ULUM ”</div>
                  <div class="school-title">SMK ISLAM BUSTANUL ULUM PAKUSARI</div>
                  <div class="npsn-text">
                    NSS : 342052423288 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NPSN : 20570966
                  </div>
                  <div class="kelompok-text">Kelompok Bisnis Manajemen dan Teknologi Informasi Komunikasi</div>
                  <div class="address-text">Jl. Himalaya No. 17 Telp. (0331) 591 880 Kode Pos. 68181 Pakusari – Jember</div>
                </td>
              </tr>
            </table>
            
            <div class="double-line"></div>

            <table class="meta-table">
              <tr>
                <td class="meta-left">
                  <table>
                    <tr>
                      <td style="width: 70px; vertical-align: top;">Nomor</td>
                      <td style="width: 15px; vertical-align: top;">:</td>
                      <td style="vertical-align: top;">${config.nomorSurat}</td>
                    </tr>
                    <tr>
                      <td style="vertical-align: top;">Lampiran</td>
                      <td style="vertical-align: top;">:</td>
                      <td style="vertical-align: top;">${config.lampiran}</td>
                    </tr>
                    <tr>
                      <td style="vertical-align: top;">Perihal</td>
                      <td style="vertical-align: top;">:</td>
                      <td style="vertical-align: top;"><strong>${config.perihal}</strong></td>
                    </tr>
                  </table>
                </td>
                <td class="meta-right">
                  <div style="font-weight: bold; font-size: 13.5px; margin-bottom: 3px;">Kepada</div>
                  <div style="font-weight: bold; font-size: 13.5px;">Yth. Bapak/Ibu Wali Murid</div>
                  <div style="font-size: 13.5px; margin: 3px 0 1px 0;">di</div>
                  <div style="font-weight: bold; font-size: 13.5px; padding-left: 40px;">Tempat</div>
                </td>
              </tr>
            </table>

            <div class="salutation">Assalamualaikum wr wb</div>
            
            <div class="body-paragraph">
              Dalam rangka kelancaran proses belajar mengajar dan kesinambungan anak didik antar sekolah dan wali murid, maka kami mengharap kehadiran Bapak/Ibu Wali Murid atas nama :
            </div>

            <table class="details-table">
              <tr>
                <td style="width: 140px;">Nama</td>
                <td style="width: 20px;">:</td>
                <td><strong>${surat.nama_siswa?.toUpperCase()}</strong></td>
              </tr>
              <tr>
                <td>Kelas</td>
                <td>:</td>
                <td><strong>${surat.nama_kelas?.toUpperCase() || '-'}</strong></td>
              </tr>
              <tr>
                <td>Jam</td>
                <td>:</td>
                <td><strong>${config.jam}</strong></td>
              </tr>
              <tr>
                <td>Hari, Tanggal</td>
                <td>:</td>
                <td><strong>${config.hariTanggal}</strong></td>
              </tr>
              <tr>
                <td>Menemui</td>
                <td>:</td>
                <td><strong>${config.menemui}</strong></td>
              </tr>
              <tr>
                <td>Tempat</td>
                <td>:</td>
                <td><strong>${config.tempat}</strong></td>
              </tr>
            </table>

            ${config.sertakanKeterangan ? `
            <div class="body-paragraph" style="white-space: pre-wrap; border: 1px solid #000; padding: 10px; border-radius: 4px; margin-top: 10px; margin-bottom: 10px; font-size: 13px;">
              <strong>Keterangan Masalah / Tindakan:</strong><br/>${surat.keterangan}
            </div>
            ` : ''}

            <div class="body-paragraph" style="margin-top: 15px;">
              Mengingat pentingnya surat panggilan tersebut, kehadiran Bapak/Ibu sangat kami harapkan. Demikian surat panggilan ini, atas perhatiannya kami ucapkan Terima Kasih.
            </div>

            <div class="salutation" style="margin-top: 15px;">Wassalamualaikum wr wb</div>

            <table class="signature-table">
              <tr>
                <td style="width: 55%;"></td>
                <td style="width: 45%; text-align: left; padding-left: 20px; vertical-align: top;">
                  <div>Pakusari, &nbsp;&nbsp; ${new Date(surat.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div style="margin-top: 3px; font-weight: bold;">Kepala SMK Islam Bustanul Ulum Pakusari</div>
                  <div style="height: 75px;"></div>
                  <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${schoolIdentity.kepala_sekolah || 'MUHAMMAD MUSLIM, S.Pd'}</div>
                  <div style="font-size: 12px; margin-top: 2px;">Nuptk. 79517668130072</div>
                </td>
              </tr>
            </table>

            <div class="footer-line"></div>
            <div class="nb-text">
              NB: ${config.nb}
            </div>

            <script>
              window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredSurat = suratList.filter(s => {
    const matchesSearch = s.nama_siswa?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.siswa_nis?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesJenis = filterJenis === 'Semua' ? true : s.jenis_surat === filterJenis;
    
    const currentStatus = s.status || 'Tercetak';
    const matchesStatus = filterStatus === 'Semua' ? true : currentStatus === filterStatus;
    
    return matchesSearch && matchesJenis && matchesStatus;
  });

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

      {/* Filter & Pencarian Surat */}
      <div className="bg-[#161b22] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari siswa atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1219] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="Semua">Semua Jenis Surat</option>
            <option value="Pemanggilan">Surat Pemanggilan</option>
            <option value="Teguran">Surat Teguran</option>
            <option value="Peringatan 1">SP1</option>
            <option value="Peringatan 2">SP2</option>
            <option value="Peringatan 3">SP3</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0f1219] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Tercetak">Tercetak</option>
            <option value="Terkirim">Terkirim</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {loading && !suratList.length ? (
        <div className="py-12 text-center text-slate-500 text-xs">Memuat data surat...</div>
      ) : filteredSurat.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-[#161b22]">
          Tidak ada data surat BK yang sesuai kriteria pencarian.
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
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredSurat.map((s) => {
                  const currentStatus = s.status || 'Tercetak';
                  return (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded border bg-transparent focus:outline-none cursor-pointer transition ${
                            currentStatus === 'Selesai' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                            currentStatus === 'Terkirim' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                            currentStatus === 'Diproses' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' :
                            'text-amber-400 border-amber-500/20 bg-amber-500/5'
                          }`}
                        >
                          <option value="Tercetak" className="bg-[#161b22] text-slate-300">Tercetak</option>
                          <option value="Terkirim" className="bg-[#161b22] text-slate-300">Terkirim</option>
                          <option value="Diproses" className="bg-[#161b22] text-slate-300">Diproses</option>
                          <option value="Selesai" className="bg-[#161b22] text-slate-300">Selesai</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleOpenPrintModal(s)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPrintModal && selectedSuratForPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1c2128] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-140px)]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                Pengaturan Cetak Kop Surat
              </h3>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nama Siswa</label>
                <div className="px-3 py-2 bg-[#12161a] border border-slate-800 rounded-lg text-xs text-slate-200 font-medium">
                  {selectedSuratForPrint.nama_siswa} ({selectedSuratForPrint.nama_kelas || 'Kelas tidak teridentifikasi'})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nomor Surat</label>
                  <input
                    type="text"
                    value={printConfig.nomorSurat}
                    onChange={(e) => setPrintConfig({ ...printConfig, nomorSurat: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lampiran</label>
                  <input
                    type="text"
                    value={printConfig.lampiran}
                    onChange={(e) => setPrintConfig({ ...printConfig, lampiran: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Perihal / Hal</label>
                <input
                  type="text"
                  value={printConfig.perihal}
                  onChange={(e) => setPrintConfig({ ...printConfig, perihal: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hari, Tanggal Pertemuan</label>
                  <input
                    type="text"
                    value={printConfig.hariTanggal}
                    onChange={(e) => setPrintConfig({ ...printConfig, hariTanggal: e.target.value })}
                    placeholder="Contoh: Kamis, 20 Februari 2025"
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Jam Pertemuan</label>
                  <input
                    type="text"
                    value={printConfig.jam}
                    onChange={(e) => setPrintConfig({ ...printConfig, jam: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Menemui Siapa</label>
                  <input
                    type="text"
                    value={printConfig.menemui}
                    onChange={(e) => setPrintConfig({ ...printConfig, menemui: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tempat Pertemuan</label>
                  <input
                    type="text"
                    value={printConfig.tempat}
                    onChange={(e) => setPrintConfig({ ...printConfig, tempat: e.target.value })}
                    className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Catatan Tambahan (NB)</label>
                <input
                  type="text"
                  value={printConfig.nb}
                  onChange={(e) => setPrintConfig({ ...printConfig, nb: e.target.value })}
                  className="w-full px-3 py-2 bg-[#12161a] border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sertakanKeterangan"
                  checked={printConfig.sertakanKeterangan}
                  onChange={(e) => setPrintConfig({ ...printConfig, sertakanKeterangan: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 bg-[#12161a] text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sertakanKeterangan" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Sertakan Keterangan Masalah / Catatan Kasus di dalam Surat
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#12161a] border-t border-slate-800 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  printSurat(selectedSuratForPrint, printConfig);
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-blue-600/10"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Kop Surat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
