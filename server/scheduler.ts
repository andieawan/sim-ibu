// ============================================================================
// Nama File : scheduler.ts
// Lokasi    : /server/scheduler.ts
// Peran     : Mengelola jadwal pencadangan otomatis data sekolah (Guru, Kelas, 
//             Siswa, Presensi, Nilai, Monitoring BK) ke Google Sheets secara berkala.
//             Menggunakan koordinat waktu zona Asia/Jakarta (WIB) untuk sinkronisasi mingguan.
// Dependency: fs, path, fetch
// ============================================================================

import fs from 'fs';
import path from 'path';
import { dbAll } from './db';

const schoolIdentityPath = path.resolve(process.cwd(), 'school_identity.json');

// ============================================================================
// FUNGSI: getJakartaTime()
// Deskripsi : Mendapatkan detail waktu saat ini di zona waktu Asia/Jakarta (WIB).
// Pengembalian: Objek berisi nama hari, jam, menit, detik, dan string tanggal ISO.
// ============================================================================
export function getJakartaTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  return {
    weekday: getVal('weekday'), // Contoh: "Saturday"
    hour: parseInt(getVal('hour'), 10),
    minute: parseInt(getVal('minute'), 10),
    second: parseInt(getVal('second'), 10),
    dateString: now.toISOString().split('T')[0] // Digunakan untuk deduplikasi backup harian
  };
}

