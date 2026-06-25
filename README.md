# SIM-IBU (Sistem Informasi dan Manajemen - SMKS Islam Bustanul Ulum) 🏫🎓

Sistem Informasi Manajemen modern berskala produksi (Production-Ready) yang dirancang khusus untuk memonitor, mencatat, dan merekapitulasi administrasi kesiswaan (absensi, nilai, profil siswa) di SMKS Islam Bustanul Ulum. Aplikasi ini mendukung arsitektur multi-peran, multi-engine database, serta didukung oleh performa PWA mobile-first dan optimasi layar sentuh (touch-first) yang ultra-responsif.

---

## 📌 Deskripsi Proyek

**SIM-IBU** (Sistem Informasi Monitor Ibu) v2.2.0-STABLE adalah solusi satu pintu bagi Guru, Wali Kelas, Wali Murid, dan Administrator untuk mengelola kegiatan belajar mengajar secara transparan, aman, dan real-time. Dengan desain antarmuka adaptif (Auto Light/Dark Mode), sistem ini dapat diakses secara optimal dari perangkat desktop maupun telepon pintar (smartphone) sebagai aplikasi Progressive Web App (PWA) mandiri.

---

## 🛠️ Fitur-Fitur Utama (SIM-IBU v2.2.0-STABLE)

### 1. 📋 Manajemen Absensi & Kehadiran Multi-Level
* **Pencatatan Real-time (Guru Pengajar)**: Input presensi harian siswa langsung dari kelas (Hadir, Sakit, Izin, Alfa).
* **Validasi Wali Kelas**: Absensi yang dimasukkan oleh guru memerlukan proses verifikasi dan persetujuan (approval) oleh wali kelas bersangkutan sebelum dipublikasikan ke wali murid.
* **Toleransi & Riwayat Kronologis**: Riwayat kehadiran yang runtut dengan detail tanggal dan pencatat.

### 2. 📝 Pengelolaan Nilai & Evaluasi KKM Pintar
* **Kalkulasi Ketuntasan Otomatis**: Penilaian tugas/kuis/ujian langsung dinilai terhadap Kriteria Ketuntasan Minimal (KKM).
* **Indikator Visual Dinamis**: Warna khusus yang kontras tinggi secara otomatis membedakan siswa yang "Tuntas" (Hijau) dan "Remedial/Belum Tuntas" (Merah), ramah dibaca di tema terang maupun gelap.

### 3. 🔍 Kartu Detail Profil Siswa Komprehensif (Terbaru)
* **Aksesibilitas Universal**: Klik nama siswa dari halaman mana pun (Guru, Rekap, Wali Kelas, Wali Murid) untuk memunculkan panel rincian interaktif.
* **Rangkuman Biodata**: Menampilkan NIS, nama lengkap, foto, alamat, dan nomor kontak darurat.
* **Statistik Visual**: Grafik lingkaran sebaran absensi dan grafik pencapaian nilai KKM harian.

### 4. 📊 Dashboard Rekapitulasi & Statistik (D3 / Recharts)
* **Grafik Interaktif**: Analisis sebaran tingkat kelulusan KKM per mata pelajaran dan grafik batang tingkat kehadiran bulanan.
* **Ekspor & Cetak**: Siap dikonversi untuk pelaporan administrasi sekolah.

### 5. 👥 Panel Administratif (Admin Control Room)
* **Manajemen Pengguna (CRUD)**: Pembuatan, pembaruan, dan penghapusan akun Guru, Wali Kelas, Wali Murid, dan Administrator.
* **Sistem Penugasan Dinamis**: Menugaskan akun guru ke kelas spesifik sebagai Wali Kelas, serta menghubungkan akun Wali Murid ke data siswa anak mereka.
* **Promosi Kelas & Kelulusan**: Memungkinkan kenaikan kelas secara massal atau kelulusan angkatan dalam beberapa klik.

### 6. 📱 Optimasi Layar Sentuh & Dukungan PWA (Touch-First)
* **A2HS (Add to Home Screen)**: Aplikasi dapat langsung diinstal ke beranda Android, iOS, maupun Desktop PC dengan Service Worker terintegrasi.
* **Area Sentuh Standard 44px**: Menjamin akurasi sentuhan tanpa salah pencet saat digunakan dengan satu tangan di layar ponsel.
* **Tanpa Stuck Hover**: Menghapus efek kursor tertahan (stuck hover) pada perangkat mobile.
* **Umpan Balik Taktil (Active State Scale)**: Efek mikro-skala instan saat tombol ditap untuk simulasi tombol fisik yang nyata.

---

