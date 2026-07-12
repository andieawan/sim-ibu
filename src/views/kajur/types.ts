// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/kajur/types.ts
// Peran     : Type definitions specifically for Kajur (Head of Department) views.
// ============================================================================

import { Pengguna, Kelas } from '../../types';

export interface KajurViewProps {
  currentUser: Pengguna;
  classes: Kelas[];
}
