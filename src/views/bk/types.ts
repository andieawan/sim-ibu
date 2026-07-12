// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/bk/types.ts
// Peran     : Type definitions specifically for BK (Counseling) views.
// ============================================================================

import { Pengguna } from '../../types';

export interface BkViewProps {
  currentUser: Pengguna;
  schoolIdentity?: any;
}

export interface BkNewCatatan {
  siswa_nis: string;
  kategori: string;
  catatan: string;
}
