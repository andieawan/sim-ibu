import { Pengguna, Siswa, Jadwal } from '../../types';

export interface AdminUser extends Pengguna {
  nama_kelas?: string;
}

export interface AdminTabProps {
  // Common
  classes: any[];
  onRefreshClasses: () => void;
  currentUser: any;
  
  // Appended Props
  downloadSampleCSV: () => void;
  exportStudentsToExcel: () => void;
  filteredSiswa: Siswa[];
  setScheduleAlert: (v: any) => void;
  setPatchAlert: (v: any) => void;
  
  // Users Tab
  users: AdminUser[];
  loadingUsers: boolean;
  userSuccessMsg: string;
  userErrorMsg: string;
  editingUserId: number | null;
  formUsername: string;
  formPassword: string;
  formNama: string;
  formRole: 'admin' | 'guru' | 'wali_murid';
  formKelasId: number | '';
  showAddForm: boolean;
  stats: any;
  loadingStats: boolean;
  
  // Catalog Tab
  catalogSiswa: Siswa[];
  loadingCatalog: boolean;
  searchQuery: string;
  selectedClassFilter: string;
  selectedClassForImport: string;
  csvFile: File | null;
  csvPreview: Array<{ nis: string; nama: string; jenis_kelamin: string }>;
  parsedSiswaList: Array<{ nis: string; nama: string; jenis_kelamin: string }>;
  importStatus: { type: 'success' | 'error' | ''; message: string };
  promoting: boolean;
  promotionTargetClass: string;
  promotionSourceClass: string;
  promotionMode: 'promote' | 'graduate';
  
  // Jadwal Tab
  schedules: Jadwal[];
  loadingSchedules: boolean;
  scheduleAlert: { type: 'success' | 'error' | ''; message: string };
  editingScheduleId: number | null;
  scheduleDeleteConfirmId: number | null;
  newSchedClassId: string;
  newSchedGuruId: string;
  newSchedMatpel: string;
  newSchedHari: string;
  newSchedMulai: string;
  newSchedSelesai: string;
  schedViewMode: 'grid' | 'flat';
  schedSearchQuery: string;
  
  // System Tab
  systemAlert: { type: 'success' | 'error'; message: string } | null;
  schoolIdentity: any;
  loadingIdentity: boolean;
  identityAlert: { type: 'success' | 'error' | ''; message: string };
  systemPatches: Array<any>;
  loadingPatches: boolean;
  diagnostics: any;
  runningDiagnostics: boolean;
  patchActionLoading: string | null;
  patchAlert: { type: 'success' | 'error'; message: string } | null;
  isDragging: boolean;
  uploadingPatch: boolean;

  // Actions
  // Users
  setFormUsername: (v: string) => void;
  setFormPassword: (v: string) => void;
  setFormNama: (v: string) => void;
  setFormRole: (v: any) => void;
  setFormKelasId: (v: any) => void;
  setShowAddForm: (v: boolean) => void;
  setEditingUserId: (v: number | null) => void;
  handleUserSubmit: (e: any) => void;
  handleEditClick: (u: AdminUser) => void;
  handleDeleteUser: (id: number) => void;
  resetUserForm: () => void;
  
  // Catalog
  setSearchQuery: (v: string) => void;
  setSelectedClassFilter: (v: string) => void;
  setSelectedClassForImport: (v: string) => void;
  handleFileChange: (e: any) => void;
  handleUploadCSV: () => void;
  setCsvFile: (v: File | null) => void;
  setCsvPreview: (v: any) => void;
  setParsedSiswaList: (v: any) => void;
  setImportStatus: (v: any) => void;
  handleDeleteStudent: (nis: string, nama?: string) => void;
  handleDeleteClass: (id: number, nama?: string) => void;
  setPromoting: (v: boolean) => void;
  setPromotionMode: (v: any) => void;
  setPromotionSourceClass: (v: string) => void;
  setPromotionTargetClass: (v: string) => void;
  handleBulkAction: (action: string) => void;

  // Jadwal
  setSchedViewMode: (v: any) => void;
  setSchedSearchQuery: (v: string) => void;
  setNewSchedClassId: (v: string) => void;
  setNewSchedGuruId: (v: string) => void;
  setNewSchedMatpel: (v: string) => void;
  setNewSchedHari: (v: string) => void;
  setNewSchedMulai: (v: string) => void;
  setNewSchedSelesai: (v: string) => void;
  setEditingScheduleId: (v: number | null) => void;
  setScheduleDeleteConfirmId: (v: number | null) => void;
  handleAddSchedule: (e: any) => void;
  handleEditScheduleClick: (s: any) => void;
  handleDeleteSchedule: (id: number) => void;
  resetScheduleForm: () => void;

  // System
  setSchoolIdentity: (v: any) => void;
  handleSaveSchoolIdentity: (e: any) => void;
  runSystemDiagnostics: () => void;
  handleApplyAllPatches: () => void;
  handleDragOver: (e: any) => void;
  handleDragLeave: (e: any) => void;
  handleDrop: (e: any) => void;
  handlePatchUpload: (file: any) => void;
  handleResetDatabase: () => void;
  
  // Codebase-wide hot reload states
  codebaseCheckResult: any;
  setCodebaseCheckResult: (v: any) => void;
  uploadedBase64Zip: string;
  setUploadedBase64Zip: (v: string) => void;
  applyingCodebaseUpdate: boolean;
  handleApplyCodebaseUpdate: () => void;
}
