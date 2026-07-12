// ============================================================================
// Nama File : nilai.ts
// Lokasi    : /src/api/nilai.ts
// Peran     : Centralized API requests for grades-related endpoints (/api/nilai*).
// ============================================================================

import { clientFetch } from './client';

export interface NilaiSaveRecord {
  nis: string;
  nilai: number;
  catatan: string;
}

export interface NilaiSavePayload {
  kelas_id: number;
  nama_aktivitas: string;
  tanggal: string;
  kkm: number;
  records: NilaiSaveRecord[];
}

export async function getNilaiHistory(classId: number): Promise<any[]> {
  return clientFetch<any[]>(`/api/nilai-history/${classId}`);
}

export async function getNilaiDetail(sessionId: number): Promise<any[]> {
  return clientFetch<any[]>(`/api/nilai-detail/${sessionId}`);
}

export async function saveNilai(payload: NilaiSavePayload): Promise<any> {
  return clientFetch<any>('/api/nilai', {
    method: 'POST',
    body: payload as any,
  });
}

export async function updateNilai(sessionId: number, payload: NilaiSavePayload): Promise<any> {
  return clientFetch<any>(`/api/nilai/${sessionId}`, {
    method: 'PUT',
    body: payload as any,
  });
}

export async function getRekapNilai(classId: number): Promise<any> {
  return clientFetch<any>(`/api/rekap/nilai/${classId}`);
}
