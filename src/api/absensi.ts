// ============================================================================
// Nama File : absensi.ts
// Lokasi    : /src/api/absensi.ts
// Peran     : Centralized API requests for attendance-related endpoints (/api/absensi*).
// ============================================================================

import { clientFetch } from './client';

export interface AbsensiSaveRecord {
  nis: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at?: string;
}

export interface AbsensiSavePayload {
  kelas_id: number;
  tanggal: string;
  records: AbsensiSaveRecord[];
}

export async function getAbsensiHistory(kelasId: number): Promise<any[]> {
  return clientFetch<any[]>(`/api/absensi-history/${kelasId}`);
}

export async function getAbsensiDetail(absensiId: number): Promise<any[]> {
  return clientFetch<any[]>(`/api/absensi-detail/${absensiId}`);
}

export async function saveAbsensi(payload: AbsensiSavePayload): Promise<any> {
  return clientFetch<any>('/api/absensi', {
    method: 'POST',
    body: payload as any,
  });
}

export async function validateAbsensi(payload: AbsensiSavePayload): Promise<any> {
  return clientFetch<any>('/api/walikelas/absensi', {
    method: 'POST',
    body: payload as any,
  });
}

export async function getRekapAbsensi(classId: number): Promise<any> {
  return clientFetch<any>(`/api/rekap/absensi/${classId}`);
}
