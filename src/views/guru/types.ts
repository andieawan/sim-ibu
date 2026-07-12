// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/guru/types.ts
// Peran     : Type definitions specifically for Guru views (Absensi, Nilai, Rekap).
// ============================================================================

import { Kelas } from '../../types';

export interface AbsensiViewProps {
  classes: Kelas[];
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
}

export interface AbsensiHistoryRecord {
  id: number;
  tanggal: string;
  count_hadir: number;
  count_izin: number;
  count_sakit: number;
  count_alfa: number;
  total_siswa: number;
  is_approved_by_walikelas?: number;
}

export interface AbsensiDetailRecord {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at?: string;
}

export interface NilaiViewProps {
  classes: Kelas[];
  loadingClasses: boolean;
  selectedClassId: number | null;
  onClassChange: (id: number) => void;
}

export interface NilaiHistoryRecord {
  id: number;
  nama_aktivitas: string;
  tanggal: string;
  rata_rata: number;
  count_remedial: number;
  total_siswa: number;
  kkm?: number;
}

export interface NilaiDetailRecord {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  nilai: number;
  catatan: string;
}