// ============================================================================
// FUNGSI: executeBackupToGoogle()
// Parameter : accessToken - Token otorisasi Google OAuth2.
// Deskripsi : Melakukan ekstraksi seluruh data dari database lokal (SQLite/Postgres)
//             dan menulisnya kembali ke tab-tab terpisah di Google Spreadsheet
//             menggunakan Google Sheets API v4.
// Pengembalian: ID dan URL lembar kerja spreadsheet yang dihasilkan.
// ============================================================================
export async function executeBackupToGoogle(accessToken: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  console.log('[Backup Engine] Starting backup queries...');
  
  // 1. Ambil data mentah dari SQLite untuk seluruh entitas penting
  const pengguna = await dbAll('SELECT id, username, nama, role, nip, jabatan, is_cuti FROM pengguna');
  const kelas = await dbAll('SELECT id, nama_kelas, sekolah, walikelas_id, jurusan FROM kelas');
  const siswa = await dbAll('SELECT nis, nama, jenis_kelamin, kelas_id, status_aktif FROM siswa');
  
  // Query kompleks: Menggabungkan detail kehadiran siswa dengan rincian kelas dan data tanggal absensi harian
  const absensiRecords = await dbAll(`
    SELECT a.tanggal, k.nama_kelas, s.nis, s.nama, d.status, d.updated_at
    FROM detail_absensi d
    JOIN absensi a ON d.absensi_id = a.id
    JOIN siswa s ON d.siswa_nis = s.nis
    JOIN kelas k ON a.kelas_id = k.id
    ORDER BY a.tanggal DESC, k.nama_kelas ASC, s.nama ASC
  `);
  
  // Query kompleks: Menghubungkan perolehan nilai siswa, batas KKM, dan data tugas harian kelas
  const nilaiRecords = await dbAll(`
    SELECT act.nama_aktivitas, act.tanggal, k.nama_kelas, s.nis, s.nama, act.kkm, dn.nilai, dn.catatan
    FROM detail_nilai dn
    JOIN aktivitas_nilai act ON dn.aktivitas_id = act.id
    JOIN siswa s ON dn.siswa_nis = s.nis
    JOIN kelas k ON act.kelas_id = k.id
    ORDER BY act.tanggal DESC, act.nama_aktivitas ASC, s.nama ASC
  `);

  // Query kompleks: Menggabungkan catatan wali kelas dengan data siswa, kelas, dan guru
  const catatanRecords = await dbAll(`
    SELECT c.id, c.tanggal, c.siswa_nis, s.nama as nama_siswa, k.nama_kelas, p.nama as nama_guru, c.kategori, c.catatan
    FROM catatan_walikelas c
    LEFT JOIN siswa s ON c.siswa_nis = s.nis
    LEFT JOIN kelas k ON c.kelas_id = k.id
    LEFT JOIN pengguna p ON c.guru_id = p.id
    ORDER BY c.tanggal DESC, c.id DESC
  `);

  // Query kompleks: Menggabungkan rincian surat BK dengan relasi profil siswa dan guru bimbingan konseling
  const suratRecords = await dbAll(`
    SELECT sb.id, sb.tanggal, sb.siswa_nis, s.nama as nama_siswa, p.nama as nama_guru, sb.jenis_surat, sb.keterangan, sb.status
    FROM surat_bk sb
    LEFT JOIN siswa s ON sb.siswa_nis = s.nis
    LEFT JOIN pengguna p ON sb.guru_id = p.id
    ORDER BY sb.tanggal DESC, sb.id DESC
  `);

  console.log(`[Backup Engine] Data fetched: ${pengguna.length} Guru, ${kelas.length} Kelas, ${siswa.length} Siswa, ${absensiRecords.length} Presensi, ${nilaiRecords.length} Nilai, ${catatanRecords.length} Catatan Monitoring, ${suratRecords.length} Surat BK.`);

  // Transformasikan struktur database relasional menjadi format baris array matriks untuk Google Sheets
  const guruRows = pengguna.map((p, idx) => [
    idx + 1, p.id, p.username, p.nama, p.role, p.nip || '-', p.jabatan || '-', p.is_cuti ? 'Ya' : 'Tidak'
  ]);
  
  const kelasRows = kelas.map((c, idx) => [
    idx + 1, c.id, c.nama_kelas, c.jurusan || '-', c.walikelas_id || '-'
  ]);
  
  const siswaRows = siswa.map((s, idx) => [
    idx + 1, s.nis, s.nama, s.jenis_kelamin, s.kelas_id || '-', s.status_aktif ? 'Ya' : 'Tidak'
  ]);
  
  const absensiRows = absensiRecords.map((r, idx) => [
    idx + 1, r.tanggal, r.nama_kelas, r.nis, r.nama, r.status, r.updated_at
  ]);
  
  const nilaiRows = nilaiRecords.map((r, idx) => {
    const isNum = typeof r.nilai === 'number';
    const status = isNum && r.nilai >= (r.kkm || 75) ? 'Tuntas' : 'Remedial';
    return [
      idx + 1, r.nama_aktivitas, r.tanggal, r.nama_kelas, r.nis, r.nama, r.kkm || 75, r.nilai, status, r.catatan || '-'
    ];
  });

  const catatanRows = catatanRecords.map((r, idx) => [
    idx + 1, r.tanggal, r.siswa_nis || '-', r.nama_siswa || '-', r.nama_kelas || '-', r.nama_guru || '-', r.kategori || 'Umum', r.catatan || '-'
  ]);

  const suratRows = suratRecords.map((r, idx) => [
    idx + 1, r.tanggal, r.siswa_nis || '-', r.nama_siswa || '-', r.nama_guru || '-', r.jenis_surat || '-', r.keterangan || '-', r.status || 'Tercetak'
  ]);

  // 2. Baca ID spreadsheet Google Sheets yang sudah tersimpan
  const data = fs.existsSync(schoolIdentityPath) ? JSON.parse(fs.readFileSync(schoolIdentityPath, 'utf8')) : {};
  let spreadsheetId = data.google_backup_spreadsheet_id;

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const targetSheetTitles = [
    '1. Guru & Staff',
    '2. Daftar Kelas',
    '3. Daftar Siswa',
    '4. Rekap Presensi',
    '5. Rekap Nilai',
    '6. Catatan Monitoring',
    '7. Surat Panggilan BK'
  ];

  // Membersihkan atau membuat ulang tab spreadsheet jika ID spreadsheet sudah ada
  if (spreadsheetId) {
    try {
      console.log(`[Backup Engine] Existing Spreadsheet detected (${spreadsheetId}). Checking sheets...`);
      const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers
      });
      if (!getRes.ok) {
        throw new Error('Spreadsheet not accessible or missing');
      }
      const sheetMeta = await getRes.json();
      const existingTitles = (sheetMeta.sheets || []).map((s: any) => s.properties?.title);
      
      const missingSheets = targetSheetTitles.filter(t => !existingTitles.includes(t));
      if (missingSheets.length > 0) {
        console.log(`[Backup Engine] Adding missing sheets: ${missingSheets.join(', ')}`);
        const addRequests = missingSheets.map(title => ({
          addSheet: {
            properties: { title }
          }
        }));
        const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ requests: addRequests })
        });
        if (!addRes.ok) {
          console.warn('[Backup Engine] Failed to add missing sheets, trying to clear anyway...', await addRes.text());
        }
      }

      console.log(`[Backup Engine] Clearing existing tabs...`);
      const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ranges: targetSheetTitles.map(title => `'${title}'!A1:Z100000`)
        })
      });
      if (!clearRes.ok) {
        throw new Error('Spreadsheet not accessible or missing');
      }
    } catch (err) {
      console.warn('[Backup Engine] Failed to clear existing spreadsheet (deleted or unauthorized). Re-creating new sheet...', err);
      spreadsheetId = null;
    }
  }

  // Membuat berkas Google Spreadsheet baru jika belum pernah terdaftar atau jika lembar kerja lama rusak
  if (!spreadsheetId) {
    console.log('[Backup Engine] Creating a brand new Google Spreadsheet...');
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        properties: {
          title: `SIM-IBU Backup Database - SMK Ibu`
        },
        sheets: targetSheetTitles.map(title => ({ properties: { title } }))
      })
    });

    if (!createRes.ok) {
      const errDetail = await createRes.json();
      throw new Error(errDetail.error?.message || 'Gagal membuat Google Spreadsheet baru');
    }

    const createdSheet = await createRes.json();
    spreadsheetId = createdSheet.spreadsheetId;
    
    // Simpan ID spreadsheet yang baru dibuat ke file identitas sekolah
    data.google_backup_spreadsheet_id = spreadsheetId;
    fs.writeFileSync(schoolIdentityPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[Backup Engine] New Google Spreadsheet created successfully with ID: ${spreadsheetId}`);
  }

  // 3. Menulis ulang seluruh data sekolah secara massal (Batch Update) ke tab-tab spreadsheet terkait
  console.log(`[Backup Engine] Writing backup data to Google Sheets tabs...`);
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: "'1. Guru & Staff'!A1",
          values: [
            ["No", "ID Guru", "Username", "Nama Lengkap", "Role Pengguna", "NIP", "Jabatan", "Status Cuti"],
            ...guruRows
          ]
        },
        {
          range: "'2. Daftar Kelas'!A1",
          values: [
            ["No", "ID Kelas", "Nama Kelas", "Jurusan / Kompetensi", "ID Wali Kelas"],
            ...kelasRows
          ]
        },
        {
          range: "'3. Daftar Siswa'!A1",
          values: [
            ["No", "NIS Siswa", "Nama Siswa", "Jenis Kelamin (L/P)", "ID Kelas", "Status Aktif"],
            ...siswaRows
          ]
        },
        {
          range: "'4. Rekap Presensi'!A1",
          values: [
            ["No", "Tanggal Presensi", "Nama Kelas", "NIS Siswa", "Nama Siswa", "Status Kehadiran", "Terakhir Diperbarui"],
            ...absensiRows
          ]
        },
        {
          range: "'5. Rekap Nilai'!A1",
          values: [
            ["No", "Nama Aktivitas/Ujian", "Tanggal Pelaksanaan", "Nama Kelas", "NIS Siswa", "Nama Siswa", "Kriteria KKM", "Nilai Diperoleh", "Status Kelulusan", "Catatan Guru"],
            ...nilaiRows
          ]
        },
        {
          range: "'6. Catatan Monitoring'!A1",
          values: [
            ["No", "Tanggal Catatan", "NIS Siswa", "Nama Siswa", "Nama Kelas", "Nama Guru/Wali Kelas", "Kategori", "Detail Catatan / Tindakan"],
            ...catatanRows
          ]
        },
        {
          range: "'7. Surat Panggilan BK'!A1",
          values: [
            ["No", "Tanggal Surat", "NIS Siswa", "Nama Siswa", "Guru Pembuat (BK)", "Jenis Surat", "Keterangan / Alasan", "Status Proses"],
            ...suratRows
          ]
        }
      ]
    })
  });

  if (!updateRes.ok) {
    const errDetail = await updateRes.json();
    throw new Error(errDetail.error?.message || 'Gagal mengisi data ke Google Spreadsheet');
  }

  // Perbarui metadata waktu pencadangan terakhir yang berhasil di file identitas sekolah
  const freshData = fs.existsSync(schoolIdentityPath) ? JSON.parse(fs.readFileSync(schoolIdentityPath, 'utf8')) : {};
  freshData.google_backup_spreadsheet_id = spreadsheetId;
  freshData.last_backup_time = new Date().toISOString();
  freshData.last_backup_status = 'Sukses';
  fs.writeFileSync(schoolIdentityPath, JSON.stringify(freshData, null, 2), 'utf8');

  console.log(`[Backup Engine] Database backup successfully persisted in Google Sheets!`);
  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}

let isBackupRunning = false;
let lastBackupDate = '';

// ============================================================================
// FUNGSI: checkAndRunScheduledBackup()
// Deskripsi : Memeriksa kelayakan dan mengeksekusi pencadangan otomatis harian/mingguan.
// Aturan Bisnis: Pencadangan otomatis berjalan hanya setiap hari Sabtu jam 23:55 WIB
//                bila fitur penjadwalan diaktifkan & token otorisasi tersedia.
// ============================================================================
export async function checkAndRunScheduledBackup() {
  if (isBackupRunning) return;
  
  try {
    const data = fs.existsSync(schoolIdentityPath) ? JSON.parse(fs.readFileSync(schoolIdentityPath, 'utf8')) : {};
    
    // Periksa apakah pencadangan terjadwal diaktifkan dan memiliki token Google yang valid
    if (!data.backup_schedule_enabled || !data.google_backup_token) {
      return;
    }

    const timeInfo = getJakartaTime();
    
    // Aturan Penjadwalan: Hari Sabtu, Pukul 23:55 WIB
    if (timeInfo.weekday === 'Saturday' && timeInfo.hour === 23 && timeInfo.minute === 55) {
      if (lastBackupDate === timeInfo.dateString) {
        return; // Mencegah eksekusi ganda dalam rentang menit yang sama (23:55:00 - 23:55:59)
      }
      
      console.log(`[Backup Scheduler] Saturday 23:55 WIB triggered! Executing automatic backup...`);
      isBackupRunning = true;
      lastBackupDate = timeInfo.dateString;
      
      try {
        await executeBackupToGoogle(data.google_backup_token);
        console.log('[Backup Scheduler] Automatic weekly backup completed successfully.');
      } catch (err: any) {
        console.error('[Backup Scheduler] Automatic weekly backup failed:', err);
        
        // Catat status kegagalan ke berkas identitas sekolah
        const freshData = fs.existsSync(schoolIdentityPath) ? JSON.parse(fs.readFileSync(schoolIdentityPath, 'utf8')) : {};
        freshData.last_backup_status = `Gagal: ${err.message || err}`;
        freshData.last_backup_time = new Date().toISOString();
        fs.writeFileSync(schoolIdentityPath, JSON.stringify(freshData, null, 2), 'utf8');
      }
    }
  } catch (err) {
    console.error('[Backup Scheduler] Error checking scheduled backup state:', err);
  } finally {
    isBackupRunning = false;
  }
}

// ============================================================================
// FUNGSI: startBackupScheduler()
// Deskripsi : Memulai interval pengecekan berkala scheduler di background Express.
// Efek       : Melakukan polling status waktu setiap 45 detik.
// ============================================================================
export function startBackupScheduler() {
  console.log('[Backup Scheduler] Initialized. Backup schedule runs weekly on Saturdays at 23:55 WIB.');
  
  // Melakukan pengecekan setiap 45 detik untuk memastikan momentum jam 23:55 tercapai dengan presisi tinggi
  setInterval(() => {
    checkAndRunScheduledBackup();
  }, 45000);
}
