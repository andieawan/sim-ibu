# 📱 Panduan Konversi Aplikasi SiGup ke Android Native dengan Capacitor

Sistem web **SiGup (Sistem Guru Pintar)** ini telah kami siapkan sepenuhnya agar dapat dikonversi menjadi aplikasi Android Native menggunakan **Capacitor**. Semua dependency utama (`@capacitor/core`, `@capacitor/cli`, dan `@capacitor/android`) beserta file konfigurasi `capacitor.config.json` telah berhasil dipasang di project Anda.

Berikut adalah panduan lengkap cara melakukan konversi ke APK baik menggunakan metode **Remote Web App** (Sangat Direkomendasikan untuk Full-stack) maupun **Local Client Asset**.

---

## 🛠️ Persiapan Awal di Komputer Anda (Lokal)

Sebelum mulai, pastikan komputer lokal Anda sudah terpasang:
1. **Node.js** (v18 ke atas)
2. **Android Studio** dan **Android SDK**
3. **Java Development Kit (JDK)** (Biasanya JDK 17 direkomendasikan untuk Gradle modern)

---

## 🚀 Jalur 1: Metode Hybrid Remote Wrapper (Sangat Direkomendasikan)

Karena aplikasi SiGup dirancang sebagai aplikasi full-stack (memiliki Node.js backend dan basis data SQLite `sekolah.db` di server), metode paling praktis dan stabil adalah mengarahkannya ke server cloud aktif Anda. Dengan metode ini, pembaruan aplikasi web akan otomatis terupdate di dalam aplikasi HP tanpa harus melakukan build ulang APK!

### Langkah-Langkah:

1. **Unduh Kode Sumber**
   Ekspor project Anda dari Google AI Studio sebagai **ZIP** atau hubungkan ke **GitHub**, lalu unduh (clone) ke folder komputer lokal Anda.

2. **Atur URL Server Aktif**
   Buka file `/capacitor.config.json` di komputer Anda, tambahkan properti `"url"` di dalam blok `"server"`. Contoh:
   ```json
   {
     "appId": "com.sigup.app",
     "appName": "SiGup - Sistem Guru Pintar",
     "webDir": "dist",
     "server": {
       "url": "https://ais-pre-36l33zcyea34gey64uy2fg-621027569204.asia-east1.run.app",
       "androidScheme": "https",
       "allowNavigation": [
         "ais-pre-36l33zcyea34gey64uy2fg-621027569204.asia-east1.run.app",
         "ais-dev-36l33zcyea34gey64uy2fg-621027569204.asia-east1.run.app"
       ]
     }
   }
   ```
   *(Ganti URL di atas dengan domain produksi permanen Anda jika sudah dideploy secara publik).*

3. **Inisialisasi Project Android**
   Buka terminal di folder project Anda di komputer, lalu jalankan perintah:
   ```bash
   # Install semua dependency di lokal
   npm install

   # Jalankan build frontend
   npm run build

   # Tambahkan platform Android native
   npx cap add android

   # Sinkronisasi konfigurasi ke folder Android
   npx cap sync
   ```

4. **Buka di Android Studio & Build APK**
   Jalankan perintah ini untuk membuka project langsung di Android Studio:
   ```bash
   npx cap open android
   ```
   - Tunggu proses Gradle Sync selesai di Android Studio.
   - Klik menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** untuk membuat file APK siap instal.

---

## 📦 Jalur 2: Metode Local Client Asset (Aplikasi Offline Terpaket)

Jika Anda ingin aplikasi bekerja secara lokal menggunakan file HTML, CSS, dan JS yang terbundel langsung ke dalam APK:

### Langkah-Langkah:

1. Pastikan properti `"url"` **tidak ada** atau dihapus dari `/capacitor.config.json` Anda agar dia meload file lokal dari folder `dist`:
   ```json
   {
     "appId": "com.sigup.app",
     "appName": "SiGup - Sistem Guru Pintar",
     "webDir": "dist"
   }
   ```
2. **Sesuaikan Alamat API (PENTING)**
   Buka kode React Anda (frontend). Karena aplikasi tidak lagi berjalan di domain yang sama dengan server Node.js, pastikan semua pemanggilan endpoint fetch (`/api/...`) diarahkan ke URL server penuh (misal: `https://domain-server-anda.com/api/...`), bukan lagi relative path.
3. Jalankan rangkaian perintah berikut di terminal lokal Anda:
   ```bash
   npm install
   npm run build
   npx cap add android
   npx cap sync
   npx cap open android
   ```
4. Di Android Studio, jalankan aplikasi di HP atau emulator, atau buat APK melalui menu **Build > Build APK**.

---

## 💡 Tips Tambahan untuk Aplikasi Android Native

* **Mengaktifkan Fitur Kamera & File (Izin Aplikasi):**
  Aplikasi SiGup memiliki fitur seperti Import CSV. Agar pengguna bisa menginput file dari HP mereka, pastikan file `AndroidManifest.xml` (berada di folder `android/app/src/main/AndroidManifest.xml`) memuat izin akses media:
  ```xml
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  ```
* **Splash Screen & App Icon:**
  Anda bisa membuat ikon aplikasi premium dan layar splash menggunakan library pembantu Capacitor-Assets. Cukup siapkan file `icon.png` dan `splash.png` di folder aset, lalu jalankan:
  ```bash
  npx cordova-res android --skip-config --copy
  ```

Aplikasi Anda kini siap melangkah ke Google Play Store! 🚀
