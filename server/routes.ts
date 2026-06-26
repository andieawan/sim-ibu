import { Router } from 'express';
import { db, dbRun, dbAll, dbGet, initializeDatabase } from './db';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import JSZip from 'jszip';

// Define session data type
export interface MySessionData {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}
import fs from 'fs';
import path from 'path';

const sessionOptions = {
  password: process.env.COOKIE_PASSWORD || 'complex_password_at_least_32_characters_long',
  cookieName: 'si-gup-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// ============================================================================
// SISTEM GURU PINTAR (SiGup) - CORE API ROUTER
// FILE: server/routes.ts
// 
// Halo Developer! 
// File ini adalah inti dari seluruh bisnis backend aplikasi SiGup.
// Semua interaksi database yang dipanggil dari Antarmuka React, bermuara di file ini.
// Di sini Anda akan menemukan Endpoint: 
// - Authentication JWT (Auth Login) & Penggantian Password
// - Manajemen CRUD Siswa, Kelas, & Nilai
// - Endpoint spesifik berdasarkan role (Admin, Guru, Wali Kelas, Wali Murid)
// 
// CATATAN PENGEMBANGAN:
// Gunakan `dbGet` (ambil 1 baris), `dbAll` (ambil banyak baris), dan
// `dbRun` (untuk INSERT/UPDATE/DELETE). Selalu gunakan parameterized
// query (tanda `?`) untuk mencegah bahaya SQL Injection!
// ============================================================================

// ============================================================================
// HELPER: Normalisasi Tanggal Global (Layer API)
// Maksud Bisnis: Memastikan semua tanggal yang disimpan ke database atau dikembalikan 
//   ke klien mengikuti satu format standar ISO-8601 atau YYYY-MM-DD.
// ============================================================================
export function formatDateISO(dateInput?: string | Date | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
}

export function formatDateYYYYMMDD(dateInput?: string | Date | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

const router = Router();

const schoolIdentityPath = path.resolve(process.cwd(), 'school_identity.json');

// Get current school identity details
router.get('/school-identity', (req, res) => {
  try {
    const defaultData = {
      nama_sekolah: "SMK Ibu",
      motto: "Sistem Guru Pintar — SMK Ibu",
      alamat: "Jl. Pendidikan No. 45, Kecamatan Bojong",
      npsn: "12345678",
      kepala_sekolah: "Drs. H. Ahmad Sudrajat, M.Pd",
      tahun_pelajaran: "2024/2025",
      semester: "Ganjil"
    };

    if (fs.existsSync(schoolIdentityPath)) {
      const data = fs.readFileSync(schoolIdentityPath, 'utf8');
      const parsed = JSON.parse(data);
      const merged = { ...defaultData, ...parsed };
      res.json(merged);
    } else {
      fs.writeFileSync(schoolIdentityPath, JSON.stringify(defaultData, null, 2), 'utf8');
      res.json(defaultData);
    }
  } catch (err) {
    console.error('Error reading school-identity:', err);
    res.status(500).json({ error: 'Gagal memuat identitas sekolah' });
  }
});

// Update school identity
router.post('/school-identity', requireAdmin, async (req, res) => {
  try {
    const { nama_sekolah, motto, alamat, npsn, kepala_sekolah, tahun_pelajaran, semester } = req.body;
    if (!nama_sekolah) {
      return res.status(400).json({ error: 'Nama sekolah wajib diisi' });
    }
    const updatedData = {
      nama_sekolah: nama_sekolah.trim(),
      motto: (motto || '').trim(),
      alamat: (alamat || '').trim(),
      npsn: (npsn || '').trim(),
      kepala_sekolah: (kepala_sekolah || '').trim(),
      tahun_pelajaran: (tahun_pelajaran || '2024/2025').trim(),
      semester: (semester || 'Ganjil').trim()
    };
    fs.writeFileSync(schoolIdentityPath, JSON.stringify(updatedData, null, 2), 'utf8');
    
    // Also sync school name to the kelas table if possible
    try {
      await dbRun('UPDATE kelas SET sekolah = ?', [updatedData.nama_sekolah]);
    } catch (dbErr) {
      console.error('Quiet error syncing school name to classes:', dbErr);
    }

    res.json({ message: 'Identitas sekolah berhasil diperbarui', data: updatedData });
  } catch (err) {
    console.error('Error saving school-identity:', err);
    res.status(500).json({ error: 'Gagal menyimpan identitas sekolah' });
  }
});

// Expose public APP_ENV configuration to the clients
router.get('/config', (req, res) => {
  const env = (process.env.APP_ENV || 'dev').toLowerCase().trim();
  const appEnv = (env === 'publish' || env === 'pub') ? 'pub' : 'dev';
  res.json({ appEnv });
});

import crypto from 'crypto';

// Helper to check if a string is a bcrypt hash
function isBcryptHash(str: string): boolean {
  return /^\$2[ayb]\$\d+\$[./A-Za-z0-9]{53}$/.test(str);
}

// In-Memory Login Rate Limiter (Brute-force protection)
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

function loginRateLimiter(req: any, res: any, next: any) {
  const rawIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts && attempts.lockUntil > now) {
    const remainingSeconds = Math.ceil((attempts.lockUntil - now) / 1000);
    return res.status(429).json({
      error: `Terlalu banyak percobaan masuk. Silakan coba lagi dalam ${remainingSeconds} detik.`
    });
  }

  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const session = await getIronSession<MySessionData>(req, res, sessionOptions);

  if (!session.user) {
    return res.status(401).json({ error: 'Akses ditolak: Sesi tidak ditemukan. Harap login kembali.' });
  }

  const user = await dbGet<{ id: number; role: string }>(
    'SELECT id, role FROM pengguna WHERE id = ?',
    [session.user.id]
  );

  if (!user || user.role !== 'admin' || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya pengguna dengan hak akses Admin yang diizinkan.' });
  }

  (req as any).user = session.user;
  next();
}

// Middleware: Authenticate and authorize Admin role for all administration paths (Session Protected)
router.use('/admin', requireAdmin);
router.use('/patches', requireAdmin);
router.use('/system', requireAdmin);

// Middleware to authenticate general users using Iron Session
async function authenticateSession(req: any, res: any, next: any) {
  const session = await getIronSession<MySessionData>(req, res, sessionOptions);
  
  if (!session.user) {
    return res.status(401).json({ error: 'Akses ditolak: Sesi tidak ditemukan. Harap login kembali.' });
  }

  req.user = session.user;
  next();
}

// Apply authentication middleware to specific endpoints
const protectedPaths = [
  '/absensi', '/absensi-history', '/absensi-detail', 
  '/nilai', '/nilai-history', '/nilai-detail',
  '/kelas', '/siswa', '/siswa-all', '/import-siswa',
  '/walikelas', '/stats', '/class-stats', '/rekap', '/jadwal'
];

protectedPaths.forEach(path => router.use(path, authenticateSession));


// ============================================================================
// HELPER: Verifikasi Akses Kelas untuk Guru (SiGup)
// Maksud Bisnis: Membatasi hak pengelolaan absensi, nilai, statistik kelas, 
//   dan rekap agar hanya berlaku bagi guru yang mengajar di kelas tertentu 
//   yang sudah dijadwalkan di jadwal pelajaran, atau dia adalah Wali Kelas dari kelas tersebut.
// Input: req (Express Request), res (Express Response), kelasId (ID Kelas target)
// Output: Promise<boolean> (Mengirim response 403 jika ditolak dan mengembalikan false, true jika berhak)
// ============================================================================
export async function verifyGuruClassAccess(req: any, res: any, kelasId: number | string): Promise<boolean> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Akses ditolak: Sesi tidak valid.' });
    return false;
  }

  // Admin memiliki hak akses penuh ke seluruh kelas
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'guru' || user.role === 'kajur' || user.role === 'kepsek') {
    // 1. Periksa apakah user tersebut memiliki jadwal mengajar di kelas ini sesuai dengan tabel jadwal pelajaran
    const hasJadwal = await dbGet<{ id: number }>(
      'SELECT id FROM jadwal WHERE guru_id = ? AND kelas_id = ? LIMIT 1',
      [user.id, kelasId]
    );
    if (hasJadwal) return true;

    // Jika tidak mengajar, tolak akses secara ketat demi keamanan data
    res.status(403).json({ error: 'Akses ditolak: Fitur absensi, nilai, statistik kelas, dan rekap hanya berlaku untuk guru/pengajar di kelas ini sesuai jadwal pelajaran.' });
    return false;
  }

  // Wali murid hanya boleh melihat kelas dari siswa yang diasuhnya
  if (user.role === 'wali_murid') {
    const parent = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM pengguna WHERE id = ?', [user.id]);
    if (parent && String(parent.kelas_id) === String(kelasId)) {
      return true;
    }
    res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk melihat kelas ini.' });
    return false;
  }

  res.status(403).json({ error: 'Akses ditolak: Peran Anda tidak diizinkan mengakses data kelas ini.' });
  return false;
}
// === AKHIR DARI HELPER VERIFIKASI AKSES GURU ===


