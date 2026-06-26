import path from 'path';
import Database, { Database as BetterDatabase } from 'better-sqlite3';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// ============================================================================
// SISTEM GURU PINTAR (SiGup) - DATABASE CONNECTION & MIGRATION SCRIPT
// FILE: server/db.ts
// 
// Developer Note:
// Pengelolaan Database Server kita ada di sini!
// Menggunakan Better-SQLite3 untuk performa dan stabilitas. 
// ============================================================================

// Connect to SQLite Database
const dbPath = path.resolve(process.cwd(), 'sekolah.db');

export let db: BetterDatabase;

// --- DATABASE PROVIDER INTERFACE ---
export interface DatabaseProvider {
  name: string;
  connect(): Promise<void>;
  run(sql: string, params?: any[]): Promise<{ id: number; changes: number }>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  close(): Promise<void>;
  translateSql?(sql: string): string;
}

// --- Better-SQLite3 Provider Implementation ---
class BetterSQLiteDatabaseProvider implements DatabaseProvider {
  name = 'sqlite';

  async connect(): Promise<void> {
    try {
      db = new Database(dbPath, { verbose: console.log });
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = -64000');
      console.log('Connected to better-sqlite3 database at:', dbPath);
      
      // Check integrity
      const row = db.prepare('PRAGMA integrity_check;').get() as any;
      if (row && row.integrity_check !== 'ok') {
          console.warn('SQLite integrity check failed', row);
      }
      
      await initializeDatabase();
    } catch (err: any) {
      console.error('Error connecting to better-sqlite3 database:', err);
      // For now, re-throw or handle as critical
      throw err;
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { id: Number(info.lastInsertRowid), changes: info.changes };
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  async close(): Promise<void> {
    if (db) {
      db.close();
    }
  }

  translateSql(sql: string): string {
    return sql;
  }
}

// --- PostgreSQL Provider (Easy Switch Adapter Sample) ---
// Instructions: `npm install pg` and add `DB_TYPE=postgres` in your env.
class PostgreSQLDatabaseProvider implements DatabaseProvider {
  name = 'postgres';
  private pool: any = null;

  async connect(): Promise<void> {
    console.log('Connecting to PostgreSQL database using host:', process.env.DB_HOST || 'localhost');
    try {
      // Dynamic import to prevent crash on startup if peer-dependencies are not installed!
      const pg = await import('pg' as any);
      this.pool = new pg.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'sigup_db',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });
      console.log('Successfully connected to Postgres Pool [Lazy loaded pg].');
    } catch (err: any) {
      console.error('Error connecting to PostgreSQL database:', err.message);
      console.warn('Fallback: Creating mock/local simulator client to avoid crash on start.');
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
    if (!this.pool) {
      throw new Error('PostgreSQL client pool is not loaded. Ensure you installed "pg" and database credentials are correct.');
    }
    // Replace SQLite positional ? with PostgreSQL positional $1, $2...
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);

    const res = await this.pool.query(pgSql, params);
    const lastRow = res.rows ? res.rows[0] : null;
    return {
      id: lastRow ? (lastRow.id || 0) : 0,
      changes: res.rowCount || 0
    };
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) throw new Error('PostgreSQL client pool not loaded.');
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);
    
    const res = await this.pool.query(pgSql, params);
    return res.rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.pool) throw new Error('PostgreSQL client pool not loaded.');
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);
    
    const res = await this.pool.query(pgSql, params);
    return res.rows?.[0] as T | undefined;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  translateSql(sql: string): string {
    let pgSql = sql;
    // ============================================================================
    // TRANSLASI QUERY SQLITE KE POSTGRESQL (ADAPTER PATTERN)
    // Maksud Bisnis: Memastikan kueri SQL yang ditulis dengan dialek SQLite dapat dieksekusi
    // di mesin PostgreSQL produksi tanpa perubahan kode di sisi layanan/routes.
    // Aliran Data:
    // - Input: Kueri SQL mentah berbasis SQLite (misalnya: INTEGER PRIMARY KEY AUTOINCREMENT)
    // - Output: Kueri SQL yang kompatibel dengan standar PostgreSQL (misalnya: SERIAL PRIMARY KEY)
    // ============================================================================
    
    // 1. Ubah Auto-increment SQLite menjadi SERIAL PostgreSQL
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    
    // 2. Ubah fungsi datetime SQLite menjadi CURRENT_TIMESTAMP standar PostgreSQL
    pgSql = pgSql.replace(/datetime\('now'/gi, "CURRENT_TIMESTAMP");
    
    // 3. Ubah perintah INSERT OR REPLACE khas SQLite pada detail_nilai menjadi ON CONFLICT DO UPDATE PostgreSQL
    if (/INSERT OR REPLACE INTO detail_nilai/i.test(pgSql)) {
      pgSql = pgSql.replace(
        /INSERT OR REPLACE INTO detail_nilai \(([^)]+)\) VALUES \(([^)]+)\)/i,
        (_, cols, vals) => `INSERT INTO detail_nilai (${cols}) VALUES (${vals}) ON CONFLICT(aktivitas_id, siswa_nis) DO UPDATE SET nilai = EXCLUDED.nilai, catatan = EXCLUDED.catatan`
      );
    }
    
    // 4. Ubah sisa perintah INSERT OR REPLACE menjadi INSERT INTO biasa
    pgSql = pgSql.replace(/INSERT OR REPLACE INTO/gi, 'INSERT INTO');

    // 5. Otomatis menambahkan klausa 'RETURNING id' untuk semua perintah INSERT di PostgreSQL,
    // kecuali untuk tabel 'siswa' dan 'patches' yang tidak menggunakan kolom kunci otomatis 'id'.
    // Hal ini sangat penting agar pgRun dapat mengembalikan ID baris baru yang berhasil dimasukkan.
    if (/INSERT INTO/i.test(pgSql) && !/RETURNING/i.test(pgSql)) {
      if (!/\bsiswa\b/i.test(pgSql) && !/\bpatches\b/i.test(pgSql)) {
        pgSql = pgSql + " RETURNING id";
      }
    }
    
    // === AKHIR DARI LOGIKA TRANSLASI QUERY ===
    return pgSql;
  }
}

