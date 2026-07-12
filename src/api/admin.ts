// ============================================================================
// Nama File : admin.ts
// Lokasi    : /src/api/admin.ts
// Peran     : Centralized API requests for admin-related endpoints (/api/admin*).
// ============================================================================

import { clientFetch } from './client';

export async function getUsers(): Promise<any[]> {
  return clientFetch<any[]>('/api/admin/users');
}

export async function getAdminSummary(): Promise<any> {
  return clientFetch<any>('/api/admin/summary');
}

export async function createUser(data: any): Promise<any> {
  return clientFetch<any>('/api/admin/users', {
    method: 'POST',
    body: data,
  });
}

export async function updateUser(id: number, data: any): Promise<any> {
  return clientFetch<any>(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteUser(id: number): Promise<any> {
  return clientFetch<any>(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export async function resetDatabase(): Promise<any> {
  return clientFetch<any>('/api/admin/reset-db', {
    method: 'POST',
  });
}

export async function promoteSiswa(payload: { target_kelas_id: number; selected_siswa: string[] }): Promise<any> {
  return clientFetch<any>('/api/admin/promote-siswa', {
    method: 'POST',
    body: payload as any,
  });
}

export async function graduateSiswa(payload: { selected_siswa: string[] }): Promise<any> {
  return clientFetch<any>('/api/admin/graduate-siswa', {
    method: 'POST',
    body: payload as any,
  });
}
