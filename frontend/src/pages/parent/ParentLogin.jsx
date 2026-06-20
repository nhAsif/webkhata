import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/Input';
import Button from '../../components/Button';
import { useTranslation } from '../../contexts/LanguageContext';
import { Users, ShieldAlert, TrendingUp, GraduationCap } from 'lucide-react';

export default function ParentLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { parentLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await parentLogin(username, password);
      toast.success(t('Welcome!'));
      navigate('/parent');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid username or code';
      setError(t(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notebook-grid flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Floating details for visual interest (Stickers) */}
      <div className="absolute top-[15%] right-[10%] bg-[#FFD93D] border-4 border-black px-6 py-4 shadow-[8px_8px_0px_0px_var(--neo-shadow)] rotate-6 hidden md:block font-heading font-black text-2xl uppercase tracking-tighter">
        <span className="flex items-center gap-2">
          {t("PARENT ACCESS")} <Users className="w-6 h-6 text-black stroke-[3px]" />
        </span>
      </div>
      <div className="absolute bottom-[20%] left-[8%] bg-[#C4B5FD] border-4 border-black px-6 py-4 shadow-[8px_8px_0px_0px_var(--neo-shadow)] -rotate-12 hidden md:block font-heading font-black text-2xl uppercase tracking-tighter">
        <span className="flex items-center gap-2">
          {t("KIDS PROGRESS")} <TrendingUp className="w-6 h-6 text-black stroke-[3px]" />
        </span>
      </div>

      <div className="w-full max-w-md bg-white border-4 border-black rounded-none p-8 shadow-[12px_12px_0px_0px_var(--neo-shadow)] relative z-10 hover:-translate-y-1 hover:shadow-[16px_16px_0px_0px_var(--neo-shadow)] transition-all duration-200">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#FF6B6B] border-4 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_var(--neo-shadow)]">
              <Users className="w-6 h-6 text-black stroke-[3px]" />
            </div>
            <span className="font-heading font-black text-3xl text-black tracking-tighter uppercase">
              WebKhata
            </span>
          </div>
          <p className="text-[12px] font-black text-black/60 font-heading uppercase tracking-widest bg-[#FFD93D] px-3 py-1 border-2 border-black rotate-1 shadow-[2px_2px_0px_0px_var(--neo-shadow)] mt-1">
            {t("Parent Portal Access")}
          </p>
        </div>

        {error && (
          <div className="bg-[#FF6B6B] border-4 border-black text-black p-4 rounded-none text-sm mb-6 flex items-start gap-2.5 shadow-[4px_4px_0px_0px_var(--neo-shadow)]">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-black stroke-[3px]" />
            <span className="font-black uppercase tracking-tight">{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-black text-black font-heading uppercase tracking-wider" htmlFor="username">{t("Username")}</label>
            <Input
              id="username"
              type="text"
              placeholder={t("Enter your username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-black text-black font-heading uppercase tracking-wider" htmlFor="parent-password">{t("Password")}</label>
            <Input
              id="parent-password"
              type="password"
              placeholder={t("Enter your password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 cursor-pointer"
            disabled={loading}
          >
            {loading ? t('Signing in...') : t("View Child's Progress")}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-4 border-black"></div>
          </div>
          <span className="relative px-4 bg-white border-2 border-black text-xs font-black text-black font-heading uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
            {t("or")}
          </span>
        </div>

        <div className="text-center">
          <a 
            href="/login" 
            className="text-xs font-black text-black bg-[#C4B5FD] border-2 border-black px-4 py-2 hover:bg-[#C4B5FD]/90 hover:shadow-[3px_3px_0px_0px_var(--neo-shadow)] hover:active:translate-x-[3px] hover:active:translate-y-[3px] hover:active:shadow-none transition-all duration-100 font-heading uppercase tracking-wider inline-block shadow-[3px_3px_0px_0px_var(--neo-shadow)]"
          >
            <span className="flex items-center justify-center gap-2">
              <GraduationCap className="w-4 h-4 text-black stroke-[3px]" />
              {t("Switch to Tutor Login")}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
