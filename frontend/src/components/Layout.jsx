import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import { cn } from '../utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CheckSquare, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  LogOut, 
  Key,
  Menu,
  X,
  Calendar,
  Wallet,
  BarChart2,
  Settings as SettingsIcon
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/batches', icon: BookOpen, label: 'Batches' },
  { to: '/attendance', icon: CheckSquare, label: 'Attendance' },
  { to: '/fees', icon: CreditCard, label: 'Fees' },
  { to: '/homework', icon: FileText, label: 'Homework' },
  { to: '/results', icon: TrendingUp, label: 'Results' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-void text-pure font-body flex overflow-x-hidden bg-grid-pattern">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-void/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
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
            <BookOpen className="w-5 h-5 text-pure" />
          </div>
          <span className="font-heading font-bold text-lg bg-gradient-to-r from-pure to-bitcoin bg-clip-text text-transparent tracking-tight">
            WebKhata
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stardust px-3 py-1 font-mono">
            Main Menu
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-stardust hover:text-pure hover:bg-white/5 border border-transparent font-mono text-xs uppercase tracking-wider transition-all duration-200 group",
                  isActive && "bg-gradient-to-r from-burnt/20 to-bitcoin/10 text-bitcoin border-bitcoin/30"
                )}
                onClick={closeSidebar}
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
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-pure truncate">{user?.username || 'User'}</div>
              <div className="text-[10px] text-stardust font-mono capitalize">{user?.role || 'tutor'}</div>
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
      <div className="flex-1 md:pl-60 min-h-screen flex flex-col relative min-w-0">
        <header className="sticky top-0 h-16 bg-void/50 backdrop-blur-md border-b border-white/10 z-30 flex items-center justify-between px-6">
          <button
            className="text-pure bg-white/5 hover:bg-white/10 border border-white/10 hover:border-bitcoin/30 p-2 rounded-xl transition-all duration-200 md:hidden flex items-center justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-stardust text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-bitcoin" />
            {new Date().toLocaleDateString('en-BD', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
