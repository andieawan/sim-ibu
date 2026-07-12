// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/wali-murid/types.ts
// Peran     : Type definitions specifically for Wali Murid views.
// ============================================================================

import { Pengguna } from '../../types';

export interface WaliMuridViewProps {
  currentUser: Pengguna;
  theme?: 'light' | 'dark';
}

export interface ClassData {
  classInfo: {
    id: number;
    nama_kelas: string;
    sekolah: string;
    nama_walikelas?: string | null;
    total_siswa: number;
  };
  attendance: Array<{
    id: number;
    tanggal: string;
    count_hadir: number;
    count_izin: number;
    count_sakit: number;
    count_alfa: number;
  }>;
}
