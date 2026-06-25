import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export function useSpreadsheetImport(onSuccess?: () => void) {
  const [selectedClassForImport, setSelectedClassForImport] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ nis: string; nama: string; jenis_kelamin: string }>>([]);
  const [parsedSiswaList, setParsedSiswaList] = useState<Array<{ nis: string; nama: string; jenis_kelamin: string }>>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportStatus({ type: '', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ab = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(ab), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to 2D array
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length < 2) {
          setImportStatus({
            type: 'error',
            message: 'Spreadsheet tidak boleh kosong dan harus memiliki header kolom di baris pertama.'
          });
          return;
        }

        // Find header row or look for standard headers
        const headerRow = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const nisIdx = headerRow.findIndex((h: string) => h.includes('nis') || h.includes('nomor induk') || h.includes('id'));
        const namaIdx = headerRow.findIndex((h: string) => h.includes('nama') || h.includes('name'));
        const jkIdx = headerRow.findIndex((h: string) => h.includes('jenis') || h.includes('kelamin') || h.includes('jk') || h.includes('gender'));

        if (nisIdx === -1 || namaIdx === -1) {
          setImportStatus({
            type: 'error',
            message: 'Kolom spreadsheet tidak valid. Harus memiliki header kolom "NIS" dan "Nama".'
          });
          return;
        }

        const previewList: typeof csvPreview = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          
          const nis = String(row[nisIdx] || '').trim();
          const nama = String(row[namaIdx] || '').trim();
          let jk = String(row[jkIdx] || 'L').trim();
          
          if (!nis || !nama) continue;
          
          jk = jk.toUpperCase().startsWith('P') || jk.toLowerCase().includes('perempuan') ? 'P' : 'L';
          previewList.push({ nis, nama, jenis_kelamin: jk });
        }

        if (previewList.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'Tidak ada data siswa valid di baris berikutnya.'
          });
        } else {
          setParsedSiswaList(previewList);
          setCsvPreview(previewList.slice(0, 5)); // show first 5 preview rows
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Gagal membaca file spreadsheet: ${err.message}`
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadCSV = async () => {
    if (!selectedClassForImport) {
      setImportStatus({ type: 'error', message: 'Pilih kelas tujuan terlebih dahulu.' });
      return;
    }
    if (parsedSiswaList.length === 0) {
      setImportStatus({ type: 'error', message: 'Data spreadsheet kosong atau tidak valid.' });
      return;
    }

    setImportStatus({ type: '', message: 'Sedang mengimpor data...' });
    
    try {
      const saved = sessionStorage.getItem('simibu_user');
      let token = '';
      if (saved) {
        const u = JSON.parse(saved);
        token = u?.token || '';
      }

      const res = await fetch(`/api/import-siswa/${selectedClassForImport}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          kelas_id: Number(selectedClassForImport),
          siswa: parsedSiswaList
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal mengimpor siswa.');
      }

      const data = await res.json();
      setImportStatus({
        type: 'success',
        message: data.message || `Berhasil mengimpor ${parsedSiswaList.length} data siswa ke kelas tersebut.`
      });
      setCsvFile(null);
      setParsedSiswaList([]);
      setCsvPreview([]);
      
      if (onSuccess) onSuccess();

    } catch (e: any) {
      setImportStatus({
        type: 'error',
        message: e.message
      });
    }
  };

  const downloadSampleCSV = () => {
    // ============================================================================
    // UNDUH FORMAT EXCEL TEMPLATE (.xlsx) UNTUK SISWA
    // Maksud Bisnis: Menghasilkan berkas template spreadsheet berformat .xlsx (Excel)
    // asli agar memudahkan admin menginput data siswa dengan kolom yang sudah terstandarisasi.
    //
    // Aliran Data:
    // - Input: Array of Objects berisi kolom template (NIS, Nama Lengkap, Jenis Kelamin).
    // - Output: File biner .xlsx yang otomatis diunduh oleh browser pengguna.
    // ============================================================================
    try {
      const data = [
        { "NIS": "12345", "Nama Lengkap": "Budi Santoso", "Jenis Kelamin": "L" },
        { "NIS": "12346", "Nama Lengkap": "Siti Aminah", "Jenis Kelamin": "P" }
      ];

      // Buat worksheet baru dari objek JSON
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Buat workbook baru
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format Impor Siswa");

      // Tulis workbook menjadi array buffer biner
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Buat blob biner bertipe data spreadsheet openxml
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Buat tautan unduhan dinamis
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "format_impor_siswa.xlsx");
      document.body.appendChild(link);
      link.click();
      
      // Bersihkan elemen tautan dari dokumen
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Gagal membuat template Excel:', error);
    }
    // === AKHIR DARI LOGIKA UNDUH TEMPLATE EXCEL ===
  };

  return {
    selectedClassForImport, setSelectedClassForImport,
    csvFile, setCsvFile,
    csvPreview, setCsvPreview,
    parsedSiswaList, setParsedSiswaList,
    importStatus, setImportStatus,
    handleFileChange, handleUploadCSV, downloadSampleCSV
  };
}
