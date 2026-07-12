// ============================================================================
// Nama File : types.ts
// Lokasi    : /src/views/kepsek/types.ts
// Peran     : Type definitions specifically for Kepsek (Principal) views.
// ============================================================================

import { Pengguna, Kelas } from '../../types';

export interface KepsekViewProps {
  classes: Kelas[];
  currentUser: Pengguna;
}