// --- MySQL Provider (Easy Switch Adapter Sample) ---
// Instructions: `npm install mysql2` and add `DB_TYPE=mysql` in your env.
class MySQLDatabaseProvider implements DatabaseProvider {
  name = 'mysql';
  private connection: any = null;

  async connect(): Promise<void> {
    console.log('Connecting to MySQL database using host:', process.env.DB_HOST || 'localhost');
    try {
      const mysql = await import('mysql2/promise' as any);
      this.connection = await mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'sigup_db',
      });
      console.log('Successfully connected to MySQL Pool [Lazy loaded mysql2].');
    } catch (err: any) {
      console.error('Error connecting to MySQL database:', err.message);
      console.warn('Fallback: Simulator mode initialized.');
    }
  }

  async run(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
    if (!this.connection) {
      throw new Error('MySQL connection pool not loaded. Check install: "npm install mysql2".');
    }
    const [res] = await this.connection.execute(sql, params);
    return {
      id: (res as any).insertId || 0,
      changes: (res as any).affectedRows || 0
    };
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.connection) throw new Error('MySQL connection pool not loaded.');
    const [rows] = await this.connection.execute(sql, params);
    return rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.connection) throw new Error('MySQL connection pool not loaded.');
    const [rows] = await this.connection.execute(sql, params);
    return (rows as any[])?.[0] as T | undefined;
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }

  translateSql(sql: string): string {
    let mySql = sql;
    // 1. Convert SQLite Auto-increment to MySQL
    mySql = mySql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY');
    // 2. Convert INSERT OR REPLACE to mysql REPLACE INTO
    mySql = mySql.replace(/INSERT OR REPLACE INTO/gi, 'REPLACE INTO');
    return mySql;
  }
}


// Factory Selection
const providers: Record<string, DatabaseProvider> = {
  sqlite: new BetterSQLiteDatabaseProvider(),
  postgres: new PostgreSQLDatabaseProvider(),
  mysql: new MySQLDatabaseProvider(),
};

const selectedDbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
export const activeProvider = providers[selectedDbType] || providers.sqlite;

console.log(`Database engine loaded: [${activeProvider.name}] (Configured via DB_TYPE, default: sqlite)`);

// SQL promise wrappers for clean async/await with automatic query routing and translation
export const dbRun = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.run(finalSql, params);
};

export const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.all<T>(finalSql, params);
};

export const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.get<T>(finalSql, params);
};

