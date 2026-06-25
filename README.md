# SiGup - Sistem Guru Pintar 🎓

Aplikasi manajemen absensi dan nilai sekolah modern dengan multi-aktor (Guru, Admin, Wali Kelas, Wali Murid), terintegrasi dengan kecerdasan KKM Pintar, analisis data lokal, serta perlindungan **Keamanan Tingkat Lanjut (Encrypted Cookies/Iron Session, Rate-Limiting, Bcrypt)**. 

---

## 📌 Deskripsi Proyek

**SiGup** dirancang untuk membantu para pendidik, administrator sekolah, dan orang tua/wali murid dalam proses mengelola, memantau administrasi kelas secara cepat, andal, dan aman. Dengan antarmuka yang intuitif dan responsif, aplikasi ini mendukung multi-role untuk pendaftaran absensi, kalkulasi kelayakan nilai berdasarkan Kriteria Ketuntasan Minimal (KKM), pemantauan wali kelas, validasi absensi wali kelas, serta portal pemantauan transparan untuk Wali Murid.

---

## 🛠️ Fitur Utama

### 1. 📋 Manajemen Kehadiran Multi-Level (Guru & Wali Kelas)
* **Pencatatan Harian (Guru/Admin)**: Absensi siswa realtime (Hadir, Izin, Sakit, Alfa).
* **Validasi Wali Kelas**: Absensi yang sudah di-input oleh guru membutuhkan proses 'Validasi' dan 'Persetujuan' (Approve) secara spesifik oleh wali kelas yang ditempatkan pada kelas tersebut, sebelum datanya dapat dilihat oleh Wali Murid.

### 2. 📝 KKM Pintar & Evaluasi (NilaiView)
* Pengaturan nilai dan indikator warna secara dinamis yang mempermudah identifikasi status kelulusan siswa (Tuntas/Belum Tuntas) pada suatu mata pelajaran.

### 3. 📊 Dashboard Rekapitulasi (RekapView)
* Visualisasi grafik sebaran ketuntasan dan kehadiran siswa per kelas per semester.

### 4. 👨‍👩‍👦 Portal Pemantauan Wali Murid
* Akun unik untuk setiap orang tua / wali murid guna secara aman memantau kelas khusus tempat anak mereka dididik.
* Menampilkan *Hanya* data absensi (Log validasi, akumulasi ketidakhadiran) yang *sudah sepenuhnya disetujui (Approved)* oleh Wali Kelas. Menyajikan tabel absensi yang interaktif.

### 5. 👥 Panel Administratif & Manajemen Pengguna (AdminView)
* Membuat, mengubah, dan menghapus akun (Guru, Admin, dan Wali Murid).
* Menentukan tugas dinamis: *Assign* akun guru menjadi wali kelas pada kelas spesifik, dan *Assign* akun wali murid ke ruang kelas spesifik.
* Migrasi dan status angkatan: Mengelola kelulusan dan promosi kenaikan kelas secara massal.

---

## 🧱 Arsitektur Sistem & Direktori Kode

Aplikasi ini menggunakan arsitektur **Full-Stack SPA terpadu (Express.js + React.js/Vite)** berjalan pada port `3000`.

**Struktur Folder & Pemeliharaan Untuk Pemula/Developer Baru:**
* `/server/db.ts`: Inisialisasi **SQLite lokal**, pembuatan Tabel (DDL), dan Seeding akun awal (Seed data). Jika ingin menambah field pangkalan data, tambahkan pada file ini, lalu tambahkan *fallback* eksekusi `ALTER TABLE` agar tidak wajib *wipe-out* / `reset` berkas database saat ini.
* `/server/routes.ts`: **Core Backend API Router**. Seluruh rute otentikasi (Encrypted Cookies/Iron Session + Bcrypt Auth), Rate Limiters (mencegah *bruteforce* spamming), dan Endpoint Manajemen CRUD (Create, Read, Update, Delete) ada di sini. Gunakan utilitas fungsi pembantu database global: `dbRun`, `dbGet`, dan `dbAll`.
* `/src/App.tsx`: **Core Router Client-Side (React)**. Mengelola state manajemen untuk status masuk (Login), session, serta mengatur tata letak tab navigasi (Navbar App) berdasarkan identitas *Role/Peran* pengguna (`admin`, `guru`, `wali_murid`).
* `/src/views/...`: Repositori setiap Tampilan Halaman (Page View Component) yang dikelompokkan secara rapi dan modular berdasarkan fungsionalitas aktor (`/admin`, `/guru`, `/wali-kelas`, `/wali-murid`, `/common`) demi pemeliharaan kode yang optimal.
* `/src/types.ts`: Kumpulan defenisi *Interfaces Struct* Global untuk konsistensi aliran Object TypeScript dari API sampai Client Render.

---

## 🔐 Pemutakhiran Keamanan Akses & Autentikasi (Zero-Trust Security)

Aplikasi memiliki perlindungan internal modern:
* **Encrypted Cookies (Iron Session)**: Semua sesi pengguna diproteksi dengan cookie terenkripsi yang aman (menghindari kerentanan berbasis token pada storage client-side).
* **Bcrypt Password Hash Auto-Upgrade**: Basis data SiGup bermigrasi dari teks mentah ke `bcrypt` cryptographically secure password otomatis (seamless hashing) di latar belakang (Background) ketika pengguna sukses otentikasi pertama kalinya. Terdapat mitigasi kerentanan *SQL Injection/Bruteforce* serta pencegahan eksfiltrasi hash *Rainbow Database*.
* **Limitasi Kecepatan Mutasi (Rate-Limiter / Anti-Spam)**: Panggilan API `login`, mutasi *password*, dan form-post dipayungi oleh limitator IP/Session agar server tak mudah lumpuh *DDoS Auth* maupun serangan kamus kata sandi otomatis (Automated credential stuffing).

---

## ⚙️ Panduan Menjalankan Aplikasi

### 1. Syarat Sistem
* Node.js v18 atau v20+
* NPM v9+

### 2. Konfigurasi Variabel Lingkungan
Salin file `.env.example` ke `.env` untuk inisialisasi lingkungan lokal:

```bash
cp .env.example .env
```

### 3. Instalasi Dependensi
Unduh seluruh dependensi paket Node:
```bash
npm install
```

### 4. Menjalankan Server Pengembangan (Development - HMR+Nodemon Emulator)
```bash
npm run dev
```
Akses UI aplikasi di: `http://localhost:3000`. Jika mengubah kode `server/*.ts`, Nodemon atau pengamat build otomatis akan bereaksi.

### 5. Deployment / Produksi (Production Build)
Sistem otomatis menyatukan SPA Vite dalam *Express Static File Serve* untuk kontainer Cloud Run atau Docker Deployment lokal.
```bash
npm run build
npm start
```
