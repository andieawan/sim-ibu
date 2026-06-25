import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Users, Key, Plus, Trash2, Shield, Settings, Database, 
  RotateCcw, CheckCircle2, ShieldAlert, Edit, Save, X, 
  GraduationCap, Layers, Search, UserCheck, Upload, Download, Info, Calendar,
  Activity, Cpu, Wrench
} from 'lucide-react';

import AdminUsersTab from './tabs/AdminUsersTab';
import AdminCatalogTab from './tabs/AdminCatalogTab';
import AdminUploadTab from './tabs/AdminUploadTab';
import AdminJadwalTab from './tabs/AdminJadwalTab';
import AdminSystemTab from './tabs/AdminSystemTab';

import * as XLSX from 'xlsx';
import { Kelas, Siswa, Pengguna, Jadwal } from '../../types';
import { useSpreadsheetImport } from './hooks/useSpreadsheetImport';

interface AdminViewProps {
  classes: Kelas[];
  onRefreshClasses: () => Promise<void>;
  currentUser: Pengguna;
  onNavigateToTab: (tab: string, classId?: number) => void;
}

interface AdminUser {
  id: number;
  username: string;
  nama: string;
  role: 'admin' | 'guru' | 'wali_murid';
  kelas_id?: number | null;
  nama_siswa?: string;
  nama_kelas?: string;
}