## 🛡️ Keamanan & Arsitektur Kelas Enterprise (Zero-Trust)

* **Multi-Engine Database Wrapper (Factory Pattern)**: Menggunakan abstraksi query pintar yang secara dinamis beralih sesuai nilai konfigurasi environment antara **SQLite (Lokal)**, **MySQL (Produksi)**, atau **PostgreSQL**.
* **Sesi Terenkripsi (Iron Session / Express Session)**: Token sesi aman disimpan di sisi server dan dikirimkan lewat cookie terenkripsi untuk mencegah eksploitasi XSS/CSRF.
* **Seamless Bcrypt Hashing**: Enkripsi sandi satu arah yang kuat, secara otomatis meng-upgrade hash kata sandi lama saat pertama kali login tanpa mengganggu alur kerja pengguna.
* **Rate Limiter & DDoS Protection**: Melindungi endpoint sensitif (login, reset sandi, post nilai) dari serangan bruteforce.

---

## ⚙️ Sistem Kebutuhan (System Requirements)

### 1. Perangkat Lunak (Software)
* **Runtime**: Node.js v18.x atau v20.x atau versi di atasnya (Rekomendasi LTS).
* **Package Manager**: NPM v9.x atau v10.x.
* **Browser**: Chrome, Safari, Edge, Firefox versi terbaru (Mendukung standar PWA dan media query `prefers-color-scheme`).

### 2. Database Pendukung (Disesuaikan via `.env`)
* **Pengembangan (Development)**: SQLite3 (Tanpa instalasi server tambahan, otomatis menghasilkan file `sekolah.db`).
* **Produksi (Production)**: MySQL v8.0+ ATAU PostgreSQL v14.0+.

---

## 🚀 Panduan Instalasi & Cara Menjalankan

Ikuti langkah-langkah di bawah ini untuk memasang SIM-IBU di lingkungan lokal Anda:

### Langkah 1: Kloning & Masuk ke Direktori
```bash
git clone <url_repositori_anda>
cd <nama_direktori_proyek>
```

### Langkah 2: Konfigurasi Variabel Lingkungan (`.env`)
Salin berkas contoh konfigurasi yang disediakan:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan parameter berikut:
```env
PORT=3000
NODE_ENV=development

# Pilihan DB_TYPE: sqlite, mysql, postgresql
DB_TYPE=sqlite
DB_FILE=sekolah.db

# Kunci Keamanan Sesi (Minimal 32 karakter)
SESSION_SECRET=ganti_dengan_kunci_rahasia_dan_panjang_anda
```

### Langkah 3: Instalasi Dependensi Paket
Unduh dan pasang semua dependensi npm yang dideklarasikan di `package.json`:
```bash
npm install
```

### Langkah 4: Jalankan Server Pengembangan (Development Mode)
Jalankan server Express beserta bundling aset Vite secara real-time:
```bash
npm run dev
```
Buka browser Anda dan akses halaman: `http://localhost:3000`.

### Langkah 5: Bangun Aplikasi untuk Produksi (Production Build)
Untuk merilis aplikasi di server produksi dengan kecepatan muat maksimal:
```bash
# Melakukan kompilasi React ke folder dist/ dan kompilasi backend Express ke server.cjs
npm run build

# Menjalankan aplikasi dalam mode produksi stabil
npm start
```

---

## 📂 Struktur Direktori Utama

* `/server.ts` - Entry point server Node/Express yang menangani perutean API dan mengintegrasikan middleware Vite.
* `/server/` - Berisi logika backend, perutean autentikasi, database wrapper, dan rate-limiter.
* `/src/App.tsx` - Gerbang utama sisi klien, mengontrol otentikasi sesi dan memisahkan navigasi sesuai peran pengguna.
* `/src/views/` - Halaman antarmuka pengguna yang dikelompokkan berdasarkan hak akses (`/admin`, `/guru`, `/wali-murid`).
* `/src/components/` - Komponen modular yang dapat digunakan kembali (PwaInstall, StudentDetailModal, ChangelogModal).
* `/src/index.css` - Lembar gaya utama yang mengkonfigurasi sistem Auto Light/Dark Mode serta optimasi layar sentuh.

---

### 🇮🇩 Catatan Pengembang & Hak Cipta
Aplikasi ini dikembangkan dengan standar tinggi dan dipelihara secara berkala demi kemajuan pendidikan digital di SMKS Islam Bustanul Ulum.
* **SIM-IBU v2.2.0-STABLE** &bull; Hak Cipta &copy; 2026 SMKS Islam Bustanul Ulum. All Rights Reserved.
