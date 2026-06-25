const fs = require('fs');
let code = fs.readFileSync('src/views/common/HomeView.tsx', 'utf-8');

const replacement = `
  // Prop object for tabs
  const tabProps = {
    currentUser, classes, schoolIdentity, theme, stats, isWaliKelas, onNavigateToTab, onOpenAddKelasModal, onOpenAddSiswaModal,
    loadingClasses, displayedClasses, selectedClassForView, setSelectedClassForView, setSiswaListForView, handleViewSiswa, handleDeleteKelas,
    classStats, loadingSiswa, siswaListForView, handleDeactivateSiswa, handleReactivateSiswa,
    schedules, selectedDayFilter, setSelectedDayFilter, loadingSchedules,
    showStats, setShowStats, onRefreshClasses
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header and SubTabs */}
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="flex items-center gap-3 relative">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
            <School className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400">Ringkasan Aktivitas &amp; Informasi Sekolah</p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0f1219] p-1.5 rounded-2xl border border-slate-800 relative z-10">
          <button
            onClick={() => setActiveSubTab('sekolah')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
              activeSubTab === 'sekolah'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }\`}
          >
            <Calendar className={\`w-3.5 h-3.5 transition-transform \${activeSubTab === 'sekolah' ? 'scale-110 text-white' : 'text-slate-400'}\`} />
            Jadwal Sekolah
          </button>
          
          {isWaliKelas && (
            <button
              onClick={() => setActiveSubTab('walikelas')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
                activeSubTab === 'walikelas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }\`}
            >
              <UserCheck className={\`w-3.5 h-3.5 transition-transform \${activeSubTab === 'walikelas' ? 'scale-110 text-white' : 'text-slate-400'}\`} />
              Wali Kelas
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('kelas')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
              activeSubTab === 'kelas'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }\`}
          >
            <Layers className={\`w-3.5 h-3.5 transition-transform \${activeSubTab === 'kelas' ? 'scale-110 text-white' : 'text-slate-400'}\`} />
            Daftar Kelas
          </button>

          <button
            onClick={() => setActiveSubTab('statistik')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
              activeSubTab === 'statistik'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }\`}
          >
            <BarChart3 className={\`w-3.5 h-3.5 transition-transform \${activeSubTab === 'statistik' ? 'scale-110 text-white' : 'text-slate-400'}\`} />
            Statistik
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === 'sekolah' && <HomeSekolahTab {...tabProps} />}
          {activeSubTab === 'walikelas' && isWaliKelas && <HomeWaliKelasTab {...tabProps} />}
          {activeSubTab === 'kelas' && <HomeKelasTab {...tabProps} />}
          {activeSubTab === 'statistik' && <HomeStatistikTab {...tabProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
`;

const startIdx = code.indexOf('  return (\n    <div className="space-y-6">');
if (startIdx !== -1) {
  code = code.substring(0, startIdx) + replacement;
} else {
  console.log('NOT FOUND');
}

const imports = `import HomeSekolahTab from './tabs/HomeSekolahTab';
import HomeWaliKelasTab from './tabs/HomeWaliKelasTab';
import HomeKelasTab from './tabs/HomeKelasTab';
import HomeStatistikTab from './tabs/HomeStatistikTab';`;

if (!code.includes('HomeSekolahTab')) {
  code = code.replace("import WaliKelasView from '../wali-kelas/WaliKelasView';", "import WaliKelasView from '../wali-kelas/WaliKelasView';\n" + imports);
}

fs.writeFileSync('src/views/common/HomeView.tsx', code);
