// ============================================================================
// Nama File : siswa.ts
// Lokasi    : /src/api/siswa.ts
// Peran     : Centralized API requests for student-related endpoints (/api/siswa*).
// ============================================================================

import { clientFetch } from './client';
import { Siswa } from '../types';

export async function getAllSiswa(): Promise<Siswa[]> {
  return clientFetch<Siswa[]>('/api/siswa-all');
}

export async function getSiswaByKelas(classId: number): Promise<Siswa[]> {
  return clientFetch<Siswa[]>(`/api/siswa/${classId}`);
}

export async function getSiswaProfile(nis: string): Promise<any> {
  return clientFetch<any>(`/api/siswa-profile/${nis}`);
}

export async function createSiswa(data: Partial<Siswa>): Promise<any> {
  return clientFetch<any>('/api/siswa', {
    method: 'POST',
    body: data as any,
  });
}

export async function deleteSiswa(nis: string): Promise<any> {
  return clientFetch<any>(`/api/siswa/${nis}`, {
    method: 'DELETE',
  });
}

export async function updateSiswaStatus(nis: string, statusAktif: number): Promise<any> {
  return clientFetch<any>(`/api/siswa/${nis}/status`, {
    method: 'PUT',
    body: { status_aktif: statusAktif } as any,
  });
}
