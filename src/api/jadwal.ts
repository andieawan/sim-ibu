// ============================================================================
// Nama File : jadwal.ts
// Lokasi    : /src/api/jadwal.ts
// Peran     : Centralized API requests for schedule-related endpoints (/api/jadwal*).
// ============================================================================

import { clientFetch } from './client';

export async function getJadwal(): Promise<any[]> {
  return clientFetch<any[]>('/api/jadwal');
}

export async function createJadwal(data: any): Promise<any> {
  return clientFetch<any>('/api/jadwal', {
    method: 'POST',
    body: data,
  });
}

export async function updateJadwal(id: number, data: any): Promise<any> {
  return clientFetch<any>(`/api/jadwal/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteJadwal(id: number): Promise<any> {
  return clientFetch<any>(`/api/jadwal/${id}`, {
    method: 'DELETE',
  });
}
