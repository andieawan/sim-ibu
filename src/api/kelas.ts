// ============================================================================
// Nama File : kelas.ts
// Lokasi    : /src/api/kelas.ts
// Peran     : Centralized API requests for class-related endpoints (/api/kelas*).
// ============================================================================

import { clientFetch } from './client';
import { Kelas, Siswa } from '../types';

export async function getKelas(): Promise<Kelas[]> {
  return clientFetch<Kelas[]>('/api/kelas');
}

export async function getSiswaByKelas(kelasId: number): Promise<Siswa[]> {
  return clientFetch<Siswa[]>(`/api/kelas/${kelasId}/siswa`);
}

export async function createKelas(data: Partial<Kelas>): Promise<any> {
  return clientFetch<any>('/api/kelas', {
    method: 'POST',
    body: data as any,
  });
}

export async function updateKelas(id: number, data: Partial<Kelas>): Promise<any> {
  return clientFetch<any>(`/api/kelas/${id}`, {
    method: 'PUT',
    body: data as any,
  });
}

export async function deleteKelas(id: number): Promise<any> {
  return clientFetch<any>(`/api/kelas/${id}`, {
    method: 'DELETE',
  });
}
