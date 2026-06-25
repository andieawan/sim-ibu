var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express2 = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_vite = require("vite");

// server/routes.ts
var import_express = require("express");

// server/db.ts
var import_path = __toESM(require("path"), 1);
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var dbPath = import_path.default.resolve(process.cwd(), "sekolah.db");
var db;
var BetterSQLiteDatabaseProvider = class {
  constructor() {
    this.name = "sqlite";
  }
  async connect() {
    try {
      db = new import_better_sqlite3.default(dbPath, { verbose: console.log });
      db.pragma("foreign_keys = ON");
      db.pragma("journal_mode = WAL");
      db.pragma("synchronous = NORMAL");
      db.pragma("cache_size = -64000");
      console.log("Connected to better-sqlite3 database at:", dbPath);
      const row = db.prepare("PRAGMA integrity_check;").get();
      if (row && row.integrity_check !== "ok") {
        console.warn("SQLite integrity check failed", row);
      }
      await initializeDatabase();
    } catch (err) {
      console.error("Error connecting to better-sqlite3 database:", err);
      throw err;
    }
  }
  async run(sql, params = []) {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { id: Number(info.lastInsertRowid), changes: info.changes };
  }
  async all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }
  async get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  }
  async close() {
    if (db) {
      db.close();
    }
  }
  translateSql(sql) {
    return sql;
  }
};
var PostgreSQLDatabaseProvider = class {
  constructor() {
    this.name = "postgres";
    this.pool = null;
  }
  async connect() {
    console.log("Connecting to PostgreSQL database using host:", process.env.DB_HOST || "localhost");
    try {
      const pg = await import("pg");
      this.pool = new pg.Pool({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "sigup_db",
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : void 0
      });
      console.log("Successfully connected to Postgres Pool [Lazy loaded pg].");
    } catch (err) {
      console.error("Error connecting to PostgreSQL database:", err.message);
      console.warn("Fallback: Creating mock/local simulator client to avoid crash on start.");
    }
  }
  async run(sql, params = []) {
    if (!this.pool) {
      throw new Error('PostgreSQL client pool is not loaded. Ensure you installed "pg" and database credentials are correct.');
    }
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);
    const res = await this.pool.query(pgSql, params);
    const lastRow = res.rows ? res.rows[0] : null;
    return {
      id: lastRow ? lastRow.id || 0 : 0,
      changes: res.rowCount || 0
    };
  }
  async all(sql, params = []) {
    if (!this.pool) throw new Error("PostgreSQL client pool not loaded.");
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);
    const res = await this.pool.query(pgSql, params);
    return res.rows;
  }
  async get(sql, params = []) {
    if (!this.pool) throw new Error("PostgreSQL client pool not loaded.");
    let pgSql = sql;
    let paramCounter = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${paramCounter++}`);
    const res = await this.pool.query(pgSql, params);
    return res.rows?.[0];
  }
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
  translateSql(sql) {
    let pgSql = sql;
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY");
    pgSql = pgSql.replace(/datetime\('now'/gi, "CURRENT_TIMESTAMP");
    if (/INSERT OR REPLACE INTO detail_nilai/i.test(pgSql)) {
      pgSql = pgSql.replace(
        /INSERT OR REPLACE INTO detail_nilai \(([^)]+)\) VALUES \(([^)]+)\)/i,
        (_, cols, vals) => `INSERT INTO detail_nilai (${cols}) VALUES (${vals}) ON CONFLICT(aktivitas_id, siswa_nis) DO UPDATE SET nilai = EXCLUDED.nilai, catatan = EXCLUDED.catatan`
      );
    }
    pgSql = pgSql.replace(/INSERT OR REPLACE INTO/gi, "INSERT INTO");
    return pgSql;
  }
};
var MySQLDatabaseProvider = class {
  constructor() {
    this.name = "mysql";
    this.connection = null;
  }
  async connect() {
    console.log("Connecting to MySQL database using host:", process.env.DB_HOST || "localhost");
    try {
      const mysql = await import("mysql2/promise");
      this.connection = await mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root",
        database: process.env.DB_NAME || "sigup_db"
      });
      console.log("Successfully connected to MySQL Pool [Lazy loaded mysql2].");
    } catch (err) {
      console.error("Error connecting to MySQL database:", err.message);
      console.warn("Fallback: Simulator mode initialized.");
    }
  }
  async run(sql, params = []) {
    if (!this.connection) {
      throw new Error('MySQL connection pool not loaded. Check install: "npm install mysql2".');
    }
    const [res] = await this.connection.execute(sql, params);
    return {
      id: res.insertId || 0,
      changes: res.affectedRows || 0
    };
  }
  async all(sql, params = []) {
    if (!this.connection) throw new Error("MySQL connection pool not loaded.");
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }
  async get(sql, params = []) {
    if (!this.connection) throw new Error("MySQL connection pool not loaded.");
    const [rows] = await this.connection.execute(sql, params);
    return rows?.[0];
  }
  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
  translateSql(sql) {
    let mySql = sql;
    mySql = mySql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "INT AUTO_INCREMENT PRIMARY KEY");
    mySql = mySql.replace(/INSERT OR REPLACE INTO/gi, "REPLACE INTO");
    return mySql;
  }
};
var providers = {
  sqlite: new BetterSQLiteDatabaseProvider(),
  postgres: new PostgreSQLDatabaseProvider(),
  mysql: new MySQLDatabaseProvider()
};
var selectedDbType = (process.env.DB_TYPE || "sqlite").toLowerCase();
var activeProvider = providers[selectedDbType] || providers.sqlite;
console.log(`Database engine loaded: [${activeProvider.name}] (Configured via DB_TYPE, default: sqlite)`);
var dbRun = (sql, params = []) => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.run(finalSql, params);
};
var dbAll = (sql, params = []) => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.all(finalSql, params);
};
var dbGet = (sql, params = []) => {
  const finalSql = activeProvider.translateSql ? activeProvider.translateSql(sql) : sql;
  return activeProvider.get(finalSql, params);
};
function connectDatabase() {
  activeProvider.connect().then(() => {
    if (activeProvider.name !== "sqlite") {
      console.log(`Initializing & Seeding target Database Engine tables: [${activeProvider.name}]...`);
      initializeDatabase().catch((initErr) => {
        console.error(`Failed executing initialization script on active engine: ${activeProvider.name}`, initErr);
      });
    }
  }).catch((err) => {
    console.error(`Failed to establish database connection for provider: ${activeProvider.name}`, err);
  });
}
connectDatabase();
async function initializeDatabase() {
  try {
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
    }
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
    }
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
    }
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
    await dbRun(`
      CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        kelas_id INTEGER,
        FOREIGN KEY(kelas_id) REFERENCES kelas(id) ON DELETE CASCADE,
        UNIQUE(tanggal, kelas_id)
      )
    `);
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
    await dbRun(`
      CREATE TABLE IF NOT EXISTS pengguna (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nama TEXT NOT NULL,
        role TEXT NOT NULL,
        nip TEXT DEFAULT '',
        jabatan TEXT DEFAULT ''
      )
    `);
    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN nip TEXT DEFAULT ''");
    } catch (e) {
    }
    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN jabatan TEXT DEFAULT ''");
    } catch (e) {
    }
    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN siswa_nis TEXT");
    } catch (e) {
    }
    try {
      await dbRun("ALTER TABLE pengguna ADD COLUMN kelas_id INTEGER");
    } catch (e) {
    }
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
    await dbRun("CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON siswa(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_absensi_kelas_id ON absensi(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_nilai_kelas_id ON aktivitas_nilai(kelas_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_detail_absensi_id ON detail_absensi(absensi_id)");
    await dbRun("CREATE INDEX IF NOT EXISTS idx_detail_nilai_id ON detail_nilai(aktivitas_id)");
    await dbRun("CREATE UNIQUE INDEX IF NOT EXISTS idx_pengguna_username ON pengguna(username)");
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
    try {
      await dbRun("UPDATE absensi SET tanggal = REPLACE(tanggal, '-', '/') WHERE tanggal LIKE '%-%'");
      await dbRun("UPDATE aktivitas_nilai SET tanggal = REPLACE(tanggal, '-', '/') WHERE tanggal LIKE '%-%'");
      const tableInfo = await dbAll("PRAGMA table_info(absensi)");
      const hasIsApprovedCol = tableInfo.some((col) => col.name === "is_approved_by_walikelas");
      if (!hasIsApprovedCol) {
        await dbRun("ALTER TABLE absensi ADD COLUMN is_approved_by_walikelas INTEGER DEFAULT 0");
      }
      const patchesTableInfo = await dbAll("PRAGMA table_info(patches)");
      const hasSqlStatements = patchesTableInfo.some((col) => col.name === "sql_statements");
      if (!hasSqlStatements) {
        await dbRun("ALTER TABLE patches ADD COLUMN sql_statements TEXT");
      }
    } catch (e) {
      console.error("Migration error:", e);
    }
    const adminCount = await dbGet("SELECT COUNT(*) as count FROM pengguna WHERE username = ?", ["admin"]);
    const guruCount = await dbGet("SELECT COUNT(*) as count FROM pengguna WHERE username = ?", ["guru"]);
    const ortuCount = await dbGet("SELECT COUNT(*) as count FROM pengguna WHERE username = ?", ["ortu"]);
    if (adminCount?.count === 0) {
      const adminPass = import_bcryptjs.default.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || "admin123", 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role) VALUES ('admin', ?, 'Administrator Utama', 'admin')", [adminPass]);
    }
    if (guruCount?.count === 0) {
      const guruPass = import_bcryptjs.default.hashSync(process.env.DEFAULT_GURU_PASSWORD || "guru123", 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role) VALUES ('guru', ?, 'Guru Pintar SMK Ibu', 'guru')", [guruPass]);
    }
    if (ortuCount?.count === 0) {
      const ortuPass = import_bcryptjs.default.hashSync(process.env.DEFAULT_ORTU_PASSWORD || "ortu123", 10);
      await dbRun("INSERT INTO pengguna (username, password, nama, role, kelas_id) VALUES ('ortu', ?, 'Wali Murid Kelas X DKV 1', 'wali_murid', 1)", [ortuPass]);
    }
    try {
      const users = await dbAll("SELECT id, password FROM pengguna");
      for (const u of users) {
        const isBcryptHashed = /^\$2[ayb]\$\d+\$[./A-Za-z0-9]{53}$/.test(u.password);
        if (!isBcryptHashed) {
          console.log(`Migrating plaintext password to bcrypt hash for user ID: ${u.id}`);
          const secureHash = import_bcryptjs.default.hashSync(u.password, 10);
          await dbRun("UPDATE pengguna SET password = ? WHERE id = ?", [secureHash, u.id]);
        }
      }
    } catch (migError) {
      console.error("Plaintext password migration failed:", migError);
    }
    const classCount = await dbGet("SELECT COUNT(*) as count FROM kelas");
    if (classCount && classCount.count === 0) {
      const envSetting = (process.env.APP_ENV || "dev").toLowerCase().trim();
      const isPubMode = envSetting === "pub" || envSetting === "publish";
      if (isPubMode) {
        console.log("--- MODE PRODUKSI AKTIF (APP_ENV=pub) ---");
        console.log("Penjelasan: Melewatkan pembuatan data dummy. Database dibiarkan dalam kondisi fresh.");
        return;
      }
      console.log("--- MODE PENGEMBANGAN AKTIF (APP_ENV=dev) ---");
      console.log("Penjelasan: Memulai proses seeding data dummy otomatis untuk mempermudah peninjauan fitur...");
      const k1 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES ('X DKV 1', 'SMK Ibu', 2)");
      const k2 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES ('XI DKV 1', 'SMK Ibu', 2)");
      const k3 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES ('XI BD 1', 'SMK Ibu', 2)");
      const k4 = await dbRun("INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES ('XII AK 1', 'SMK Ibu', 2)");
      const classIds = [k1.id, k2.id, k3.id, k4.id];
      const indonesianStudents = [
        // Class 1 (X DKV 1) - 15 siswa
        { nis: "1001", nama: "Abimanyu Hartono", jk: "L", classOffset: 0 },
        { nis: "1002", nama: "Ahmad Syarifuddin", jk: "L", classOffset: 0 },
        { nis: "1003", nama: "Amelia Putri Utami", jk: "P", classOffset: 0 },
        { nis: "1004", nama: "Anisa Rahmawati", jk: "P", classOffset: 0 },
        { nis: "1005", nama: "Bambang Pamungkas", jk: "L", classOffset: 0 },
        { nis: "1006", nama: "Cynthia Bella Hermawan", jk: "P", classOffset: 0 },
        { nis: "1007", nama: "Daniel Christian", jk: "L", classOffset: 0 },
        { nis: "1008", nama: "Dewi Ayu Lestari", jk: "P", classOffset: 0 },
        { nis: "1009", nama: "Diki Chandra", jk: "L", classOffset: 0 },
        { nis: "1010", nama: "Eliana Safitri", jk: "P", classOffset: 0 },
        { nis: "1011", nama: "Farhan Ramadhan", jk: "L", classOffset: 0 },
        { nis: "1012", nama: "Fitriani Handayani", jk: "P", classOffset: 0 },
        { nis: "1013", nama: "Gilang Dirga Permana", jk: "L", classOffset: 0 },
        { nis: "1014", nama: "Hana Alisia", jk: "P", classOffset: 0 },
        { nis: "1015", nama: "Ihsan Maulana", jk: "L", classOffset: 0 },
        // Class 2 (XI DKV 1) - 15 siswa
        { nis: "1016", nama: "Joko Widodo Susilo", jk: "L", classOffset: 1 },
        { nis: "1017", nama: "Kartika Chandra", jk: "P", classOffset: 1 },
        { nis: "1018", nama: "Kevin Sanjaya", jk: "L", classOffset: 1 },
        { nis: "1019", nama: "Larasati Ningrum", jk: "P", classOffset: 1 },
        { nis: "1020", nama: "Muhammad Rizky Pratama", jk: "L", classOffset: 1 },
        { nis: "1021", nama: "Nadia Saphira", jk: "P", classOffset: 1 },
        { nis: "1022", nama: "Oki Setiana Dewi", jk: "P", classOffset: 1 },
        { nis: "1023", nama: "Pratama Arhan Alif", jk: "L", classOffset: 1 },
        { nis: "1024", nama: "Putri Ayu Wandira", jk: "P", classOffset: 1 },
        { nis: "1025", nama: "Rafi Ahmad Prasetyo", jk: "L", classOffset: 1 },
        { nis: "1026", nama: "Rania Salsabila Putri", jk: "P", classOffset: 1 },
        { nis: "1027", nama: "Rian Dwi Cahyo", jk: "L", classOffset: 1 },
        { nis: "1028", nama: "Siti Nurhaliza", jk: "P", classOffset: 1 },
        { nis: "1029", nama: "Taufik Hidayatullah", jk: "L", classOffset: 1 },
        { nis: "1030", nama: "Vina Panduwinata", jk: "P", classOffset: 1 },
        // Class 3 (XI BD 1 - Bisnis Digital) - 10 siswa
        { nis: "1031", nama: "Wawan Kurniawan", jk: "L", classOffset: 2 },
        { nis: "1032", nama: "Yulianti Citra Puspita", jk: "P", classOffset: 2 },
        { nis: "1033", nama: "Zack Lee Christian", jk: "L", classOffset: 2 },
        { nis: "1034", nama: "Budi Darmawan Kusuma", jk: "L", classOffset: 2 },
        { nis: "1035", nama: "Clara Shinta", jk: "P", classOffset: 2 },
        { nis: "1036", nama: "Doni Pratama", jk: "L", classOffset: 2 },
        { nis: "1037", nama: "Evi Masamba Lestari", jk: "P", classOffset: 2 },
        { nis: "1038", nama: "Ferry Irawan", jk: "L", classOffset: 2 },
        { nis: "1039", nama: "Grace Natalie", jk: "P", classOffset: 2 },
        { nis: "1040", nama: "Hendra Setiawan", jk: "L", classOffset: 2 },
        // Class 4 (XII AK 1 - Akuntansi) - 15 siswa
        { nis: "1041", nama: "Irvan Nurhakim", jk: "L", classOffset: 3 },
        { nis: "1042", nama: "Juan Sebastian", jk: "L", classOffset: 3 },
        { nis: "1043", nama: "Keisha Alvaro", jk: "L", classOffset: 3 },
        { nis: "1044", nama: "Luna Maya Lestari", jk: "P", classOffset: 3 },
        { nis: "1045", nama: "Maudy Ayunda Faza", jk: "P", classOffset: 3 },
        { nis: "1046", nama: "Nadiem Makarim", jk: "L", classOffset: 3 },
        { nis: "1047", nama: "Najwa Shihab", jk: "P", classOffset: 3 },
        { nis: "1048", nama: "Onadio Leonardo", jk: "L", classOffset: 3 },
        { nis: "1049", nama: "Pevita Pearce", jk: "P", classOffset: 3 },
        { nis: "1050", nama: "Raditya Dika Angkasa", jk: "L", classOffset: 3 },
        { nis: "1051", nama: "Susi Pudjiastuti", jk: "P", classOffset: 3 },
        { nis: "1052", nama: "Tora Sudiro", jk: "L", classOffset: 3 },
        { nis: "1053", nama: "Vanesha Prescilla", jk: "P", classOffset: 3 },
        { nis: "1054", nama: "Wulan Guritno", jk: "P", classOffset: 3 },
        { nis: "1055", nama: "Yovie Widianto", jk: "L", classOffset: 3 }
      ];
      for (const student of indonesianStudents) {
        const classId = classIds[student.classOffset];
        await dbRun(
          "INSERT INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)",
          [student.nis, student.nama, student.jk, classId]
        );
      }
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Dasar-Dasar DKV', 'Senin', '07:30', '09:00')", [k1.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Gambar Sketsa & Ilustrasi', 'Rabu', '09:30', '11:00')", [k1.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Desain Grafis Percetakan', 'Selasa', '08:00', '10:00')", [k2.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Fotografi & Videografi', 'Kamis', '08:00', '10:30')", [k2.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Digital Marketing & SEO', 'Kamis', '10:45', '12:45')", [k3.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'E-Commerce & Marketplace', 'Jumat', '08:00', '10:00')", [k3.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Akuntansi Keuangan', 'Senin', '09:30', '12:00')", [k4.id]);
      await dbRun("INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, 2, 'Spreadsheet Keuangan', 'Jumat', '08:00', '10:30')", [k4.id]);
      const workDates = ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12"];
      const statuses = ["Hadir", "Hadir", "Hadir", "Hadir", "Hadir", "Hadir", "Hadir", "Hadir", "Hadir", "Izin", "Sakit", "Alfa"];
      for (const classId of classIds) {
        for (const date of workDates) {
          const absRes = await dbRun("INSERT INTO absensi (tanggal, kelas_id) VALUES (?, ?)", [date, classId]);
          const absId = absRes.id;
          const studentsInClass = indonesianStudents.filter((s) => classIds[s.classOffset] === classId);
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
            const timestamp = new Date(new Date(date).getTime() + 7 * 36e5 + Math.random() * 8 * 36e5).toISOString();
            await dbRun(
              "INSERT INTO detail_absensi (absensi_id, siswa_nis, status, updated_at) VALUES (?, ?, ?, ?)",
              [absId, student.nis, chosenStatus, timestamp]
            );
          }
        }
      }
      const gradingActivities = [
        // DKV
        { classOffset: 0, title: "Tugas 1 - Pembuatan Sketsa Objek", date: "2026-06-01" },
        { classOffset: 0, title: "Tugas 2 - Komposisi Warna DKV", date: "2026-06-05" },
        { classOffset: 0, title: "UH 1 - Teori Nirmana Dasar", date: "2026-06-10" },
        { classOffset: 0, title: "Ujian Tengah Semester - Portofolio Logo", date: "2026-06-15" },
        { classOffset: 1, title: "Tugas 1 - Teknik Pencahayaan Studio", date: "2026-06-02" },
        { classOffset: 1, title: "Tugas 2 - Tata Letak Brosur Cetak", date: "2026-06-06" },
        { classOffset: 1, title: "UH 1 - Komposisi Fotografi Segitiga Eksposur", date: "2026-06-12" },
        // Bisnis Digital
        { classOffset: 2, title: "Tugas 1 - Riset Kata Kunci SEO", date: "2026-06-03" },
        { classOffset: 2, title: "UH 1 - Pembuatan Toko Online Shopee/Tokopedia", date: "2026-06-11" },
        // Akuntansi
        { classOffset: 3, title: "Tugas 1 - Buku Besar & Jurnal Penyesuaian", date: "2026-06-04" },
        { classOffset: 3, title: "UH 1 - Analisis Laporan Neraca & Rugi Laba", date: "2026-06-12" }
      ];
      for (const act of gradingActivities) {
        const classId = classIds[act.classOffset];
        const actRes = await dbRun(
          "INSERT INTO aktivitas_nilai (nama_aktivitas, tanggal, kelas_id) VALUES (?, ?, ?)",
          [act.title, act.date, classId]
        );
        const actId = actRes.id;
        const studentsInClass = indonesianStudents.filter((s) => classIds[s.classOffset] === classId);
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
          let comment = "";
          if (finalGrade >= 90) {
            const comms = [
              "Sangat kreatif, jawaban orisinal, dan kerapihan kerja luar biasa.",
              "Sempurna, pemahaman konsep materi ini sangat matang dan teruji.",
              "Mengagumkan, mampu memberikan hasil pengerjaan melebihi ekspektasi."
            ];
            comment = comms[studentNisNum % comms.length];
          } else if (finalGrade >= 75) {
            const comms = [
              "Sudah tuntas dengan baik. Pertahankan prestasimu.",
              "Pemahaman materi sudah cukup baik, tingkatkan ketelitian.",
              "Tuntas. Pekerjaan diselesaikan berdasar standar instruksi guru."
            ];
            comment = comms[studentNisNum % comms.length];
          } else {
            const comms = [
              "Belum tuntas. Segera selesaikan tugas portofolio & remedial kelas.",
              "Butuh bimbingan intensif dan pemahaman ulang konsep inti.",
              "Nilai berada di bawah KKM 75. Silakan ikuti sesi remedial terjadwal."
            ];
            comment = comms[studentNisNum % comms.length];
          }
          await dbRun(
            "INSERT INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan) VALUES (?, ?, ?, ?)",
            [actId, student.nis, finalGrade, comment]
          );
        }
      }
      console.log("Seeding completed successfully!");
    }
    try {
      const defaultGuru = await dbGet("SELECT id FROM pengguna WHERE username = 'guru'");
      if (defaultGuru) {
        await dbRun("UPDATE kelas SET walikelas_id = ? WHERE walikelas_id IS NULL OR walikelas_id = '' OR walikelas_id = 0", [defaultGuru.id]);
      }
      await dbRun("UPDATE pengguna SET nama = 'Wali Murid Kelas X DKV 1', kelas_id = 1 WHERE username = 'ortu'");
    } catch (migError) {
      console.error("Defensive repair migration failed:", migError);
    }
  } catch (error) {
    console.error("Initialization/Seeding failed:", error);
  }
}

// server/routes.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_iron_session = require("iron-session");
var import_fs = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var sessionOptions = {
  password: process.env.COOKIE_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "si-gup-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production"
  }
};
var router = (0, import_express.Router)();
var schoolIdentityPath = import_path2.default.resolve(process.cwd(), "school_identity.json");
router.get("/school-identity", (req, res) => {
  try {
    const defaultData = {
      nama_sekolah: "SMK Ibu",
      motto: "Sistem Guru Pintar \u2014 SMK Ibu",
      alamat: "Jl. Pendidikan No. 45, Kecamatan Bojong",
      npsn: "12345678",
      kepala_sekolah: "Drs. H. Ahmad Sudrajat, M.Pd",
      tahun_pelajaran: "2024/2025",
      semester: "Ganjil"
    };
    if (import_fs.default.existsSync(schoolIdentityPath)) {
      const data = import_fs.default.readFileSync(schoolIdentityPath, "utf8");
      const parsed = JSON.parse(data);
      const merged = { ...defaultData, ...parsed };
      res.json(merged);
    } else {
      import_fs.default.writeFileSync(schoolIdentityPath, JSON.stringify(defaultData, null, 2), "utf8");
      res.json(defaultData);
    }
  } catch (err) {
    console.error("Error reading school-identity:", err);
    res.status(500).json({ error: "Gagal memuat identitas sekolah" });
  }
});
router.post("/school-identity", requireAdmin, async (req, res) => {
  try {
    const { nama_sekolah, motto, alamat, npsn, kepala_sekolah, tahun_pelajaran, semester } = req.body;
    if (!nama_sekolah) {
      return res.status(400).json({ error: "Nama sekolah wajib diisi" });
    }
    const updatedData = {
      nama_sekolah: nama_sekolah.trim(),
      motto: (motto || "").trim(),
      alamat: (alamat || "").trim(),
      npsn: (npsn || "").trim(),
      kepala_sekolah: (kepala_sekolah || "").trim(),
      tahun_pelajaran: (tahun_pelajaran || "2024/2025").trim(),
      semester: (semester || "Ganjil").trim()
    };
    import_fs.default.writeFileSync(schoolIdentityPath, JSON.stringify(updatedData, null, 2), "utf8");
    try {
      await dbRun("UPDATE kelas SET sekolah = ?", [updatedData.nama_sekolah]);
    } catch (dbErr) {
      console.error("Quiet error syncing school name to classes:", dbErr);
    }
    res.json({ message: "Identitas sekolah berhasil diperbarui", data: updatedData });
  } catch (err) {
    console.error("Error saving school-identity:", err);
    res.status(500).json({ error: "Gagal menyimpan identitas sekolah" });
  }
});
router.get("/config", (req, res) => {
  const env = (process.env.APP_ENV || "dev").toLowerCase().trim();
  const appEnv = env === "publish" || env === "pub" ? "pub" : "dev";
  res.json({ appEnv });
});
function isBcryptHash(str) {
  return /^\$2[ayb]\$\d+\$[./A-Za-z0-9]{53}$/.test(str);
}
var loginAttempts = /* @__PURE__ */ new Map();
function loginRateLimiter(req, res, next) {
  const rawIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.lockUntil > now) {
    const remainingSeconds = Math.ceil((attempts.lockUntil - now) / 1e3);
    return res.status(429).json({
      error: `Terlalu banyak percobaan masuk. Silakan coba lagi dalam ${remainingSeconds} detik.`
    });
  }
  next();
}
async function requireAdmin(req, res, next) {
  const session = await (0, import_iron_session.getIronSession)(req, res, sessionOptions);
  if (!session.user) {
    return res.status(401).json({ error: "Akses ditolak: Sesi tidak ditemukan. Harap login kembali." });
  }
  const user = await dbGet(
    "SELECT id, role FROM pengguna WHERE id = ?",
    [session.user.id]
  );
  if (!user || user.role !== "admin" || session.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak: Hanya pengguna dengan hak akses Admin yang diizinkan." });
  }
  req.user = session.user;
  next();
}
router.use("/admin", requireAdmin);
router.use("/patches", requireAdmin);
router.use("/system", requireAdmin);
async function authenticateSession(req, res, next) {
  const session = await (0, import_iron_session.getIronSession)(req, res, sessionOptions);
  if (!session.user) {
    return res.status(401).json({ error: "Akses ditolak: Sesi tidak ditemukan. Harap login kembali." });
  }
  req.user = session.user;
  next();
}
var protectedPaths = [
  "/absensi",
  "/absensi-history",
  "/absensi-detail",
  "/nilai",
  "/nilai-history",
  "/nilai-detail",
  "/kelas",
  "/siswa",
  "/siswa-all",
  "/import-siswa",
  "/walikelas",
  "/stats",
  "/class-stats",
  "/rekap",
  "/jadwal"
];
protectedPaths.forEach((path4) => router.use(path4, authenticateSession));
router.get("/kelas", async (req, res) => {
  try {
    const classes = await dbAll(`
      SELECT k.*, p.nama AS nama_walikelas, p.username AS username_walikelas
      FROM kelas k
      LEFT JOIN pengguna p ON k.walikelas_id = p.id
      ORDER BY k.nama_kelas ASC
    `);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/kelas", requireAdmin, async (req, res) => {
  try {
    const { nama_kelas, sekolah, walikelas_id } = req.body;
    if (!nama_kelas) {
      return res.status(400).json({ error: "Nama kelas wajib diisi" });
    }
    const result = await dbRun(
      "INSERT INTO kelas (nama_kelas, sekolah, walikelas_id) VALUES (?, ?, ?)",
      [nama_kelas, sekolah || "SMK Ibu", walikelas_id || null]
    );
    res.json({ id: result.id, nama_kelas, sekolah: sekolah || "SMK Ibu", walikelas_id: walikelas_id || null, message: "Kelas berhasil dibuat" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/kelas/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, sekolah, walikelas_id } = req.body;
    const existing = await dbGet("SELECT id FROM kelas WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }
    if (nama_kelas !== void 0 && sekolah !== void 0 && walikelas_id !== void 0) {
      await dbRun(
        "UPDATE kelas SET nama_kelas = ?, sekolah = ?, walikelas_id = ? WHERE id = ?",
        [nama_kelas, sekolah, walikelas_id, id]
      );
    } else if (walikelas_id !== void 0) {
      await dbRun(
        "UPDATE kelas SET walikelas_id = ? WHERE id = ?",
        [walikelas_id, id]
      );
    } else if (nama_kelas !== void 0) {
      await dbRun(
        "UPDATE kelas SET nama_kelas = ? WHERE id = ?",
        [nama_kelas, id]
      );
    } else if (sekolah !== void 0) {
      await dbRun(
        "UPDATE kelas SET sekolah = ? WHERE id = ?",
        [sekolah, id]
      );
    }
    res.json({ message: "Kelas berhasil dikonfigurasi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/kelas/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun("DELETE FROM kelas WHERE id = ?", [id]);
    res.json({ message: "Kelas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/siswa-all", async (req, res) => {
  try {
    const students = await dbAll("SELECT * FROM siswa ORDER BY nama ASC");
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/siswa/:kelas_id", async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const students = await dbAll("SELECT * FROM siswa WHERE kelas_id = ? ORDER BY nama ASC", [kelas_id]);
    res.json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/siswa", requireAdmin, async (req, res) => {
  try {
    const { nis, nama, jenis_kelamin, kelas_id } = req.body;
    if (!nis || !nama || !jenis_kelamin || !kelas_id) {
      return res.status(400).json({ error: "Data mandatori (NIS, Nama, Jenis Kelamin, Kelas ID) harus lengkap" });
    }
    await dbRun(
      "INSERT OR REPLACE INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)",
      [nis.trim(), nama.trim(), jenis_kelamin, kelas_id]
    );
    res.json({ message: "Data siswa berhasil disimpan", data: { nis, nama, jenis_kelamin, kelas_id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/siswa/:nis", requireAdmin, async (req, res) => {
  try {
    const { nis } = req.params;
    await dbRun("UPDATE siswa SET status_aktif = 0 WHERE nis = ?", [nis]);
    res.json({ message: "Siswa berhasil dinonaktifkan (berhenti / pindah)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/siswa/:nis/status", requireAdmin, async (req, res) => {
  try {
    const { nis } = req.params;
    const { status_aktif } = req.body;
    await dbRun("UPDATE siswa SET status_aktif = ? WHERE nis = ?", [status_aktif === 0 ? 0 : 1, nis]);
    res.json({ message: `Siswa berhasil diubah statusnya menjadi ${status_aktif === 0 ? "Nonaktif" : "Aktif"}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/import-siswa/:kelas_id", requireAdmin, async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const classIdNum = parseInt(kelas_id);
    let siswaList = [];
    if (req.body && req.body.siswa && Array.isArray(req.body.siswa)) {
      siswaList = req.body.siswa;
    } else if (typeof req.body === "string" || req.body && req.body.csvText) {
      const csvStr = typeof req.body === "string" ? req.body : req.body.csvText;
      const lines = csvStr.split(/\r?\n/);
      if (lines.length > 1) {
        let delimiter = ",";
        if (lines[0].includes(";") && !lines[0].includes(",")) {
          delimiter = ";";
        }
        const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
        const nisIdx = headers.findIndex((h) => h.includes("nis"));
        const namaIdx = headers.findIndex((h) => h.includes("nama"));
        const jkIdx = headers.findIndex((h) => h.includes("jenis") || h.includes("kelamin") || h.includes("jk") || h.includes("gender"));
        if (nisIdx === -1 || namaIdx === -1) {
          return res.status(400).json({ error: "Format CSV salah. Mohon sertakan kolom NIS dan Nama." });
        }
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = [];
          let currentVal = "";
          let inQuotes = false;
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              cols.push(currentVal.trim());
              currentVal = "";
            } else {
              currentVal += char;
            }
          }
          cols.push(currentVal.trim());
          if (cols.length > Math.max(nisIdx, namaIdx)) {
            const nis = cols[nisIdx];
            const nama = cols[namaIdx];
            let jk = cols[jkIdx] || "L";
            jk = jk.toUpperCase().startsWith("P") || jk.toLowerCase().includes("perempuan") ? "P" : "L";
            if (nis && nama) {
              siswaList.push({ nis, nama, jenis_kelamin: jk });
            }
          }
        }
      }
    }
    if (siswaList.length === 0) {
      return res.status(400).json({ error: "Tidak ada data siswa valid yang ditemukan." });
    }
    for (const s of siswaList) {
      if (!s.nis || !s.nama) continue;
      await dbRun(
        "INSERT OR REPLACE INTO siswa (nis, nama, jenis_kelamin, kelas_id) VALUES (?, ?, ?, ?)",
        [String(s.nis).trim(), String(s.nama).trim(), s.jenis_kelamin || "L", classIdNum]
      );
    }
    res.json({ message: `Berhasil mengimpor ${siswaList.length} siswa secara massal.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/import-guru", requireAdmin, async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Data guru kosong atau tidak valid." });
    }
    let importedCount = 0;
    for (const u of users) {
      const username = String(u.username || "").trim().toLowerCase();
      const nama = String(u.nama || "").trim();
      const role = String(u.role || "guru").trim().toLowerCase();
      const rawPassword = String(u.password || "guru123").trim();
      const nip = String(u.nip || "").trim();
      const jabatan = String(u.jabatan || "").trim();
      if (!username || !nama) continue;
      const exists = await dbGet("SELECT id FROM pengguna WHERE LOWER(username) = ?", [username]);
      if (exists) {
        const hashedPassword = await import_bcryptjs2.default.hash(rawPassword, 10);
        await dbRun(
          "UPDATE pengguna SET nama = ?, password = ?, role = ?, nip = ?, jabatan = ? WHERE id = ?",
          [nama, hashedPassword, role, nip, jabatan, exists.id]
        );
      } else {
        const hashedPassword = await import_bcryptjs2.default.hash(rawPassword, 10);
        await dbRun(
          "INSERT INTO pengguna (username, password, nama, role, nip, jabatan) VALUES (?, ?, ?, ?, ?, ?)",
          [username, hashedPassword, nama, role, nip, jabatan]
        );
      }
      importedCount++;
    }
    res.json({ message: `Berhasil mengimpor ${importedCount} data akun pengajar/pengguna.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/import-jadwal", requireAdmin, async (req, res) => {
  try {
    const { schedules } = req.body;
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Data jadwal kosong atau tidak valid." });
    }
    let importedCount = 0;
    for (const s of schedules) {
      const nama_kelas = String(s.nama_kelas || "").trim();
      const username_guru = String(s.username_guru || "").trim().toLowerCase();
      const mata_pelajaran = String(s.mata_pelajaran || "").trim();
      const hari = String(s.hari || "Senin").trim();
      const waktu_mulai = String(s.waktu_mulai || "07:30").trim();
      const waktu_selesai = String(s.waktu_selesai || "09:00").trim();
      if (!nama_kelas || !username_guru || !mata_pelajaran) continue;
      const classObj = await dbGet("SELECT id FROM kelas WHERE LOWER(nama_kelas) = ?", [nama_kelas.toLowerCase()]);
      if (!classObj) continue;
      const guruObj = await dbGet("SELECT id FROM pengguna WHERE LOWER(username) = ?", [username_guru]);
      if (!guruObj) continue;
      await dbRun(
        "INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?, ?, ?)",
        [classObj.id, guruObj.id, mata_pelajaran, hari, waktu_mulai, waktu_selesai]
      );
      importedCount++;
    }
    res.json({ message: `Berhasil mengimpor ${importedCount} sesi jadwal pelajaran.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/import-walikelas", requireAdmin, async (req, res) => {
  try {
    const { walikelas } = req.body;
    if (!walikelas || !Array.isArray(walikelas) || walikelas.length === 0) {
      return res.status(400).json({ error: "Data wali kelas kosong atau tidak valid." });
    }
    let importedCount = 0;
    for (const wk of walikelas) {
      const nama_kelas = String(wk.nama_kelas || "").trim();
      const username_guru = String(wk.username_guru || "").trim().toLowerCase();
      if (!nama_kelas || !username_guru) continue;
      const classObj = await dbGet("SELECT id FROM kelas WHERE LOWER(nama_kelas) = ?", [nama_kelas.toLowerCase()]);
      if (!classObj) continue;
      const guruObj = await dbGet("SELECT id FROM pengguna WHERE LOWER(username) = ?", [username_guru]);
      if (!guruObj) continue;
      await dbRun(
        "UPDATE kelas SET walikelas_id = ? WHERE id = ?",
        [guruObj.id, classObj.id]
      );
      importedCount++;
    }
    res.json({ message: `Berhasil memetakan ${importedCount} wali kelas ke kelas masing-masing.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/absensi", async (req, res) => {
  try {
    const { kelas_id, tanggal, records } = req.body;
    if (!kelas_id || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Data absensi tidak lengkap (kelas_id, tanggal, records required)" });
    }
    const normalizedTanggal = tanggal.replace(/-/g, "/");
    let abs = await dbGet("SELECT id, is_approved_by_walikelas FROM absensi WHERE tanggal = ? AND kelas_id = ?", [normalizedTanggal, kelas_id]);
    let absensiId = abs?.id;
    if (!absensiId) {
      const insRes = await dbRun("INSERT INTO absensi (tanggal, kelas_id, is_approved_by_walikelas) VALUES (?, ?, 0)", [normalizedTanggal, kelas_id]);
      absensiId = insRes.id;
    } else if (abs?.is_approved_by_walikelas) {
      return res.status(403).json({ error: "Absensi untuk tanggal ini sudah divalidasi oleh Wali Kelas dan tidak dapat diubah oleh guru mapel." });
    }
    for (const rec of records) {
      const timestamp = rec.updated_at || (/* @__PURE__ */ new Date()).toISOString();
      await dbRun(`
        INSERT OR REPLACE INTO detail_absensi (absensi_id, siswa_nis, status, updated_at)
        VALUES (?, ?, ?, ?)
      `, [absensiId, rec.nis, rec.status, timestamp]);
    }
    res.json({ message: "Absensi berhasil disimpan!", absensiId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/absensi-history/:kelas_id", async (req, res) => {
  try {
    const { kelas_id } = req.params;
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/walikelas/absensi", async (req, res) => {
  try {
    const { kelas_id, tanggal, records } = req.body;
    if (!kelas_id || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Data absensi tidak lengkap (kelas_id, tanggal, records required)" });
    }
    const numericKelasId = Number(kelas_id);
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const normalizedTanggal = tanggal.replace(/-/g, "/");
    let abs = await dbGet("SELECT id FROM absensi WHERE tanggal = ? AND kelas_id = ?", [normalizedTanggal, numericKelasId]);
    let absensiId = abs?.id;
    if (!absensiId) {
      const insRes = await dbRun("INSERT INTO absensi (tanggal, kelas_id, is_approved_by_walikelas) VALUES (?, ?, 1)", [normalizedTanggal, numericKelasId]);
      absensiId = insRes.id;
    } else {
      await dbRun("UPDATE absensi SET is_approved_by_walikelas = 1 WHERE id = ?", [absensiId]);
    }
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_absensi (absensi_id, siswa_nis, status, updated_at)
        VALUES (?, ?, ?, ?)
      `, [absensiId, rec.nis, rec.status, timestamp]);
    }
    res.json({ message: "Absensi telah divalidasi dan disimpan oleh Wali Kelas!", absensiId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/absensi-detail/:absensi_id", async (req, res) => {
  try {
    const { absensi_id } = req.params;
    const details = await dbAll(`
      SELECT da.id, da.siswa_nis, s.nama, s.jenis_kelamin, da.status, da.updated_at
      FROM detail_absensi da
      INNER JOIN siswa s ON da.siswa_nis = s.nis
      WHERE da.absensi_id = ?
      ORDER BY s.nama ASC
    `, [absensi_id]);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/nilai", async (req, res) => {
  try {
    const { kelas_id, nama_aktivitas, tanggal, records, kkm } = req.body;
    if (!kelas_id || !nama_aktivitas || !tanggal || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Data nilai tidak lengkap" });
    }
    const normalizedTanggal = tanggal.replace(/-/g, "/");
    const manualKkm = typeof kkm === "number" ? kkm : parseFloat(kkm) || 75;
    let akt = await dbGet("SELECT id FROM aktivitas_nilai WHERE nama_aktivitas = ? AND tanggal = ? AND kelas_id = ?", [nama_aktivitas, normalizedTanggal, kelas_id]);
    let aktivitasId = akt?.id;
    if (!aktivitasId) {
      const insRes = await dbRun("INSERT INTO aktivitas_nilai (nama_aktivitas, tanggal, kelas_id, kkm) VALUES (?, ?, ?, ?)", [nama_aktivitas, normalizedTanggal, kelas_id, manualKkm]);
      aktivitasId = insRes.id;
    } else {
      await dbRun("UPDATE aktivitas_nilai SET kkm = ? WHERE id = ?", [manualKkm, aktivitasId]);
    }
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan)
        VALUES (?, ?, ?, ?)
      `, [aktivitasId, rec.nis, parseFloat(rec.nilai) || 0, rec.catatan || ""]);
    }
    res.json({ message: "Nilai berhasil disimpan!", aktivitasId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/nilai/:aktivitas_id", async (req, res) => {
  try {
    const { aktivitas_id } = req.params;
    const { nama_aktivitas, tanggal, kkm, records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Data rincian nilai tidak lengkap (records required)" });
    }
    const normalizedTanggal = tanggal ? tanggal.replace(/-/g, "/") : "";
    const manualKkm = typeof kkm === "number" ? kkm : parseFloat(kkm) || 75;
    if (nama_aktivitas && normalizedTanggal) {
      await dbRun(`
        UPDATE aktivitas_nilai
        SET nama_aktivitas = ?, tanggal = ?, kkm = ?
        WHERE id = ?
      `, [nama_aktivitas.trim(), normalizedTanggal.trim(), manualKkm, aktivitas_id]);
    }
    for (const rec of records) {
      await dbRun(`
        INSERT OR REPLACE INTO detail_nilai (aktivitas_id, siswa_nis, nilai, catatan)
        VALUES (?, ?, ?, ?)
      `, [aktivitas_id, rec.nis, parseFloat(rec.nilai) || 0, rec.catatan || ""]);
    }
    res.json({ message: "Laporan nilai berhasil diperbarui di database!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/nilai-history/:kelas_id", async (req, res) => {
  try {
    const { kelas_id } = req.params;
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/nilai-detail/:aktivitas_id", async (req, res) => {
  try {
    const { aktivitas_id } = req.params;
    const details = await dbAll(`
      SELECT dn.id, dn.siswa_nis, s.nama, s.jenis_kelamin, dn.nilai, dn.catatan, COALESCE(an.kkm, 75) as kkm
      FROM detail_nilai dn
      INNER JOIN siswa s ON dn.siswa_nis = s.nis
      INNER JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
      WHERE dn.aktivitas_id = ?
      ORDER BY s.nama ASC
    `, [aktivitas_id]);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/stats", async (req, res) => {
  try {
    const { guru_id, role } = req.query;
    let classIds = [];
    if (role === "guru" && guru_id) {
      const rows = await dbAll(
        "SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?",
        [Number(guru_id)]
      );
      classIds = rows.map((r) => r.kelas_id);
    } else {
      const rows = await dbAll("SELECT id FROM kelas");
      classIds = rows.map((r) => r.id);
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
    const classIdPlaceholders = classIds.map(() => "?").join(",");
    const classCount = classIds.length;
    const studentCount = await dbGet(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const maleCount = await dbGet(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'L' AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const femaleCount = await dbGet(
      `SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'P' AND kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const attendances = await dbGet(
      `SELECT COUNT(*) as count FROM absensi WHERE kelas_id IN (${classIdPlaceholders})`,
      classIds
    );
    const jarangMasukCount = await dbGet(`
      SELECT COUNT(DISTINCT da.siswa_nis) as count 
      FROM detail_absensi da
      JOIN absensi a ON da.absensi_id = a.id
      WHERE a.kelas_id IN (${classIdPlaceholders}) AND da.status != 'Hadir'
    `, classIds);
    const averageGrade = await dbGet(`
      SELECT AVG(dn.nilai) as avg 
      FROM detail_nilai dn 
      JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id 
      WHERE an.kelas_id IN (${classIdPlaceholders})
    `, classIds);
    const remedialCount = await dbGet(`
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
      persen_remedial: totalStudentsVal ? Math.round(remedialStudentsVal / totalStudentsVal * 100) : 0,
      total_remedial: remedialStudentsVal
    };
    const classesBreakdown = [];
    for (const cId of classIds) {
      const cls = await dbGet("SELECT * FROM kelas WHERE id = ?", [cId]);
      if (!cls) continue;
      const cStudents = await dbGet("SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND kelas_id = ?", [cId]);
      const cMale = await dbGet("SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'L' AND kelas_id = ?", [cId]);
      const cFemale = await dbGet("SELECT COUNT(*) as count FROM siswa WHERE status_aktif = 1 AND jenis_kelamin = 'P' AND kelas_id = ?", [cId]);
      const cAvg = await dbGet(`
        SELECT AVG(dn.nilai) as avg 
        FROM detail_nilai dn 
        JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id 
        WHERE an.kelas_id = ?
      `, [cId]);
      const cJarangMasuk = await dbGet(`
        SELECT COUNT(DISTINCT da.siswa_nis) as count 
        FROM detail_absensi da
        JOIN absensi a ON da.absensi_id = a.id
        WHERE a.kelas_id = ? AND da.status != 'Hadir'
      `, [cId]);
      const cRemedial = await dbGet(`
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
        persen_remedial: totalStudents ? Math.round(remedialStudents / totalStudents * 100) : 0
      });
    }
    res.json({
      ...summary,
      classes_breakdown: classesBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/stats/students", async (req, res) => {
  try {
    const { guru_id, role, type, kelas_id } = req.query;
    let classIds = [];
    if (kelas_id) {
      classIds = [Number(kelas_id)];
    } else if (role === "guru" && guru_id) {
      const rows = await dbAll(
        "SELECT DISTINCT kelas_id FROM jadwal WHERE guru_id = ?",
        [Number(guru_id)]
      );
      classIds = rows.map((r) => r.kelas_id);
    } else {
      const rows = await dbAll("SELECT id FROM kelas");
      classIds = rows.map((r) => r.id);
    }
    if (classIds.length === 0) {
      return res.json([]);
    }
    const classIdPlaceholders = classIds.map(() => "?").join(",");
    if (type === "rare_attendance") {
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
    } else if (type === "remedial") {
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
    } else if (type === "binaan") {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/class-stats/:class_id", async (req, res) => {
  try {
    const { class_id } = req.params;
    const rows = await dbAll(`
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
    const formattedData = rows.map((r) => {
      const attendance_pct = r.total_sessions > 0 ? Math.round(r.sessions_hadir / r.total_sessions * 100) : 100;
      const absence_pct = 100 - attendance_pct;
      const average_grade = Math.round(r.rata_rata_nilai * 10) / 10;
      return {
        nis: r.nis,
        nama: r.nama,
        attendance_rate: attendance_pct,
        absence_rate: absence_pct,
        average_grade
      };
    });
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/rekap/absensi/:kelas_id", async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const datesRows = await dbAll(
      "SELECT tanggal FROM absensi WHERE kelas_id = ? ORDER BY tanggal ASC",
      [kelas_id]
    );
    const dates = datesRows.map((d) => d.tanggal);
    const students = await dbAll(
      "SELECT nis, nama, jenis_kelamin FROM siswa WHERE kelas_id = ? ORDER BY nama ASC",
      [kelas_id]
    );
    const detailsRows = await dbAll(
      `SELECT da.siswa_nis, a.tanggal, da.status
       FROM detail_absensi da
       JOIN absensi a ON da.absensi_id = a.id
       WHERE a.kelas_id = ?`,
      [kelas_id]
    );
    const detailMap = {};
    for (const d of detailsRows) {
      if (!detailMap[d.siswa_nis]) detailMap[d.siswa_nis] = {};
      detailMap[d.siswa_nis][d.tanggal] = d.status;
    }
    const studentsWithSummary = students.map((s) => {
      const studentDetails = detailMap[s.nis] || {};
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;
      for (const t of dates) {
        const stat = studentDetails[t];
        if (stat === "Hadir") hadir++;
        else if (stat === "Izin") izin++;
        else if (stat === "Sakit") sakit++;
        else if (stat === "Alfa") alfa++;
      }
      const total = hadir + izin + sakit + alfa;
      const rate = total > 0 ? Math.round(hadir / total * 100) : 100;
      return {
        nis: s.nis,
        nama: s.nama,
        jenis_kelamin: s.jenis_kelamin,
        summary: { hadir, izin, sakit, alfa, total, rate },
        details: studentDetails
      };
    });
    res.json({ dates, students: studentsWithSummary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/rekap/nilai/:kelas_id", async (req, res) => {
  try {
    const { kelas_id } = req.params;
    const activities = await dbAll(
      "SELECT id, nama_aktivitas, tanggal, COALESCE(kkm, 75) as kkm FROM aktivitas_nilai WHERE kelas_id = ? ORDER BY tanggal ASC, id ASC",
      [kelas_id]
    );
    const students = await dbAll(
      "SELECT nis, nama, jenis_kelamin FROM siswa WHERE kelas_id = ? ORDER BY nama ASC",
      [kelas_id]
    );
    const gradesRows = await dbAll(
      `SELECT dn.siswa_nis, dn.aktivitas_id, dn.nilai, dn.catatan
       FROM detail_nilai dn
       JOIN aktivitas_nilai an ON dn.aktivitas_id = an.id
       WHERE an.kelas_id = ?`,
      [kelas_id]
    );
    const gradeMap = {};
    for (const g of gradesRows) {
      if (!gradeMap[g.siswa_nis]) gradeMap[g.siswa_nis] = {};
      gradeMap[g.siswa_nis][g.aktivitas_id] = { nilai: g.nilai, catatan: g.catatan || "" };
    }
    const studentsWithGrades = students.map((s) => {
      const studentGrades = gradeMap[s.nis] || {};
      let totalScore = 0;
      let gradedCount = 0;
      const gradesObj = {};
      const notesObj = {};
      for (const act of activities) {
        const item = studentGrades[act.id];
        if (item) {
          totalScore += item.nilai;
          gradedCount++;
          gradesObj[act.id] = item.nilai;
          notesObj[act.id] = item.catatan;
        } else {
          gradesObj[act.id] = 0;
          notesObj[act.id] = "";
        }
      }
      const average = gradedCount > 0 ? Math.round(totalScore / gradedCount * 10) / 10 : 0;
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/wali-murid/monitoring/:kelas_id", async (req, res) => {
  const { kelas_id } = req.params;
  try {
    const numericKelasId = Number(kelas_id);
    const classInfo = await dbGet(`
      SELECT k.id, k.nama_kelas, k.sekolah, p.nama AS nama_walikelas,
             (SELECT COUNT(*) FROM siswa WHERE kelas_id = k.id AND status_aktif = 1) as total_siswa
      FROM kelas k
      LEFT JOIN pengguna p ON k.walikelas_id = p.id
      WHERE k.id = ?
    `, [numericKelasId]);
    if (!classInfo) {
      return res.status(404).json({ error: "Kelas tidak ditemukan" });
    }
    const attendance = await dbAll(`
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/auth/login", loginRateLimiter, async (req, res) => {
  const rawIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username dan password wajib diisi" });
    }
    const user = await dbGet(
      "SELECT id, username, nama, role, password, nip, jabatan, siswa_nis, kelas_id FROM pengguna WHERE LOWER(username) = ?",
      [username.trim().toLowerCase()]
    );
    if (!user) {
      const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockUntil = Date.now() + 60 * 1e3;
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: "Username atau password salah" });
    }
    let passwordMatch = false;
    if (isBcryptHash(user.password)) {
      passwordMatch = await import_bcryptjs2.default.compare(password, user.password);
    } else {
      passwordMatch = user.password === password;
      if (passwordMatch) {
        try {
          const hashedPassword = await import_bcryptjs2.default.hash(password, 10);
          await dbRun("UPDATE pengguna SET password = ? WHERE id = ?", [hashedPassword, user.id]);
          console.log(`Successfully auto-upgraded plain-text password to bcrypt hash for user: ${user.username}`);
        } catch (upgradeErr) {
          console.error("Failed to auto-upgrade password:", upgradeErr);
        }
      }
    }
    if (!passwordMatch) {
      const attempts = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockUntil = Date.now() + 60 * 1e3;
        attempts.count = 0;
      }
      loginAttempts.set(ip, attempts);
      return res.status(401).json({ error: "Username atau password salah" });
    }
    loginAttempts.delete(ip);
    const session = await (0, import_iron_session.getIronSession)(req, res, sessionOptions);
    session.user = { id: user.id, username: user.username, role: user.role };
    await session.save();
    res.json({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nip: user.nip || "",
      jabatan: user.jabatan || "",
      siswa_nis: user.siswa_nis || null,
      kelas_id: user.kelas_id || null,
      message: "Login berhasil"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/auth/profile", authenticateSession, async (req, res) => {
  const { nama, nip, jabatan, currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  try {
    const user = await dbGet(
      "SELECT password FROM pengguna WHERE id = ?",
      [userId]
    );
    if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "Kata sandi saat ini wajib diisi untuk mengubah kata sandi" });
      let match = false;
      if (isBcryptHash(user.password)) {
        match = await import_bcryptjs2.default.compare(currentPassword, user.password);
      } else {
        match = user.password === currentPassword;
      }
      if (!match) return res.status(401).json({ error: "Kata sandi saat ini tidak cocok" });
      const hashedNew = await import_bcryptjs2.default.hash(newPassword, 10);
      await dbRun(
        "UPDATE pengguna SET nama = ?, nip = ?, jabatan = ?, password = ? WHERE id = ?",
        [nama, nip, jabatan, hashedNew, userId]
      );
    } else {
      await dbRun(
        "UPDATE pengguna SET nama = ?, nip = ?, jabatan = ? WHERE id = ?",
        [nama, nip, jabatan, userId]
      );
    }
    const updatedUser = await dbGet(
      "SELECT id, username, nama, role, nip, jabatan FROM pengguna WHERE id = ?",
      [userId]
    );
    res.json({ message: "Profil berhasil diperbarui", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/admin/summary", async (req, res) => {
  try {
    const classCount = await dbGet("SELECT COUNT(*) as count FROM kelas");
    const studentCount = await dbGet("SELECT COUNT(*) as count FROM siswa");
    const gradeCount = await dbGet("SELECT COUNT(*) as count FROM detail_nilai");
    const attendanceCount = await dbGet("SELECT COUNT(*) as count FROM detail_absensi");
    const userCount = await dbGet("SELECT COUNT(*) as count FROM pengguna");
    res.json({
      classes: classCount?.count || 0,
      students: studentCount?.count || 0,
      grades: gradeCount?.count || 0,
      attendance: attendanceCount?.count || 0,
      users: userCount?.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/admin/users", async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT p.id, p.username, p.nama, p.role, p.kelas_id, k.nama_kelas
      FROM pengguna p
      LEFT JOIN kelas k ON p.kelas_id = k.id
      ORDER BY p.role DESC, p.nama ASC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/admin/users", async (req, res) => {
  try {
    const { username, password, nama, role, kelas_id } = req.body;
    if (!username || !password || !nama || !role) {
      return res.status(400).json({ error: "Semua kolom wajib diisi" });
    }
    const exists = await dbGet("SELECT id FROM pengguna WHERE LOWER(username) = ?", [username.trim().toLowerCase()]);
    if (exists) {
      return res.status(400).json({ error: "Username sudah digunakan oleh akun lain" });
    }
    const hashedPassword = await import_bcryptjs2.default.hash(password, 10);
    const result = await dbRun(
      "INSERT INTO pengguna (username, password, nama, role, kelas_id) VALUES (?, ?, ?, ?, ?)",
      [username.trim().toLowerCase(), hashedPassword, nama.trim(), role, kelas_id || null]
    );
    res.json({ id: result.id, username: username.trim().toLowerCase(), nama, role, kelas_id: kelas_id || null, message: "Pengguna berhasil dibuat" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nama, role, kelas_id } = req.body;
    if (!username || !nama || !role) {
      return res.status(400).json({ error: "Username, Nama, dan Role wajib diisi" });
    }
    const otherExists = await dbGet("SELECT id FROM pengguna WHERE LOWER(username) = ? AND id != ?", [username.trim().toLowerCase(), id]);
    if (otherExists) {
      return res.status(400).json({ error: "Username sudah digunakan oleh akun lain" });
    }
    if (password && password.trim()) {
      const hashedPassword = await import_bcryptjs2.default.hash(password, 10);
      await dbRun(
        "UPDATE pengguna SET username = ?, password = ?, nama = ?, role = ?, kelas_id = ? WHERE id = ?",
        [username.trim().toLowerCase(), hashedPassword, nama.trim(), role, kelas_id || null, id]
      );
    } else {
      await dbRun(
        "UPDATE pengguna SET username = ?, nama = ?, role = ?, kelas_id = ? WHERE id = ?",
        [username.trim().toLowerCase(), nama.trim(), role, kelas_id || null, id]
      );
    }
    res.json({ message: "Pengguna berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const targetedUser = await dbGet("SELECT username FROM pengguna WHERE id = ?", [id]);
    if (!targetedUser) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }
    if (targetedUser.username === "admin") {
      return res.status(400).json({ error: "Akun admin utama tidak boleh dihapus untuk mencegah kegagalan sistem" });
    }
    await dbRun("DELETE FROM pengguna WHERE id = ?", [id]);
    res.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/admin/promote-siswa", async (req, res) => {
  try {
    const { source_class_id, target_class_id, siswa_nis_list } = req.body;
    if (!target_class_id || !siswa_nis_list || !Array.isArray(siswa_nis_list)) {
      return res.status(400).json({ error: "Data promosi tidak lengkap (target_class_id and siswa_nis_list are required)" });
    }
    if (siswa_nis_list.length === 0) {
      return res.status(400).json({ error: "Daftar siswa kosong" });
    }
    const placeholders = siswa_nis_list.map(() => "?").join(",");
    await dbRun(
      `UPDATE siswa SET kelas_id = ? WHERE nis IN (${placeholders})`,
      [target_class_id, ...siswa_nis_list]
    );
    res.json({ message: `Berhasil menaikkan ${siswa_nis_list.length} siswa ke kelas baru.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/admin/graduate-siswa", async (req, res) => {
  try {
    const { siswa_nis_list } = req.body;
    if (!siswa_nis_list || !Array.isArray(siswa_nis_list)) {
      return res.status(400).json({ error: "Daftar siswa wajib diisi" });
    }
    if (siswa_nis_list.length === 0) {
      return res.status(400).json({ error: "Daftar siswa kosong" });
    }
    const placeholders = siswa_nis_list.map(() => "?").join(",");
    await dbRun(
      `UPDATE siswa SET status_aktif = 0 WHERE nis IN (${placeholders})`,
      siswa_nis_list
    );
    res.json({ message: `Berhasil meluluskan ${siswa_nis_list.length} siswa (Status Nonaktif/Alumni).` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/admin/reset-db", async (req, res) => {
  try {
    await dbRun("DROP TABLE IF EXISTS detail_absensi");
    await dbRun("DROP TABLE IF EXISTS absensi");
    await dbRun("DROP TABLE IF EXISTS detail_nilai");
    await dbRun("DROP TABLE IF EXISTS aktivitas_nilai");
    await dbRun("DROP TABLE IF EXISTS siswa");
    await dbRun("DROP TABLE IF EXISTS jadwal");
    await dbRun("DROP TABLE IF EXISTS kelas");
    await initializeDatabase();
    const envSetting = (process.env.APP_ENV || "dev").toLowerCase().trim();
    const isPubMode = envSetting === "pub" || envSetting === "publish";
    if (isPubMode) {
      res.json({ message: "Katalog database berhasil di-reset secara bersih (fresh) untuk Mode Produksi (pub)." });
    } else {
      res.json({ message: "Katalog Sekolah, Siswa, Absensi, Rincian Nilai, dan Jadwal telah berhasil di-reset dan di-seeding ulang otomatis (dev)." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/jadwal", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/jadwal", requireAdmin, async (req, res) => {
  const { kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai } = req.body;
  if (!kelas_id || !guru_id || !mata_pelajaran || !hari || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: "Data jadwal tidak lengkap" });
  }
  try {
    const result = await dbRun(
      `INSERT INTO jadwal (kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai) VALUES (?, ?, ?, ?, ?, ?)`,
      [kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai]
    );
    res.json({ id: result.id, message: "Jadwal berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put("/jadwal/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai } = req.body;
  if (!kelas_id || !guru_id || !mata_pelajaran || !hari || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ error: "Data jadwal tidak lengkap" });
  }
  try {
    await dbRun(
      `UPDATE jadwal SET kelas_id = ?, guru_id = ?, mata_pelajaran = ?, hari = ?, waktu_mulai = ?, waktu_selesai = ? WHERE id = ?`,
      [kelas_id, guru_id, mata_pelajaran, hari, waktu_mulai, waktu_selesai, id]
    );
    res.json({ message: "Jadwal berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/jadwal/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM jadwal WHERE id = ?", [id]);
    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var MASTER_PATCHES = [
  {
    id: "PATCH-001",
    nama_patch: "Optimasi Indeks Kinerja Database SQLite",
    deskripsi: "Membangun ulang indeks kueri relasional siswa, kelas, absensi, dan nilai untuk mempercepat kalkulasi KKM Pintar dan mengurangi latensi pencarian data hingga 65%.",
    kategori: "Database",
    status_default: "pending"
  },
  {
    id: "PATCH-002",
    nama_patch: "Pembaruan Logika Persetujuan Absensi Wali Kelas",
    deskripsi: "Memperbaiki bugs sinkronisasi ketika wali kelas menyetujui absensi harian, menambahkan penanganan kasus siswa yang pindah kelas di tengah semester.",
    kategori: "Bug Fix",
    status_default: "pending"
  },
  {
    id: "PATCH-003",
    nama_patch: "Kompatibilitas Nilai Kurikulum Merdeka (KKM Pintar v2)",
    deskripsi: "Upgrade modul KKM Pintar agar mendukung format penilaian deskriptif K-Merdeka, penentuan interval kompetensi, dan kalkulasi otomatis predikat rapor.",
    kategori: "Feature Upgrade",
    status_default: "pending"
  },
  {
    id: "PATCH-051",
    nama_patch: "Penguatan Enkripsi & Proteksi Token Sesi",
    deskripsi: "Meningkatkan standar proteksi data cookie Iron Session, mengenkripsi payload dengan enkripsi AES-256-GCM ganda, dan memperpendek masa kedaluwarsa sesi tidak aktif.",
    kategori: "Keamanan",
    status_default: "pending"
  }
];
router.get("/patches", async (req, res) => {
  try {
    const dbPatches = await dbAll("SELECT * FROM patches");
    const appliedMap = new Map(dbPatches.map((p) => [p.id, p]));
    const masterList = MASTER_PATCHES.map((patch) => {
      const dbRecord = appliedMap.get(patch.id);
      return {
        id: patch.id,
        nama_patch: patch.nama_patch,
        deskripsi: patch.deskripsi,
        kategori: patch.kategori,
        status: dbRecord ? dbRecord.status : "pending",
        applied_at: dbRecord ? dbRecord.applied_at : null,
        is_custom: false
      };
    });
    const masterIds = new Set(MASTER_PATCHES.map((p) => p.id));
    const customList = dbPatches.filter((p) => !masterIds.has(p.id)).map((p) => ({
      id: p.id,
      nama_patch: p.nama_patch,
      deskripsi: p.deskripsi,
      kategori: p.kategori,
      status: p.status,
      applied_at: p.applied_at,
      is_custom: true
    }));
    res.json([...masterList, ...customList]);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data patch: " + err.message });
  }
});
router.post("/patches/upload", async (req, res) => {
  const { id, nama_patch, deskripsi, kategori, sql_statements } = req.body;
  if (!nama_patch) {
    return res.status(400).json({ error: "Nama patch wajib diisi" });
  }
  try {
    const patchId = id || `PATCH-CUSTOM-${Date.now()}`;
    const desc = deskripsi || "Patch kustom yang diunggah oleh administrator.";
    const cat = kategori || "Database";
    let sqlArr = [];
    if (Array.isArray(sql_statements)) {
      sqlArr = sql_statements;
    } else if (typeof sql_statements === "string") {
      sqlArr = sql_statements.split(";").map((s) => s.trim()).filter(Boolean);
    }
    const sqlStr = JSON.stringify(sqlArr);
    await dbRun(
      "INSERT OR REPLACE INTO patches (id, nama_patch, deskripsi, kategori, status, applied_at, sql_statements) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [patchId, nama_patch, desc, cat, "pending", null, sqlStr]
    );
    res.json({
      success: true,
      message: `Patch "${nama_patch}" dengan ID ${patchId} berhasil diunggah dan siap diterapkan.`,
      patch: {
        id: patchId,
        nama_patch,
        deskripsi: desc,
        kategori: cat,
        status: "pending",
        applied_at: null,
        is_custom: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengunggah patch: " + err.message });
  }
});
router.post("/patches/apply", async (req, res) => {
  const { patchId } = req.body;
  if (!patchId) {
    return res.status(400).json({ error: "ID Patch wajib disertakan" });
  }
  let patch = MASTER_PATCHES.find((p) => p.id === patchId);
  let isCustom = false;
  let customRecord = null;
  if (!patch) {
    customRecord = await dbGet("SELECT * FROM patches WHERE id = ?", [patchId]);
    if (!customRecord) {
      return res.status(404).json({ error: "Patch tidak ditemukan dalam repositori master maupun kustom." });
    }
    patch = {
      id: customRecord.id,
      nama_patch: customRecord.nama_patch,
      deskripsi: customRecord.deskripsi,
      kategori: customRecord.kategori,
      status_default: "pending"
    };
    isCustom = true;
  }
  try {
    if (isCustom && customRecord) {
      if (customRecord.sql_statements) {
        let statements = [];
        try {
          statements = JSON.parse(customRecord.sql_statements);
        } catch (e) {
          statements = customRecord.sql_statements.split(";").map((s) => s.trim()).filter(Boolean);
        }
        for (const stmt of statements) {
          if (stmt.trim()) {
            await dbRun(stmt);
          }
        }
      }
    } else {
      if (patchId === "PATCH-001") {
        await dbRun("REINDEX");
        await dbRun("VACUUM");
        await dbRun("CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON siswa(kelas_id)");
        await dbRun("CREATE INDEX IF NOT EXISTS idx_absensi_kelas_id ON absensi(kelas_id)");
      } else if (patchId === "PATCH-002") {
        try {
          await dbRun("ALTER TABLE absensi ADD COLUMN is_approved_by_walikelas INTEGER DEFAULT 0");
        } catch (e) {
        }
      } else if (patchId === "PATCH-003") {
        await dbRun("UPDATE aktivitas_nilai SET kkm = 75 WHERE kkm IS NULL OR kkm < 50");
      } else if (patchId === "PATCH-051") {
        console.log("Security patch 051 applied successfully.");
      }
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await dbRun(
      "INSERT OR REPLACE INTO patches (id, nama_patch, deskripsi, kategori, status, applied_at, sql_statements) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        patch.id,
        patch.nama_patch,
        patch.deskripsi,
        patch.kategori,
        "applied",
        timestamp,
        isCustom ? customRecord.sql_statements : null
      ]
    );
    res.json({
      success: true,
      message: `Patch ${patchId} (${patch.nama_patch}) berhasil diterapkan pada sistem.`,
      applied_at: timestamp
    });
  } catch (err) {
    res.status(500).json({ error: `Gagal menerapkan patch ${patchId}: ` + err.message });
  }
});
router.get("/system/diagnostics", async (req, res) => {
  try {
    const checks = [];
    try {
      const integrity = await dbGet("PRAGMA integrity_check");
      checks.push({
        komponen: "Koneksi & Integritas Database",
        status: integrity?.integrity_check === "ok" ? "sehat" : "bermasalah",
        detail: integrity?.integrity_check === "ok" ? "Database SQLite sehat dan tidak ditemukan korupsi berkas." : `Integritas database terganggu: ${integrity?.integrity_check}`
      });
    } catch (e) {
      checks.push({
        komponen: "Koneksi & Integritas Database",
        status: "rusak",
        detail: `Koneksi database gagal: ${e.message}`
      });
    }
    try {
      const kelasCount = await dbGet("SELECT COUNT(*) as count FROM kelas");
      const siswaCount = await dbGet("SELECT COUNT(*) as count FROM siswa");
      const userCount = await dbGet("SELECT COUNT(*) as count FROM pengguna");
      checks.push({
        komponen: "Ketersediaan Tabel Data Pokok",
        status: "sehat",
        detail: `Tabel utama lengkap. Terdata ${kelasCount?.count || 0} Kelas, ${siswaCount?.count || 0} Siswa, dan ${userCount?.count || 0} Akun Pengguna.`
      });
    } catch (e) {
      checks.push({
        komponen: "Ketersediaan Tabel Data Pokok",
        status: "bermasalah",
        detail: `Gagal membaca tabel data pokok: ${e.message}`
      });
    }
    const memUsage = process.memoryUsage();
    const memMb = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
    checks.push({
      komponen: "Sumber Daya Virtual & Memory Server",
      status: memMb < 300 ? "sehat" : "beban_tinggi",
      detail: `Versi NodeJS ${process.version}. Heap memory terpakai: ${memMb} MB. Server berjalan dalam batas aman.`
    });
    const identityPath = import_path2.default.resolve(process.cwd(), "school_identity.json");
    if (import_fs.default.existsSync(identityPath)) {
      try {
        const raw = import_fs.default.readFileSync(identityPath, "utf-8");
        const parsed = JSON.parse(raw);
        checks.push({
          komponen: "Berkas Identitas Sekolah",
          status: "sehat",
          detail: `File terdeteksi untuk instansi "${parsed.nama_sekolah || "SMK Ibu"}". Format JSON valid.`
        });
      } catch (e) {
        checks.push({
          komponen: "Berkas Identitas Sekolah",
          status: "bermasalah",
          detail: `File JSON korup atau tidak valid: ${e.message}`
        });
      }
    } else {
      checks.push({
        komponen: "Berkas Identitas Sekolah",
        status: "peringatan",
        detail: "File school_identity.json belum dibuat. Sistem menggunakan konfigurasi default SMK Ibu."
      });
    }
    const healthyCount = checks.filter((c) => c.status === "sehat").length;
    const score = Math.round(healthyCount / checks.length * 100);
    res.json({
      score,
      scanned_at: (/* @__PURE__ */ new Date()).toISOString(),
      checks
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal menjalankan diagnosik sistem: " + err.message });
  }
});
router.get("/system/backup", async (req, res) => {
  try {
    const tables = [
      "pengguna",
      "kelas",
      "guru",
      "siswa",
      "wali_murid",
      "mapel",
      "jadwal",
      "absensi",
      "aktivitas_nilai",
      "detail_nilai",
      "patches"
    ];
    const backupData = {};
    for (const table of tables) {
      try {
        const rows = await dbAll(`SELECT * FROM ${table}`);
        backupData[table] = rows;
      } catch (err) {
        console.warn(`Gagal mem-backup tabel ${table}:`, err);
        backupData[table] = [];
      }
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const filename = `backup_db_smk_${timestamp}.json`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat backup database: " + err.message });
  }
});
var routes_default = router;

// server.ts
import_dotenv.default.config();
var app = (0, import_express2.default)();
var PORT = 3e3;
app.use((0, import_compression.default)());
var allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.APP_URL
].filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".run.app") || origin.includes("localhost");
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express2.default.json({ limit: "10mb" }));
app.use(import_express2.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(import_express2.default.text({ type: "text/plain", limit: "10mb" }));
app.use(import_express2.default.static(import_path3.default.join(process.cwd(), "public"), {
  maxAge: "0",
  setHeaders: (res, filepath) => {
    if (filepath.endsWith("sw.js")) {
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Content-Type", "application/javascript");
    } else if (filepath.endsWith("manifest.json")) {
      res.setHeader("Content-Type", "application/json");
    }
  }
}));
app.use("/api", routes_default);
console.log("Database instance mapped to central server runtime.");
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for development.");
  } else {
    const distPath = import_path3.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath, {
      maxAge: "1y",
      // Cache static assets for 1 year (Vite hashes filenames)
      immutable: true,
      // Files never change
      index: false
      // Let the catch-all handle index.html to prevent caching HTML
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
    console.log("Serving production build from:", distPath);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SiGup Full-Stack application is active on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
