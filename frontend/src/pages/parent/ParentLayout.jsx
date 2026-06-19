import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { cn } from '../../utils/cn';
import { 
  Home, 
  CheckSquare, 
  CreditCard, 
  Calendar, 
  FileText, 
  TrendingUp, 
  LogOut, 
  Key,
  Menu,
  X,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';

const PARENT_NAV = [
  { to: '/parent', icon: Home, label: 'Overview', end: true },
  { to: '/parent/attendance', icon: CheckSquare, label: 'Attendance' },
  { to: '/parent/fees', icon: CreditCard, label: 'Fees' },
  { to: '/parent/routine', icon: Calendar, label: 'Routine' },
  { to: '/parent/homework', icon: FileText, label: 'Homework' },
  { to: '/parent/results', icon: TrendingUp, label: 'Results' },
  { to: '/parent/vocabulary', icon: BookOpen, label: 'Vocabulary' },
];

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Prefetch daily vocabulary on portal load
  useEffect(() => {
    import('../../api/vocabulary').then(({ getDailyVocabulary }) => {
      getDailyVocabulary().catch(() => {
        // Silently fail, it will retry when they actually visit the page
      });
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-void text-black font-body flex overflow-x-hidden">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r-4 border-black w-64 min-h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-200 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b-4 border-black flex items-center gap-3 bg-[#FFD93D]">
          <div className="w-10 h-10 bg-[#FF6B6B] border-4 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_var(--neo-shadow)] flex-shrink-0">
            <Home className="w-5 h-5 text-black stroke-[3px]" />
          </div>
          <span className="font-heading font-black text-2xl text-black tracking-tighter uppercase">
            Parent Portal
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto bg-white">
          <span className="text-[11px] font-black uppercase tracking-widest text-black/50 px-3 py-1 font-heading">
            Parent Menu
          </span>
          {PARENT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 border-4 border-transparent text-black hover:bg-[#C4B5FD]/40 hover:border-black hover:shadow-[4px_4px_0px_0px_var(--neo-shadow)] hover:-translate-y-0.5 hover:translate-x-[-2px] font-heading font-black text-[14px] transition-all duration-100 group",
                  isActive && "bg-[#FFD93D] border-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] -translate-y-0.5 translate-x-[-2px]"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-100 group-hover:scale-110 text-black stroke-[2.5px]")} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t-4 border-black bg-[#C4B5FD]/10">
          <div className="flex items-center gap-3 p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_var(--neo-shadow)]">
            <div className="w-9 h-9 border-4 border-black bg-[#FF6B6B] flex items-center justify-center font-heading font-black text-sm text-black flex-shrink-0 shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
              {(user?.username || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-black truncate uppercase tracking-tight">{user?.username || 'Parent'}</div>
              <div className="text-[10px] text-black/60 font-mono font-bold capitalize">Parent</div>
            </div>
            <button
              className="text-black hover:bg-[#FFD93D] p-1.5 border-2 border-transparent hover:border-black transition-all duration-100 cursor-pointer"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Change Password"
            >
              <Key className="w-4 h-4 stroke-[3px]" />
            </button>
            <button
              className="text-black hover:bg-[#FF6B6B] p-1.5 border-2 border-transparent hover:border-black transition-all duration-100 cursor-pointer"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:pl-64 min-h-screen flex flex-col relative min-w-0">
        {/* Header - Textured red bar with yellow ribbon */}
        <header className="sticky top-0 bg-[#FF6B6B] border-b-4 border-black z-30 flex flex-col">
          <div className="h-16 flex items-center justify-between px-6">
            <button
              className="text-black bg-white border-4 border-black hover:bg-neutral-100 p-2 transition-all duration-100 md:hidden flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5 stroke-[3px]" /> : <Menu className="w-5 h-5 stroke-[3px]" />}
            </button>

            {/* Centered Yellow Sticker */}
            <div className="flex-1 flex justify-center">
              <div className="relative bg-[#FFD93D] text-black font-heading font-black text-sm md:text-base px-6 py-2 border-4 border-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] -rotate-1 hover:rotate-0 transition-transform duration-200">
                <span className="relative z-10 select-none uppercase tracking-wider font-black">
                  🌸 Parent Portal 🌸
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-black text-xs font-heading font-black uppercase tracking-wider border-4 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--neo-shadow)]">
                <span className="font-black">Read-Only Access</span>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 text-black bg-[#FFD93D] border-4 border-black hover:bg-white transition-all duration-100 cursor-pointer shadow-[3px_3px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 stroke-[2.5px]" /> : <Moon className="w-5 h-5 stroke-[2.5px]" />}
              </button>
            </div>
          </div>
          {/* Scalloped edge decorative divider */}
          <div className="scalloped-divider w-full" />
        </header>

        <main className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-x-hidden bg-notebook-grid">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
