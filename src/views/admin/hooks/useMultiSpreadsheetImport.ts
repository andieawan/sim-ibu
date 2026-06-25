import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// ============================================================================
// HOOK MULTI SPREADSHEET IMPORT (GURU, JADWAL, & WALI KELAS)
// Maksud Bisnis: Memproses file Excel/XLSX/CSV secara terpisah untuk mempermudah
// admin menginput data Guru, Jadwal Pelajaran, dan Wali Kelas secara massal.
//
// Aliran Data:
// - Input: Berkas biner .xlsx / .csv yang diunggah pengguna.
// - Proses: Membaca berkas biner di sisi klien, memetakan header kolom, 
//   menyajikan 5 baris pertama untuk pratinjau (Preview), dan mengirimkan 
//   data JSON lengkap ke API backend terkait.
// - Output: Log status sukses/gagal proses impor massal tersebut.
// ============================================================================

export function useMultiSpreadsheetImport(
  onGuruSuccess?: () => void,
  onJadwalSuccess?: () => void,
  onWaliSuccess?: () => void
) {
  // --- 1. STATE & HANDLER UNTUK GURU ---
  const [guruFile, setGuruFile] = useState<File | null>(null);
  const [guruPreview, setGuruPreview] = useState<Array<any>>([]);
  const [parsedGuruList, setParsedGuruList] = useState<Array<any>>([]);
  const [guruImportStatus, setGuruImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const handleGuruFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGuruFile(file);
    setGuruImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ab = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(ab), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setGuruImportStatus({
            type: 'error',
            message: 'Spreadsheet guru tidak boleh kosong dan harus memiliki header kolom.'
          });
          return;
        }

        // Deteksi header kolom
        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const namaIdx = headerRow.findIndex((h: string) => h.includes('nama') || h.includes('lengkap'));
        const usernameIdx = headerRow.findIndex((h: string) => h.includes('username') || h.includes('user'));
        const passwordIdx = headerRow.findIndex((h: string) => h.includes('password') || h.includes('sandi'));
        const roleIdx = headerRow.findIndex((h: string) => h.includes('role') || h.includes('kewenangan'));
        const nipIdx = headerRow.findIndex((h: string) => h.includes('nip') || h.includes('nomor induk'));
        const jabatanIdx = headerRow.findIndex((h: string) => h.includes('jabatan') || h.includes('posisi'));

        if (namaIdx === -1 || usernameIdx === -1) {
          setGuruImportStatus({
            type: 'error',
            message: 'Kolom tidak valid. Minimal harus memiliki header "Nama Lengkap" dan "Username".'
          });
          return;
        }

        const previewList: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const nama = String(row[namaIdx] || '').trim();
          const username = String(row[usernameIdx] || '').trim();
          const password = passwordIdx !== -1 ? String(row[passwordIdx] || '').trim() : 'guru123';
          const role = roleIdx !== -1 ? String(row[roleIdx] || '').trim().toLowerCase() : 'guru';
          const nip = nipIdx !== -1 ? String(row[nipIdx] || '').trim() : '';
          const jabatan = jabatanIdx !== -1 ? String(row[jabatanIdx] || '').trim() : '';

          if (!nama || !username) continue;

          previewList.push({ nama, username, password, role, nip, jabatan });
        }

        if (previewList.length === 0) {
          setGuruImportStatus({ type: 'error', message: 'Tidak ada data guru valid yang terbaca.' });
        } else {
          setParsedGuruList(previewList);
          setGuruPreview(previewList.slice(0, 5));
        }
      } catch (err: any) {
        setGuruImportStatus({ type: 'error', message: `Gagal membaca file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadGuru = async () => {
    if (parsedGuruList.length === 0) {
      setGuruImportStatus({ type: 'error', message: 'Data guru kosong atau tidak valid.' });
      return;
    }
    setGuruImportStatus({ type: '', message: 'Sedang mengunggah data guru...' });

    try {
      const res = await fetch('/api/import-guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedGuruList })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor guru.');

      setGuruImportStatus({ type: 'success', message: data.message });
      setGuruFile(null);
      setParsedGuruList([]);
      setGuruPreview([]);

      if (onGuruSuccess) onGuruSuccess();
    } catch (e: any) {
      setGuruImportStatus({ type: 'error', message: e.message });
    }
  };

  const downloadSampleGuruExcel = () => {
    try {
      const data = [
        { "Nama Lengkap": "Drs. Hermawan M.Pd", "Username": "hermawan", "Password": "password123", "Role": "guru", "NIP": "197508112003121001", "Jabatan": "Wakasek Kurikulum" },
        { "Nama Lengkap": "Siti Rahayu S.Pd", "Username": "sitirahayu", "Password": "password123", "Role": "guru", "NIP": "198304022009042002", "Jabatan": "Kepala Laboratorium" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Impor Guru");
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "format_impor_guru.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error(error);
    }
  };


  // --- 2. STATE & HANDLER UNTUK JADWAL ---
  const [jadwalFile, setJadwalFile] = useState<File | null>(null);
  const [jadwalPreview, setJadwalPreview] = useState<Array<any>>([]);
  const [parsedJadwalList, setParsedJadwalList] = useState<Array<any>>([]);
  const [jadwalImportStatus, setJadwalImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const handleJadwalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJadwalFile(file);
    setJadwalImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ab = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(ab), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setJadwalImportStatus({
            type: 'error',
            message: 'Spreadsheet jadwal tidak boleh kosong.'
          });
          return;
        }

        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const kelasIdx = headerRow.findIndex((h: string) => h.includes('kelas') || h.includes('nama kelas'));
        const guruIdx = headerRow.findIndex((h: string) => h.includes('guru') || h.includes('username guru'));
        const matpelIdx = headerRow.findIndex((h: string) => h.includes('pelajaran') || h.includes('matpel') || h.includes('mata pelajaran'));
        const hariIdx = headerRow.findIndex((h: string) => h.includes('hari'));
        const mulaiIdx = headerRow.findIndex((h: string) => h.includes('mulai') || h.includes('waktu mulai'));
        const selesaiIdx = headerRow.findIndex((h: string) => h.includes('selesai') || h.includes('waktu selesai'));

        if (kelasIdx === -1 || guruIdx === -1 || matpelIdx === -1) {
          setJadwalImportStatus({
            type: 'error',
            message: 'Kolom tidak lengkap. Wajib memiliki header: "Nama Kelas", "Username Guru", "Mata Pelajaran".'
          });
          return;
        }

        const previewList: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const nama_kelas = String(row[kelasIdx] || '').trim();
          const username_guru = String(row[guruIdx] || '').trim();
          const mata_pelajaran = String(row[matpelIdx] || '').trim();
          const hari = hariIdx !== -1 ? String(row[hariIdx] || 'Senin').trim() : 'Senin';
          const waktu_mulai = mulaiIdx !== -1 ? String(row[mulaiIdx] || '07:30').trim() : '07:30';
          const waktu_selesai = selesaiIdx !== -1 ? String(row[selesaiIdx] || '09:00').trim() : '09:00';

          if (!nama_kelas || !username_guru || !mata_pelajaran) continue;

          previewList.push({ nama_kelas, username_guru, mata_pelajaran, hari, waktu_mulai, waktu_selesai });
        }

        if (previewList.length === 0) {
          setJadwalImportStatus({ type: 'error', message: 'Tidak ada data jadwal valid yang terbaca.' });
        } else {
          setParsedJadwalList(previewList);
          setJadwalPreview(previewList.slice(0, 5));
        }
      } catch (err: any) {
        setJadwalImportStatus({ type: 'error', message: `Gagal membaca file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadJadwal = async () => {
    if (parsedJadwalList.length === 0) {
      setJadwalImportStatus({ type: 'error', message: 'Data jadwal kosong.' });
      return;
    }
    setJadwalImportStatus({ type: '', message: 'Sedang mengunggah jadwal...' });

    try {
      const res = await fetch('/api/import-jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: parsedJadwalList })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengimpor jadwal.');

      setJadwalImportStatus({ type: 'success', message: data.message });
      setJadwalFile(null);
      setParsedJadwalList([]);
      setJadwalPreview([]);

      if (onJadwalSuccess) onJadwalSuccess();
    } catch (e: any) {
      setJadwalImportStatus({ type: 'error', message: e.message });
    }
  };

  const downloadSampleJadwalExcel = () => {
    try {
      const data = [
        { "Nama Kelas": "X DKV 1", "Username Guru": "guru", "Mata Pelajaran": "Dasar Desain Grafis", "Hari": "Senin", "Waktu Mulai": "07:30", "Waktu Selesai": "09:00" },
        { "Nama Kelas": "X DKV 1", "Username Guru": "guru", "Mata Pelajaran": "Komposisi Foto", "Hari": "Senin", "Waktu Mulai": "09:15", "Waktu Selesai": "10:45" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Impor Jadwal");
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "format_impor_jadwal.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error(error);
    }
  };


  // --- 3. STATE & HANDLER UNTUK WALI KELAS ---
  const [waliFile, setWaliFile] = useState<File | null>(null);
  const [waliPreview, setWaliPreview] = useState<Array<any>>([]);
  const [parsedWaliList, setParsedWaliList] = useState<Array<any>>([]);
  const [waliImportStatus, setWaliImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const handleWaliFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWaliFile(file);
    setWaliImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ab = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(ab), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setWaliImportStatus({
            type: 'error',
            message: 'Spreadsheet wali kelas tidak boleh kosong.'
          });
          return;
        }

        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const kelasIdx = headerRow.findIndex((h: string) => h.includes('kelas') || h.includes('nama kelas'));
        const waliIdx = headerRow.findIndex((h: string) => h.includes('wali') || h.includes('username wali') || h.includes('username'));

        if (kelasIdx === -1 || waliIdx === -1) {
          setWaliImportStatus({
            type: 'error',
            message: 'Kolom tidak lengkap. Wajib memiliki header: "Nama Kelas" dan "Username Wali Kelas".'
          });
          return;
        }

        const previewList: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const nama_kelas = String(row[kelasIdx] || '').trim();
          const username_guru = String(row[waliIdx] || '').trim();

          if (!nama_kelas || !username_guru) continue;

          previewList.push({ nama_kelas, username_guru });
        }

        if (previewList.length === 0) {
          setWaliImportStatus({ type: 'error', message: 'Tidak ada data wali kelas valid yang terbaca.' });
        } else {
          setParsedWaliList(previewList);
          setWaliPreview(previewList.slice(0, 5));
        }
      } catch (err: any) {
        setWaliImportStatus({ type: 'error', message: `Gagal membaca file: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadWali = async () => {
    if (parsedWaliList.length === 0) {
      setWaliImportStatus({ type: 'error', message: 'Data wali kelas kosong.' });
      return;
    }
    setWaliImportStatus({ type: '', message: 'Sedang mengunggah pemetaan wali kelas...' });

    try {
      const res = await fetch('/api/import-walikelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walikelas: parsedWaliList })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memetakan wali kelas.');

      setWaliImportStatus({ type: 'success', message: data.message });
      setWaliFile(null);
      setParsedWaliList([]);
      setWaliPreview([]);

      if (onWaliSuccess) onWaliSuccess();
    } catch (e: any) {
      setWaliImportStatus({ type: 'error', message: e.message });
    }
  };

  const downloadSampleWaliExcel = () => {
    try {
      const data = [
        { "Nama Kelas": "X DKV 1", "Username Wali Kelas": "guru" },
        { "Nama Kelas": "XI DKV 1", "Username Wali Kelas": "hermawan" }
      ];
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Wali Kelas");
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "format_impor_walikelas.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error(error);
    }
  };

  return {
    guruFile, setGuruFile, guruPreview, setGuruPreview, parsedGuruList, setParsedGuruList, guruImportStatus, setGuruImportStatus, handleGuruFileChange, handleUploadGuru, downloadSampleGuruExcel,
    jadwalFile, setJadwalFile, jadwalPreview, setJadwalPreview, parsedJadwalList, setParsedJadwalList, jadwalImportStatus, setJadwalImportStatus, handleJadwalFileChange, handleUploadJadwal, downloadSampleJadwalExcel,
    waliFile, setWaliFile, waliPreview, setWaliPreview, parsedWaliList, setParsedWaliList, waliImportStatus, setWaliImportStatus, handleWaliFileChange, handleUploadWali, downloadSampleWaliExcel
  };
}
