import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.cwd(), 'sekolah.db');
console.log('Connecting to database:', dbPath);

let db: any;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error('Error opening database:', err);
  process.exit(1);
}

const dbRun = async (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { id: info.lastInsertRowid as number, changes: info.changes };
};

const indonesianStudents = [
  // Class 1 (X PPLG 1) - 15 siswa
  { nis: '1001', nama: 'Abimanyu Hartono', jk: 'L', classOffset: 0 },
  { nis: '1002', nama: 'Ahmad Syarifuddin', jk: 'L', classOffset: 0 },
  { nis: '1003', nama: 'Amelia Putri Utami', jk: 'P', classOffset: 0 },
  { nis: '1004', nama: 'Anisa Rahmawati', jk: 'P', classOffset: 0 },
  { nis: '1005', nama: 'Bambang Pamungkas', jk: 'L', classOffset: 0 },
  { nis: '1006', nama: 'Cynthia Bella Hermawan', jk: 'P', classOffset: 0 },
  { nis: '1007', nama: 'Daniel Christian', jk: 'L', classOffset: 0 },
  { nis: '1008', nama: 'Dewi Ayu Lestari', jk: 'P', classOffset: 0 },
  { nis: '1009', nama: 'Diki Chandra', jk: 'L', classOffset: 0 },
  { nis: '1010', nama: 'Eliana Safitri', jk: 'P', classOffset: 0 },
  { nis: '1011', nama: 'Farhan Ramadhan', jk: 'L', classOffset: 0 },
  { nis: '1012', nama: 'Fitriani Handayani', jk: 'P', classOffset: 0 },
  { nis: '1013', nama: 'Gilang Dirga Permana', jk: 'L', classOffset: 0 },
  { nis: '1014', nama: 'Hana Alisia', jk: 'P', classOffset: 0 },
  { nis: '1015', nama: 'Ihsan Maulana', jk: 'L', classOffset: 0 },
  
  // Class 2 (X PPLG 2) - 15 siswa
  { nis: '1016', nama: 'Joko Widodo Susilo', jk: 'L', classOffset: 1 },
  { nis: '1017', nama: 'Kartika Chandra', jk: 'P', classOffset: 1 },
  { nis: '1018', nama: 'Kevin Sanjaya', jk: 'L', classOffset: 1 },
  { nis: '1019', nama: 'Larasati Ningrum', jk: 'P', classOffset: 1 },
  { nis: '1020', nama: 'Muhammad Rizky Pratama', jk: 'L', classOffset: 1 },
  { nis: '1021', nama: 'Nadia Saphira', jk: 'P', classOffset: 1 },
  { nis: '1022', nama: 'Oki Setiana Dewi', jk: 'P', classOffset: 1 },
  { nis: '1023', nama: 'Pratama Arhan Alif', jk: 'L', classOffset: 1 },
  { nis: '1024', nama: 'Putri Ayu Wandira', jk: 'P', classOffset: 1 },
  { nis: '1025', nama: 'Rafi Ahmad Prasetyo', jk: 'L', classOffset: 1 },
  { nis: '1026', nama: 'Rania Salsabila Putri', jk: 'P', classOffset: 1 },
  { nis: '1027', nama: 'Rian Dwi Cahyo', jk: 'L', classOffset: 1 },
  { nis: '1028', nama: 'Siti Nurhaliza', jk: 'P', classOffset: 1 },
  { nis: '1029', nama: 'Taufik Hidayatullah', jk: 'L', classOffset: 1 },
  { nis: '1030', nama: 'Vina Panduwinata', jk: 'P', classOffset: 1 },

  // Class 3 (XI PPLG 1) - 10 siswa
  { nis: '1031', nama: 'Wawan Kurniawan', jk: 'L', classOffset: 2 },
  { nis: '1032', nama: 'Yulianti Citra Puspita', jk: 'P', classOffset: 2 },
  { nis: '1033', nama: 'Zack Lee Christian', jk: 'L', classOffset: 2 },
  { nis: '1034', nama: 'Budi Darmawan Kusuma', jk: 'L', classOffset: 2 },
  { nis: '1035', nama: 'Clara Shinta', jk: 'P', classOffset: 2 },
  { nis: '1036', nama: 'Doni Pratama', jk: 'L', classOffset: 2 },
  { nis: '1037', nama: 'Evi Masamba Lestari', jk: 'P', classOffset: 2 },
  { nis: '1038', nama: 'Ferry Irawan', jk: 'L', classOffset: 2 },
  { nis: '1039', nama: 'Grace Natalie', jk: 'P', classOffset: 2 },
  { nis: '1040', nama: 'Hendra Setiawan', jk: 'L', classOffset: 2 },

  // Class 4 (XII Animasi 1) - 15 siswa
  { nis: '1041', nama: 'Irvan Nurhakim', jk: 'L', classOffset: 3 },
  { nis: '1042', nama: 'Juan Sebastian', jk: 'L', classOffset: 3 },
  { nis: '1043', nama: 'Keisha Alvaro', jk: 'L', classOffset: 3 },
  { nis: '1044', nama: 'Luna Maya Lestari', jk: 'P', classOffset: 3 },
  { nis: '1045', nama: 'Maudy Ayunda Faza', jk: 'P', classOffset: 3 },
  { nis: '1046', nama: 'Nadiem Makarim', jk: 'L', classOffset: 3 },
  { nis: '1047', nama: 'Najwa Shihab', jk: 'P', classOffset: 3 },
  { nis: '1048', nama: 'Onadio Leonardo', jk: 'L', classOffset: 3 },
  { nis: '1049', nama: 'Pevita Pearce', jk: 'P', classOffset: 3 },
  { nis: '1050', nama: 'Raditya Dika Angkasa', jk: 'L', classOffset: 3 },
  { nis: '1051', nama: 'Susi Pudjiastuti', jk: 'P', classOffset: 3 },
  { nis: '1052', nama: 'Tora Sudiro', jk: 'L', classOffset: 3 },
  { nis: '1053', nama: 'Vanesha Prescilla', jk: 'P', classOffset: 3 },
  { nis: '1054', nama: 'Wulan Guritno', jk: 'P', classOffset: 3 },
  { nis: '1055', nama: 'Yovie Widianto', jk: 'L', classOffset: 3 }
];

