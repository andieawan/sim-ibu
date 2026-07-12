// ============================================================================
// Nama File : useWaliMuridMonitoring.ts
// Lokasi    : /src/views/wali-murid/hooks/useWaliMuridMonitoring.ts
// Peran     : Custom hook to fetch monitoring data and details for Wali Murid.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Pengguna } from '../../../types';
import { ClassData } from '../types';

export function useWaliMuridMonitoring(currentUser: Pengguna) {
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAbsensiId, setSelectedAbsensiId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Array<any>>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const fetchMonitoringData = useCallback(async () => {
    if (!currentUser.kelas_id) {
      setError('Akun Anda belum terhubung dengan kelas mana pun. Hubungi Administrator Sekolah.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wali-murid/monitoring/${currentUser.kelas_id}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`
        }
      });
      if (!res.ok) {
        throw new Error('Gagal memuat data monitoring kelas anak Anda.');
      }
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.kelas_id, currentUser.token]);

  useEffect(() => {
    fetchMonitoringData();
  }, [currentUser.kelas_id, fetchMonitoringData]);

  const handleSessionClick = async (absensiId: number) => {
    setSelectedAbsensiId(absensiId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/absensi-detail/${absensiId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`
        }
      });
      if (res.ok) {
        const jsonData = await res.json();
        setSessionDetails(jsonData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return {
    data,
    loading,
    error,
    selectedAbsensiId,
    setSelectedAbsensiId,
    sessionDetails,
    loadingDetails,
    fetchMonitoringData,
    handleSessionClick
  };
}
