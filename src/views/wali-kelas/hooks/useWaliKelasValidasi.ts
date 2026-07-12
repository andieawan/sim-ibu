// ============================================================================
// Nama File : useWaliKelasValidasi.ts
// Lokasi    : /src/views/wali-kelas/hooks/useWaliKelasValidasi.ts
// Peran     : Custom hook to manage state & logic for attendance validation by Homeroom.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { AbsensiHistory, DetailRec } from '../types';

export function useWaliKelasValidasi(kelasId: number) {
  const [history, setHistory] = useState<AbsensiHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AbsensiHistory | null>(null);
  
  const [details, setDetails] = useState<DetailRec[]>([]);
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const getAuthHeader = () => {
    try {
      const saved = localStorage.getItem('simibu_user') || sessionStorage.getItem('simibu_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.token) {
          return { 'Authorization': `Bearer ${u.token}` };
        }
      }
    } catch (_) {}
    return {};
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi-history/${kelasId}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchHistory();
  }, [kelasId, fetchHistory]);

  const handleSelectSession = async (session: AbsensiHistory) => {
    setSelectedSession(session);
    setLoadingDetails(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/absensi-detail/${session.id}`, { headers: getAuthHeader() });
      if (res.ok) {
        const data: DetailRec[] = await res.json();
        setDetails(data);
        const map: Record<string, any> = {};
        data.forEach(d => { map[d.siswa_nis] = d.status; });
        setLocalStatuses(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveValidasi = async () => {
    if (!selectedSession) return;
    setSaving(true);
    setMessage(null);

    const records = details.map(d => ({
      nis: d.siswa_nis,
      status: localStatuses[d.siswa_nis] || 'Hadir'
    }));

    try {
      const res = await fetch('/api/walikelas/absensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          kelas_id: kelasId,
          tanggal: selectedSession.tanggal,
          records
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      setMessage({ type: 'success', text: 'Absensi harian kelas ini berhasil divalidasi dan diubah bila ada pembaruan.' });
      await fetchHistory(); // refresh history
      
      setSelectedSession({ ...selectedSession, is_approved_by_walikelas: 1 });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return {
    history,
    loading,
    selectedSession,
    setSelectedSession,
    details,
    localStatuses,
    setLocalStatuses,
    loadingDetails,
    saving,
    message,
    setMessage,
    fetchHistory,
    handleSelectSession,
    handleSaveValidasi
  };
}
