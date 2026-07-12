// ============================================================================
// SIM-IBU (SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM) - TYPESCRIPT DEFINITIONS
// FILE: src/types.ts
// 
// Catatan Pengembang:
// File ini mendefinisikan seluruh struktur objek (Interface) TypeScript di aplikasi.
// Gunakan antarmuka ini jika membuat komponen baru untuk menjaga konsistensi tipe data (Type Safety)
// terhadap balasan API Express dari Backend maupun skema database.
// ============================================================================

/**
 * Representasi Kelas di SMKS Islam Bustanul Ulum.
 * Menyimpan data identitas kelas, wali kelas, serta pembagian jurusan.
 */
export interface Kelas {
  id: number;                  // ID unik kelas (Primary Key)
  nama_kelas: string;          // Nama kelas (contoh: "XII RPL 1", "X TKJ 2")
  sekolah: string;             // Nama sekolah (selalu tersinkronisasi dengan identitas sekolah)
  walikelas_id?: number | null;// ID guru yang bertugas sebagai wali kelas (merujuk ke tabel pengguna)
  nama_walikelas?: string;     // Nama lengkap wali kelas (opsional, diambil lewat JOIN)
  username_walikelas?: string; // Username wali kelas untuk keperluan kueri/log
  jurusan?: string;            // Singkatan jurusan (contoh: "RPL", "TKJ")
  is_mengajar?: number;        // Penanda apakah guru aktif saat ini mengajar di kelas ini (0 atau 1)
}

/**
 * Representasi Siswa aktif maupun tidak aktif.
 * NIS digunakan sebagai kunci utama unik (Unique Primary Key) alih-alih ID angka.
 */
export interface Siswa {
  nis: string;                 // Nomor Induk Siswa (NIS) unik sebagai ID utama
  nama: string;                // Nama lengkap siswa
  jenis_kelamin: 'L' | 'P';    // Jenis kelamin: 'L' (Laki-laki) atau 'P' (Perempuan)
  kelas_id: number;            // ID Kelas tempat siswa bernaung (Foreign Key)
  status_aktif?: number;       // Status keaktifan siswa (1: Aktif, 0: Nonaktif/Pindah/Lulus)
}

/**
 * Aktivitas atau Agenda Penilaian yang dibuat oleh Guru.
 * Contoh: "Kuis Harian 1", "Ujian Tengah Semester", "Tugas Praktik HTML".
 */
export interface AktivitasNilai {
  id: number;                  // ID unik aktivitas penilaian (Primary Key)
  nama_aktivitas: string;      // Deskripsi atau nama aktivitas evaluasi
  tanggal: string;             // Tanggal pelaksanaan evaluasi (format YYYY-MM-DD)
  kelas_id: number;            // ID Kelas yang dinilai (Foreign Key)
}

/**
 * Rincian nilai yang diperoleh masing-masing siswa pada aktivitas penilaian tertentu.
 */
export interface DetailNilai {
  id: number;                  // ID unik detail nilai (Primary Key)
  aktivitas_id: number;        // ID Aktivitas penilaian yang dirujuk (Foreign Key)
  siswa_nis: string;           // NIS siswa yang mendapatkan nilai (Foreign Key)
  nilai: number;               // Nilai numerik siswa (skala 0 - 100)
  catatan: string;             // Catatan guru terkait pencapaian siswa (contoh: "Butuh bimbingan", "Sangat Baik")
}

/**
 * Sesi Absensi Harian yang dibuat untuk merekam kehadiran kelas pada tanggal tertentu.
 */
export interface Absensi {
  id: number;                  // ID unik sesi absensi (Primary Key)
  tanggal: string;             // Tanggal pelaksanaan absensi (format YYYY-MM-DD)
  kelas_id: number;            // ID Kelas yang diabsensi (Foreign Key)
}

/**
 * Status kehadiran masing-masing siswa pada sesi absensi tertentu.
 */
export interface DetailAbsensi {
  id: number;                  // ID unik detail kehadiran (Primary Key)
  absensi_id: number;          // ID Sesi absensi yang dirujuk (Foreign Key)
  siswa_nis: string;           // NIS siswa yang bersangkutan (Foreign Key)
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa'; // Status kehadiran resmi
  updated_at: string;          // Tanggal & waktu pembaruan data terakhir
}

/**
 * Representasi Pengguna (Akun) dalam Sistem SIM-IBU.
 * Mendukung otorisasi multi-peran (Role-based Access Control).
 */
