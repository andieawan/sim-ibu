// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/wali-kelas/types.ts
// Peran     : Type definitions specifically for Wali Kelas views.
// ============================================================================

import { Pengguna, Kelas } from '../../types';

export interface WaliKelasViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
  onNavigateToTab: (tab: string, classId?: number) => void;
}

export interface StudentStat {
  nis: string;
  nama: string;
  attendance_rate: number;
  absence_rate: number;
  average_grade: number;
}

export interface WaliKelasValidasiProps {
  kelasId: number;
}

export interface AbsensiHistory {
  id: number;
  tanggal: string;
  is_approved_by_walikelas: number;
  count_hadir: number;
  count_izin: number;
  count_sakit: number;
  count_alfa: number;
  total_siswa: number;
}

export interface DetailRec {
  id: number;
  siswa_nis: string;
  nama: string;
  jenis_kelamin: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at: string;
}

export interface WaliKelasCatatanProps {
  currentUser: Pengguna;
  kelasId: number;
}
