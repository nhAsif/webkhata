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
    <div className="min-h-screen bg-void bg-grid-pattern flex items-center justify-center p-4 relative overflow-hidden font-body text-[#121212]">
      {/* Bauhaus Constructivist Background Compositions */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#D02020] opacity-10 border-4 border-black pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-[#1040C0] opacity-10 border-4 border-black rotate-45 pointer-events-none" />
      <div className="absolute top-1/4 right-[-100px] w-80 h-80 bg-[#F0C020] opacity-10 border-4 border-black [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-80px] w-64 h-64 bg-[#121212] opacity-5 border-4 border-black pointer-events-none" />

      {/* Massive Display Text Behind Card (Constructivist Poster Style) */}
      <div className="hidden lg:block absolute left-12 bottom-12 font-heading font-black text-8xl text-[#121212]/5 uppercase tracking-tighter select-none pointer-events-none leading-none">
        FORM<br />FOLLOWS<br />FUNCTION
      </div>
      <div className="hidden lg:block absolute right-12 top-12 font-heading font-black text-8xl text-[#121212]/5 text-right uppercase tracking-tighter select-none pointer-events-none leading-none">
        BAUHAUS<br />MODERNISM
      </div>

      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_#121212] relative z-10 rounded-none transition-all duration-300 hover:shadow-[14px_14px_0px_0px_#121212]">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            {/* Geometric Logo */}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-[#D02020] border border-black" />
              <div className="w-4 h-4 bg-[#1040C0] border border-black" />
              <div className="w-4 h-4 bg-[#F0C020] border border-black [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)]" />
            </div>
            <span className="font-heading font-black text-3xl text-[#121212] uppercase tracking-tighter">
              WebKhata
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 font-mono uppercase tracking-widest">
            Tutor Management Portal
          </p>
        </div>

        {error && (
          <div className="bg-[#D02020]/10 border-2 border-[#D02020] text-[#D02020] p-3.5 rounded-none text-xs mb-6 flex items-start gap-2.5 font-mono uppercase font-bold tracking-wider shadow-[2px_2px_0px_0px_#121212]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 font-mono" htmlFor="username">Username</label>
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
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 font-mono" htmlFor="password">Password</label>
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
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black/10"></div>
          </div>
          <span className="relative px-3 bg-white text-[10px] font-black text-gray-500 font-mono uppercase tracking-wider">
            or
          </span>
        </div>

        <div className="text-center">
          <a 
            href="/parent/login" 
            className="inline-block text-xs font-black text-[#1040C0] hover:text-[#D02020] hover:underline transition-colors font-mono uppercase tracking-wider"
          >
            👪 Switch to Parent Portal
          </a>
        </div>

        <div className="mt-8 p-4 bg-[#F0C020] border-2 border-black rounded-none text-xs text-[#121212] font-mono shadow-[3px_3px_0px_0px_#121212] font-bold uppercase tracking-wider">
          <span className="text-[#D02020] font-black">Default Login:</span><br />
          <div className="mt-2 flex items-center justify-between">
            <span>User: <span className="bg-white px-1.5 py-0.5 border border-black text-[#121212]">admin</span></span>
            <span>Pass: <span className="bg-white px-1.5 py-0.5 border border-black text-[#121212]">changeme</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
