// ============================================================================
// Nama File : useGuruNilai.ts
// Lokasi    : /src/views/guru/hooks/useGuruNilai.ts
// Peran     : Custom hook for managing state and centralized API requests for grades.
// ============================================================================

import { useState, useCallback } from 'react';
import { Siswa } from '../../../types';
import { getSiswaByKelas } from '../../../api/siswa';
import { getNilaiHistory, getNilaiDetail, saveNilai, updateNilai } from '../../../api/nilai';
import { NilaiHistoryRecord, NilaiDetailRecord } from '../types';

export function useGuruNilai(selectedClassId: number | null, kkm: number) {
  const [students, setStudents] = useState<Siswa[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [history, setHistory] = useState<NilaiHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  
  const [selectedHistorySession, setSelectedHistorySession] = useState<NilaiHistoryRecord | null>(null);
  const [historyDetails, setHistoryDetails] = useState<NilaiDetailRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  const [saving, setSaving] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const loadStudents = useCallback(async (classId: number) => {
    setLoadingStudents(true);
    setSaveStatus({ type: '', message: '' });
    try {
      const data = await getSiswaByKelas(classId);
      const activeStudents = data.filter(s => s.status_aktif !== 0);
      setStudents(activeStudents);
      
      const initialGrades: Record<string, number> = {};
      const initialNotes: Record<string, string> = {};
      activeStudents.forEach(s => {
        initialGrades[s.nis] = 80;
        initialNotes[s.nis] = 80 >= kkm ? 'Tuntas' : 'Remedial';
      });
      setGrades(initialGrades);
      setNotes(initialNotes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  }, [kkm]);

  const loadHistory = useCallback(async (classId: number) => {
    setLoadingHistory(true);
    try {
      const rawData = await getNilaiHistory(classId);
      const data = rawData.map((record: any) => ({
        ...record,
        tanggal: record.tanggal ? record.tanggal.replace(/\//g, '-') : ''
      }));
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSaveGrades = async (activityName: string, activityDate: string) => {
    if (!selectedClassId || !activityName.trim() || students.length === 0) {
      setSaveStatus({ type: 'error', message: 'Silakan isi Nama Aktivitas dan pastikan siswa terdaftar.' });
      return;
    }
    setSaving(true);
    setSaveStatus({ type: '', message: '' });

    const records = students.map((s) => ({
      nis: s.nis,
      nilai: grades[s.nis] ?? 0,
      catatan: notes[s.nis] || ''
    }));

    try {
      await saveNilai({
        kelas_id: selectedClassId,
        nama_aktivitas: activityName.trim(),
        tanggal: activityDate,
        kkm,
        records
      });

      setSaveStatus({
        type: 'success',
        message: 'Laporan Nilai & Pencapaian KKM berhasil diposkan ke database SQLite!'
      });
      loadHistory(selectedClassId);
    } catch (error: any) {
      setSaveStatus({
        type: 'error',
        message: `Gagal mengirim data: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const loadHistoryDetails = async (session: NilaiHistoryRecord, onSetEditFields: (session: NilaiHistoryRecord, detailData: NilaiDetailRecord[]) => void) => {
    setSelectedHistorySession(session);
    setLoadingDetails(true);
    try {
      const data = await getNilaiDetail(session.id);
      setHistoryDetails(data);
      onSetEditFields(session, data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateGrades = async (
    editActivityName: string,
    editActivityDate: string,
    editKkm: number,
    editGrades: Record<string, number>,
    editNotes: Record<string, string>,
    onSuccess: () => void,
    onError: (msg: string) => void
  ) => {
    if (!selectedHistorySession) return;
    setUpdating(true);
    const records = historyDetails.map((det) => ({
      nis: det.siswa_nis,
      nilai: editGrades[det.siswa_nis] ?? 0,
      catatan: editNotes[det.siswa_nis] || ''
    }));

    try {
      await updateNilai(selectedHistorySession.id, {
        kelas_id: selectedClassId || 0,
        nama_aktivitas: editActivityName.trim(),
        tanggal: editActivityDate,
        kkm: editKkm,
        records
      });

      if (selectedClassId) {
        loadHistory(selectedClassId);
        const freshDetails = await getNilaiDetail(selectedHistorySession.id);
        setHistoryDetails(freshDetails);
        setSelectedHistorySession(prev => prev ? {
          ...prev,
          nama_aktivitas: editActivityName.trim(),
          tanggal: editActivityDate,
          kkm: editKkm,
        } : null);
      }
      onSuccess();
    } catch (err: any) {
      onError(err.message || "Gagal memperbarui nilai.");
    } finally {
      setUpdating(false);
    }
  };

  return {
    students,
    setStudents,
    loadingStudents,
    grades,
    setGrades,
    notes,
    setNotes,
    history,
    loadingHistory,
    selectedHistorySession,
    setSelectedHistorySession,
    historyDetails,
    setHistoryDetails,
    loadingDetails,
    saving,
    updating,
    saveStatus,
    setSaveStatus,
    loadStudents,
    loadHistory,
    handleSaveGrades,
    loadHistoryDetails,
    handleUpdateGrades
  };
}