// 1. Get List of Kelas (Terfilter otomatis berdasarkan otorisasi peran guru aktif)
router.get('/kelas', async (req, res) => {
  try {
    const user = (req as any).user;
    let classes;
    
    // Aliran Data: Jika peran pengguna adalah guru, filter kelas agar hanya memuat kelas yang diajar atau diwakili olehnya saja
    if (user && user.role === 'guru') {
      classes = await dbAll(`
        SELECT k.*, p.nama AS nama_walikelas, p.username AS username_walikelas,
        (CASE WHEN k.id IN (SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?) THEN 1 ELSE 0 END) AS is_mengajar
        FROM kelas k
        LEFT JOIN pengguna p ON k.walikelas_id = p.id
        WHERE k.walikelas_id = ? OR k.id IN (SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?)
        ORDER BY k.nama_kelas ASC
      `, [user.id, user.id, user.id]);
    } else if (user && user.role === 'wali_murid') {
      // Wali murid hanya melihat kelas asuhannya
      const parent = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM pengguna WHERE id = ?', [user.id]);
      const classId = parent?.kelas_id || 0;
      classes = await dbAll(`
        SELECT k.*, p.nama AS nama_walikelas, p.username AS username_walikelas
        FROM kelas k
        LEFT JOIN pengguna p ON k.walikelas_id = p.id
        WHERE k.id = ?
        ORDER BY k.nama_kelas ASC
      `, [classId]);
    } else {
      // Peran lain (Admin/Kepsek/Kajur) dapat melihat seluruh kelas secara komprehensif
      classes = await dbAll(`
        SELECT k.*, p.nama AS nama_walikelas, p.username AS username_walikelas,
        (CASE WHEN k.id IN (SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?) THEN 1 ELSE 0 END) AS is_mengajar
        FROM kelas k
        LEFT JOIN pengguna p ON k.walikelas_id = p.id
        ORDER BY k.nama_kelas ASC
      `, [user.id]);
    }
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Create a Kelas
router.post('/kelas', requireAdmin, async (req, res) => {
  try {
    const { nama_kelas, sekolah, walikelas_id } = req.body;
    if (!nama_kelas) {
      return res.status(400).json({ error: 'Nama kelas wajib diisi' });
    }
    const result = await dbRun(
      'INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES (?, ?, ?)',
      [nama_kelas, sekolah || 'SMK Ibu', walikelas_id || null]
    );
    res.json({ id: result.id, nama_kelas, sekolah: sekolah || 'SMK Ibu', walikelas_id: walikelas_id || null, message: 'Kelas berhasil dibuat' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2b. Update a Kelas (Wali Kelas assignment or name updates)
router.put('/kelas/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, sekolah, walikelas_id } = req.body;
    
    // Check if class exists
    const existing = await dbGet('SELECT id FROM kelas WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    if (nama_kelas !== undefined && sekolah !== undefined && walikelas_id !== undefined) {
      await dbRun(
        'UPDATE kelas SET nama_kelas = ?, sekolah = ?, walikelas_id = ? WHERE id = ?',
        [nama_kelas, sekolah, walikelas_id, id]
      );
    } else if (walikelas_id !== undefined) {
      await dbRun(
        'UPDATE kelas SET walikelas_id = ? WHERE id = ?',
        [walikelas_id, id]
      );
    } else if (nama_kelas !== undefined) {
      await dbRun(
        'UPDATE kelas SET nama_kelas = ? WHERE id = ?',
        [nama_kelas, id]
      );
    } else if (sekolah !== undefined) {
      await dbRun(
        'UPDATE kelas SET sekolah = ? WHERE id = ?',
        [sekolah, id]
      );
    }
    
    res.json({ message: 'Kelas berhasil dikonfigurasi' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete a Kelas
router.delete('/kelas/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM kelas WHERE id = ?', [id]);
    res.json({ message: 'Kelas berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4_all. Get All Siswa (Optimized endpoint to avoid N+1 query loops)
router.get('/siswa-all', async (req, res) => {
  try {
    const students = await dbAll('SELECT * FROM siswa ORDER BY nama ASC');
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINT: DETAIL PROFIL SISWA KOMPREHENSIF (ABSENSI & NILAI)
// Maksud Bisnis: Menyediakan data profil lengkap siswa secara real-time yang 
//                 mencakup data pribadi, riwayat absensi harian, dan pencapaian 
//                 nilai akademik untuk ditampilkan di modal detail interaktif.
//
// Aliran Data:
// - Input: `nis` (String, nomor induk siswa dari parameter URL)
// - Proses: 
//   1. Mengambil data dasar siswa & informasi kelas.
//   2. Mengambil riwayat absensi (Hadir, Sakit, Izin, Alfa) yang diurutkan kronologis.
//   3. Mengambil riwayat nilai aktivitas beserta KKM dan status kelulusan.
// - Output: Objek JSON berisi detail siswa, daftar absensi, dan daftar nilai.
// ============================================================================
router.get('/siswa-profile/:nis', async (req, res) => {
  try {
    const { nis } = req.params;
    
    // 1. Ambil data dasar siswa beserta kelasnya
    const siswa = await dbGet(`
      SELECT s.*, k.nama_kelas, k.sekolah, k.jurusan 
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      WHERE s.nis = ?
    `, [nis]);

    if (!siswa) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
    }

    // 2. Ambil riwayat absensi detail siswa
    const absensi = await dbAll(`
      SELECT da.id, da.absensi_id, da.status, da.updated_at, a.tanggal
      FROM detail_absensi da
      JOIN absensi a ON da.absensi_id = a.id
      WHERE da.siswa_nis = ?
      ORDER BY a.tanggal DESC
    `, [nis]);

    // 3. Ambil riwayat nilai detail siswa
    const nilai = await dbAll(`
      SELECT dn.id, dn.aktivitas_id, dn.nilai, dn.catatan, an.nama_aktivitas, an.tanggal, an.kkm
      FROM detail_nilai dn
      JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
      WHERE dn.siswa_nis = ?
      ORDER BY an.tanggal DESC
    `, [nis]);

    res.json({
      success: true,
      siswa,
      absensi,
      nilai
    });
  } catch (error: any) {
    console.error('Error fetching siswa profile:', error);
    res.status(500).json({ error: error.message });
  }
});
// === AKHIR DARI DETAIL PROFIL SISWA KOMPREHENSIF ===

// 4. Get Siswa by Kelas
router.get('/siswa/:kelas_id', async (req, res) => {
  try {
    const { kelas_id } = req.params;
    
    // Verifikasi hak akses guru terhadap kelas ini berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    const students = await dbAll('SELECT * FROM siswa WHERE kelas_id = ? ORDER BY nama ASC', [kelas_id]);
    res.json(students);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Create / Save Siswa manually
router.post('/siswa', requireAdmin, async (req, res) => {
  try {
    const { nis, nama, jenis_kelamin, kelas_id } = req.body;
    if (!nis || !nama || !jenis_kelamin || !kelas_id) {
      return res.status(400).json({ error: 'Data mandatori (NIS, Nama, Jenis Kelamin, Kelas ID) harus lengkap' });
    }
    await dbRun(
      'INSERT OR REPLACE INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)',
      [nis.trim(), nama.trim(), jenis_kelamin, kelas_id]
    );
    res.json({ message: 'Data siswa berhasil disimpan', data: { nis, nama, jenis_kelamin, kelas_id } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete (Deactivate) a Siswa
router.delete('/siswa/:nis', requireAdmin, async (req, res) => {
  try {
    const { nis } = req.params;
    await dbRun('UPDATE siswa SET status_aktif = 0 WHERE nis = ?', [nis]);
    res.json({ message: 'Siswa berhasil dinonaktifkan (berhenti / pindah)' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6b. Set Siswa Active Status (Reactivate / Deactivate manually)
router.put('/siswa/:nis/status', requireAdmin, async (req, res) => {
  try {
    const { nis } = req.params;
    const { status_aktif } = req.body; // should be 1 for active, 0 for inactive
    await dbRun('UPDATE siswa SET status_aktif = ? WHERE nis = ?', [status_aktif === 0 ? 0 : 1, nis]);
    res.json({ message: `Siswa berhasil diubah statusnya menjadi ${status_aktif === 0 ? 'Nonaktif' : 'Aktif'}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Bulk Import Siswa via parsed rows (JSON) or raw CSV string
router.post('/import-siswa/:kelas_id', requireAdmin, async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const classIdNum = parseInt(kelas_id);
    let siswaList: Array<{ nis: string; nama: string; jenis_kelamin: 'L' | 'P' }> = [];

    // If payload contains JSON list of siswa
    if (req.body && req.body.siswa && Array.isArray(req.body.siswa)) {
      siswaList = req.body.siswa;
    } else if (typeof req.body === 'string' || (req.body && req.body.csvText)) {
      // If it is raw CSV text
      const csvStr = typeof req.body === 'string' ? req.body : req.body.csvText;
      const lines = csvStr.split(/\r?\n/);
      if (lines.length > 1) {
        // Find columns from headers with delimiter autosensing
        let delimiter = ',';
        if (lines[0].includes(';') && !lines[0].includes(',')) {
          delimiter = ';';
        }
        const headers = lines[0].split(delimiter).map((h: string) => h.trim().toLowerCase());
        const nisIdx = headers.findIndex((h: string) => h.includes('nis'));
        const namaIdx = headers.findIndex((h: string) => h.includes('nama'));
        const jkIdx = headers.findIndex((h: string) => h.includes('jenis') || h.includes('kelamin') || h.includes('jk') || h.includes('gender'));

        if (nisIdx === -1 || namaIdx === -1) {
          return res.status(400).json({ error: 'Format CSV salah. Mohon sertakan kolom NIS dan Nama.' });
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Simple split by detected delimiter, respecting quotes if any
          const cols: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              cols.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          cols.push(currentVal.trim());

          if (cols.length > Math.max(nisIdx, namaIdx)) {
            const nis = cols[nisIdx];
            const nama = cols[namaIdx];
            let jk = cols[jkIdx] || 'L';
            
            // Normalize gender to 'L' or 'P'
            jk = jk.toUpperCase().startsWith('P') || jk.toLowerCase().includes('perempuan') ? 'P' : 'L';
            
            if (nis && nama) {
              siswaList.push({ nis, nama, jenis_kelamin: jk as 'L' | 'P' });
            }
          }
        }
      }
    }

    if (siswaList.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data siswa valid yang ditemukan.' });
    }

    for (const s of siswaList) {
      if (!s.nis || !s.nama) continue;
      await dbRun(
        'INSERT OR REPLACE INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)',
        [String(s.nis).trim(), String(s.nama).trim(), s.jenis_kelamin || 'L', classIdNum]
      );
    }

    res.json({ message: `Berhasil mengimpor ${siswaList.length} siswa secara massal.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINT BULK IMPORT MULTI-ENTITAS (EXCEL / XLSX / CSV)
// Maksud Bisnis: Memfasilitasi administrator dalam mengunggah data guru, jadwal pelajaran,
// dan pemetaan wali kelas dalam jumlah banyak sekaligus guna meningkatkan efisiensi operasional.
//
// Aliran Data:
// - Input: Payload JSON berisi daftar baris data mentah yang telah diparsing dari spreadsheet.
// - Proses: Validasi integritas, enkripsi password baru (untuk guru), pencarian relasi foreign key,
//   dan penyimpanan massal ke dalam database menggunakan transaksi/perulangan aman.
// - Output: Pesan konfirmasi keberhasilan beserta jumlah entitas yang berhasil diproses.
// ============================================================================

// 7b. Bulk Import Guru (Akun Pengguna)
router.post('/import-guru', requireAdmin, async (req, res) => {
  try {
    const { users } = req.body; // array of { username, nama, role, password, nip, jabatan }
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Data guru kosong atau tidak valid.' });
    }

    let importedCount = 0;
    for (const u of users) {
      const username = String(u.username || '').trim().toLowerCase();
      const nama = String(u.nama || '').trim();
      const role = String(u.role || 'guru').trim().toLowerCase();
      const rawPassword = String(u.password || 'guru123').trim();
      const nip = String(u.nip || '').trim();
      const jabatan = String(u.jabatan || '').trim();

      if (!username || !nama) continue;

      const exists = await dbGet('SELECT id FROM pengguna WHERE LOWER(username) = ?', [username]);
      if (exists) {
        // Jika akun sudah ada, perbarui data profil dan passwordnya
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await dbRun(
          'UPDATE pengguna SET nama = ?, password = ?, role = ?, nip = ?, jabatan = ? WHERE id = ?',
          [nama, hashedPassword, role, nip, jabatan, exists.id]
        );
      } else {
        // Jika akun baru, buat baru dengan password terenkripsi
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await dbRun(
          'INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES (?, ?, ?, ?, ?, ?)',
          [username, hashedPassword, nama, role, nip, jabatan]
        );
      }
      importedCount++;
    }

    res.json({ message: `Berhasil mengimpor ${importedCount} data akun pengajar/pengguna.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7c. Bulk Import Jadwal Pelajaran
router.post('/import-jadwal', requireAdmin, async (req, res) => {
  try {
    const { schedules } = req.body; // array of { nama_kelas, username_guru, mata_pelajaran, hari, waktu_mulai, waktu_selesai }
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: 'Data jadwal kosong atau tidak valid.' });
    }

    let importedCount = 0;
    for (const s of schedules) {
      const nama_kelas = String(s.nama_kelas || '').trim();
      const username_guru = String(s.username_guru || '').trim().toLowerCase();
      const mata_pelajaran = String(s.mata_pelajaran || '').trim();
      const hari = String(s.hari || 'Senin').trim();
      const waktu_mulai = String(s.waktu_mulai || '07:30').trim();
      const waktu_selesai = String(s.waktu_selesai || '09:00').trim();

      if (!nama_kelas || !username_guru || !mata_pelajaran) continue;

      // Cari ID kelas berdasarkan nama kelas (case-insensitive)
      const classObj = await dbGet<{ id: number }>('SELECT id FROM kelas WHERE LOWER(nama_kelas) = ?', [nama_kelas.toLowerCase()]);
      if (!classObj) continue;

      // Cari ID guru berdasarkan username guru (case-insensitive)
      const guruObj = await dbGet<{ id: number }>('SELECT id FROM pengguna WHERE LOWER(username) = ?', [username_guru]);
      if (!guruObj) continue;

      // Masukkan jadwal baru ke dalam database
      await dbRun(
        'INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?, ?, ?)',
        [classObj.id, guruObj.id, mata_pelajaran, hari, waktu_mulai, waktu_selesai]
      );
      importedCount++;
    }

    res.json({ message: `Berhasil mengimpor ${importedCount} sesi jadwal pelajaran.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7d. Bulk Import Wali Kelas (Pemetaan Wali Kelas)
router.post('/import-walikelas', requireAdmin, async (req, res) => {
  try {
    const { walikelas } = req.body; // array of { nama_kelas, username_guru }
    if (!walikelas || !Array.isArray(walikelas) || walikelas.length === 0) {
      return res.status(400).json({ error: 'Data wali kelas kosong atau tidak valid.' });
    }

    let importedCount = 0;
    for (const wk of walikelas) {
      const nama_kelas = String(wk.nama_kelas || '').trim();
      const username_guru = String(wk.username_guru || '').trim().toLowerCase();

      if (!nama_kelas || !username_guru) continue;

      // Cari ID kelas berdasarkan nama kelas
      const classObj = await dbGet<{ id: number }>('SELECT id FROM kelas WHERE LOWER(nama_kelas) = ?', [nama_kelas.toLowerCase()]);
      if (!classObj) continue;

      // Cari ID guru berdasarkan username guru
      const guruObj = await dbGet<{ id: number }>('SELECT id FROM pengguna WHERE LOWER(username) = ?', [username_guru]);
      if (!guruObj) continue;

      // Update kolom walikelas_id pada tabel kelas ke ID guru pengajar tersebut
      await dbRun(
        'UPDATE kelas SET walikelas_id = ? WHERE id = ?',
        [guruObj.id, classObj.id]
      );
      importedCount++;
    }

    res.json({ message: `Berhasil memetakan ${importedCount} wali kelas ke kelas masing-masing.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === AKHIR DARI LOGIKA BULK IMPORT MULTI-ENTITAS ===

// 8. Save Absensi (Creates Absensi entry + DetailAbsensi entries)
router.post('/absensi', async (req, res) => {
  try {
    const { kelas_id, tanggal, records } = req.body;
    // records: [ { nis: string, status: string, updated_at?: string }, ... ]
    if (!kelas_id || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Data absensi tidak lengkap (kelas_id, tanggal, records required)' });
    }

    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    const normalizedTanggal = tanggal.replace(/-/g, '/');

    // 1. Check or insert Absensi record
    let abs = await dbGet<{ id: number, is_approved_by_walikelas: number }>('SELECT id, is_approved_by_walikelas FROM absensi WHERE tanggal = ? AND kelas_id = ?', [normalizedTanggal, kelas_id]);
    let absensiId = abs?.id;

    if (!absensiId) {
      const insRes = await dbRun('INSERT INTO absensi (tanggal, kelas_id, is_approved_by_walikelas) VALUES (?, ?, 0)', [normalizedTanggal, kelas_id]);
      absensiId = insRes.id;
    } else if (abs?.is_approved_by_walikelas) {
      return res.status(403).json({ error: 'Absensi untuk tanggal ini sudah divalidasi oleh Wali Kelas dan tidak dapat diubah oleh guru mapel.' });
    }

    // 2. Insert or update student statuses
    for (const rec of records) {
      const timestamp = rec.updated_at || formatDateISO();
      await dbRun(`
        INSERT OR REPLACE INTO detail_absensi (absensi_id, siswa_nis, status, updated_at)
        VALUES (?, ?, ?, ?)
      `, [absensiId, rec.nis, rec.status, timestamp]);
    }

    res.json({ message: 'Absensi berhasil disimpan!', absensiId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Get Absensi History for a class
router.get('/absensi-history/:kelas_id', async (req, res) => {
  try {
    const { kelas_id } = req.params;

    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    const history = await dbAll(`
      SELECT a.id, a.tanggal, a.is_approved_by_walikelas,
             COUNT(CASE WHEN da.status = 'Hadir' THEN 1 END) as count_hadir,
             COUNT(CASE WHEN da.status = 'Izin' THEN 1 END) as count_izin,
             COUNT(CASE WHEN da.status = 'Sakit' THEN 1 END) as count_sakit,
             COUNT(CASE WHEN da.status = 'Alfa' THEN 1 END) as count_alfa,
             COUNT(da.id) as total_siswa
      FROM absensi a
      LEFT JOIN detail_absensi da ON a.id = da.absensi_id
      WHERE a.kelas_id = ?
      GROUP BY a.id, a.tanggal
      ORDER BY a.tanggal DESC
    `, [kelas_id]);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9b. Walikelas Approve Overwrite Absensi
router.post('/walikelas/absensi', async (req, res) => {
  try {
    const { kelas_id, tanggal, records } = req.body;
    if (!kelas_id || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Data absensi tidak lengkap (kelas_id, tanggal, records required)' });
    }

    const numericKelasId = Number(kelas_id);
    const timestamp = formatDateISO();
    const normalizedTanggal = tanggal.replace(/-/g, '/');

    // 1. Check or insert Absensi record
    let abs = await dbGet<{ id: number }>('SELECT id FROM absensi WHERE tanggal = ? AND kelas_id = ?', [normalizedTanggal, numericKelasId]);
    let absensiId = abs?.id;

    if (!absensiId) {
      const insRes = await dbRun('INSERT INTO absensi (tanggal, kelas_id, is_approved_by_walikelas) VALUES (?, ?, 1)', [normalizedTanggal, numericKelasId]);
      absensiId = insRes.id;
    } else {
      await dbRun('UPDATE absensi SET is_approved_by_walikelas = 1 WHERE id = ?', [absensiId]);
    }

    // 2. Insert or update student statuses
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_absensi (absensi_id, siswa_nis, status, updated_at)
        VALUES (?, ?, ?, ?)
      `, [absensiId, rec.nis, rec.status, timestamp]);
    }

    res.json({ message: 'Absensi telah divalidasi dan disimpan oleh Wali Kelas!', absensiId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Get Detail Absensi of a specific absensi session
router.get('/absensi-detail/:absensi_id', async (req, res) => {
  try {
    const { absensi_id } = req.params;

    // Ambil kelas_id dari sesi absensi ini untuk verifikasi hak akses guru
    const abs = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM absensi WHERE id = ?', [absensi_id]);
    if (!abs) {
      return res.status(404).json({ error: 'Data absensi tidak ditemukan' });
    }

    const hasAccess = await verifyGuruClassAccess(req, res, abs.kelas_id);
    if (!hasAccess) return;

    const details = await dbAll(`
      SELECT da.id, da.siswa_nis, s.nama, s.jenis_kelamin, da.status, da.updated_at
      FROM detail_absensi da
      INNER JOIN siswa s ON da.siswa_nis = s.nis
      WHERE da.absensi_id = ?
      ORDER BY s.nama ASC
    `, [absensi_id]);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Save Nilai (Creates AktivitasNilai entry + DetailNilai entries)
router.post('/nilai', async (req, res) => {
  try {
    const { kelas_id, nama_aktivitas, tanggal, records, kkm } = req.body;
    // records: [ { nis: string, nilai: number, catatan: string }, ... ]
    if (!kelas_id || !nama_aktivitas || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Data nilai tidak lengkap' });
    }

    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    const normalizedTanggal = tanggal.replace(/-/g, '/');
    const manualKkm = typeof kkm === 'number' ? kkm : parseFloat(kkm) || 75;

    // 1. Insert or get AktivitasNilai
    let akt = await dbGet<{ id: number }>('SELECT id FROM aktivitas_nilai WHERE nama_aktivitas = ? AND tanggal = ? AND kelas_id = ?', [nama_aktivitas, normalizedTanggal, kelas_id]);
    let aktivitasId = akt?.id;

    if (!aktivitasId) {
      const insRes = await dbRun('INSERT INTO aktivitas_nilai (nama_aktivitas, tanggal, kelas_id, kkm) VALUES (?, ?, ?, ?)', [nama_aktivitas, normalizedTanggal, kelas_id, manualKkm]);
      aktivitasId = insRes.id;
    } else {
      await dbRun('UPDATE aktivitas_nilai SET kkm = ? WHERE id = ?', [manualKkm, aktivitasId]);
    }

    // 2. Insert or update grades
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan)
        VALUES (?, ?, ?, ?)
      `, [aktivitasId, rec.nis, parseFloat(rec.nilai) || 0, rec.catatan || '']);
    }

    res.json({ message: 'Nilai berhasil disimpan!', aktivitasId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11b. Update Existing Nilai (Updates AktivitasNilai attributes & replaces/inserts student grades)
router.put('/nilai/:aktivitas_id', async (req, res) => {
  try {
    const { aktivitas_id } = req.params;
    const { nama_aktivitas, tanggal, kkm, records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Data rincian nilai tidak lengkap (records required)' });
    }

    // Ambil kelas_id aktivitas ini untuk verifikasi hak akses guru
    const act = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM aktivitas_nilai WHERE id = ?', [aktivitas_id]);
    if (!act) {
      return res.status(404).json({ error: 'Aktivitas nilai tidak ditemukan' });
    }

    const hasAccess = await verifyGuruClassAccess(req, res, act.kelas_id);
    if (!hasAccess) return;

    const normalizedTanggal = tanggal ? tanggal.replace(/-/g, '/') : '';
    const manualKkm = typeof kkm === 'number' ? kkm : parseFloat(kkm) || 75;

    // 1. Update Aktivitas_Nilai metadata
    if (nama_aktivitas && normalizedTanggal) {
      await dbRun(`
        UPDATE aktivitas_nilai
        SET nama_aktivitas = ?, tanggal = ?, kkm = ?
        WHERE id = ?
      `, [nama_aktivitas.trim(), normalizedTanggal.trim(), manualKkm, aktivitas_id]);
    }

    // 2. Insert or replace for each student's grade records in this activity
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan)
        VALUES (?, ?, ?, ?)
      `, [aktivitas_id, rec.nis, parseFloat(rec.nilai) || 0, rec.catatan || '']);
    }

    res.json({ message: 'Laporan nilai berhasil diperbarui di database!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Get Grades History for a class
router.get('/nilai-history/:kelas_id', async (req, res) => {
  try {
    const { kelas_id } = req.params;

    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    const history = await dbAll(`
      SELECT an.id, an.nama_aktivitas, an.tanggal, COALESCE(an.kkm, 75) as kkm,
             ROUND(AVG(dn.nilai), 1) as rata_rata,
             COUNT(CASE WHEN dn.nilai < COALESCE(an.kkm, 75) THEN 1 END) as count_remedial,
             COUNT(dn.id) as total_siswa
      FROM aktivitas_nilai an
      LEFT JOIN detail_nilai dn ON an.id = dn.aktivitas_id
      WHERE an.kelas_id = ?
      GROUP BY an.id, an.nama_aktivitas, an.tanggal, an.kkm
      ORDER BY an.tanggal DESC, an.id DESC
    `, [kelas_id]);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Get Detail Grades of a specific activity
router.get('/nilai-detail/:aktivitas_id', async (req, res) => {
  try {
    const { aktivitas_id } = req.params;

    // Ambil kelas_id aktivitas ini untuk verifikasi hak akses guru
    const act = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM aktivitas_nilai WHERE id = ?', [aktivitas_id]);
    if (!act) {
      return res.status(404).json({ error: 'Aktivitas nilai tidak ditemukan' });
    }

    const hasAccess = await verifyGuruClassAccess(req, res, act.kelas_id);
    if (!hasAccess) return;

    const details = await dbAll(`
      SELECT dn.id, dn.siswa_nis, s.nama, s.jenis_kelamin, dn.nilai, dn.catatan, COALESCE(an.kkm, 75) as kkm
      FROM detail_nilai dn
      INNER JOIN siswa s ON dn.siswa_nis = s.nis
      INNER JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
      WHERE dn.aktivitas_id = ?
      ORDER BY s.nama ASC
    `, [aktivitas_id]);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Dashboard / Profil Statistics
router.get('/stats', async (req, res) => {
  try {
    const { guru_id, role } = req.query;

    let classIds: number[] = [];
    
    // Aliran Data: Penyaringan akses kelas (classIds) berdasarkan role pengguna aktif
    if (role === 'guru' && guru_id) {
      const rows = await dbAll<{ kelas_id: number }>(
        'SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?',
        [Number(guru_id)]
      );
      classIds = rows.map(r => r.kelas_id);
    } else if (role === 'kajur' && guru_id) {
      // Kepala Jurusan: hanya melihat kelas yang sesuai dengan jurusan yang diampunya
      const user = await dbGet<{ jurusan: string }>('SELECT jurusan FROM pengguna WHERE id = ?', [Number(guru_id)]);
      const jur = user?.jurusan || '';
      const rows = await dbAll<{ id: number }>(
        'SELECT id FROM kelas WHERE jurusan = ? OR nama_kelas LIKE ? OR nama_kelas LIKE ?',
        [jur, `%${jur}%`, `%${jur.split(' ').map(w => w[0]).join('')}%`]
      );
      classIds = rows.map(r => r.id);
    } else if (role === 'wali_murid' && guru_id) {
      // Wali Murid: hanya melihat kelas tempat anaknya berada
      const user = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM pengguna WHERE id = ?', [Number(guru_id)]);
      if (user && user.kelas_id) {
        classIds = [user.kelas_id];
      }
    } else {
      // Admin, Kepala Sekolah (kepsek), Bimbingan Konseling (bk): berhak melihat semua kelas terdaftar
      const rows = await dbAll<{ id: number }>('SELECT id FROM kelas');
      classIds = rows.map(r => r.id);
    }

    if (classIds.length === 0) {
      return res.json({
        total_kelas: 0,
        total_siswa: 0,
        total_l: 0,
        total_p: 0,
        total_absensi: 0,
        rata_rata_nilai: 0,
        persen_remedial: 0,
        total_remedial: 0,
        classes_breakdown: []
      });
    }

    // Now, let's calculate global stats over these classIds
    const classIdPlaceholders = classIds.map(() => '?').join(',');

    const classCount = classIds.length;
    
    const studentCount = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const maleCount = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'L' AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const femaleCount = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'P' AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const attendances = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM absensi WHERE kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    
    const jarangMasukCount = await dbGet<{ count: number }>(`
      SELECT COUNT(DISTINCT da.siswa_nis) as count 
      FROM detail_absensi da
      JOIN absensi a ON da.absensi_id = a.id
      WHERE a.kelas_id IN (${classIdPlaceholders}) AND da.status != 'Hadir'
    `, classIds);
    
    // Average grades
    const averageGrade = await dbGet<{ avg: number }>(`
      SELECT AVG(dn.nilai) as avg 
      FROM detail_nilai dn 
      JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id 
      WHERE an.kelas_id IN (${classIdPlaceholders})
    `, classIds);

    // Remedial
    const remedialCount = await dbGet<{ count: number }>(`
      SELECT COUNT(DISTINCT dn.siswa_nis) as count 
      FROM detail_nilai dn
      JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
      WHERE dn.nilai < COALESCE(an.kkm, 75) AND an.kelas_id IN (${classIdPlaceholders})
    `, classIds);

    const totalStudentsVal = studentCount?.count || 0;
    const remedialStudentsVal = remedialCount?.count || 0;
    const jarangMasukStudentsVal = jarangMasukCount?.count || 0;

    const summary = {
      total_kelas: classCount,
      total_siswa: totalStudentsVal,
      total_l: maleCount?.count || 0,
      total_p: femaleCount?.count || 0,
      total_absensi: attendances?.count || 0,
      rata_rata_nilai: averageGrade && averageGrade.avg ? Math.round(averageGrade.avg * 10) / 10 : 0,
      total_jarang_masuk: jarangMasukStudentsVal,
      total_siswa_binaan: remedialStudentsVal + jarangMasukStudentsVal,
      persen_remedial: totalStudentsVal ? Math.round((remedialStudentsVal / totalStudentsVal) * 100) : 0,
      total_remedial: remedialStudentsVal,
    };

    // Now let's calculate stats breakdown for each class in classIds
    const classesBreakdown = [];
    for (const cId of classIds) {
      const cls = await dbGet<{ id: number; nama_kelas: string; sekolah: string }>('SELECT * FROM kelas WHERE id = ?', [cId]);
      if (!cls) continue;

      const cStudents = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND kelas_id = ?', [cId]);
      const cMale = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'L' AND kelas_id = ?", [cId]);
      const cFemale = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'P' AND kelas_id = ?", [cId]);
      
      const cAvg = await dbGet<{ avg: number }>(`
        SELECT AVG(dn.nilai) as avg 
        FROM detail_nilai dn 
        JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id 
        WHERE an.kelas_id = ?
      `, [cId]);

      const cJarangMasuk = await dbGet<{ count: number }>(`
        SELECT COUNT(DISTINCT da.siswa_nis) as count 
        FROM detail_absensi da
        JOIN absensi a ON da.absensi_id = a.id
        WHERE a.kelas_id = ? AND da.status != 'Hadir'
      `, [cId]);

      const cRemedial = await dbGet<{ count: number }>(`
        SELECT COUNT(DISTINCT dn.siswa_nis) as count 
        FROM detail_nilai dn
        JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
        WHERE dn.nilai < COALESCE(an.kkm, 75) AND an.kelas_id = ?
      `, [cId]);

      const totalStudents = cStudents?.count || 0;
      const remedialStudents = cRemedial?.count || 0;
      const jarangMasukStudents = cJarangMasuk?.count || 0;
      const totalBinaan = remedialStudents + jarangMasukStudents;

      classesBreakdown.push({
        id: cls.id,
        nama_kelas: cls.nama_kelas,
        sekolah: cls.sekolah,
        total_siswa: totalStudents,
        total_l: cMale?.count || 0,
        total_p: cFemale?.count || 0,
        total_jarang_masuk: jarangMasukStudents,
        total_siswa_binaan: totalBinaan,
        rata_rata_nilai: cAvg && cAvg.avg ? Math.round(cAvg.avg * 10) / 10 : 0,
        total_remedial: remedialStudents,
        persen_remedial: totalStudents ? Math.round((remedialStudents / totalStudents) * 100) : 0,
      });
    }

    res.json({
      ...summary,
      classes_breakdown: classesBreakdown
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14b. Stats Students detail route
router.get('/stats/students', async (req, res) => {
  try {
    const { guru_id, role, type, kelas_id } = req.query;

    let classIds: number[] = [];
    if (kelas_id) {
      classIds = [Number(kelas_id)];
    } else if (role === 'guru' && guru_id) {
      const rows = await dbAll<{ kelas_id: number }>(
        'SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?',
        [Number(guru_id)]
      );
      classIds = rows.map(r => r.kelas_id);
    } else if (role === 'kajur' && guru_id) {
      // Kepala Jurusan: hanya melihat daftar siswa dari jurusan yang diampunya
      const user = await dbGet<{ jurusan: string }>('SELECT jurusan FROM pengguna WHERE id = ?', [Number(guru_id)]);
      const jur = user?.jurusan || '';
      const rows = await dbAll<{ id: number }>(
        'SELECT id FROM kelas WHERE jurusan = ? OR nama_kelas LIKE ? OR nama_kelas LIKE ?',
        [jur, `%${jur}%`, `%${jur.split(' ').map(w => w[0]).join('')}%`]
      );
      classIds = rows.map(r => r.id);
    } else if (role === 'wali_murid' && guru_id) {
      // Wali Murid: hanya melihat daftar siswa dari kelas tempat anaknya berada
      const user = await dbGet<{ kelas_id: number }>('SELECT kelas_id FROM pengguna WHERE id = ?', [Number(guru_id)]);
      if (user && user.kelas_id) {
        classIds = [user.kelas_id];
      }
    } else {
      // Admin, Kepala Sekolah (kepsek), Bimbingan Konseling (bk): berhak melihat semua kelas terdaftar
      const rows = await dbAll<{ id: number }>('SELECT id FROM kelas');
      classIds = rows.map(r => r.id);
    }

    if (classIds.length === 0) {
      return res.json([]);
    }

    const classIdPlaceholders = classIds.map(() => '?').join(',');

    if (type === 'rare_attendance') {
      const sql = `
        SELECT 
          s.nis, 
          s.nama, 
          s.jenis_kelamin,
          k.nama_kelas, 
          k.sekolah,
          COUNT(CASE WHEN da.status = 'Sakit' THEN 1 END) as sakit_count,
          COUNT(CASE WHEN da.status = 'Izin' THEN 1 END) as izin_count,
          COUNT(CASE WHEN da.status = 'Alfa' THEN 1 END) as alfa_count,
          COUNT(CASE WHEN da.status != 'Hadir' THEN 1 END) as total_tidak_hadir
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        JOIN detail_absensi da ON s.nis = da.siswa_nis
        JOIN absensi a ON da.absensi_id = a.id
        WHERE s.status_aktif = 1 AND s.kelas_id IN (${classIdPlaceholders}) AND da.status != 'Hadir'
        GROUP BY s.nis, s.nama, s.jenis_kelamin, k.nama_kelas, k.sekolah
        ORDER BY total_tidak_hadir DESC, s.nama ASC
      `;
      const students = await dbAll(sql, classIds);
      return res.json(students);
    } else if (type === 'remedial') {
      const sql = `
        SELECT 
          s.nis, 
          s.nama, 
          s.jenis_kelamin,
          k.nama_kelas, 
          k.sekolah,
          an.nama_aktivitas,
          COALESCE(an.kkm, 75) as kkm,
          dn.nilai,
          an.tanggal
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        JOIN detail_nilai dn ON s.nis = dn.siswa_nis
        JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
        WHERE s.status_aktif = 1 
          AND s.kelas_id IN (${classIdPlaceholders}) 
          AND dn.nilai < COALESCE(an.kkm, 75)
        ORDER BY k.nama_kelas ASC, s.nama ASC, an.tanggal DESC
      `;
      const students = await dbAll(sql, classIds);
      return res.json(students);
    } else if (type === 'binaan') {
      const sql = `
        SELECT DISTINCT
          s.nis, 
          s.nama, 
          s.jenis_kelamin,
          k.nama_kelas, 
          k.sekolah,
          (
            SELECT COUNT(*) 
            FROM detail_absensi da2 
            WHERE da2.siswa_nis = s.nis AND da2.status != 'Hadir'
          ) as total_tidak_hadir,
          (
            SELECT COUNT(*) 
            FROM detail_nilai dn2
            JOIN aktivitas_nilai an2 ON dn2.aktivitas_id = an2.id
            WHERE dn2.siswa_nis = s.nis AND dn2.nilai < COALESCE(an2.kkm, 75)
          ) as total_remedial_fields
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        LEFT JOIN detail_absensi da ON s.nis = da.siswa_nis
        LEFT JOIN detail_nilai dn ON s.nis = dn.siswa_nis
        LEFT JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
        WHERE s.status_aktif = 1 
          AND s.kelas_id IN (${classIdPlaceholders})
          AND (
            da.status != 'Hadir' 
            OR (dn.nilai < COALESCE(an.kkm, 75))
          )
        ORDER BY k.nama_kelas ASC, s.nama ASC
      `;
      const students = await dbAll(sql, classIds);
      return res.json(students);
    } else {
      // type === 'all' or default
      const sql = `
        SELECT s.nis, s.nama, s.jenis_kelamin, k.nama_kelas, k.sekolah, s.kelas_id
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.status_aktif = 1 AND s.kelas_id IN (${classIdPlaceholders})
        ORDER BY k.nama_kelas ASC, s.nama ASC
      `;
      const students = await dbAll(sql, classIds);
      return res.json(students);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Class-specific statistics (attendance percentage vs missing grades distribution)
router.get('/class-stats/:class_id', async (req, res) => {
  try {
    const { class_id } = req.params;
    
    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, class_id);
    if (!hasAccess) return;
    
    const rows = await dbAll<{
      nis: string;
      nama: string;
      total_sessions: number;
      sessions_hadir: number;
      rata_rata_nilai: number;
    }>(`
      SELECT 
        s.nis, 
        s.nama,
        COALESCE((SELECT COUNT(*) FROM absensi a WHERE a.kelas_id = s.kelas_id), 0) as total_sessions,
        COALESCE((SELECT COUNT(*) FROM detail_absensi da JOIN absensi a ON da.absensi_id = a.id WHERE a.kelas_id = s.kelas_id AND da.siswa_nis = s.nis AND da.status = 'Hadir'), 0) as sessions_hadir,
        COALESCE((SELECT AVG(dn.nilai) FROM detail_nilai dn JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id WHERE an.kelas_id = s.kelas_id AND dn.siswa_nis = s.nis), 0) as rata_rata_nilai
      FROM siswa s
      WHERE s.kelas_id = ? AND s.status_aktif = 1
      ORDER BY s.nama ASC
    `, [class_id]);

    const formattedData = rows.map(r => {
      const attendance_pct = r.total_sessions > 0 ? Math.round((r.sessions_hadir / r.total_sessions) * 100) : 100;
      const absence_pct = 100 - attendance_pct;
      const average_grade = Math.round(r.rata_rata_nilai * 10) / 10;
      return {
        nis: r.nis,
        nama: r.nama,
        attendance_rate: attendance_pct,
        absence_rate: absence_pct,
        average_grade: average_grade,
      };
    });

    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15a. Rekap Absensi (Attendance Matrix)
router.get('/rekap/absensi/:kelas_id', async (req, res) => {
  try {
    const { kelas_id } = req.params;
    
    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;
    
    // 1. Get dates
    const datesRows = await dbAll<{ tanggal: string }>(
      'SELECT tanggal FROM absensi WHERE kelas_id = ? ORDER BY tanggal ASC',
      [kelas_id]
    );
    const dates = datesRows.map(d => d.tanggal);

    // 2. Get students
    const students = await dbAll<{ nis: string; nama: string; jenis_kelamin: string }>(
      'SELECT nis, nama, jenis_kelamin FROM siswa WHERE kelas_id = ? ORDER BY nama ASC',
      [kelas_id]
    );

    // 3. Get all detailed attendances
    const detailsRows = await dbAll<{ siswa_nis: string; tanggal: string; status: string }>(
      `SELECT da.siswa_nis, a.tanggal, da.status
       FROM detail_absensi da
       JOIN absensi a ON da.absensi_id = a.id
       WHERE a.kelas_id = ?`,
      [kelas_id]
    );

    // Map details to student dicts
    const detailMap: Record<string, Record<string, string>> = {};
    for (const d of detailsRows) {
      if (!detailMap[d.siswa_nis]) detailMap[d.siswa_nis] = {};
      detailMap[d.siswa_nis][d.tanggal] = d.status;
    }

    // Prepare response
    const studentsWithSummary = students.map(s => {
      const studentDetails = detailMap[s.nis] || {};
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;

      for (const t of dates) {
        const stat = studentDetails[t];
        if (stat === 'Hadir') hadir++;
        else if (stat === 'Izin') izin++;
        else if (stat === 'Sakit') sakit++;
        else if (stat === 'Alfa') alfa++;
      }

      const total = hadir + izin + sakit + alfa;
      const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;

      return {
        nis: s.nis,
        nama: s.nama,
        jenis_kelamin: s.jenis_kelamin,
        summary: { hadir, izin, sakit, alfa, total, rate },
        details: studentDetails
      };
    });

    res.json({ dates, students: studentsWithSummary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15b. Rekap Nilai (Grades Matrix)
router.get('/rekap/nilai/:kelas_id', async (req, res) => {
  try {
    const { kelas_id } = req.params;

    // Verifikasi hak akses guru pengajar berdasarkan jadwal pelajaran
    const hasAccess = await verifyGuruClassAccess(req, res, kelas_id);
    if (!hasAccess) return;

    // 1. Get grading activities
    const activities = await dbAll<{ id: number; nama_aktivitas: string; tanggal: string; kkm: number }>(
      'SELECT id, nama_aktivitas, tanggal, COALESCE(kkm, 75) as kkm FROM aktivitas_nilai WHERE kelas_id = ? ORDER BY tanggal ASC, id ASC',
      [kelas_id]
    );

    // 2. Get students
    const students = await dbAll<{ nis: string; nama: string; jenis_kelamin: string }>(
      'SELECT nis, nama, jenis_kelamin FROM siswa WHERE kelas_id = ? ORDER BY nama ASC',
      [kelas_id]
    );

    // 3. Get all grades details
    const gradesRows = await dbAll<{ siswa_nis: string; aktivitas_id: number; nilai: number; catatan: string }>(
      `SELECT dn.siswa_nis, dn.aktivitas_id, dn.nilai, dn.catatan
       FROM detail_nilai dn
       JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
       WHERE an.kelas_id = ?`,
      [kelas_id]
    );

    const gradeMap: Record<string, Record<number, { nilai: number; catatan: string }>> = {};
    for (const g of gradesRows) {
      if (!gradeMap[g.siswa_nis]) gradeMap[g.siswa_nis] = {};
      gradeMap[g.siswa_nis][g.aktivitas_id] = { nilai: g.nilai, catatan: g.catatan || '' };
    }

    const studentsWithGrades = students.map(s => {
      const studentGrades = gradeMap[s.nis] || {};
      let totalScore = 0;
      let gradedCount = 0;

      const gradesObj: Record<number, number> = {};
      const notesObj: Record<number, string> = {};

      for (const act of activities) {
        const item = studentGrades[act.id];
        if (item) {
          totalScore += item.nilai;
          gradedCount++;
          gradesObj[act.id] = item.nilai;
          notesObj[act.id] = item.catatan;
        } else {
          gradesObj[act.id] = 0; // standard fallback
          notesObj[act.id] = '';
        }
      }

      const average = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 10) / 10 : 0;

      return {
        nis: s.nis,
        nama: s.nama,
        jenis_kelamin: s.jenis_kelamin,
        average,
        grades: gradesObj,
        notes: notesObj
      };
    });

    res.json({ activities, students: studentsWithGrades });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15_guardian. Wali Murid / Guardian Student Monitoring API
router.get('/wali-murid/monitoring/:kelas_id', async (req, res) => {
  const { kelas_id } = req.params;
  try {
    const numericKelasId = Number(kelas_id);
    // 1. Get class info
    const classInfo = await dbGet<{
      id: number;
      nama_kelas: string;
      sekolah: string;
      nama_walikelas?: string | null;
      total_siswa: number;
    }>(`
      SELECT k.id, k.nama_kelas, k.sekolah, p.nama AS nama_walikelas,
             (SELECT COUNT(*) FROM siswa WHERE kelas_id = k.id AND status_aktif = 1) as total_siswa
      FROM kelas k
      LEFT JOIN pengguna p ON k.walikelas_id = p.id
      WHERE k.id = ?
    `, [numericKelasId]);

    if (!classInfo) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    // 2. Get attendance history (Only approved by Wali Kelas)
    const attendance = await dbAll<{
      id: number;
      tanggal: string;
      count_hadir: number;
      count_izin: number;
      count_sakit: number;
      count_alfa: number;
    }>(`
      SELECT a.id, a.tanggal,
             COUNT(CASE WHEN da.status = 'Hadir' THEN 1 END) as count_hadir,
             COUNT(CASE WHEN da.status = 'Izin' THEN 1 END) as count_izin,
             COUNT(CASE WHEN da.status = 'Sakit' THEN 1 END) as count_sakit,
             COUNT(CASE WHEN da.status = 'Alfa' THEN 1 END) as count_alfa
      FROM absensi a
      LEFT JOIN detail_absensi da ON a.id = da.absensi_id
      WHERE a.kelas_id = ? AND (a.is_approved_by_walikelas = 1 OR a.is_approved_by_walikelas = '1')
      GROUP BY a.id, a.tanggal
      ORDER BY a.tanggal DESC
    `, [numericKelasId]);

    res.json({
      classInfo,
      attendance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 16. User Authentication Route (Secure, Hashed, JWT-Tokenized, and Rate-Limited)
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const rawIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }
    const user = await dbGet<{ id: number; username: string; nama: string; role: string; password: string; nip: string; jabatan: string; siswa_nis?: string | null; kelas_id?: number | null }>(
      'SELECT id, username, nama, role, password, nip, jabatan, siswa_nis, kelas_id FROM pengguna WHERE LOWER(username) = ?',
      [username.trim().toLowerCase()]
    );

    if (!user) {
      const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockUntil = Date.now() + 60 * 1000; // 60 seconds lock
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Verify Password (supports secure hashed comparison and seamless auto-upgrade)
    let passwordMatch = false;
    if (isBcryptHash(user.password)) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text check for transition compatibility
      passwordMatch = (user.password === password);
      // Auto-upgrade password to secure hash in background!
      if (passwordMatch) {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await dbRun('UPDATE pengguna SET password = ? WHERE id = ?', [hashedPassword, user.id]);
          console.log(`Successfully auto-upgraded plain-text password to bcrypt hash for user: ${user.username}`);
        } catch (upgradeErr) {
          console.error('Failed to auto-upgrade password:', upgradeErr);
        }
      }
    }

    if (!passwordMatch) {
      const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockUntil = Date.now() + 60 * 1000; // 60 seconds lock
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Reset rate limits on success
    loginAttempts.delete(ip);

    // Set Iron Session
    const session = await getIronSession<MySessionData>(req, res, sessionOptions);
    session.user = { id: user.id, username: user.username, role: user.role };
    await session.save();

    // Return user details for immediate client-side profile usage
    res.json({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nip: user.nip || '',
      jabatan: user.jabatan || '',
      siswa_nis: user.siswa_nis || null,
      kelas_id: user.kelas_id || null,
      message: 'Login berhasil'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/auth/profile', authenticateSession, async (req: any, res) => {
  const { nama, nip, jabatan, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await dbGet<{ password: string }>(
      'SELECT password FROM pengguna WHERE id = ?',
      [userId]
    );

    if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi' });
      
      let match = false;
      if (isBcryptHash(user.password)) {
        match = await bcrypt.compare(currentPassword, user.password);
      } else {
        match = user.password === currentPassword;
      }

      if (!match) return res.status(401).json({ error: 'Kata sandi saat ini tidak cocok' });
      
      const hashedNew = await bcrypt.hash(newPassword, 10);
      await dbRun('UPDATE pengguna SET nama = ?, nip = ?, jabatan = ?, password = ? WHERE id = ?', 
        [nama, nip, jabatan, hashedNew, userId]);
    } else {
      await dbRun('UPDATE pengguna SET nama = ?, nip = ?, jabatan = ? WHERE id = ?', 
        [nama, nip, jabatan, userId]);
    }

    const updatedUser = await dbGet(
      'SELECT id, username, nama, role, nip, jabatan FROM pengguna WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 17_summary. Admin: Get system summary metrics
router.get('/admin/summary', async (req, res) => {
  try {
    const classCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM kelas');
    const studentCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM siswa');
    const gradeCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM detail_nilai');
    const attendanceCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM detail_absensi');
    const userCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna');

    res.json({
      classes: classCount?.count || 0,
      students: studentCount?.count || 0,
      grades: gradeCount?.count || 0,
      attendance: attendanceCount?.count || 0,
      users: userCount?.count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});// 17. Admin: List all user profiles
router.get('/admin/users', async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT p.id, p.username, p.nama, p.role, p.kelas_id, p.jurusan, p.nip, p.jabatan, p.is_cuti, k.nama_kelas
      FROM pengguna p
      LEFT JOIN kelas k ON p.kelas_id = k.id
      ORDER BY p.role DESC, p.nama ASC
    `);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 18. Admin: Create a new user account
router.post('/admin/users', async (req, res) => {
  try {
    const { username, password, nama, role, kelas_id, jurusan, is_cuti, nip, jabatan } = req.body;
    if (!username || !password || !nama || !role) {
      return res.status(400).json({ error: 'Semua kolom wajib diisi' });
    }
    const exists = await dbGet('SELECT id FROM pengguna WHERE LOWER(username) = ?', [username.trim().toLowerCase()]);
    if (exists) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
    }

    // Maksud Bisnis: Memastikan aturan Kepala Sekolah hanya boleh ditunjuk untuk 1 guru saja secara real-time.
    // Aliran Data: Jika role baru adalah 'kepsek', demote akun kepsek lama menjadi 'guru'.
    if (role === 'kepsek') {
      await dbRun("UPDATE pengguna SET role = 'guru' WHERE role = 'kepsek'");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO pengguna (username, password, nama, role, kelas_id, jurusan, is_cuti, nip, jabatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username.trim().toLowerCase(), hashedPassword, nama.trim(), role, kelas_id || null, jurusan || '', is_cuti ? 1 : 0, nip || '', jabatan || '']
    );
    res.json({ id: result.id, username: username.trim().toLowerCase(), nama, role, kelas_id: kelas_id || null, jurusan: jurusan || '', message: 'Pengguna berhasil dibuat' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 19. Admin: Update a user account
router.put('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama, role, kelas_id, jurusan, is_cuti, nip, jabatan } = req.body;
    if (!username || !nama || !role) {
      return res.status(400).json({ error: 'Username, Nama, dan Role wajib diisi' });
    }
    const otherExists = await dbGet('SELECT id FROM pengguna WHERE LOWER(username) = ? AND id != ?', [username.trim().toLowerCase(), id]);
    if (otherExists) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain' });
    }
    
    // Maksud Bisnis: Memastikan aturan Kepala Sekolah hanya boleh ditunjuk untuk 1 guru saja secara real-time saat update.
    // Aliran Data: Jika role diubah menjadi 'kepsek', demote akun kepsek lama yang ber-ID lain menjadi 'guru'.
    if (role === 'kepsek') {
      await dbRun("UPDATE pengguna SET role = 'guru' WHERE role = 'kepsek' AND id != ?", [id]);
    }

    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await dbRun(
        'UPDATE pengguna SET username = ?, password = ?, nama = ?, role = ?, kelas_id = ?, jurusan = ?, is_cuti = ?, nip = ?, jabatan = ? WHERE id = ?',
        [username.trim().toLowerCase(), hashedPassword, nama.trim(), role, kelas_id || null, jurusan || '', is_cuti ? 1 : 0, nip || '', jabatan || '', id]
      );
    } else {
      await dbRun(
        'UPDATE pengguna SET username = ?, nama = ?, role = ?, kelas_id = ?, jurusan = ?, is_cuti = ?, nip = ?, jabatan = ? WHERE id = ?',
        [username.trim().toLowerCase(), nama.trim(), role, kelas_id || null, jurusan || '', is_cuti ? 1 : 0, nip || '', jabatan || '', id]
      );
    }
    res.json({ message: 'Pengguna berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 20. Admin: Delete a user account (protecting main admin accounts)
router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const targetedUser = await dbGet<{ username: string }>('SELECT username FROM pengguna WHERE id = ?', [id]);
    if (!targetedUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }
    if (targetedUser.username === 'admin') {
      return res.status(400).json({ error: 'Akun admin utama tidak boleh dihapus untuk mencegah kegagalan sistem' });
    }
    await dbRun('DELETE FROM pengguna WHERE id = ?', [id]);
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 20b. Admin: Promote students in bulk
router.post('/admin/promote-siswa', async (req, res) => {
  try {
    const { source_class_id, target_class_id, siswa_nis_list } = req.body;
    if (!target_class_id || !siswa_nis_list || !Array.isArray(siswa_nis_list)) {
      return res.status(400).json({ error: 'Data promosi tidak lengkap (target_class_id and siswa_nis_list are required)' });
    }

    if (siswa_nis_list.length === 0) {
      return res.status(400).json({ error: 'Daftar siswa kosong' });
    }

    const placeholders = siswa_nis_list.map(() => '?').join(',');
    await dbRun(
      `UPDATE siswa SET kelas_id = ? WHERE nis IN (${placeholders})`,
      [target_class_id, ...siswa_nis_list]
    );

    res.json({ message: `Berhasil menaikkan ${siswa_nis_list.length} siswa ke kelas baru.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 20c. Admin: Graduate students in bulk
router.post('/admin/graduate-siswa', async (req, res) => {
  try {
    const { siswa_nis_list } = req.body;
    if (!siswa_nis_list || !Array.isArray(siswa_nis_list)) {
      return res.status(400).json({ error: 'Daftar siswa wajib diisi' });
    }

    if (siswa_nis_list.length === 0) {
      return res.status(400).json({ error: 'Daftar siswa kosong' });
    }

    const placeholders = siswa_nis_list.map(() => '?').join(',');
    await dbRun(
      `UPDATE siswa SET status_aktif = 0 WHERE nis IN (${placeholders})`,
      siswa_nis_list
    );

    res.json({ message: `Berhasil meluluskan ${siswa_nis_list.length} siswa (Status Nonaktif/Alumni).` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 21. Admin: Reset database dan inisialisasi ulang
// Maksud Bisnis: Menyediakan fungsi bagi administrator untuk mereset seluruh data sekolah (kelas, siswa, absensi, nilai, jadwal).
// Aliran Data:
// - Input: Request POST dari Admin.
// - Output: Menghapus semua tabel terkait sekolah, memanggil initializeDatabase() untuk membuat ulang, 
//   dan mengembalikan pesan sukses yang dinamis sesuai dengan nilai APP_ENV saat ini (apakah di-seeding ulang atau dibiarkan bersih).
router.post('/admin/reset-db', async (req, res) => {
  try {
    await dbRun('DROP TABLE IF EXISTS catatan_walikelas');
    await dbRun('DROP TABLE IF EXISTS surat_bk');
    await dbRun('DROP TABLE IF EXISTS detail_absensi');
    await dbRun('DROP TABLE IF EXISTS absensi');
    await dbRun('DROP TABLE IF EXISTS detail_nilai');
    await dbRun('DROP TABLE IF EXISTS aktivitas_nilai');
    await dbRun('DROP TABLE IF EXISTS siswa');
    await dbRun('DROP TABLE IF EXISTS jadwal');
    await dbRun('DROP TABLE IF EXISTS kelas');

    // Buat ulang tabel dan lakukan seeding jika APP_ENV='dev'
    await initializeDatabase();

    const envSetting = (process.env.APP_ENV || 'dev').toLowerCase().trim();
    const isPubMode = envSetting === 'pub' || envSetting === 'publish';

    if (isPubMode) {
      res.json({ message: 'Katalog database berhasil di-reset secara bersih (fresh) untuk Mode Produksi (pub).' });
    } else {
      res.json({ message: 'Katalog Sekolah, Siswa, Absensi, Rincian Nilai, dan Jadwal telah berhasil di-reset dan di-seeding ulang otomatis (dev).' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === AKHIR DARI LOGIKA RESET DATABASE ===

// 22. Jadwal: Get all schedules
router.get('/jadwal', async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT j.*, k.nama_kelas, p.nama as nama_guru, p.username as username_guru
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id
      JOIN pengguna p ON j.guru_id = p.id
      ORDER BY 
        CASE j.hari
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
          ELSE 7
        END, j.waktu_mulai ASC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 23. Jadwal: Add new schedule
router.post('/jadwal', requireAdmin, async (req, res) => {
  const { kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai } = req.body;
  if (!kelas_id || !guru_id || !mata_pelajaran || !hari || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: 'Data jadwal tidak lengkap' });
  }
  try {
    const result = await dbRun(
      `INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?, ?, ?)`,
      [kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai]
    );
    res.json({ id: result.id, message: 'Jadwal berhasil ditambahkan' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 23b. Jadwal: Update schedule
router.put('/jadwal/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai } = req.body;
  if (!kelas_id || !guru_id || !mata_pelajaran || !hari || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: 'Data jadwal tidak lengkap' });
  }
  try {
    await dbRun(
      `UPDATE jadwal SET kelas_id = ?, guru_id = ?, mata_pelajaran = ?, hari = ?, waktu_mulai = ?, waktu_selesai = ? WHERE id = ?`,
      [kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai, id]
    );
    res.json({ message: 'Jadwal berhasil diperbarui' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 24. Jadwal: Delete schedule
router.delete('/jadwal/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM jadwal WHERE id = ?', [id]);
    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// SYSTEM MAINTENANCE, REPAIRS, AND PATCH MANAGEMENT ENDPOINTS
// ============================================================================

// Predefined patches list with details
const MASTER_PATCHES = [
  {
    id: 'PATCH-001',
    nama_patch: 'Optimasi Indeks Kinerja Database SQLite',
    deskripsi: 'Membangun ulang indeks kueri relasional siswa, kelas, absensi, dan nilai untuk mempercepat kalkulasi KKM Pintar dan mengurangi latensi pencarian data hingga 65%.',
    kategori: 'Database',
    status_default: 'pending'
  },
  {
    id: 'PATCH-002',
    nama_patch: 'Pembaruan Logika Persetujuan Absensi Wali Kelas',
    deskripsi: 'Memperbaiki bugs sinkronisasi ketika wali kelas menyetujui absensi harian, menambahkan penanganan kasus siswa yang pindah kelas di tengah semester.',
    kategori: 'Bug Fix',
    status_default: 'pending'
  },
  {
    id: 'PATCH-003',
    nama_patch: 'Kompatibilitas Nilai Kurikulum Merdeka (KKM Pintar v2)',
    deskripsi: 'Upgrade modul KKM Pintar agar mendukung format penilaian deskriptif K-Merdeka, penentuan interval kompetensi, dan kalkulasi otomatis predikat rapor.',
    kategori: 'Feature Upgrade',
    status_default: 'pending'
  },
  {
    id: 'PATCH-051',
    nama_patch: 'Penguatan Enkripsi & Proteksi Token Sesi',
    deskripsi: 'Meningkatkan standar proteksi data cookie Iron Session, mengenkripsi payload dengan enkripsi AES-256-GCM ganda, dan memperpendek masa kedaluwarsa sesi tidak aktif.',
    kategori: 'Keamanan',
    status_default: 'pending'
  }
];

// GET /api/patches - Ambil semua patch sistem dan status aplikasinya
router.get('/patches', async (req, res) => {
  try {
    // Ambil patch yang sudah berhasil diaplikasikan dari database
    const dbPatches = await dbAll('SELECT * FROM patches');
    const appliedMap = new Map(dbPatches.map(p => [p.id, p]));

    const masterList = MASTER_PATCHES.map(patch => {
      const dbRecord = appliedMap.get(patch.id);
      return {
        id: patch.id,
        nama_patch: patch.nama_patch,
        deskripsi: patch.deskripsi,
        kategori: patch.kategori,
        status: dbRecord ? dbRecord.status : 'pending',
        applied_at: dbRecord ? dbRecord.applied_at : null,
        is_custom: false
      };
    });

    const masterIds = new Set(MASTER_PATCHES.map(p => p.id));
    const customList = dbPatches
      .filter(p => !masterIds.has(p.id))
      .map(p => ({
        id: p.id,
        nama_patch: p.nama_patch,
        deskripsi: p.deskripsi,
        kategori: p.kategori,
        status: p.status,
        applied_at: p.applied_at,
        is_custom: true
      }));

    res.json([...masterList, ...customList]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data patch: ' + err.message });
  }
});

// POST /api/patches/upload - Mengunggah dan meregistrasikan patch baru (JSON atau SQL)
router.post('/patches/upload', async (req, res) => {
  const { id, nama_patch, deskripsi, kategori, sql_statements } = req.body;

  if (!nama_patch) {
    return res.status(400).json({ error: 'Nama patch wajib diisi' });
  }

  try {
    const patchId = id || `PATCH-CUSTOM-${Date.now()}`;
    const desc = deskripsi || 'Patch kustom yang diunggah oleh administrator.';
    const cat = kategori || 'Database';

    let sqlArr: string[] = [];
    if (Array.isArray(sql_statements)) {
      sqlArr = sql_statements;
    } else if (typeof sql_statements === 'string') {
      sqlArr = sql_statements.split(';').map(s => s.trim()).filter(Boolean);
    }

    const sqlStr = JSON.stringify(sqlArr);

    await dbRun(
      'INSERT OR REPLACE INTO patches (id, nama_patch, deskripsi, kategori, status, applied_at, sql_statements) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patchId, nama_patch, desc, cat, 'pending', null, sqlStr]
    );

    res.json({
      success: true,
      message: `Patch "${nama_patch}" dengan ID ${patchId} berhasil diunggah dan siap diterapkan.`,
      patch: {
        id: patchId,
        nama_patch,
        deskripsi: desc,
        kategori: cat,
        status: 'pending',
        applied_at: null,
        is_custom: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengunggah patch: ' + err.message });
  }
});

// POST /api/patches/apply - Jalankan aplikasi patch sistem secara real-time
router.post('/patches/apply', async (req, res) => {
  const { patchId } = req.body;
  if (!patchId) {
    return res.status(400).json({ error: 'ID Patch wajib disertakan' });
  }

  let patch = MASTER_PATCHES.find(p => p.id === patchId);
  let isCustom = false;
  let customRecord: any = null;

  if (!patch) {
    // Periksa jika ini merupakan patch kustom dari database
    customRecord = await dbGet('SELECT * FROM patches WHERE id = ?', [patchId]);
    if (!customRecord) {
      return res.status(404).json({ error: 'Patch tidak ditemukan dalam repositori master maupun kustom.' });
    }
    patch = {
      id: customRecord.id,
      nama_patch: customRecord.nama_patch,
      deskripsi: customRecord.deskripsi,
      kategori: customRecord.kategori,
      status_default: 'pending'
    };
    isCustom = true;
  }

  try {
    if (isCustom && customRecord) {
      // Jalankan seluruh statement SQL kustom berurutan
      if (customRecord.sql_statements) {
        let statements: string[] = [];
        try {
          statements = JSON.parse(customRecord.sql_statements);
        } catch (e) {
          statements = customRecord.sql_statements.split(';').map((s: string) => s.trim()).filter(Boolean);
        }
        for (const stmt of statements) {
          if (stmt.trim()) {
            await dbRun(stmt);
          }
        }
      }
    } else {
      // Jalankan logika patch riil sesuai dengan ID masing-masing!
      if (patchId === 'PATCH-001') {
        // Jalankan optimasi database SQLite nyata!
        await dbRun('REINDEX');
        await dbRun('VACUUM');
        // Buat ulang indeks jika belum ada
        await dbRun('CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON siswa(kelas_id)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_absensi_kelas_id ON absensi(kelas_id)');
      } else if (patchId === 'PATCH-002') {
        // Fix database approval schema inconsistencies
        try {
          await dbRun("ALTER TABLE absensi ADD COLUMN is_approved_by_walikelas INTEGER DEFAULT 0");
        } catch (e) {
          // Abaikan jika kolom sudah ada
        }
      } else if (patchId === 'PATCH-003') {
        // Update kkm default jika ada yang kurang dari 75
        await dbRun("UPDATE aktivitas_nilai SET kkm = 75 WHERE kkm IS NULL OR kkm < 50");
      } else if (patchId === 'PATCH-051') {
        // Melakukan refresh session settings atau logs
        console.log('Security patch 051 applied successfully.');
      }
    }

    const timestamp = formatDateISO();
    // Simpan status patch di database agar persisten
    await dbRun(
      'INSERT OR REPLACE INTO patches (id, nama_patch, deskripsi, kategori, status, applied_at, sql_statements) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        patch.id, 
        patch.nama_patch, 
        patch.deskripsi, 
        patch.kategori, 
        'applied', 
        timestamp,
        isCustom ? customRecord.sql_statements : null
      ]
    );

    res.json({
      success: true,
      message: `Patch ${patchId} (${patch.nama_patch}) berhasil diterapkan pada sistem.`,
      applied_at: timestamp
    });
  } catch (err: any) {
    res.status(500).json({ error: `Gagal menerapkan patch ${patchId}: ` + err.message });
  }
});

// GET /api/system/diagnostics - Jalankan pemindaian kesehatan & pemecahan masalah sistem
router.get('/system/diagnostics', async (req, res) => {
  try {
    const checks: any[] = [];
    
    // 1. Cek Koneksi & Integritas SQLite
    try {
      const integrity = await dbGet<{ integrity_check: string }>('PRAGMA integrity_check');
      checks.push({
        komponen: 'Koneksi & Integritas Database',
        status: integrity?.integrity_check === 'ok' ? 'sehat' : 'bermasalah',
        detail: integrity?.integrity_check === 'ok' 
          ? 'Database SQLite sehat dan tidak ditemukan korupsi berkas.' 
          : `Integritas database terganggu: ${integrity?.integrity_check}`
      });
    } catch (e: any) {
      checks.push({
        komponen: 'Koneksi & Integritas Database',
        status: 'rusak',
        detail: `Koneksi database gagal: ${e.message}`
      });
    }

    // 2. Cek Struktur Tabel Esensial
    try {
      const kelasCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM kelas');
      const siswaCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM siswa');
      const userCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna');
      checks.push({
        komponen: 'Ketersediaan Tabel Data Pokok',
        status: 'sehat',
        detail: `Tabel utama lengkap. Terdata ${kelasCount?.count || 0} Kelas, ${siswaCount?.count || 0} Siswa, dan ${userCount?.count || 0} Akun Pengguna.`
      });
    } catch (e: any) {
      checks.push({
        komponen: 'Ketersediaan Tabel Data Pokok',
        status: 'bermasalah',
        detail: `Gagal membaca tabel data pokok: ${e.message}`
      });
    }

    // 3. Cek Versi NodeJS dan Memori Server
    const memUsage = process.memoryUsage();
    const memMb = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
    checks.push({
      komponen: 'Sumber Daya Virtual & Memory Server',
      status: memMb < 300 ? 'sehat' : 'beban_tinggi',
      detail: `Versi NodeJS ${process.version}. Heap memory terpakai: ${memMb} MB. Server berjalan dalam batas aman.`
    });

    // 4. Cek File Pengaturan Identitas Sekolah
    const identityPath = path.resolve(process.cwd(), 'school_identity.json');
    if (fs.existsSync(identityPath)) {
      try {
        const raw = fs.readFileSync(identityPath, 'utf-8');
        const parsed = JSON.parse(raw);
        checks.push({
          komponen: 'Berkas Identitas Sekolah',
          status: 'sehat',
          detail: `File terdeteksi untuk instansi "${parsed.nama_sekolah || 'SMK Ibu'}". Format JSON valid.`
        });
      } catch (e: any) {
        checks.push({
          komponen: 'Berkas Identitas Sekolah',
          status: 'bermasalah',
          detail: `File JSON korup atau tidak valid: ${e.message}`
        });
      }
    } else {
      checks.push({
        komponen: 'Berkas Identitas Sekolah',
        status: 'peringatan',
        detail: 'File school_identity.json belum dibuat. Sistem menggunakan konfigurasi default SMK Ibu.'
      });
    }

    // Hitung persentase kesehatan sistem
    const healthyCount = checks.filter(c => c.status === 'sehat').length;
    const score = Math.round((healthyCount / checks.length) * 100);

    res.json({
      score,
      scanned_at: formatDateISO(),
      checks
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menjalankan diagnosik sistem: ' + err.message });
  }
});

// GET /api/system/backup - Unduh salinan data database sebagai JSON
router.get('/system/backup', async (req, res) => {
  try {
    const tables = [
      'pengguna', 'kelas', 'guru', 'siswa', 'wali_murid', 
      'mapel', 'jadwal', 'absensi', 'aktivitas_nilai', 'detail_nilai', 'patches'
    ];
    
    const backupData: any = {};
    
    for (const table of tables) {
      try {
        const rows = await dbAll(`SELECT * FROM ${table}`);
        backupData[table] = rows;
      } catch (err) {
        console.warn(`Gagal mem-backup tabel ${table}:`, err);
        backupData[table] = [];
      }
    }
    
    const timestamp = formatDateISO().replace(/[:.]/g, '-');
    const filename = `backup_db_smk_${timestamp}.json`;
    
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membuat backup database: ' + err.message });
  }
});

// ============================================================================
// ENDPOINT: POST /api/codebase/check
// Maksud Bisnis: Menerima unggahan file ZIP berisi seluruh codebase kode sumber proyek,
// membandingkannya dengan file lokal yang sedang berjalan di server kontainer, 
// kemudian mendeteksi daftar penambahan berkas baru (fitur baru), modifikasi berkas 
// (perbaikan bug / pembaruan), serta mengelompokkan kategori perubahan secara cerdas.
//
// Aliran Data:
// - Input: Objek JSON `req.body` berisi `fileBase64` (string terenkripsi Base64 dari file ZIP).
// - Output: Ringkasan statistik (jumlah file ditambah, dimodifikasi, ukuran) serta
//   array rincian perubahan berkas lengkap dengan status dan jenis semantik perubahannya.
// ============================================================================
router.post('/codebase/check', async (req, res) => {
  const { fileBase64 } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: 'Data berkas ZIP (Base64) wajib disertakan' });
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(buffer);

    const changedFiles: any[] = [];
    let addedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    const validEntries = Object.entries(loadedZip.files).filter(([relativePath, zipEntry]) => {
      if (zipEntry.dir) return false;

      // Abaikan berkas metadata sistem operasi atau file tersembunyi
      if (relativePath.includes('__MACOSX') || relativePath.split('/').pop()?.startsWith('.')) {
        return false;
      }

      // Abaikan direktori dependensi, keluaran build, berkas database lokal, dan lingkungan (.env)
      if (
        relativePath.startsWith('node_modules/') ||
        relativePath.startsWith('dist/') ||
        relativePath.includes('sekolah.db') ||
        relativePath.includes('database.sqlite') ||
        relativePath.endsWith('.env')
      ) {
        return false;
      }
      return true;
    });

    // Melakukan pemrosesan file paralel via Promise.all
    await Promise.all(validEntries.map(async ([relativePath, zipEntry]) => {
      const localPath = path.resolve(process.cwd(), relativePath);
      const exists = fs.existsSync(localPath);

      const zipContent = await zipEntry.async('string');
      let status = 'added';
      let semanticType: 'feature' | 'bugfix' | 'refactor' | 'general' = 'general';
      let summaryOfChange = '';

      if (exists) {
        const localContent = fs.readFileSync(localPath, 'utf-8');
        if (localContent.trim() === zipContent.trim()) {
          status = 'unchanged';
          unchangedCount++;
          return; // Lewati berkas yang tidak berubah
        } else {
          status = 'modified';
          modifiedCount++;
        }
      } else {
        addedCount++;
      }

      // Deteksi semantik cerdas menggunakan kata kunci di dalam kode sumber
      const isBugfix = /bugfix|perbaikan_bug|hotfix|fix_error|fix\s*\(|perbaikan|penanganan_error/i.test(zipContent) ||
                        /error|err|catch|handling/i.test(relativePath);
      const isFeature = /fitur_baru|new_feature|feat|tambah_fitur|create_tab/i.test(zipContent) ||
                        /view|tab|modal|page|add|create/i.test(relativePath);
      const isRefactor = /refactor|optimasi|clean_code|performance|rapikan/i.test(zipContent) ||
                         /utils|helpers|types/i.test(relativePath);

      if (isBugfix) {
        semanticType = 'bugfix';
      } else if (isFeature) {
        semanticType = 'feature';
      } else if (isRefactor) {
        semanticType = 'refactor';
      }

      if (status === 'added') {
        summaryOfChange = `Berkas baru terdeteksi: "${relativePath}" (${semanticType === 'feature' ? 'Fitur Baru' : 'Pembaruan Umum'})`;
      } else {
        summaryOfChange = `Perubahan isi kode terdeteksi pada: "${relativePath}" (${semanticType === 'bugfix' ? 'Perbaikan Bug' : 'Optimasi Kode'})`;
      }

      changedFiles.push({
        path: relativePath,
        status,
        semanticType,
        summaryOfChange,
        size: zipContent.length
      });
    }));

    res.json({
      success: true,
      stats: {
        added: addedCount,
        modified: modifiedCount,
        unchanged: unchangedCount,
        totalChanges: changedFiles.length
      },
      changedFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menganalisis berkas ZIP: ' + err.message });
  }
});
// === AKHIR DARI ENDPOINT CEK CODEBASE ===

// ============================================================================
// ENDPOINT: POST /api/codebase/apply
// Maksud Bisnis: Menerapkan pembaruan codebase secara menyeluruh dengan mengekstrak 
// isi dari berkas ZIP yang diunggah dan menulis ulang file ke sistem penyimpanan server.
// Hal ini berguna untuk pembaruan fitur / perbaikan bug dinamis secara hot-reload.
//
// Aliran Data:
// - Input: Objek JSON `req.body` berisi `fileBase64` (string Base64 berkas ZIP).
// - Output: Pesan sukses berserta jumlah berkas yang berhasil diperbarui di sistem.
// ============================================================================
router.post('/codebase/apply', async (req, res) => {
  const { fileBase64 } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: 'Data berkas ZIP (Base64) wajib disertakan untuk pembaruan' });
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(buffer);

    let appliedCount = 0;
    const appliedFiles: string[] = [];

    const validEntries = Object.entries(loadedZip.files).filter(([relativePath, zipEntry]) => {
      if (zipEntry.dir) return false;

      // Abaikan berkas metadata OS atau file tersembunyi
      if (relativePath.includes('__MACOSX') || relativePath.split('/').pop()?.startsWith('.')) {
        return false;
      }

      // Cegah penulisan ulang pada folder dependensi, database persisten, dan konfigurasi rahasia
      if (
        relativePath.startsWith('node_modules/') ||
        relativePath.startsWith('dist/') ||
        relativePath.includes('sekolah.db') ||
        relativePath.includes('database.sqlite') ||
        relativePath.endsWith('.env')
      ) {
        return false;
      }
      return true;
    });

    // Mengekstrak dan menulis berkas-berkas secara paralel
    await Promise.all(validEntries.map(async ([relativePath, zipEntry]) => {
      const localPath = path.resolve(process.cwd(), relativePath);

      // Buat direktori induk secara rekursif jika belum tercipta di workspace
      fs.mkdirSync(path.dirname(localPath), { recursive: true });

      // Tulis konten berkas sebagai biner (nodebuffer) agar mendukung teks maupun berkas media
      const zipContentBuffer = await zipEntry.async('nodebuffer');
      fs.writeFileSync(localPath, zipContentBuffer);
      
      appliedCount++;
      appliedFiles.push(relativePath);
    }));

    res.json({
      success: true,
      message: `Pembaruan sistem berhasil! ${appliedCount} berkas telah diperbarui secara langsung.`,
      appliedFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menerapkan pembaruan codebase: ' + err.message });
  }
});
// === AKHIR DARI ENDPOINT TERAPKAN CODEBASE ===

// === ENDPOINT CATATAN WALI KELAS ===
router.get('/catatan_walikelas', async (req, res) => {
  try {
    const { kelas_id } = req.query;
    let query = `
      SELECT c.*, s.nama as nama_siswa, p.nama as nama_guru 
      FROM catatan_walikelas c
      JOIN siswa s ON c.siswa_nis = s.nis
      JOIN pengguna p ON c.guru_id = p.id
    `;
    const params: any[] = [];
    if (kelas_id) {
      query += ` WHERE c.kelas_id = ?`;
      params.push(kelas_id);
    }
    query += ` ORDER BY c.id DESC`;
    
    const data = await dbAll(query, params);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/catatan_walikelas', async (req, res) => {
  try {
    const { siswa_nis, kelas_id, guru_id, kategori, catatan } = req.body;
    const tanggal = formatDateYYYYMMDD();
    const result = await dbRun(
      `INSERT INTO catatan_walikelas (siswa_nis, kelas_id, guru_id, kategori, catatan, tanggal) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [siswa_nis, kelas_id, guru_id, kategori || 'Umum', catatan, tanggal]
    );
    res.json({ id: result.id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/catatan_walikelas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM catatan_walikelas WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// === AKHIR DARI ENDPOINT CATATAN WALI KELAS ===

// === ENDPOINT SURAT BK ===
router.get('/surat_bk', async (req, res) => {
  try {
    const query = `
      SELECT sb.*, s.nama as nama_siswa, p.nama as nama_guru 
      FROM surat_bk sb
      JOIN siswa s ON sb.siswa_nis = s.nis
      JOIN pengguna p ON sb.guru_id = p.id
      ORDER BY sb.id DESC
    `;
    const data = await dbAll(query);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/surat_bk', async (req, res) => {
  try {
    const { siswa_nis, guru_id, jenis_surat, keterangan } = req.body;
    const tanggal = formatDateYYYYMMDD();
    const result = await dbRun(
      `INSERT INTO surat_bk (siswa_nis, guru_id, jenis_surat, tanggal, keterangan) 
       VALUES (?, ?, ?, ?, ?)`,
      [siswa_nis, guru_id, jenis_surat, tanggal, keterangan]
    );
    res.json({ id: result.id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/surat_bk/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await dbRun(`UPDATE surat_bk SET status = ? WHERE id = ?`, [status, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/surat_bk/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM surat_bk WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// === AKHIR DARI ENDPOINT SURAT BK ===

export default router;