// Establish database connection on startup
export function connectDatabase() {
  activeProvider.connect().then(() => {
    if (activeProvider.name !== 'sqlite') {
      console.log(`Initializing & Seeding target Database Engine tables: [${activeProvider.name}]...`);
      initializeDatabase().catch((initErr) => {
        console.error(`Failed executing initialization script on active engine: ${activeProvider.name}`, initErr);
      });
    }
  }).catch((err) => {
    console.error(`Failed to establish database connection for provider: ${activeProvider.name}`, err);
  });
}

// Connect immediately
connectDatabase();

// Create tables & Seed dummy data
export async function initializeDatabase() {
  try {
    // 1. Table Kelas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS kelas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kelas TEXT NOT NULL,
        sekolah TEXT DEFAULT 'SMK Ibu',
        walikelas_id INTEGER
      )
    `);

    try {
      await dbRun("ALTER TABLE kelas ADD COLUMN walikelas_id INTEGER");
    } catch (e) {
      // Ignore if the column already exists
    }

    try {
      await dbRun("ALTER TABLE kelas ADD COLUMN jurusan TEXT DEFAULT ''");
    } catch (e) {
      // Ignore
    }

    // 2. Table Siswa
    await dbRun(`
      CREATE TABLE IF NOT EXISTS siswa (
        nis TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
        kelas_id INTEGER,
        status_aktif INTEGER DEFAULT 1,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      )
    `);

    try {
      await dbRun("ALTER TABLE siswa ADD COLUMN status_aktif INTEGER DEFAULT 1");
    } catch (e) {
      // Ignore if the column already exists
    }

    // 3. Table Aktivitas_Nilai
    await dbRun(`
      CREATE TABLE IF NOT EXISTS aktivitas_nilai (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_aktivitas TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        kelas_id INTEGER,
        kkm INTEGER DEFAULT 75,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      )
    `);

    try {
      await dbRun("ALTER TABLE aktivitas_nilai ADD COLUMN kkm INTEGER DEFAULT 75");
    } catch (e) {
      // Ignore if the column already exists
    }

    // 4. Table Detail_Nilai
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

    // 5. Table Absensi
    await dbRun(`
      CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        kelas_id INTEGER,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        UNIQUE(tanggal, kelas_id)
      )
    `);

    // 6. Table Detail_Absensi
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

    // 7. Table Pengguna
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pengguna (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nama TEXT NOT NULL,
        role TEXT NOT NULL,
        nip TEXT DEFAULT '',
        jabatan TEXT DEFAULT '',
        is_cuti INTEGER DEFAULT 0
      )
    `);

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN nip TEXT DEFAULT ''");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN jabatan TEXT DEFAULT ''");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN siswa_nis TEXT");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN kelas_id INTEGER");
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN jurusan TEXT DEFAULT ''");
    } catch (e) {
      // Ignore
    }

    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN is_cuti INTEGER DEFAULT 0");
    } catch (e) {
      // Ignore
    }

    // 8. Table Jadwal
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

    // 9. Table Catatan Wali Kelas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS catatan_walikelas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siswa_nis TEXT,
        kelas_id INTEGER,
        guru_id INTEGER,
        kategori TEXT DEFAULT 'Umum',
        catatan TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        FOREIGN KEY(siswa_nis) REFERENCES siswa(nis) ON DELETE CASCADE,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        FOREIGN KEY(guru_id) REFERENCES pengguna(id) ON DELETE CASCADE
      )
    `);

    // 10. Table Surat BK
    await dbRun(`
      CREATE TABLE IF NOT EXISTS surat_bk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siswa_nis TEXT,
        guru_id INTEGER,
        jenis_surat TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        keterangan TEXT NOT NULL,
        status TEXT DEFAULT 'Tercetak',
        FOREIGN KEY(siswa_nis) REFERENCES siswa(nis) ON DELETE CASCADE,
        FOREIGN KEY(guru_id) REFERENCES pengguna(id) ON DELETE CASCADE
      )
    `);

    // Add Database Indexing for High Scalability and Performance Output
    await dbRun("CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON siswa(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_absensi_kelas_id ON absensi(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id ON aktivitas_nilai(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_detail_absensi_id ON detail_absensi(absensi_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_detail_nilai_id ON detail_nilai(aktivitas_id)");
    await dbRun("CREATE UNIQUE INDEX IF NOT EXISTS idx_pengguna_username ON pengguna(username)");

    // 9. Table Patches (System Update History & Diagnosis Status)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS patches (
        id TEXT PRIMARY KEY,
        nama_patch TEXT NOT NULL,
        deskripsi TEXT,
        kategori TEXT,
        status TEXT,
        applied_at TEXT,
        sql_statements TEXT
      )
    `);

    // ============================================================================
    // MIGRASI DIAGNOSTIK & DEFENSIVE COLUMN ADDITION (MULTI-ENGINE COMPATIBLE)
    // Maksud Bisnis: Memigrasikan format tanggal lama agar seragam menggunakan garis miring ('/'),
    // serta menjamin kolom-kolom baru seperti 'is_approved_by_walikelas' dan 'sql_statements'
    // ditambahkan dengan aman baik di SQLite maupun PostgreSQL tanpa memicu kegagalan startup.
    // ============================================================================
    try {
      await dbRun("UPDATE absensi SET tanggal = REPLACE(tanggal, '-', '/') WHERE tanggal LIKE '%-%'");
      await dbRun("UPDATE aktivitas_nilai SET tanggal = REPLACE(tanggal, '-', '/') WHERE tanggal LIKE '%-%'");
      
      if (activeProvider.name === 'sqlite') {
        // --- LOGIK KHUSUS ENGINE SQLITE ---
        // Menggunakan PRAGMA table_info untuk memeriksa kolom secara aman sebelum melakukan ALTER TABLE
        const tableInfo = await dbAll("PRAGMA table_info(absensi)");
        const hasIsApprovedCol = tableInfo.some((col: any) => col.name === 'is_approved_by_walikelas');
        if (!hasIsApprovedCol) {
          await dbRun("ALTER TABLE absensi ADD COLUMN is_approved_by_walikelas INTEGER DEFAULT 0");
        }

        const patchesTableInfo = await dbAll("PRAGMA table_info(patches)");
        const hasSqlStatements = patchesTableInfo.some((col: any) => col.name === 'sql_statements');
        if (!hasSqlStatements) {
          await dbRun("ALTER TABLE patches ADD COLUMN sql_statements TEXT");
        }
      } else {
        // --- LOGIK KHUSUS ENGINE POSTGRESQL / MYSQL ---
        // Mencoba langsung menambahkan kolom baru dengan mengabaikan error jika kolom sudah terdaftar
        try {
          await dbRun("ALTER TABLE absensi ADD COLUMN is_approved_by_walikelas INTEGER DEFAULT 0");
        } catch (colErr) {
          // Abaikan jika kolom sudah ada
        }

        try {
          await dbRun("ALTER TABLE patches ADD COLUMN sql_statements TEXT");
        } catch (colErr) {
          // Abaikan jika kolom sudah ada
        }
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
    // === AKHIR DARI PROSES MIGRASI ===

    // Seed initial users if table is empty
    const adminCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['admin']);
    const guruCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['guru']);
    const ortuCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['ortu']);
    const bkUserCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['bk']);
    const kajurUserCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['kajur']);
    const kepsekUserCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['kepsek']);

    const defaultPass = bcrypt.hashSync('guru123', 10);
    const parentPass = bcrypt.hashSync('ortu123', 10);

    if (adminCount?.count === 0) {
      const adminPass = bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role) VALUES ('admin', ?, 'Administrator Utama', 'admin')", [adminPass]);
    }
    if (guruCount?.count === 0) {
      await dbRun("INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES ('guru', ?, 'Budi Santoso, S.Pd.', 'guru', '198402112009031002', 'Guru Matematika')", [defaultPass]);
    }
    
    // Tambahan Guru-guru lain untuk simulasi realistik banyak kelas dan mata pelajaran
    const extraGurus = [
      { username: 'guru2', nama: 'Siti Rahma, S.Pd.', role: 'guru', nip: '198805232014022003', jabatan: 'Guru DKV / Wali Kelas' },
      { username: 'guru3', nama: 'Andi Wijaya, S.Kom.', role: 'guru', nip: '199211042019031005', jabatan: 'Guru RPL / Produktif' },
      { username: 'guru4', nama: 'Dewi Lestari, M.Pd.', role: 'guru', nip: '198509152011012004', jabatan: 'Guru Akuntansi' },
      { username: 'guru5', nama: 'Ahmad Farhan, S.Pd.', role: 'guru', nip: '199008222016021008', jabatan: 'Guru Bisnis Digital' },
    ];
    for (const g of extraGurus) {
      const exists = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', [g.username]);
      if (exists?.count === 0) {
        await dbRun("INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES (?, ?, ?, ?, ?, ?)", [g.username, defaultPass, g.nama, g.role, g.nip, g.jabatan]);
      }
    }

    if (ortuCount?.count === 0) {
      await dbRun("INSERT INTO pengguna (username, password, nama, role, kelas_id) VALUES ('ortu', ?, 'Wali Murid Kelas X DKV 1', 'wali_murid', 1)", [parentPass]);
    }

    // Tambahan Wali Murid (Parents) lain untuk sinkronisasi monitoring
    const extraParents = [
      { username: 'ortu2', nama: 'Subagyo (Orang Tua Kevin)', role: 'wali_murid', kelas_id: 2 },
      { username: 'ortu3', nama: 'Herianto (Orang Tua Clara)', role: 'wali_murid', kelas_id: 3 },
      { username: 'ortu4', nama: 'Yusuf S. (Orang Tua Maudy)', role: 'wali_murid', kelas_id: 4 },
      { username: 'ortu5', nama: 'Rudi Hermawan (Orang Tua Dimas)', role: 'wali_murid', kelas_id: 5 },
    ];
    for (const p of extraParents) {
      const exists = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', [p.username]);
      if (exists?.count === 0) {
        await dbRun("INSERT INTO pengguna (username, password, nama, role, kelas_id) VALUES (?, ?, ?, ?, ?)", [p.username, parentPass, p.nama, p.role, p.kelas_id]);
      }
    }
    
    // Add BK, Kajur, Kepsek users if they don't exist in the system (checked by username)
    if (bkUserCount?.count === 0) {
      const bkPass = bcrypt.hashSync('bk123', 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES ('bk', ?, 'Dra. Siska Putri, M.Psi', 'bk', '197906142005012001', 'Koordinator BK')", [bkPass]);
    }
    // Tambahan BK ke-2
    const bk2Exists = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', ['bk2']);
    if (bk2Exists?.count === 0) {
      const bkPass = bcrypt.hashSync('bk123', 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES ('bk2', ?, 'Rian Hidayat, S.Psi', 'bk', '198710182015041002', 'Staf Konselor BK')", [bkPass]);
    }

    if (kajurUserCount?.count === 0) {
      const kajurPass = bcrypt.hashSync('kajur123', 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role, jurusan, nip, jabatan) VALUES ('kajur', ?, 'Irwan Hermawan, M.Sn', 'kajur', 'Desain Komunikasi Visual', '197501022001031003', 'Kajur DKV')", [kajurPass]);
    }
    // Tambahan Kajur Jurusan lain agar fleksibel
    const extraKajurs = [
      { username: 'kajur_bd', nama: 'H. Mulyadi, M.M.', role: 'kajur', jurusan: 'Bisnis Digital', jabatan: 'Kajur Bisnis Digital' },
      { username: 'kajur_ak', nama: 'Sri Wahyuni, S.E., Ak.', role: 'kajur', jurusan: 'Akuntansi', jabatan: 'Kajur Akuntansi' },
      { username: 'kajur_rpl', nama: 'Ferry Astika, S.Kom., M.T.', role: 'kajur', jurusan: 'Rekayasa Perangkat Lunak', jabatan: 'Kajur RPL' },
    ];
    for (const kj of extraKajurs) {
      const exists = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM pengguna WHERE username = ?', [kj.username]);
      if (exists?.count === 0) {
        const kajurPass = bcrypt.hashSync('kajur123', 10);
        await dbRun("INSERT INTO pengguna (username, password, nama, role, jurusan, jabatan) VALUES (?, ?, ?, ?, ?, ?)", [kj.username, kajurPass, kj.nama, kj.role, kj.jurusan, kj.jabatan]);
      }
    }

    if (kepsekUserCount?.count === 0) {
      const kepsekPass = bcrypt.hashSync('kepsek123', 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES ('kepsek', ?, 'Dr. H. Ahmad Sunarto, M.Pd.', 'kepsek', '196803151992031005', 'Kepala Sekolah')", [kepsekPass]);
    }

    // Migrate any existing plaintext passwords inside the database
    try {
      const users = await dbAll('SELECT id, password FROM pengguna');
      for (const u of users) {
        const isBcryptHashed = /^\$2[ayb]\$\d+\$[./A-Za-z0-9]{53}$/.test(u.password);
        if (!isBcryptHashed) {
          console.log(`Migrating plaintext password to bcrypt hash for user ID: ${u.id}`);
          const secureHash = bcrypt.hashSync(u.password, 10);
          await dbRun('UPDATE pengguna SET password = ? WHERE id = ?', [secureHash, u.id]);
        }
      }
    } catch (migError) {
      console.error('Plaintext password migration failed:', migError);
    }

    // ============================================================================
    // EVALUASI TAHAPAN PENGEMBANGAN (APP_ENV) SEBELUM SEEDING DATA DUMMY
    // Maksud Bisnis: Memastikan data contoh (dummy) hanya masuk ke dalam sistem ketika
    // aplikasi berada pada tahap pengembangan ('dev'). Jika sudah diatur ke mode 
    // produksi ('pub'), database akan dibiarkan bersih (fresh) tanpa ada data rekayasa,
    // demi keamanan dan kebersihan sistem saat mulai digunakan secara riil.
    //
    // Aliran Data:
    // - Input: Membaca nilai dari variabel lingkungan process.env.APP_ENV (nilai default: 'dev').
    // - Output: Menampilkan log status, lalu menghentikan eksekusi seeding jika terdeteksi mode 'pub'.
    // ============================================================================
    const classCount = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM kelas');
    if (classCount && classCount.count === 0) {
      const envSetting = (process.env.APP_ENV || 'dev').toLowerCase().trim();
      const isPubMode = envSetting === 'pub' || envSetting === 'publish';

      if (isPubMode) {
        console.log('--- MODE PRODUKSI AKTIF (APP_ENV=pub) ---');
        console.log('Penjelasan: Melewatkan pembuatan data dummy. Database dibiarkan dalam kondisi fresh.');
        return;
      }

      console.log('--- MODE PENGEMBANGAN AKTIF (APP_ENV=dev) ---');
      console.log('Penjelasan: Memulai proses seeding data dummy otomatis untuk mempermudah peninjauan fitur...');
      // === AKHIR DARI EVALUASI APP_ENV ===
      
      // Ambil ID dari guru-guru yang terdaftar secara dinamis untuk relasi Wali Kelas
      const g1 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru'");
      const g2 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru2'");
      const g3 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru3'");
      const g4 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru4'");
      const g5 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru5'");

      const idGuru1 = g1 ? g1.id : 2;
      const idGuru2 = g2 ? g2.id : (g1 ? g1.id : 2);
      const idGuru3 = g3 ? g3.id : (g1 ? g1.id : 2);
      const idGuru4 = g4 ? g4.id : (g1 ? g1.id : 2);
      const idGuru5 = g5 ? g5.id : (g1 ? g1.id : 2);

      const k1 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id, jurusan) VALUES ('X DKV 1', 'SMK Ibu', ?, 'DKV')", [idGuru1]);
      const k2 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id, jurusan) VALUES ('XI DKV 1', 'SMK Ibu', ?, 'DKV')", [idGuru2]);
      const k3 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id, jurusan) VALUES ('XI BD 1', 'SMK Ibu', ?, 'BD')", [idGuru3]);
      const k4 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id, jurusan) VALUES ('XII AK 1', 'SMK Ibu', ?, 'AK')", [idGuru4]);

      const classIds = [k1.id, k2.id, k3.id, k4.id];

      const indonesianStudents = [
        // Class 1 (X DKV 1) - 15 siswa
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
        
        // Class 2 (XI DKV 1) - 15 siswa
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

        // Class 3 (XI BD 1 - Bisnis Digital) - 10 siswa
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

        // Class 4 (XII AK 1 - Akuntansi) - 15 siswa
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

      // Insert Siswa
      for (const student of indonesianStudents) {
        const classId = classIds[student.classOffset];
        await dbRun(
          "INSERT INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)",
          [student.nis, student.nama, student.jk, classId]
        );
      }

      // Insert Schedules (Jadwal) - Mata Pelajaran masing-masing Jurusan secara dinamis menggunakan ID Guru real
      // 1. DKV: Gambar Sketsa, Dasar-Dasar DKV, Desain Grafis Percetakan, Fotografi & Videografi
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Dasar-Dasar DKV', 'Senin', '07:30', '09:00')", [k1.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Gambar Sketsa & Ilustrasi', 'Rabu', '09:30', '11:00')", [k1.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Sejarah Seni Rupa', 'Senin', '09:30', '11:30')", [k1.id, idGuru1]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Komposisi Desain', 'Selasa', '07:30', '09:30')", [k1.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Matematika Terapan', 'Kamis', '07:30', '09:30')", [k1.id, idGuru1]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Bahasa Inggris Komunikasi', 'Jumat', '09:00', '11:00')", [k1.id, idGuru1]);

      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Desain Grafis Percetakan', 'Selasa', '08:00', '10:00')", [k2.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Fotografi & Videografi', 'Kamis', '08:00', '10:30')", [k2.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Animasi 2D & 3D', 'Senin', '08:00', '10:30')", [k2.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Tipografi Aplikatif', 'Rabu', '10:00', '12:00')", [k2.id, idGuru2]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Kewirausahaan Kreatif', 'Kamis', '11:00', '13:00')", [k2.id, idGuru5]);
      
      // 2. Bisnis Digital (BD): Digital Marketing & SEO, E-Commerce & Marketplace
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Digital Marketing & SEO', 'Kamis', '10:45', '12:45')", [k3.id, idGuru5]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'E-Commerce & Marketplace', 'Jumat', '08:00', '10:00')", [k3.id, idGuru5]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Analisis Data Pasar', 'Senin', '10:00', '12:30')", [k3.id, idGuru5]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Copywriting untuk Promosi', 'Selasa', '09:00', '11:30')", [k3.id, idGuru5]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Matematika Bisnis', 'Rabu', '08:00', '10:00')", [k3.id, idGuru1]);
      
      // 3. Akuntansi (AK): Akuntansi Keuangan, Spreadsheet Keuangan
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Akuntansi Keuangan', 'Senin', '09:30', '12:00')", [k4.id, idGuru4]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Spreadsheet Keuangan', 'Jumat', '08:00', '10:30')", [k4.id, idGuru4]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Praktikum Akuntansi Lembaga', 'Selasa', '10:30', '13:00')", [k4.id, idGuru4]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Perpajakan Indonesia', 'Rabu', '09:00', '11:30')", [k4.id, idGuru4]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Etika Profesi Akuntan', 'Kamis', '08:00', '10:00')", [k4.id, idGuru4]);



      // Seed Attendance (Absensi) - 5 separate dates for high-density historical analytics
      const workDates = ['2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12'];
      const statuses = ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Izin', 'Sakit', 'Alfa'];

      for (const classId of classIds) {
        for (const date of workDates) {
          const absRes = await dbRun("INSERT INTO absensi (tanggal, kelas_id) VALUES (?, ?)", [date, classId]);
          const absId = absRes.id;

          const studentsInClass = indonesianStudents.filter(s => classIds[s.classOffset] === classId);
          for (const student of studentsInClass) {
            let statusIndex = Math.floor(Math.random() * statuses.length);
            const studentNisNum = parseInt(student.nis);
            if (studentNisNum % 13 === 0) {
              statusIndex = Math.random() > 0.5 ? 11 : 0;
            } else if (studentNisNum % 17 === 0) {
              statusIndex = Math.random() > 0.6 ? 10 : 9;
            } else {
              statusIndex = Math.floor(Math.random() * 9);
            }
            const chosenStatus = statuses[statusIndex];
            const timestamp = new Date(new Date(date).getTime() + 7 * 3600000 + Math.random() * 8 * 3600000).toISOString();
            await dbRun(
              "INSERT INTO detail_absensi (absensi_id, siswa_nis, status, updated_at) VALUES (?, ?, ?, ?)",
              [absId, student.nis, chosenStatus, timestamp]
            );
          }
        }
      }

      // Seed Assessments and Grades (Nilai) - Topik berbasis Jurusan masing-masing
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

        const studentsInClass = indonesianStudents.filter(s => classIds[s.classOffset] === classId);
        for (const student of studentsInClass) {
          const studentNisNum = parseInt(student.nis);
          let baseline = 75;
          if (studentNisNum % 3 === 0) {
            baseline = 88;
          } else if (studentNisNum % 3 === 1) {
            baseline = 76;
          } else {
            baseline = 63;
          }

          const variance = Math.floor(Math.random() * 23) - 10;
          let finalGrade = Math.min(100, Math.max(35, baseline + variance));

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

      console.log('Seeding completed successfully!');
    }

    // --- PENJAGA KEAMANAN DATA MANDATORI (DEFENSIVE REPAIR MIGRATION) ---
    // Maksud Bisnis: Memastikan bahwa jika terdapat data kelas bimbingan yang kosong wali kelasnya,
    // atau pengguna 'ortu' belum memiliki pemetaan kelas, sistem akan memetakan otomatis agar
    // Wali Murid dapat memantau validasi absensi secara real-time demi integrasi fungsional penuh.
    try {
      const defaultGuru = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru'");
      if (defaultGuru) {
        await dbRun("UPDATE kelas SET walikelas_id = ? WHERE walikelas_id IS NULL OR walikelas_id = '' OR walikelas_id = 0", [defaultGuru.id]);
      }
      await dbRun("UPDATE pengguna SET nama = 'Wali Murid Kelas X DKV 1', kelas_id = 1 WHERE username = 'ortu'");

      // Migrasi Aktif Jadwal Dummy Tambahan: Jika jumlah jadwal kurang dari 15, masukkan jadwal baru secara dinamis
      const schedCount = await dbGet<{ count: number }>("SELECT COUNT(*) as count FROM jadwal");
      if (schedCount && schedCount.count < 15) {
        console.log('Menambahkan jadwal dummy tambahan secara otomatis...');
        const classes = await dbAll<{ id: number; nama_kelas: string }>("SELECT id, nama_kelas FROM kelas");
        const g1 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru'");
        const g2 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru2'");
        const g3 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru3'");
        const g4 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru4'");
        const g5 = await dbGet<{ id: number }>("SELECT id FROM pengguna WHERE username = 'guru5'");

        const idG1 = g1?.id || 2;
        const idG2 = g2?.id || idG1;
        const idG3 = g3?.id || idG1;
        const idG4 = g4?.id || idG1;
        const idG5 = g5?.id || idG1;

        // Kosongkan dulu jadwal jika hanya sedikit untuk mencegah duplikasi sebelum melakukan penambahan massal
        await dbRun("DELETE FROM jadwal");

        for (const k of classes) {
          if (k.nama_kelas.includes('DKV 1') && k.nama_kelas.startsWith('X')) {
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Dasar-Dasar DKV', 'Senin', '07:30', '09:00')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Gambar Sketsa & Ilustrasi', 'Rabu', '09:30', '11:00')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Sejarah Seni Rupa', 'Senin', '09:30', '11:30')", [k.id, idG1]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Komposisi Desain', 'Selasa', '07:30', '09:30')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Matematika Terapan', 'Kamis', '07:30', '09:30')", [k.id, idG1]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Bahasa Inggris Komunikasi', 'Jumat', '09:00', '11:00')", [k.id, idG1]);
          } else if (k.nama_kelas.includes('DKV 1') && k.nama_kelas.startsWith('XI')) {
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Desain Grafis Percetakan', 'Selasa', '08:00', '10:00')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Fotografi & Videografi', 'Kamis', '08:00', '10:30')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Animasi 2D & 3D', 'Senin', '08:00', '10:30')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Tipografi Aplikatif', 'Rabu', '10:00', '12:00')", [k.id, idG2]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Kewirausahaan Kreatif', 'Kamis', '11:00', '13:00')", [k.id, idG5]);
          } else if (k.nama_kelas.includes('BD')) {
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Digital Marketing & SEO', 'Kamis', '10:45', '12:45')", [k.id, idG5]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'E-Commerce & Marketplace', 'Jumat', '08:00', '10:00')", [k.id, idG5]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Analisis Data Pasar', 'Senin', '10:00', '12:30')", [k.id, idG5]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Copywriting untuk Promosi', 'Selasa', '09:00', '11:30')", [k.id, idG5]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Matematika Bisnis', 'Rabu', '08:00', '10:00')", [k.id, idG1]);
          } else if (k.nama_kelas.includes('AK')) {
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Akuntansi Keuangan', 'Senin', '09:30', '12:00')", [k.id, idG4]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Spreadsheet Keuangan', 'Jumat', '08:00', '10:30')", [k.id, idG4]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Praktikum Akuntansi Lembaga', 'Selasa', '10:30', '13:00')", [k.id, idG4]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Perpajakan Indonesia', 'Rabu', '09:00', '11:30')", [k.id, idG4]);
            await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, 'Etika Profesi Akuntan', 'Kamis', '08:00', '10:00')", [k.id, idG4]);
          }
        }
        console.log('Jadwal dummy tambahan sukses dimasukkan secara dinamis!');
      }
    } catch (migError) {
      console.error('Defensive repair migration failed:', migError);
    }
  } catch (error) {
    console.error('Initialization/Seeding failed:', error);
  }
}
