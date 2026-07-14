# Panduan Deployment Sistem Informasi Monitoring Ibu (SIM-IBU)

SIM-IBU dirancang dengan arsitektur **Database Provider (Factory Pattern)** yang sangat fleksibel dan tangguh. Anda dapat mendeploy aplikasi ini ke VPS polos (Ubuntu/Debian) secara manual atau menggunakan Docker — dengan pilihan database **SQLite (Default)**, **MySQL**, atau **PostgreSQL** hanya dengan mengubah file konfigurasi `.env`, **tanpa mengubah kode program sama sekali**.

Berikut adalah panduan lengkap untuk 3 skenario deployment utama SIM-IBU:

---

## 📋 Persiapan Awal (Untuk Semua Skenario)

Sebelum memulai, salin file contoh environment dan sesuaikan konfigurasinya:
```bash
cp .env.example .env
```
Buka file `.env` dan atur parameter berikut:
* `COOKIE_PASSWORD`: Isi dengan string acak minimal 32 karakter untuk enkripsi session cookie.
* `APP_ENV`: Atur ke `dev` untuk pengujian (menampilkan tombol login cepat) atau `pub` untuk produksi (menyembunyikan tombol demo, menghapus seluruh data rekayasa saat server restart, serta hanya menyisakan akun 'admin' secara default).

---

## 🛠️ Skenario 1: VPS Manual + SQLite (Paling Sederhana)
Skenario ini sangat direkomendasikan untuk VPS kecil, demo, atau pengujian cepat karena **tidak membutuhkan server database tambahan**. Data disimpan di dalam file lokal `/server/data/sekolah.db`.

### Langkah-langkah:
1. **Install Node.js & NPM** (Direkomendasikan Node.js v20+).
2. **Kloning Repositori** dan masuk ke direktori proyek.
3. **Konfigurasi `.env`**:
   ```env
   DB_TYPE=sqlite
   ```
4. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
5. **Kompilasi Aplikasi**:
   ```bash
   npm run build
   ```
6. **Jalankan Aplikasi di Latar Belakang** (menggunakan PM2 agar tetap berjalan saat terminal ditutup):
   ```bash
   # Install pm2 jika belum ada
   npm install -g pm2
   
   # Start aplikasi dengan PM2
   pm2 start npm --name "sim-ibu" -- start
   ```

---

## 🔌 Skenario 2: VPS Manual + MySQL atau PostgreSQL Eksternal
Skenario ini cocok untuk deployment di VPS polos di mana Anda ingin menggunakan layanan database server mandiri (baik di mesin yang sama maupun server database pihak ketiga).

### Langkah-langkah:
1. **Siapkan Database**: Buat database kosong bernama `sigup_db` (atau sesuai keinginan) di server MySQL/Postgres Anda.
2. **Konfigurasi `.env`**:
   * **Opsi A: Menggunakan MySQL**
     ```env
     DB_TYPE=mysql
     DB_HOST=localhost            # Ubah ke IP Server jika DB berada di server lain
     DB_PORT=3306
     DB_USER=sim_ibu_user
     DB_PASSWORD=password_mysql_anda
     DB_NAME=sigup_db
     ```
   * **Opsi B: Menggunakan PostgreSQL**
     ```env
     DB_TYPE=postgres
     DB_HOST=localhost            # Ubah ke IP Server jika DB berada di server lain
     DB_PORT=5432
     DB_USER=postgres
     DB_PASSWORD=password_postgres_anda
     DB_NAME=sigup_db
     DB_SSL=false
     ```
3. **Instalasi & Kompilasi**:
   ```bash
   npm install
   npm run build
   ```
4. **Jalankan dengan PM2**:
   ```bash
   pm2 start npm --name "sim-ibu" -- start
   ```
   *Sistem SIM-IBU akan mendeteksi tipe database secara cerdas dan otomatis membuat tabel-tabel serta skema migrasi yang diperlukan saat pertama kali aplikasi dijalankan (Idempotent).*

---

## 🐳 Skenario 3: Docker Compose (Aplikasi & Database Terisolasi)
Skenario terbaik untuk lingkungan produksi modern, integrasi CI/CD, dan deployment terisolasi penuh. SIM-IBU menyediakan dua file Docker Compose yang siap pakai.

### Opsi 3A: Menggunakan Docker Compose + MySQL (Default)
Menjalankan container aplikasi SIM-IBU dan container database MySQL secara bersamaan.

