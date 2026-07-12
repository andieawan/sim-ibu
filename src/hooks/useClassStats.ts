import { useState, useEffect, useCallback } from 'react';

export interface StudentStat {
  nis: string;
  nama: string;
  attendance_rate: number;
  absence_rate: number;
  average_grade: number;
  missing_grades?: number; // fallback in case some structures have it
}

export interface MappedClassStat {
  name: string;
  fullName: string;
  'Rasio Absen (%)': number;
  'Rata-rata Nilai': number;
}

export function useClassStats(classId: number | null) {
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [classStats, setClassStats] = useState<MappedClassStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/class-stats/${id}`);
      if (res.ok) {
        const data: StudentStat[] = await res.json();
        setStudentStats(data);
        
        // Map to Recharts compatible fields
        const mapped: MappedClassStat[] = data.map((d) => ({
          name: d.nama.split(' ').slice(0, 2).join(' '),
          fullName: d.nama,
          'Rasio Absen (%)': d.absence_rate,
          'Rata-rata Nilai': d.average_grade
        }));
        setClassStats(mapped);
      } else {
        throw new Error('Gagal memuat statistik kelas.');
      }
    } catch (err: any) {
      console.error('Error fetching class stats:', err);
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classId) {
      fetchStats(classId);
    } else {
      setStudentStats([]);
      setClassStats([]);
    }
  }, [classId, fetchStats]);

  return {
    studentStats,
    classStats,
    loading,
    error,
    refresh: () => {
      if (classId) {
        fetchStats(classId);
      }
    }
  };
}
