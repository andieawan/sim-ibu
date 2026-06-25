import React, { useState } from 'react';
import { GraduationCap, ShieldAlert, Key, User, ArrowRight, Loader2 } from 'lucide-react';
import { Pengguna } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: Pengguna) => void;
  appEnv: 'dev' | 'pub';
}

export default function LoginView({ onLoginSuccess, appEnv }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Silakan lengkapi semua kolom');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Gagal tersambung ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col justify-center items-center p-4 selection:bg-blue-600/20 selection:text-blue-400">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo and Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-3xl flex items-center justify-center font-bold shadow-xl mx-auto">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight uppercase font-sans mb-1">
              SIM-IBU
            </h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono mb-2">
              SISTEM INFORMASI DAN MANAJEMEN - SMKS ISLAM BUSTANUL ULUM
            </p>
            {appEnv === 'dev' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm leading-none uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                Tahap Pengembangan (Dev)
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm leading-none uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Diterbitkan Resmi (Pub)
              </div>
            )}
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-[#161b22] border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
          
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-200">Silakan Masuk</h3>
            <p className="text-xs text-slate-500">Akses modul presensi, penilaian KKM, dan data sekolah</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-500" />
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Contoh: guru / admin / ortu"
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3 text-slate-500" />
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Masukkan kata sandi..."
                className="w-full px-4 py-3 bg-[#0f1219] border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 font-semibold text-slate-200"
                disabled={loading}
              />
            </div>

            {/* Warning Alarm Container */}
            {error && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/25 rounded-2xl text-rose-450 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1.5 duration-100">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium leading-normal">{error}</span>
              </div>
            )}

            {/* Submit Switch Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick login sandbox selector */}
          {appEnv === 'dev' && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider block">
                Pilihan Akun Demo (Klik untuk Isi Instan):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('guru', 'guru123')}
                  className="p-2.5 bg-[#0f1219] border border-slate-800 hover:border-slate-700 hover:bg-[#161b22] rounded-2xl text-left text-xs transition cursor-pointer"
                >
                  <div className="font-extrabold text-blue-400 text-[11px]">GURU</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">guru123</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="p-2.5 bg-[#0f1219] border border-slate-800 hover:border-slate-700 hover:bg-[#161b22] rounded-2xl text-left text-xs transition cursor-pointer"
                >
                  <div className="font-extrabold text-emerald-400 text-[11px]">ADMIN</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('ortu', 'ortu123')}
                  className="p-2.5 bg-[#0f1219] border border-slate-800 hover:border-slate-700 hover:bg-[#161b22] rounded-2xl text-left text-xs transition cursor-pointer"
                >
                  <div className="font-extrabold text-amber-500 text-[11px]">ORTU</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 leading-none">ortu123</div>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* App Meta footer */}
        <p className="text-center text-[10px] text-slate-600 font-mono">
          SIM-IBU v1.4 • Hak Cipta SMKS Islam Bustanul Ulum © 2026
        </p>

      </div>
    </div>
  );
}
