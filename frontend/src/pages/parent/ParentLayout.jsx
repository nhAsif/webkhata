import { useState } from 'react';
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

  const handleLogout = () => {
    logout();
    navigate('/parent/login');
  };

  return (
    <div className="min-h-screen bg-void text-pure font-body flex overflow-x-hidden bg-grid-pattern">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-void/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-matter border-r border-white/10 w-60 min-h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-burnt to-bitcoin rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(247,147,26,0.35)] flex-shrink-0">
            <Home className="w-5 h-5 text-pure" />
          </div>
          <span className="font-heading font-bold text-lg bg-gradient-to-r from-pure to-bitcoin bg-clip-text text-transparent tracking-tight">
            Parent Portal
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {PARENT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-stardust hover:text-pure hover:bg-white/5 border border-transparent font-mono text-xs uppercase tracking-wider transition-all duration-200 group",
                  isActive && "bg-gradient-to-r from-burnt/20 to-bitcoin/10 text-bitcoin border-bitcoin/30"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-bitcoin to-gold flex items-center justify-center font-bold text-sm text-void flex-shrink-0 shadow-[0_0_10px_rgba(247,147,26,0.2)]">
              {(user?.username || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-pure truncate">{user?.username || 'Parent'}</div>
              <div className="text-[10px] text-stardust font-mono">Parent</div>
            </div>
            <button
              className="text-stardust hover:text-bitcoin p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              className="text-stardust hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:pl-60 min-h-screen flex flex-col relative">
        <header className="sticky top-0 h-16 bg-void/50 backdrop-blur-md border-b border-white/10 z-30 flex items-center justify-between px-6">
          <button
            className="text-pure bg-white/5 hover:bg-white/10 border border-white/10 hover:border-bitcoin/30 p-2 rounded-xl transition-all duration-200 md:hidden flex items-center justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Read-Only Portal
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 w-full">
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
