// ============================================================================
// SIM-IBU (SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM) - TYPESCRIPT DEFINITIONS
// FILE: src/types.ts
// 
// Developer Note:
// File ini mendefinisikan seluruh struktur objek Object Type/Interface di App.
// Gunakan antarmuka ini jika membuat komponen baru untuk menjaga konsistensi TS
// terhadap balasan API Express dari Backend.
// ============================================================================

export interface Kelas {
  id: number;
  nama_kelas: string;
  sekolah: string;
  walikelas_id?: number | null;
  nama_walikelas?: string;
  username_walikelas?: string;
  jurusan?: string;
  is_mengajar?: number;
}

export interface Siswa {
  nis: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  kelas_id: number;
  status_aktif?: number;
}

export interface AktivitasNilai {
  id: number;
  nama_aktivitas: string;
  tanggal: string;
  kelas_id: number;
}

export interface DetailNilai {
  id: number;
  aktivitas_id: number;
  siswa_nis: string;
  nilai: number;
  catatan: string;
}

export interface Absensi {
  id: number;
  tanggal: string;
  kelas_id: number;
}

export interface DetailAbsensi {
  id: number;
  absensi_id: number;
  siswa_nis: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';
  updated_at: string;
}

export interface Pengguna {
  id: number;
  username: string;
  nama: string;
  role: 'guru' | 'admin' | 'wali_murid' | 'bk' | 'kajur' | 'kepsek';
  token?: string;
  nip?: string;
  jabatan?: string;
  siswa_nis?: string | null;
  kelas_id?: number | null;
  jurusan?: string;
  is_cuti?: number;
}

export interface Jadwal {
  id: number;
  kelas_id: number;
  guru_id: number;
  mata_pelajaran: string;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  nama_kelas?: string;
  nama_guru?: string;
  username_guru?: string;
}

export interface CatatanWaliKelas {
  id: number;
  siswa_nis: string;
  kelas_id: number;
  guru_id: number;
  kategori: string;
  catatan: string;
  tanggal: string;
  nama_siswa?: string;
  nama_guru?: string;
}

export interface SuratBk {
  id: number;
  siswa_nis: string;
  guru_id: number;
  jenis_surat: string;
  tanggal: string;
  keterangan: string;
  status: string;
  nama_siswa?: string;
  nama_guru?: string;
}


