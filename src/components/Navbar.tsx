import { Home, CalendarCheck, Award, BarChart3, Settings, FileSpreadsheet, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isAdmin?: boolean;
  isWaliKelas?: boolean;
  isWaliMurid?: boolean;
}

export default function Navbar({ currentTab, setTab, isAdmin, isWaliKelas, isWaliMurid }: NavbarProps) {
  let navItems = [
    { id: 'beranda', label: 'Monitor Anak', icon: Home },
  ];

  if (!isWaliMurid) {
    navItems.push(
      { id: 'absensi', label: 'Absensi', icon: CalendarCheck },
      { id: 'nilai', label: 'Nilai', icon: Award }
    );
    navItems.push({ id: 'rekap', label: 'Rekap', icon: FileSpreadsheet });

    if (isAdmin) {
      navItems.push({ id: 'admin', label: 'Manajemen', icon: Settings });
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0f1219] border-t border-slate-800 flex justify-around items-stretch z-50 shadow-2xl px-4 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-btn-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center px-1 sm:px-6 transition-all duration-300 relative ${
              isActive 
                ? 'text-blue-500 border-t-2 border-blue-500 bg-blue-500/5 font-semibold' 
                : 'text-slate-500 hover:text-slate-200 border-t-2 border-transparent'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