export default function AdminView({ classes, onRefreshClasses, currentUser, onNavigateToTab }: AdminViewProps) {
  const [adminTab, setAdminTab] = useState<'users' | 'catalog' | 'upload' | 'jadwal' | 'system'>('users');
  const [schedViewMode, setSchedViewMode] = useState<'grid' | 'flat'>('grid');
  const [schedSearchQuery, setSchedSearchQuery] = useState('');
  
  const {
    selectedClassForImport, setSelectedClassForImport,
    csvFile, setCsvFile,
    csvPreview, setCsvPreview,
    parsedSiswaList, setParsedSiswaList,
    importStatus, setImportStatus,
    handleFileChange, handleUploadCSV, downloadSampleCSV
  } = useSpreadsheetImport(() => fetchAllStudents());
  const exportStudentsToExcel = () => {
    try {
      if (filteredSiswa.length === 0) {
        alert('Tidak ada data siswa untuk diekspor.');
        return;
      }
      
      const exportData = filteredSiswa.map(s => {
        const cl = classes.find(c => c.id === s.kelas_id);
        return {
          "NIS": s.nis,
          "Nama Siswa": s.nama,
          "Jenis Kelamin": s.jenis_kelamin === 'L' ? 'L (Laki-laki)' : 'P (Perempuan)',
          "Kelas": cl ? cl.nama_kelas : 'Tanpa Kelas',
          "Sekolah": cl ? cl.sekolah : 'SMKS Islam Bustanul Ulum'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Siswa");
      
      // Auto-fit column widths
      const maxLens = Object.keys(exportData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...exportData.map(row => String((row as any)[key] || '').length)
        );
      });
      worksheet['!cols'] = maxLens.map(len => ({ wch: len + 3 }));

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      
      let filename = "daftar_siswa_sigup_all.xlsx";
      if (selectedClassFilter) {
        const targetClassObj = classes.find(c => String(c.id) === String(selectedClassFilter));
        if (targetClassObj) {
          filename = `daftar_siswa_${targetClassObj.nama_kelas.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Gagal mengekspor data: ${err.message}`);
    }
  };

  // User accounts list state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userErrorMsg, setUserErrorMsg] = useState('');

  // User form state (Add / Edit)
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState(''); // can be left empty in edit
  const [formNama, setFormNama] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'guru' | 'wali_murid'>('guru');
  const [formKelasId, setFormKelasId] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);

  // System stats
  const [stats, setStats] = useState<{
    classes: number;
    students: number;
    grades: number;
    attendance: number;
    users: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [systemAlert, setSystemAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // School identity states for administrator editing
  const [schoolIdentity, setSchoolIdentity] = useState({
    nama_sekolah: 'SMKS Islam Bustanul Ulum',
    motto: 'SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM',
    alamat: 'Jl. Pendidikan No. 45, Kecamatan Bojong',
    npsn: '12345678',
    kepala_sekolah: 'Drs. H. Ahmad Sudrajat, M.Pd',
    tahun_pelajaran: '2024/2025',
    semester: 'Ganjil'
  });
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [identityAlert, setIdentityAlert] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Search & Filter students list
  const [catalogSiswa, setCatalogSiswa] = useState<Siswa[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

  // Schedule management states
  const [schedules, setSchedules] = useState<Jadwal[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleAlert, setScheduleAlert] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  
  // Schedule edit states
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleDeleteConfirmId, setScheduleDeleteConfirmId] = useState<number | null>(null);

  // New schedule form state
  const [newSchedClassId, setNewSchedClassId] = useState('');
  const [newSchedGuruId, setNewSchedGuruId] = useState('');
  const [newSchedMatpel, setNewSchedMatpel] = useState('');
  const [newSchedHari, setNewSchedHari] = useState('Senin');
  const [newSchedMulai, setNewSchedMulai] = useState('07:30');
  const [newSchedSelesai, setNewSchedSelesai] = useState('09:00');

  // Patch and System Update states
  const [systemPatches, setSystemPatches] = useState<Array<{
    id: string;
    nama_patch: string;
    deskripsi: string;
    kategori: string;
    status: 'pending' | 'applied';
    applied_at: string | null;
  }>>([]);
  const [loadingPatches, setLoadingPatches] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    score: number;
    scanned_at: string;
    checks: Array<{
      komponen: string;
      status: 'sehat' | 'bermasalah' | 'rusak' | 'peringatan' | 'beban_tinggi';
      detail: string;
    }>;
  } | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [patchActionLoading, setPatchActionLoading] = useState<string | null>(null);
  const [patchAlert, setPatchAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPatch, setUploadingPatch] = useState(false);

  // State kustom untuk pembaruan codebase menyeluruh (.zip penuh)
  const [codebaseCheckResult, setCodebaseCheckResult] = useState<any>(null);
  const [uploadedBase64Zip, setUploadedBase64Zip] = useState<string>('');
  const [applyingCodebaseUpdate, setApplyingCodebaseUpdate] = useState(false);

  // ============================================================================
  // FUNGSI TERAPKAN PEMBARUAN CODEBASE (HOT-RELOAD SISTEM)
  // Maksud Bisnis: Mengirimkan string base64 ZIP penuh yang sudah tervalidasi ke backend
  // untuk diekstraksi ke direktori kerja aplikasi, memicu auto-restart server dev.
  //
  // Aliran Data:
  // - Input: `uploadedBase64Zip` (State kustom penampung data file zip).
  // - Output: Memperbarui semua file proyek secara real-time dan merestart halaman.
  // ============================================================================
  const handleApplyCodebaseUpdate = async () => {
    if (!uploadedBase64Zip) return;
    setApplyingCodebaseUpdate(true);
    setPatchAlert(null);
    try {
      const res = await fetch('/api/codebase/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: uploadedBase64Zip })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatchAlert({ 
          type: 'success', 
          message: data.message || 'Pembaruan codebase sukses! Sistem sedang merestart secara otomatis...' 
        });
        setCodebaseCheckResult(null);
        setUploadedBase64Zip('');
        // Berikan jeda agar server selesai reload, lalu segarkan browser pengguna
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setPatchAlert({ type: 'error', message: data.error || 'Gagal menerapkan pembaruan codebase.' });
      }
    } catch (err: any) {
      setPatchAlert({ type: 'error', message: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setApplyingCodebaseUpdate(false);
    }
  };

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await fetch('/api/jadwal');
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (e) {
      console.error('Error fetching schedules:', e);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleEditScheduleClick = (s: Jadwal) => {
    setEditingScheduleId(s.id);
    setNewSchedClassId(String(s.kelas_id));
    setNewSchedGuruId(String(s.guru_id));
    setNewSchedMatpel(s.mata_pelajaran);
    setNewSchedHari(s.hari);
    setNewSchedMulai(s.waktu_mulai);
    setNewSchedSelesai(s.waktu_selesai);
    setScheduleAlert({ type: '', message: '' });
  };

  const resetScheduleForm = () => {
    setEditingScheduleId(null);
    setNewSchedMatpel('');
    setNewSchedHari('Senin');
    setNewSchedMulai('07:30');
    setNewSchedSelesai('09:00');
    setScheduleAlert({ type: '', message: '' });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleAlert({ type: '', message: '' });

    if (!newSchedClassId || !newSchedGuruId || !newSchedMatpel.trim() || !newSchedHari || !newSchedMulai || !newSchedSelesai) {
      setScheduleAlert({ type: 'error', message: 'Semua kolom jadwal wajib diisi.' });
      return;
    }

    try {
      const isEdit = editingScheduleId !== null;
      const url = isEdit ? `/api/jadwal/${editingScheduleId}` : '/api/jadwal';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelas_id: parseInt(newSchedClassId),
          guru_id: parseInt(newSchedGuruId),
          mata_pelajaran: newSchedMatpel.trim(),
          hari: newSchedHari,
          waktu_mulai: newSchedMulai,
          waktu_selesai: newSchedSelesai
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setScheduleAlert({ 
          type: 'success', 
          message: isEdit ? 'Jadwal pelajaran berhasil diperbarui!' : 'Jadwal guru berhasil dipetakan ke kelas ini!' 
        });
        resetScheduleForm();
        fetchSchedules();
      } else {
        setScheduleAlert({ type: 'error', message: resData.error || 'Gagal menyimpan jadwal' });
      }
    } catch (err: any) {
      setScheduleAlert({ type: 'error', message: `Kesalahan: ${err.message}` });
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    setScheduleAlert({ type: '', message: '' });
    try {
      const response = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
      const resData = await response.json();
      if (response.ok) {
        setScheduleAlert({ type: 'success', message: 'Jadwal berhasil dihapus.' });
        fetchSchedules();
        setScheduleDeleteConfirmId(null);
      } else {
        setScheduleAlert({ type: 'error', message: resData.error || 'Gagal menghapus jadwal' });
      }
    } catch (err: any) {
      setScheduleAlert({ type: 'error', message: `Kesalahan: ${err.message}` });
    }
  };

  // Fetch administrator summary and accounts
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`,
          'X-User-Id': String(currentUser.id),
          'X-User-Role': currentUser.role
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        const firstGuru = data.find((u: any) => u.role === 'guru');
        if (firstGuru && !newSchedGuruId) {
          setNewSchedGuruId(String(firstGuru.id));
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSystemSummary = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/summary', {
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`,
          'X-User-Id': String(currentUser.id),
          'X-User-Role': currentUser.role
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAllStudents = async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch('/api/siswa-all');
      if (res.ok) {
        const sList = await res.json();
        setCatalogSiswa(sList);
      }
    } catch (e) {
      console.error('Error listing all students:', e);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchSchoolIdentity = async () => {
    setLoadingIdentity(true);
    try {
      const res = await fetch('/api/school-identity');
      if (res.ok) {
        const data = await res.json();
        setSchoolIdentity(data);
      }
    } catch (err) {
      console.error('Error fetching school identity:', err);
    } finally {
      setLoadingIdentity(false);
    }
  };

  // Fetch System Patches
  const fetchSystemPatches = async () => {
    setLoadingPatches(true);
    try {
      const res = await fetch('/api/patches');
      if (res.ok) {
        const data = await res.json();
        setSystemPatches(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch system patches:', err);
    } finally {
      setLoadingPatches(false);
    }
  };

  // Run System Diagnostics
  const runSystemDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const res = await fetch('/api/system/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (err: any) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  // Apply All Pending Patches
  const handleApplyAllPatches = async () => {
    const pendingPatches = systemPatches.filter(p => p.status === 'pending');
    if (pendingPatches.length === 0) return;

    setPatchActionLoading('ALL');
    setPatchAlert(null);
    let successCount = 0;
    let failCount = 0;

    for (const patch of pendingPatches) {
      try {
        const res = await fetch('/api/patches/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patchId: patch.id }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    if (failCount === 0) {
      setPatchAlert({ type: 'success', message: `Berhasil menerapkan ${successCount} patch.` });
    } else if (successCount === 0) {
      setPatchAlert({ type: 'error', message: `Gagal menerapkan ${failCount} patch.` });
    } else {
      setPatchAlert({ type: 'success', message: `Berhasil menerapkan ${successCount} patch, ${failCount} gagal.` });
    }

    await fetchSystemPatches();
    await runSystemDiagnostics();
    await fetchSystemSummary();
    setPatchActionLoading(null);
  };

  // Handle patch file upload (.json, .sql, or .zip)
  // ============================================================================
  // FUNGSI UNGGAL PATCH & PEMBARUAN SISTEM (UNIFIED CODEBASE & DATABASE UPDATER)
  // Maksud Bisnis: Membaca berkas pembaruan berupa .json kustom, file .sql mentah,
  // atau file kompresi .zip yang berisi koleksi file kustom maupun kode sumber proyek penuh.
  // Jika mendeteksi file zip codebase, sistem akan melakukan analisis diff cerdas
  // dan memproses hot-reload codebase setelah disetujui admin.
  //
  // Aliran Data:
  // - Input: Objek berkas `file` dari input/drag-and-drop.
  // - Proses: Mengirim file ZIP (Base64) ke `/api/codebase/check` untuk analisis diff.
  //           Jika ditemukan berkas proyek, simpan hasil verifikasi ke state.
  //           Jika bukan codebase, gunakan ekstraksi client-side fallback untuk SQL/JSON patch database.
  // - Output: Menampilkan daftar pembaruan atau mendaftarkan patch SQL ke database secara dinamis.
  // ============================================================================
  const handlePatchUpload = async (file: File) => {
    setUploadingPatch(true);
    setPatchAlert(null);
    setCodebaseCheckResult(null);
    setUploadedBase64Zip('');

    try {
      const fileName = file.name;
      const lowerFileName = fileName.toLowerCase();
      const isJson = lowerFileName.endsWith('.json');
      const isSql = lowerFileName.endsWith('.sql');
      const isZip = lowerFileName.endsWith('.zip');

      if (!isJson && !isSql && !isZip) {
        throw new Error('Format file tidak didukung. Harap unggah file .json, .sql, atau .zip');
      }

      // Fungsi bantu untuk membersihkan dan mengekstrak perintah SQL dari string berkas SQL
      const extractSqlStatements = (sqlContent: string): string[] => {
        let cleanContent = sqlContent.replace(/\/\*[\s\S]*?\*\//g, '');
        const lines = cleanContent.split('\n');
        const cleanLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('--') || trimmed.startsWith('//')) {
            return '';
          }
          const commentIndex = line.indexOf('--');
          if (commentIndex !== -1) {
            return line.substring(0, commentIndex).trim();
          }
          return line;
        });
        
        return cleanLines
          .join('\n')
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      };

      // Fungsi bantu untuk memetakan objek JSON ke format payload patch standar secara fleksibel
      const mapJsonToPatchPayload = (parsed: any, fallbackName: string, fileIndex: number) => {
        const name = parsed.nama_patch || parsed.nama || parsed.name || parsed.title || `Patch ${fallbackName}`;
        const sqls = parsed.sql_statements || parsed.sql || parsed.statements || parsed.queries || parsed.query;
        
        if (!sqls) return null;

        let sqlArray: string[] = [];
        if (Array.isArray(sqls)) {
          sqlArray = sqls.map(s => String(s).trim()).filter(Boolean);
        } else if (typeof sqls === 'string') {
          sqlArray = extractSqlStatements(sqls);
        }

        if (sqlArray.length === 0) return null;

        return {
          id: parsed.id || `PATCH-CUSTOM-${Date.now()}-${fileIndex}`,
          nama_patch: name,
          deskripsi: parsed.deskripsi || parsed.description || `Patch kustom dari file ${fallbackName} di dalam zip.`,
          kategori: parsed.kategori || parsed.category || 'Bug Fix',
          sql_statements: sqlArray
        };
      };

      // Ekstraksi fallback jika file zip bukan berisi pembaruan codebase proyek
      const fallbackZipPatchExtraction = async (zipFile: File) => {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(zipFile);
        
        let foundPatchesCount = 0;
        let fileIndex = 0;
        
        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
          if (zipEntry.dir) continue;
          if (relativePath.includes('__MACOSX') || relativePath.split('/').pop()?.startsWith('.')) {
            continue;
          }
          
          const lowerPath = relativePath.toLowerCase();
          const isEntryJson = lowerPath.endsWith('.json');
          const isEntrySql = lowerPath.endsWith('.sql');
          
          if (!isEntryJson && !isEntrySql) continue;
          
          const content = await zipEntry.async('string');
          const cleanFileName = relativePath.split('/').pop() || relativePath;
          let patchPayloads: any[] = [];
          
          if (isEntryJson) {
            try {
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed)) {
                parsed.forEach((item, idx) => {
                  const payload = mapJsonToPatchPayload(item, `${cleanFileName} [${idx}]`, fileIndex + idx);
                  if (payload) patchPayloads.push(payload);
                });
              } else {
                const payload = mapJsonToPatchPayload(parsed, cleanFileName, fileIndex);
                if (payload) patchPayloads.push(payload);
              }
            } catch (err) {
              console.warn(`Melewati berkas JSON non-patch di dalam ZIP: ${relativePath}`, err);
            }
          } else if (isEntrySql) {
            const statements = extractSqlStatements(content);
            if (statements.length > 0) {
              patchPayloads.push({
                id: `PATCH-SQL-${Date.now()}-${fileIndex}`,
                nama_patch: `Patch SQL: ${cleanFileName}`,
                deskripsi: `Skrip SQL yang diekstrak dari ${relativePath} di dalam file ZIP ${fileName}. Terdiri dari ${statements.length} instruksi.`,
                kategori: 'Database',
                sql_statements: statements
              });
            }
          }
          
          for (const payload of patchPayloads) {
            const res = await fetch('/api/patches/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.success) {
              foundPatchesCount++;
            }
          }
          fileIndex += Math.max(1, patchPayloads.length);
        }
        
        if (foundPatchesCount > 0) {
          setPatchAlert({ 
            type: 'success', 
            message: `Berhasil mengekstrak, memvalidasi, dan mendaftarkan ${foundPatchesCount} patch database dari file ZIP "${fileName}".` 
          });
          await fetchSystemPatches();
        } else {
          throw new Error('Tidak ditemukan berkas patch .json valid atau skrip .sql di dalam file ZIP.');
        }
      };

      if (isZip) {
        // Baca berkas zip sebagai Base64 terlebih dahulu untuk verifikasi codebase backend
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const res = await fetch('/api/codebase/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: base64Data })
            });
            const data = await res.json();
            
            if (res.ok && data.success && data.changedFiles && data.changedFiles.length > 0) {
              setCodebaseCheckResult(data);
              setUploadedBase64Zip(base64Data);
              setPatchAlert({
                type: 'success',
                message: `Pemeriksaan selesai! Terdeteksi ${data.stats.added} berkas baru dan ${data.stats.modified} berkas diubah. Silakan tinjau daftar di bawah ini untuk memulai proses pembaruan.`
              });
            } else {
              // Jika bukan zip proyek / tidak ada file berubah yang terdeteksi, fallback ke ekstraksi db patch biasa
              await fallbackZipPatchExtraction(file);
            }
          } catch (err: any) {
            console.warn('Codebase check failed, falling back to local patch extraction:', err);
            await fallbackZipPatchExtraction(file);
          } finally {
            setUploadingPatch(false);
          }
        };
        reader.onerror = () => {
          setPatchAlert({ type: 'error', message: 'Gagal membaca berkas zip.' });
          setUploadingPatch(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Menangani unggahan file standar non-ZIP (.json atau .sql tunggal)
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let patchPayloads: any[] = [];

          if (isJson) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              parsed.forEach((item, idx) => {
                const payload = mapJsonToPatchPayload(item, `${fileName} [${idx}]`, idx);
                if (payload) patchPayloads.push(payload);
              });
            } else {
              const payload = mapJsonToPatchPayload(parsed, fileName, 0);
              if (payload) patchPayloads.push(payload);
            }

            if (patchPayloads.length === 0) {
              throw new Error('File JSON patch tidak valid. Pastikan elemen memiliki "nama_patch" dan "sql_statements".');
            }
          } else {
            const statements = extractSqlStatements(content);
            if (statements.length === 0) {
              throw new Error('File SQL kosong atau tidak memiliki perintah SQL yang valid.');
            }

            patchPayloads.push({
              id: `PATCH-SQL-${Date.now()}`,
              nama_patch: `Patch SQL: ${fileName}`,
              deskripsi: `Menjalankan skrip SQL eksternal dari file ${fileName}. Terdiri dari ${statements.length} instruksi.`,
              kategori: 'Database',
              sql_statements: statements
            });
          }

          let uploadedCount = 0;
          let lastMessage = '';

          for (const payload of patchPayloads) {
            const res = await fetch('/api/patches/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
              uploadedCount++;
              lastMessage = data.message;
            } else {
              console.error('Gagal mengunggah patch:', data.error);
            }
          }

          if (uploadedCount > 0) {
            setPatchAlert({ 
              type: 'success', 
              message: uploadedCount > 1 
                ? `Berhasil mengunggah ${uploadedCount} patch dari file "${fileName}".` 
                : lastMessage 
            });
            await fetchSystemPatches();
          } else {
            throw new Error('Gagal meregistrasikan patch ke database.');
          }
        } catch (err: any) {
          setPatchAlert({ type: 'error', message: `Gagal membaca file: ${err.message}` });
        } finally {
          setUploadingPatch(false);
        }
      };

      reader.onerror = () => {
        setPatchAlert({ type: 'error', message: 'Gagal membaca isi berkas.' });
        setUploadingPatch(false);
      };

      reader.readAsText(file);

    } catch (err: any) {
      setPatchAlert({ type: 'error', message: err.message });
      setUploadingPatch(false);
    }
  };
  // === AKHIR DARI LOGIKA UNGGAH PATCH SISTEM ===

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePatchUpload(files[0]);
    }
  };

  const handleSaveSchoolIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityAlert({ type: '', message: '' });
    try {
      const res = await fetch('/api/school-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolIdentity)
      });
      const resData = await res.json();
      if (res.ok) {
        setIdentityAlert({ type: 'success', message: resData.message || 'Identitas sekolah berhasil diperbarui!' });
        onRefreshClasses();
      } else {
        setIdentityAlert({ type: 'error', message: resData.error || 'Gagal menyimpan perubahan.' });
      }
    } catch (err: any) {
      console.error('Error saving school identity:', err);
      setIdentityAlert({ type: 'error', message: `Kesalahan: ${err.message}` });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSystemSummary();
    fetchSchedules();
    fetchSchoolIdentity();
    if (classes.length > 0) {
      fetchAllStudents();
      if (!newSchedClassId) {
        setNewSchedClassId(String(classes[0].id));
      }
    }
  }, [classes]);

  useEffect(() => {
    if (adminTab === 'system') {
      fetchSystemPatches();
      runSystemDiagnostics();
    }
  }, [adminTab]);

  // Handle user submit (Create & Update)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg('');
    setUserSuccessMsg('');

    if (!formUsername.trim() || !formNama.trim()) {
      setUserErrorMsg('Username dan Nama lengkap wajib diisi');
      return;
    }

    if (!editingUserId && !formPassword.trim()) {
      setUserErrorMsg('Password wajib diisi untuk akun baru');
      return;
    }

    try {
      const isEdit = editingUserId !== null;
      const url = isEdit ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = {
        username: formUsername.trim(),
        nama: formNama.trim(),
        role: formRole,
        password: formPassword.trim() || undefined,
        kelas_id: formRole === 'wali_murid' ? formKelasId : null
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token || ''}`,
          'X-User-Id': String(currentUser.id),
          'X-User-Role': currentUser.role
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      setUserSuccessMsg(isEdit ? 'Akun pengguna berhasil diperbarui!' : 'Akun pengguna baru berhasil dibuat!');
      
      // Reset forms
      resetUserForm();
      fetchUsers();
      fetchSystemSummary();
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Gagal memproses permintaan');
    }
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormPassword('');
    setFormNama('');
    setFormRole('guru');
    setFormKelasId('');
    setShowAddForm(false);
  };

  const handleEditClick = (u: AdminUser) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormNama(u.nama);
    setFormRole(u.role);
    setFormKelasId(u.kelas_id || '');
    setFormPassword(''); // leave blank by default
    setShowAddForm(true);
    setUserErrorMsg('');
    setUserSuccessMsg('');
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) return;
    setUserErrorMsg('');
    setUserSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`,
          'X-User-Id': String(currentUser.id),
          'X-User-Role': currentUser.role
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus');
      }
      setUserSuccessMsg('Akun pengguna berhasil dihapus');
      fetchUsers();
      fetchSystemSummary();
    } catch (err: any) {
      setUserErrorMsg(err.message);
    }
  };

  // Delete student directly
  const handleDeleteStudent = async (nis: string) => {
    if (!window.confirm(`Hapus siswa dengan NIS ${nis}? Seluruh data absensi dan nilai siswa ini juga akan terhapus secara permanen.`)) return;
    try {
      const res = await fetch(`/api/siswa/${nis}`, { method: 'DELETE' });
      if (res.ok) {
        setCatalogSiswa(prev => prev.filter(s => s.nis !== nis));
        fetchSystemSummary();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete class directly
  const handleDeleteClass = async (id: number, nama: string) => {
    if (!window.confirm(`PERINGATAN: Menghapus kelas "${nama}" akan melenyapkan SELURUH data siswa, absensi, dan nilai di kelas tersebut. Lanjutkan?`)) return;
    try {
      const res = await fetch(`/api/kelas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshClasses();
        fetchSystemSummary();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Database Wipe Utility
  const handleResetDatabase = async () => {
    const confirmation = window.prompt(
      'PERINGATAN BERDAYA TINGGI!\n\nSeluruh konfigurasi Kategori Kelas, Siswa, Presensi Siswa, dan Histori Penilaian akan DIHAPUS & RE-SEEDING ULANG dari basis data awal.\n\nKetik kata kunci "RESTART" untuk menyetujui reset:'
    );
    
    if (confirmation !== 'RESTART') {
      alert('Reset dibatalkan. Kata kunci tidak cocok.');
      return;
    }

    setSystemAlert(null);
    try {
      const res = await fetch('/api/admin/reset-db', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token || ''}`,
          'X-User-Id': String(currentUser.id),
          'X-User-Role': currentUser.role
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSystemAlert({ type: 'success', message: data.message });
        await onRefreshClasses();
        resetUserForm();
        fetchUsers();
        fetchSystemSummary();
      } else {
        throw new Error(data.error || 'Reset gagal');
      }
    } catch (err: any) {
      setSystemAlert({ type: 'error', message: err.message || 'Koneksi error' });
    }
  };

  // Filtering list computations
  const filteredSiswa = catalogSiswa.filter(s => {
    const sQuery = searchQuery.toLowerCase();
    const matchSearch = s.nama.toLowerCase().includes(sQuery) || s.nis.includes(sQuery);
    const matchClass = selectedClassFilter === '' || s.kelas_id === Number(selectedClassFilter);
    return matchSearch && matchClass;
  });

  const [promoting, setPromoting] = useState(false);
  const [promotionTargetClass, setPromotionTargetClass] = useState('');
  const [promotionSourceClass, setPromotionSourceClass] = useState('');
  const [promotionMode, setPromotionMode] = useState<'promote' | 'graduate'>('promote');

  const handleBulkAction = async () => {
    if (promotionMode === 'promote' && !promotionTargetClass) {
      alert('Pilih kelas target promosi terlebih dahulu.');
      return;
    }
    if (!promotionSourceClass) {
      alert('Pilih kelas asal terlebih dahulu.');
      return;
    }

    const confirmMsg = promotionMode === 'promote' 
      ? 'Apakah Anda yakin ingin MENAIKKAN SELURUH siswa di kelas ini ke kelas target?' 
      : 'Apakah Anda yakin ingin MELULUSKAN SELURUH siswa di kelas terpilih (Status Alumni/Nonaktif)?';

    if (!window.confirm(confirmMsg)) return;

    setPromoting(true);
    setSystemAlert(null);

    try {
      // Fetch students in source class
      const studentsRes = await fetch('/api/siswa-all');
      const allStudents: Siswa[] = await studentsRes.json();
      const targetSiswa = allStudents.filter(s => String(s.kelas_id) === String(promotionSourceClass));
      
      if (targetSiswa.length === 0) {
        alert('Tidak ada siswa di kelas terpilih.');
        setPromoting(false);
        return;
      }

      const nisList = targetSiswa.map(s => s.nis);
      const url = promotionMode === 'promote' ? '/api/admin/promote-siswa' : '/api/admin/graduate-siswa';
      const body = promotionMode === 'promote' 
        ? { source_class_id: promotionSourceClass, target_class_id: promotionTargetClass, siswa_nis_list: nisList }
        : { siswa_nis_list: nisList };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setSystemAlert({ type: 'success', message: data.message });
        fetchAllStudents();
        fetchSystemSummary();
      } else {
        throw new Error(data.error || 'Aksi gagal');
      }
    } catch (err: any) {
      setSystemAlert({ type: 'error', message: err.message });
    } finally {
      setPromoting(false);
    }
  };


  // Provide all states as props
  const tabProps = {
    classes, onRefreshClasses, currentUser,
    users, loadingUsers, userSuccessMsg, userErrorMsg, editingUserId,
    formUsername, formPassword, formNama, formRole, formKelasId, showAddForm, stats, loadingStats,
    catalogSiswa, loadingCatalog, searchQuery, selectedClassFilter, selectedClassForImport, csvFile, csvPreview, parsedSiswaList, importStatus, promoting, promotionTargetClass, promotionSourceClass, promotionMode,
    schedules, loadingSchedules, scheduleAlert, editingScheduleId, scheduleDeleteConfirmId, newSchedClassId, newSchedGuruId, newSchedMatpel, newSchedHari, newSchedMulai, newSchedSelesai, schedViewMode, schedSearchQuery,
    systemAlert, schoolIdentity, loadingIdentity, identityAlert, systemPatches, loadingPatches, diagnostics, runningDiagnostics, patchActionLoading, patchAlert, isDragging, uploadingPatch,
    codebaseCheckResult, setCodebaseCheckResult, uploadedBase64Zip, setUploadedBase64Zip, applyingCodebaseUpdate, handleApplyCodebaseUpdate,
    setFormUsername, setFormPassword, setFormNama, setFormRole, setFormKelasId, setShowAddForm, setEditingUserId, handleUserSubmit, handleEditClick, handleDeleteUser, resetUserForm, 
    setSearchQuery, setSelectedClassFilter, setSelectedClassForImport, handleFileChange, handleUploadCSV, setCsvFile, setCsvPreview, setParsedSiswaList, setImportStatus, handleDeleteStudent, handleDeleteClass, setPromoting, setPromotionMode, setPromotionSourceClass, setPromotionTargetClass, handleBulkAction,
    setSchedViewMode, setSchedSearchQuery, setNewSchedClassId, setNewSchedGuruId, setNewSchedMatpel, setNewSchedHari, setNewSchedMulai, setNewSchedSelesai, setEditingScheduleId, setScheduleDeleteConfirmId, handleAddSchedule, handleEditScheduleClick, handleDeleteSchedule, resetScheduleForm,
    setSchoolIdentity, handleSaveSchoolIdentity, runSystemDiagnostics, handleApplyAllPatches, handleDragOver, handleDragLeave, handleDrop, handlePatchUpload, handleResetDatabase,
    downloadSampleCSV, exportStudentsToExcel, filteredSiswa, setScheduleAlert, setPatchAlert, setCatalogSiswa
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1920px] mx-auto pb-24">
      {/* Header Panel */}
      <div className="bg-[#161b22] border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Super <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Admin</span></h1>
              <p className="text-xs text-slate-400 mt-1">Konfigurasi Sistem &amp; Manajemen Data Induk</p>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex bg-[#0f1219] p-1.5 rounded-2xl border border-slate-800 shadow-inner relative z-10">
          <button
            onClick={() => setAdminTab('users')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'users' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setAdminTab('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'catalog' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Database className="w-4 h-4" /> Katalog
          </button>
          <button
            onClick={() => setAdminTab('upload')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'upload' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button
            onClick={() => setAdminTab('jadwal')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'jadwal' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Calendar className="w-4 h-4" /> Jadwal
          </button>
          <button
            onClick={() => setAdminTab('system')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${adminTab === 'system' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Settings className="w-4 h-4" /> Sistem
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <button
          onClick={() => setAdminTab('users')}
          className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border cursor-pointer ${
            adminTab === 'users' ? 'bg-[#161b22] border-blue-500/30 text-blue-400 shadow-lg' : 'bg-[#0f1219] border-slate-800 text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Pengguna</span>
        </button>
        <button
          onClick={() => setAdminTab('catalog')}
          className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border cursor-pointer ${
            adminTab === 'catalog' ? 'bg-[#161b22] border-blue-500/30 text-blue-400 shadow-lg' : 'bg-[#0f1219] border-slate-800 text-slate-400'
          }`}
        >
          <Database className="w-5 h-5" />
          <span>Katalog</span>
        </button>
        <button
          onClick={() => setAdminTab('upload')}
          className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border cursor-pointer ${
            adminTab === 'upload' ? 'bg-[#161b22] border-blue-500/30 text-blue-400 shadow-lg' : 'bg-[#0f1219] border-slate-800 text-slate-400'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </button>
        <button
          onClick={() => setAdminTab('jadwal')}
          className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border cursor-pointer ${
            adminTab === 'jadwal' ? 'bg-[#161b22] border-blue-500/30 text-blue-400 shadow-lg' : 'bg-[#0f1219] border-slate-800 text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Jadwal</span>
        </button>
        <button
          onClick={() => setAdminTab('system')}
          className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border col-span-2 cursor-pointer ${
            adminTab === 'system' ? 'bg-[#161b22] border-blue-500/30 text-blue-400 shadow-lg' : 'bg-[#0f1219] border-slate-800 text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Sistem</span>
        </button>
      </div>

      {adminTab === 'users' && <AdminUsersTab {...tabProps as any} />}
      {adminTab === 'catalog' && <AdminCatalogTab {...tabProps as any} />}
      {adminTab === 'upload' && <AdminUploadTab {...tabProps as any} />}
      {adminTab === 'jadwal' && <AdminJadwalTab {...tabProps as any} />}
      {adminTab === 'system' && <AdminSystemTab {...tabProps as any} />}
    </div>
  );
}
