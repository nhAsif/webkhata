import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  BookOpen
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
    <div className="min-h-screen bg-void text-[#121212] font-body flex overflow-x-hidden bg-grid-pattern">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-[#121212]/80 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r-4 border-black w-60 min-h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b-4 border-black flex items-center gap-3 bg-[#1040C0]/10">
          {/* Bauhaus Geometric Logo */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-[#D02020] border-2 border-black" title="Circle" />
            <div className="w-4 h-4 bg-[#1040C0] border-2 border-black" title="Square" />
            <div className="w-4 h-4 bg-[#F0C020] border-2 border-black [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)]" title="Triangle" />
          </div>
          <span className="font-heading font-black text-xl text-[#121212] tracking-tighter uppercase">
            Parent Portal
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {PARENT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-none text-gray-700 hover:text-black hover:bg-gray-100 border border-transparent font-mono text-xs uppercase tracking-wider transition-all duration-200 group border-b border-black/5",
                  isActive && "bg-[#F0C020] text-black border-2 border-black shadow-[3px_3px_0px_0px_#121212] font-black translate-x-[-2px] translate-y-[-2px]"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t-4 border-black bg-gray-50">
          <div className="flex items-center gap-3 p-2.5 rounded-none bg-white border-2 border-black shadow-[3px_3px_0px_0px_#121212]">
            <div className="w-8 h-8 rounded-none border-2 border-black bg-[#D02020] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_#121212] flex-shrink-0">
              {(user?.username || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-[#121212] uppercase tracking-tight truncate">{user?.username || 'Parent'}</div>
              <div className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-wider">Parent</div>
            </div>
            <button
              className="text-gray-500 hover:text-[#1040C0] hover:bg-gray-100 p-1.5 border border-transparent hover:border-black rounded-none transition-all duration-200"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              className="text-gray-500 hover:text-[#D02020] hover:bg-gray-100 p-1.5 border border-transparent hover:border-black rounded-none transition-all duration-200"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:pl-60 min-h-screen flex flex-col relative min-w-0">
        <header className="sticky top-0 h-16 bg-white/85 backdrop-blur-md border-b-4 border-black z-30 flex items-center justify-between px-6">
          <button
            className="text-black bg-white hover:bg-gray-100 border-2 border-black p-1.5 rounded-none shadow-[2px_2px_0px_0px_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200 md:hidden flex items-center justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-[#1040C0] text-white border-2 border-black shadow-[2px_2px_0px_0px_#121212] font-mono">
              Read-Only Portal
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
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
