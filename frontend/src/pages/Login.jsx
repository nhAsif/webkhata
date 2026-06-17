import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import Button from '../components/Button';
import { BookOpen, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void bg-grid-pattern flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bitcoin/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Spinning Orbitals for 3D depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[800px] h-[800px]">
        <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow" />
        <div className="absolute inset-10 border border-bitcoin/10 rounded-full animate-spin-reverse" />
        <div className="absolute inset-20 border border-gold/5 rounded-full animate-spin-slow" />
      </div>

      <div className="w-full max-w-md bg-matter/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(247,147,26,0.15)] relative z-10 transition-all duration-300 hover:border-bitcoin/30 animate-float">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-burnt to-bitcoin rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(247,147,26,0.4)]">
              <BookOpen className="w-6 h-6 text-pure" />
            </div>
            <span className="font-heading font-bold text-2xl bg-gradient-to-r from-pure to-bitcoin bg-clip-text text-transparent tracking-tight">
              WebKhata
            </span>
          </div>
          <p className="text-xs font-semibold text-stardust font-mono uppercase tracking-widest">
            Tutor Management Portal
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm mb-6 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust" htmlFor="username">Username</label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust" htmlFor="password">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
            ) : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-3 bg-matter text-[10px] text-stardust font-mono uppercase tracking-wider">
            or
          </span>
        </div>

        <div className="text-center">
          <a 
            href="/parent/login" 
            className="text-xs font-semibold text-bitcoin hover:text-gold hover:underline transition-colors font-mono uppercase tracking-wider"
          >
            👪 Switch to Parent Portal
          </a>
        </div>

        <div className="mt-8 p-4 bg-void/50 border border-white/5 rounded-xl text-xs text-stardust font-body">
          <strong className="text-bitcoin font-semibold">Default Credentials:</strong>{' '}
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-pure">admin</span>
          {' / '}
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-pure">changeme</span>
        </div>
      </div>
    </div>
  );
}
