import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
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
  Sparkles
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
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-[#EADDC9] text-[#181B20] font-body flex overflow-x-hidden relative">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden backdrop-blur-xs",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Styled as scholastic forest-green cardboard ledger cover */}
      <aside
        className={cn(
          "bg-[#1A3329] border-r-4 border-[#181B20] w-64 min-h-screen fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 shadow-[8px_0px_24px_rgba(0,0,0,0.15)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Cover Sticker Badge */}
        <div className="p-4 border-b-4 border-[#181B20] bg-[#162A22]">
          <div className="bg-[#FAF6EE] border-4 border-[#181B20] p-4 rotate-[-1.5deg] shadow-[4px_4px_0px_0px_#181B20] hover:rotate-0 transition-transform duration-300 flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-[#FF6B6B] border-2 border-[#181B20] flex items-center justify-center shadow-[2px_2px_0px_0px_#181B20] transform -rotate-6">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-black text-xl text-[#1A3329] tracking-tighter uppercase text-center mt-1">
              WebKhata
            </span>
            <span className="font-mono text-[9px] font-bold text-black/50 tracking-wider uppercase">
              {t("Parent Portal")}
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto bg-[#1A3329]">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FAF6EE]/40 px-3 py-1 font-heading">
            {t("Ledger Index")}
          </span>
          {PARENT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 border-2 border-transparent text-[#F3EDE0] hover:bg-white/5 hover:text-white font-heading font-bold text-[14px] transition-all duration-200 group relative rounded-sm",
                  isActive && "bg-[#E5A93B] text-black border-[#181B20] shadow-[3px_3px_0px_0px_#181B20] -translate-y-0.5 translate-x-1 hover:bg-[#E5A93B] hover:text-black font-black"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn("w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 stroke-[2.5px]")} />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile Section - Styled as desk label tag */}
        <div className="p-4 border-t-4 border-[#181B20] bg-[#162A22]">
          <div className="flex items-center gap-2.5 p-2.5 bg-[#FAF6EE] border-4 border-[#181B20] shadow-[4px_4px_0px_0px_#181B20] relative group overflow-hidden">
            <div className="w-8 h-8 border-2 border-[#181B20] bg-[#C4B5FD] flex items-center justify-center font-heading font-black text-sm text-black flex-shrink-0 shadow-[2px_2px_0px_0px_#181B20] transform -rotate-3 group-hover:rotate-3 transition-transform duration-200">
              {(user?.username || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-black truncate uppercase tracking-tight">{user?.username || t('Parent')}</div>
              <div className="text-[9px] text-black/60 font-mono font-bold capitalize">{t("Guardian Access")}</div>
            </div>
            <div className="flex gap-1">
              <button
                className="text-black hover:bg-[#E5A93B] p-1 border border-transparent hover:border-black transition-all duration-100 cursor-pointer active:scale-90"
                onClick={() => setIsPasswordModalOpen(true)}
                title={t("Change Password")}
              >
                <Key className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
              <button
                className="text-black hover:bg-[#FF6B6B] p-1 border border-transparent hover:border-black transition-all duration-100 cursor-pointer active:scale-90"
                onClick={handleLogout}
                title={t("Logout")}
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Spiral Wire Bind Divider */}
      <div className="hidden md:block fixed left-60 top-0 bottom-0 w-8 z-40 pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 flex flex-col justify-between py-6 opacity-90">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-8 bg-gradient-to-r from-gray-400 via-white to-gray-600 border-2 border-[#181B20] rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.15)] transform -rotate-12"
              style={{ margin: '4px 0' }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 min-h-screen flex flex-col relative min-w-0 bg-[#FAF6EE]">
        {/* Header - Styled as a bookmark bar on top of the open pages */}
        <header className="sticky top-0 bg-[#F5EFE4] border-b-4 border-[#181B20] z-30 flex flex-col shadow-sm">
          <div className="h-16 flex items-center justify-between px-6">
            <button
              className="text-black bg-[#FAF6EE] border-4 border-[#181B20] hover:bg-neutral-100 p-2 transition-all duration-200 md:hidden flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_#181B20] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5 stroke-[2.5px]" /> : <Menu className="w-5 h-5 stroke-[2.5px]" />}
            </button>

            {/* Pinned Title Ribbon */}
            <div className="flex-1 flex justify-center md:justify-start">
              <div className="relative bg-[#E5A93B] text-black font-heading font-black text-sm md:text-base px-5 py-1.5 border-4 border-[#181B20] shadow-[3px_3px_0px_0px_#181B20] -rotate-1 hover:rotate-0 transition-transform duration-300 flex items-center gap-2 select-none uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-black stroke-[3.5px]" />
                <span>{t("Student Portal")}</span>
                <Sparkles className="w-4 h-4 text-black stroke-[3.5px]" />
              </div>
            </div>

            {/* Status indicator designed as school stamp badge */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-block">
                <span className="border-4 border-dashed border-[#1B3B6F] text-[#1B3B6F] font-heading font-black text-xs uppercase px-2.5 py-1 rotate-[-2deg] inline-block tracking-widest shadow-2xs">
                  {t("VERIFIED DIARY")}
                </span>
              </div>
            </div>
          </div>
          {/* Scalloped edge decorative divider */}
          <div className="scalloped-divider w-full" />
        </header>

        {/* Notebook open graph page contents */}
        <main className="flex-1 p-4 sm:p-6 w-full max-w-full overflow-x-hidden bg-notebook-grid relative page-flip-enter">
          {/* Red Ledger Margin Rule on the left side of the page (desktop only) */}
          <div className="hidden lg:block absolute left-[48px] top-0 bottom-0 w-[2px] bg-[#C0392B]/30 pointer-events-none" />

          {/* Container padding wrapper to shift content past margin rule */}
          <div className="lg:pl-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
}