1. **Konfigurasi `.env`** (Sesuaikan kredensial database Anda):
   ```env
   DB_TYPE=mysql
   DB_HOST=db                         # Wajib bernilai 'db' agar menunjuk ke service MySQL internal docker
   DB_PORT=3306
   DB_USER=sim_ibu_user
   DB_PASSWORD=password_aman_mysql
   DB_NAME=sigup_db
   ```
2. **Jalankan Docker Compose**:
   ```bash
   docker compose up -d --build
   ```
3. **Periksa Status Container**:
   ```bash
   docker compose ps
   ```

### Opsi 3B: Menggunakan Docker Compose + SQLite (Single Container)
Menjalankan container SIM-IBU secara mandiri dengan SQLite. Direktori database SQLite (`/app/server/data`) dan berkas konfigurasi sekolah (`/app/school_identity.json`) di-mount ke host secara persisten agar seluruh data sekolah, penjadwal pencadangan otomatis Google Sheets, dan status API aman dari kehilangan data.

1. **Konfigurasi `.env`**:
   ```env
   DB_TYPE=sqlite
   ```
2. **Jalankan Docker Compose SQLite**:
   ```bash
   docker compose -f docker-compose.sqlite.yml up -d --build
   ```

---

## 🌐 Skenario 4: Database di Server Terpisah (Remote Database)

Jika Anda memiliki server database terpisah (misalnya AWS RDS, Google Cloud SQL, VPS khusus database, atau server bare-metal eksternal) dan ingin menghubungkan SIM-IBU ke server tersebut, ikuti langkah-langkah penting berikut demi kelancaran dan keamanan koneksi:

### 1. Pengaturan di Server Database (Remote Server)
Agar database dapat menerima koneksi dari server aplikasi SIM-IBU Anda:
* **Ubah Bind Address**: Secara default, MySQL/PostgreSQL hanya mendengarkan koneksi lokal (`127.0.0.1`). Ubah konfigurasi database Anda (misalnya `mysqld.cnf` untuk MySQL atau `postgresql.conf` untuk PostgreSQL) agar mendengarkan IP publik/internal yang sesuai, atau gunakan `0.0.0.0` (mendengarkan semua interface).
  ```ini
  # Contoh pada MySQL (/etc/mysql/mysql.conf.d/mysqld.cnf)
  bind-address = 0.0.0.0
  ```
* **Buat User & Berikan Hak Akses**: Buat user khusus SIM-IBU yang diizinkan terhubung dari IP Server Aplikasi Anda.
  ```sql
  -- Contoh SQL pada MySQL (Ganti IP_SERVER_APLIKASI dengan IP VPS SIM-IBU Anda)
  CREATE USER 'sim_ibu_user'@'IP_SERVER_APLIKASI' IDENTIFIED BY 'password_aman_anda';
  GRANT ALL PRIVILEGES ON sigup_db.* TO 'sim_ibu_user'@'IP_SERVER_APLIKASI';
  FLUSH PRIVILEGES;
  ```
* **Konfigurasi Firewall**: Pastikan firewall (seperti UFW di Ubuntu, iptables, atau Security Group pada AWS/GCP) membuka port database (**3306** untuk MySQL, **5432** untuk PostgreSQL) **hanya untuk IP Server Aplikasi SIM-IBU Anda** demi keamanan maksimal.

### 2. Pengaturan di Server Aplikasi SIM-IBU
* **Ubah berkas `.env`**:
  Sesuaikan `DB_HOST` dengan IP publik atau host domain dari server database Anda. Pastikan tidak lagi menggunakan `localhost` atau `127.0.0.1` (karena itu mengacu pada internal server aplikasi).
  ```env
  DB_TYPE=mysql                     # Atau 'postgres'
  DB_HOST=192.168.10.50             # IP Publik/Internal Server Database Terpisah
  DB_PORT=3306
  DB_USER=sim_ibu_user
  DB_PASSWORD=password_aman_anda
  DB_NAME=sigup_db
  ```

### 3. Cara Menjalankan dengan Docker Compose (App Only)
Jika Anda ingin menjalankan aplikasi SIM-IBU di dalam Docker, namun databasenya berada di luar (remote), Anda tidak perlu menjalankan container database lokal (`db`). Gunakan file konfigurasi `docker-compose.external.yml` yang sudah disediakan:
```bash
docker compose -f docker-compose.external.yml up -d --build
```

---

## 🐳 Perintah Docker yang Berguna
* **Melihat log real-time**: `docker compose logs -f` (atau `docker compose -f docker-compose.sqlite.yml logs -f`)
* **Menghentikan container**: `docker compose down` (atau `docker compose -f docker-compose.sqlite.yml down`)
* **Restart aplikasi**: `docker compose restart app`

