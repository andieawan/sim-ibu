// ============================================================================
// Nama File : useBkDashboard.ts
// Lokasi    : /src/views/bk/hooks/useBkDashboard.ts
// Peran     : Custom hook to manage state, fetching and mutation for BK panel.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { CatatanWaliKelas, Siswa } from '../../../types';
import { BkNewCatatan } from '../types';

export function useBkDashboard(activeTab: string, currentUser: any) {
  const [catatan, setCatatan] = useState<CatatanWaliKelas[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [suratList, setSuratList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // State for adding new record
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatatan, setNewCatatan] = useState<BkNewCatatan>({
    siswa_nis: '',
    kategori: 'Konseling',
    catatan: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resCatatan = await fetch('/api/catatan_walikelas');
      if (resCatatan.ok) {
        const data = await resCatatan.json();
        setCatatan(data);
      }

      const resSiswa = await fetch('/api/siswa-all');
      if (resSiswa.ok) {
        const data = await resSiswa.json();
        setSiswaList(data);
      }

      const resKelas = await fetch('/api/kelas');
      if (resKelas.ok) {
        const data = await resKelas.json();
        setKelasList(data);
      }

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
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

  const handleSubmitCatatan = async (
    onSuccess: () => void,
    onError: (msg: string, title?: string, type?: 'warning' | 'danger') => void
  ) => {
    if (!newCatatan.siswa_nis || !newCatatan.catatan) {
      onError('Mohon lengkapi semua bidang form.', 'Formulir Belum Lengkap', 'warning');
      return;
    }

    const selectedSiswa = siswaList.find(s => s.nis === newCatatan.siswa_nis);
    if (!selectedSiswa) {
      onError('Siswa tidak valid.', 'Siswa Tidak Valid', 'danger');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/catatan_walikelas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kelas_id: selectedSiswa.kelas_id,
          siswa_nis: newCatatan.siswa_nis,
          guru_id: currentUser?.id,
          kategori: newCatatan.kategori,
          catatan: newCatatan.catatan
        })
      });

      if (res.ok) {
        onSuccess();
        setNewCatatan({
          siswa_nis: '',
          kategori: 'Konseling',
          catatan: ''
        });
        setShowAddForm(false);
        fetchData();
      } else {
        onError('Gagal menambahkan catatan baru.', 'Kesalahan Simpan', 'danger');
      }
    } catch (err: any) {
      onError(err.message || 'Terjadi kesalahan sistem.', 'Kesalahan Sistem', 'danger');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteCatatan = async (
    id: number,
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    try {
      const res = await fetch(`/api/catatan_walikelas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onSuccess();
        fetchData();
      } else {
        onError('Gagal menghapus catatan.');
      }
    } catch (err: any) {
      onError(err.message || 'Gagal menghapus catatan.');
    }
  };

  return {
    catatan,
    setCatatan,
    siswaList,
    kelasList,
    suratList,
    setSuratList,
    loading,
    loadingSubmit,
    filterKategori,
    setFilterKategori,
    showAddForm,
    setShowAddForm,
    newCatatan,
    setNewCatatan,
    fetchData,
    handleSubmitCatatan,
    handleDeleteCatatan
  };
}