async function seed() {
  try {
    console.log('Dropping existing tables...');
    await dbRun('DROP TABLE IF EXISTS detail_absensi');
    await dbRun('DROP TABLE IF EXISTS absensi');
    await dbRun('DROP TABLE IF EXISTS detail_nilai');
    await dbRun('DROP TABLE IF EXISTS aktivitas_nilai');
    await dbRun('DROP TABLE IF EXISTS siswa');
    await dbRun('DROP TABLE IF EXISTS jadwal');
    await dbRun('DROP TABLE IF EXISTS kelas');
    await dbRun('DROP TABLE IF EXISTS pengguna');

    console.log('Creating tables...');
    // Create Kelas Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS kelas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kelas TEXT NOT NULL,
        sekolah TEXT DEFAULT 'SMK Ibu'
      )
    `);

    // Create Siswa Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS siswa (
        nis TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
        kelas_id INTEGER,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      )
    `);

    // Create Aktivitas Nilai Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS aktivitas_nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_aktivitas TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        kelas_id INTEGER,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      )
    `);

    // Create Detail Nilai Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS detail_nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aktivitas_id INTEGER,
        siswa_nis TEXT,
        nilai REAL NOT NULL,
        catatan TEXT,
        FOREIGN KEY(aktivitas_id) REFERENCES aktivitas_nilai(id) ON DELETE CASCADE,
        FOREIGN KEY(siswa_nis) REFERENCES siswa(nis) ON DELETE CASCADE,
        UNIQUE(aktivitas_id, siswa_nis)
      )
    `);

    // Create Absensi Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        kelas_id INTEGER,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        UNIQUE(tanggal, kelas_id)
      )
    `);

    // Create Detail Absensi Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS detail_absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        absensi_id INTEGER,
        siswa_nis TEXT,
        status TEXT CHECK(status IN ('Hadir', 'Izin', 'Sakit', 'Alfa')),
        updated_at TEXT NOT NULL,
        FOREIGN KEY(absensi_id) REFERENCES absensi(id) ON DELETE CASCADE,
        FOREIGN KEY(siswa_nis) REFERENCES siswa(nis) ON DELETE CASCADE,
        UNIQUE(absensi_id, siswa_nis)
      )
    `);

    // Create Pengguna Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pengguna (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nama TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Create Jadwal Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS jadwal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kelas_id INTEGER,
        guru_id INTEGER,
        mata_pelajaran TEXT NOT NULL,
        hari TEXT NOT NULL,
        waktu_mulai TEXT NOT NULL,
        waktu_selesai TEXT NOT NULL,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        FOREIGN KEY(guru_id) REFERENCES pengguna(id) ON DELETE CASCADE
      )
    `);

    console.log('Seeding Pengguna...');
    await dbRun("INSERT INTO pengguna (username, password, nama, role) VALUES ('admin', 'admin123', 'Administrator Utama', 'admin')");
    await dbRun("INSERT INTO pengguna (username, password, nama, role) VALUES ('guru', 'guru123', 'Guru Pintar SMK Ibu', 'guru')");

    console.log('Seeding Kelas...');
    const class1 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah) VALUES ('X DKV 1', 'SMK Ibu')");
    const class2 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah) VALUES ('XI DKV 1', 'SMK Ibu')");
    const class3 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah) VALUES ('XI BD 1', 'SMK Ibu')");
    const class4 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah) VALUES ('XII AK 1', 'SMK Ibu')");

    const classIds = [class1.id, class2.id, class3.id, class4.id];

    console.log('Seeding Siswa...');
    for (const student of indonesianStudents) {
      const classId = classIds[student.classOffset];
      await dbRun(
        "INSERT INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)",
        [student.nis, student.nama, student.jk, classId]
      );
    }

    console.log('Seeding Schedules (Jadwal)...');
    // Schedules for guru (ID 2) aligned to respective majors
    // DKV
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Dasar-Dasar DKV', 'Senin', '07:30', '09:00')", [class1.id]);
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Gambar Sketsa & Ilustrasi', 'Rabu', '09:30', '11:00')", [class1.id]);
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Desain Grafis Percetakan', 'Selasa', '08:00', '10:00')", [class2.id]);
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Fotografi & Videografi', 'Kamis', '08:00', '10:30')", [class2.id]);
    
    // Bisnis Digital
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Digital Marketing & SEO', 'Kamis', '10:45', '12:45')", [class3.id]);
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'E-Commerce & Marketplace', 'Jumat', '08:00', '10:00')", [class3.id]);
    
    // Akuntansi
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Akuntansi Keuangan', 'Senin', '09:30', '12:00')", [class4.id]);
    await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Spreadsheet Keuangan', 'Jumat', '08:00', '10:30')", [class4.id]);

    console.log('Seeding Attendance (Absensi)...');
    // 5 separate dates for high-density historical analytics
    const workDates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
    const statuses = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Izin', 'Sakit', 'Alfa'];

    for (const classId of classIds) {
      for (const date of workDates) {
        const absRes = await dbRun("INSERT INTO absensi (tanggal, kelas_id) VALUES (?, ?)", [date, classId]);
        const absId = absRes.id;

        // Find students in this class
        const studentsInClass = indonesianStudents.filter((s, idx) => classIds[s.classOffset] === classId);
        
        for (const student of studentsInClass) {
          // Weighted status
          // Give certain students consistent attendance trends (e.g. some are truant, some are prone to sickness)
          let statusIndex = Math.floor(Math.random() * statuses.length);
          const studentNisNum = parseInt(student.nis);
          if (studentNisNum % 13 === 0) {
            // Prone to Alfa
            statusIndex = Math.random() > 0.5 ? 11 : 0; // Alfa or Hadir
          } else if (studentNisNum % 17 === 0) {
            // Prone to Sakit/Izin
            statusIndex = Math.random() > 0.6 ? 10 : 9; // Sakit or Izin
          } else {
            // Excellent attendance
            statusIndex = Math.floor(Math.random() * 9); // always Hadir (indices 0..8)
          }

          const chosenStatus = statuses[statusIndex];
          const timestamp = new Date(new Date(date).getTime() + 7 * 3600000 + Math.random() * 8 * 3600000).toISOString(); // Real-time Indonesian time-stamp
          await dbRun(
            "INSERT INTO detail_absensi (absensi_id, siswa_nis, status, updated_at) VALUES (?, ?, ?, ?)",
            [absId, student.nis, chosenStatus, timestamp]
          );
        }
      }
    }

    console.log('Seeding Assessments and Grades (Nilai)...');
    // Grading activities definitions
    const gradingActivities = [
      // DKV
      { classOffset: 0, title: 'Tugas 1 - Pembuatan Sketsa Objek', date: '2026-06-01' },
      { classOffset: 0, title: 'Tugas 2 - Komposisi Warna DKV', date: '2026-06-05' },
      { classOffset: 0, title: 'UH 1 - Teori Nirmana Dasar', date: '2026-06-10' },
      { classOffset: 0, title: 'Ujian Tengah Semester - Portofolio Logo', date: '2026-06-15' },

      { classOffset: 1, title: 'Tugas 1 - Teknik Pencahayaan Studio', date: '2026-06-02' },
      { classOffset: 1, title: 'Tugas 2 - Tata Letak Brosur Cetak', date: '2026-06-06' },
      { classOffset: 1, title: 'UH 1 - Komposisi Fotografi Segitiga Eksposur', date: '2026-06-12' },

      // Bisnis Digital
      { classOffset: 2, title: 'Tugas 1 - Riset Kata Kunci SEO', date: '2026-06-03' },
      { classOffset: 2, title: 'UH 1 - Pembuatan Toko Online Shopee/Tokopedia', date: '2026-06-11' },

      // Akuntansi
      { classOffset: 3, title: 'Tugas 1 - Buku Besar & Jurnal Penyesuaian', date: '2026-06-04' },
      { classOffset: 3, title: 'UH 1 - Analisis Laporan Neraca & Rugi Laba', date: '2026-06-12' }
    ];

    for (const act of gradingActivities) {
      const classId = classIds[act.classOffset];
      const actRes = await dbRun(
        "INSERT INTO aktivitas_nilai (nama_aktivitas, tanggal, kelas_id) VALUES (?, ?, ?)",
        [act.title, act.date, classId]
      );
      const actId = actRes.id;

      // Find students in this class
      const studentsInClass = indonesianStudents.filter((s, idx) => classIds[s.classOffset] === classId);

      for (const student of studentsInClass) {
        const studentNisNum = parseInt(student.nis);
        
        // Base academic scoring baseline:
        // - Modulo 3 === 0: baseline = 88 (Excellent student, grades range 85-100)
        // - Modulo 3 === 1: baseline = 76 (Average student, grades range 70-85)
        // - Modulo 3 === 2: baseline = 65 (Struggling student, grades range 45-74)
        let baseline = 75;
        if (studentNisNum % 3 === 0) {
          baseline = 88;
        } else if (studentNisNum % 3 === 1) {
          baseline = 76;
        } else {
          baseline = 63;
        }

        // Add variance (-10 to +12)
        const variance = Math.floor(Math.random() * 23) - 10;
        let finalGrade = Math.min(100, Math.max(35, baseline + variance));

        // Format nice comments
        let comment = '';
        if (finalGrade >= 90) {
          const comms = [
            'Sangat kreatif, jawaban orisinal, dan kerapihan kerja luar biasa.',
            'Sempurna, pemahaman konsep materi ini sangat matang dan teruji.',
            'Mengagumkan, mampu memberikan hasil pengerjaan melebihi ekspektasi.'
          ];
          comment = comms[studentNisNum % comms.length];
        } else if (finalGrade >= 75) {
          const comms = [
            'Sudah tuntas dengan baik. Pertahankan prestasimu.',
            'Pemahaman materi sudah cukup baik, tingkatkan ketelitian.',
            'Tuntas. Pekerjaan diselesaikan berdasar standar instruksi guru.'
          ];
          comment = comms[studentNisNum % comms.length];
        } else {
          const comms = [
            'Belum tuntas. Segera selesaikan tugas portofolio & remedial kelas.',
            'Butuh bimbingan intensif dan pemahaman ulang konsep inti.',
            'Nilai berada di bawah KKM 75. Silakan ikuti sesi remedial terjadwal.'
          ];
          comment = comms[studentNisNum % comms.length];
        }

        await dbRun(
          "INSERT INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan) VALUES (?, ?, ?, ?)",
          [actId, student.nis, finalGrade, comment]
        );
      }
    }

    console.log('Seeding process finished with absolute success!');
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    db.close();
    process.exit(1);
  }
}

seed();
