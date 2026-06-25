import { useState, FormEvent } from 'react';
import { User, LogOut, Shield, Key, Check, X, Camera, Palette, Sun, Moon, DownloadCloud, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pengguna } from '../types';

interface ProfileMenuProps {
  user: Pengguna;
  onLogout: () => void;
  onClose: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  onUpdateUser: (updatedUser: Pengguna) => void;
  onOpenChangelog: () => void;
}

export default function ProfileMenu({ user, onLogout, onClose, theme, onThemeChange, onUpdateUser, onOpenChangelog }: ProfileMenuProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true
  );
  const [formData, setFormData] = useState({
    nama: user.nama,
    nip: user.nip || '',
    jabatan: user.jabatan || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          nama: formData.nama,
          nip: formData.nip,
          jabatan: formData.jabatan,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Profil berhasil diperbarui');
        onUpdateUser({ ...user, ...data.user });
        // Clear passwords
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setTimeout(() => setIsEditing(false), 1500);
      } else {
        setError(data.error || 'Gagal memperbarui profil');
      }
    } catch (err) {
      setError('Koneksi ke server terputus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      {/* Menu Content */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm h-full bg-[#0f1219] border-l border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0f1219]/90 backdrop-blur-md z-10">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Pengaturan Akun & Profil
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          {/* User Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="w-20 h-20 bg-blue-600/10 border-2 border-blue-500/30 rounded-full flex items-center justify-center text-3xl font-bold text-blue-400 shadow-lg">
                {user.nama.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full border-2 border-[#0f1219] text-white cursor-pointer hover:scale-110 transition shadow-md">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.nama}</h3>
              <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5 mt-1">
                <Shield className="w-3 h-3" />
                {user.role === 'admin' ? 'Administrator' : user.role === 'wali_murid' ? 'Wali Murid Official' : 'Guru Pengajar'}
              </p>
            </div>
          </div>

          {/* Action Tabs - Only if not editing */}
          {!isEditing ? (
            <div className="space-y-6">
              {/* Profile Summary */}
              <div className="bg-[#161b22] rounded-2xl p-4 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Nama Lengkap</label>
                  <p className="text-sm font-semibold text-slate-200">{user.nama}</p>
                </div>
                {user.role !== 'wali_murid' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">NIP / Identitas</label>
                      <p className="text-sm font-semibold text-slate-200">{user.nip || 'Belum diatur'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Jabatan</label>
                      <p className="text-sm font-semibold text-slate-200">{user.jabatan || 'Belum diatur'}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95"
                    >
                      Edit Profil Akun
                    </button>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Status Hubungan</label>
                    <p className="text-sm font-semibold text-slate-200">Wali Murid Resmi</p>
                  </div>
                )}
              </div>

              {/* Personalization Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                  <Palette className="w-3 h-3" />
                  Tampilan & Personalisasi
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" />, color: 'bg-[#0f1219]' },
                    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" />, color: 'bg-white' },
                    { id: 'emerald', label: 'Nature', icon: '🌲', color: 'bg-emerald-600' },
                    { id: 'rose', label: 'Sunset', icon: '🌅', color: 'bg-rose-600' },
                    { id: 'indigo', label: 'Royal', icon: '🔮', color: 'bg-indigo-600' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition transition-all active:scale-95 ${
                        theme === t.id 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-sm' 
                          : 'border-slate-800 bg-[#161b22] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="shrink-0">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Versi & Log Pembaruan */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                  Sistem Informasi Versi
                </h4>
                <div 
                  onClick={onOpenChangelog}
                  className="bg-[#161b22] border border-blue-500/20 hover:border-blue-500/40 p-4 rounded-2xl flex flex-col items-start gap-3 cursor-pointer group transition duration-300"
                >
                  <div className="space-y-1 text-left w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200 block group-hover:text-blue-400 transition-colors">SIM-IBU v2.2.0-Stabil</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-extrabold uppercase font-mono tracking-wider">Aktif</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                      Aplikasi telah berhasil diperbarui. Klik di sini untuk melihat catatan rilis lengkap, perbaikan bug mode terang, dan daftar fitur tambahan.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 group-hover:underline flex items-center gap-1 self-end transition">
                    Lihat Log Pembaruan &rarr;
                  </span>
                </div>
              </div>

              {/* Danger Zone */}
              {!isStandalone && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                    <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
                    Aplikasi Pintasan Mudah
                  </h4>
                  <div className="bg-[#161b22] border border-blue-500/20 p-4 rounded-2xl flex flex-col items-start gap-3">
                    <div className="space-y-1 text-left">
                      <span className="text-xs font-bold text-slate-200 block">Dukung Akses Offline</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        Pasang aplikasi SIM-IBU di layar utama ponsel/PC Anda untuk akses instan tanpa membuka browser.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-pwa-install'));
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg active:scale-95 flex items-center justify-center gap-2 font-semibold"
                    >
                      <DownloadCloud className="w-4 h-4 text-white" />
                      Pasang Aplikasi
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800">
                 <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-3 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out dari Akun
                </button>
              </div>
            </div>
          ) : (
            /* Editing Form */
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">NIP / ID Guru</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Jabatan / Peran</label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3 text-slate-500">
                    <Key className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Keamanan & Sandi</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Kata Sandi Saat Ini</label>
                      <input
                        type="password"
                        placeholder="Wajib jika ganti sandi"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Kata Sandi Baru</label>
                      <input
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold text-center italic">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? 'Disimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