export interface Pengguna {
  id: number;                  // ID unik pengguna/akun (Primary Key)
  username: string;            // Username unik untuk proses login/autentikasi
  nama: string;                // Nama lengkap dengan gelar (jika ada)
  role: 'guru' | 'admin' | 'wali_murid' | 'bk' | 'kajur' | 'kepsek'; // Hak akses spesifik dalam aplikasi
  token?: string;              // Token autentikasi sesi (opsional)
  nip?: string;                // Nomor Induk Pegawai bagi guru/staf (opsional)
  jabatan?: string;            // Deskripsi jabatan tambahan (contoh: "Kepala Komite", "Waka Kurikulum")
  siswa_nis?: string | null;   // Khusus Wali Murid: NIS siswa yang diasuh (menghubungkan akun ke siswa)
  kelas_id?: number | null;    // Kelas asuhan (Wali Kelas) atau kelas anak (Wali Murid)
  jurusan?: string;            // Jurusan yang dinaungi (khusus Kepala Jurusan / Kajur)
  is_cuti?: number;            // Status cuti guru (1: Cuti, 0: Aktif Mengajar)
}

/**
 * Jadwal Pelajaran (KBM) mingguan yang mengikat Guru, Kelas, dan Mata Pelajaran.
 */
export interface Jadwal {
  id: number;                  // ID unik jadwal pelajaran (Primary Key)
  kelas_id: number;            // ID Kelas yang diajar (Foreign Key)
  guru_id: number;             // ID Guru pengampu mata pelajaran (Foreign Key)
  mata_pelajaran: string;      // Nama mata pelajaran (contoh: "Pemrograman Web", "Matematika")
  hari: string;                // Hari mengajar (contoh: "Senin", "Selasa", dst.)
  waktu_mulai: string;         // Jam mulai mengajar (format HH:MM, contoh: "07:30")
  waktu_selesai: string;       // Jam selesai mengajar (format HH:MM, contoh: "09:00")
  nama_kelas?: string;         // Nama kelas (opsional, diambil via JOIN)
  nama_guru?: string;          // Nama guru pengampu (opsional, diambil via JOIN)
  username_guru?: string;      // Username guru pengampu (opsional, diambil via JOIN)
}

/**
 * Catatan Pembinaan atau Catatan Karakter yang dibuat oleh Wali Kelas untuk siswa asuhannya.
 * Catatan ini nantinya dapat diakses juga oleh guru Bimbingan Konseling (BK).
 */
export interface CatatanWaliKelas {
  id: number;                  // ID unik catatan pembinaan (Primary Key)
  siswa_nis: string;           // NIS siswa yang dibina (Foreign Key)
  kelas_id: number;            // ID Kelas siswa saat catatan dibuat (Foreign Key)
  guru_id: number;             // ID Guru yang menulis catatan (Foreign Key)
  kategori: string;            // Kategori pembinaan (contoh: "Konseling", "Prestasi", "Pelanggaran")
  catatan: string;             // Isi rincian pembinaan atau kejadian yang dicatat
  tanggal: string;             // Tanggal pencatatan (format YYYY-MM-DD)
  nama_siswa?: string;         // Nama siswa (opsional, diambil via JOIN)
  nama_guru?: string;          // Nama pembuat catatan/wali kelas (opsional, diambil via JOIN)
}

/**
 * Surat Keputusan atau Rekomendasi yang diterbitkan oleh Guru Bimbingan Konseling (BK).
 * Contoh: "Surat Panggilan Orang Tua", "Rekomendasi Penyaluran PKL", atau "Peringatan Kedisplinan".
 */
export interface SuratBk {
  id: number;                  // ID unik dokumen/surat BK (Primary Key)
  siswa_nis: string;           // NIS siswa yang bersangkutan (Foreign Key)
  guru_id: number;             // ID Guru BK yang merilis dokumen (Foreign Key)
  jenis_surat: string;         // Jenis dokumen (contoh: "Surat Panggilan I", "Surat Peringatan")
  tanggal: string;             // Tanggal penerbitan dokumen (format YYYY-MM-DD)
  keterangan: string;          // Rincian kronologis atau alasan penerbitan dokumen
  status: string;              // Status tindak lanjut (contoh: "Menunggu Tindak Lanjut", "Selesai")
  nama_siswa?: string;         // Nama siswa (opsional, diambil via JOIN)
  nama_guru?: string;          // Nama guru BK penerbit (opsional, diambil via JOIN)
  nama_kelas?: string;         // Nama kelas siswa (opsional, diambil via JOIN)
  nama_walikelas?: string;     // Nama wali kelas siswa (opsional, diambil via JOIN)
}


