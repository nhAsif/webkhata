import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function ParentLogin() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { parentLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await parentLogin(username, code);
      toast.success('Welcome!');
      navigate('/parent');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid username or code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">👪</div>
          <span className="login-logo-text">Parent Portal</span>
        </div>
        <p className="login-subtitle">View your child's progress</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="parent-code">Password / Parent Code</label>
            <input
              id="parent-code"
              className="form-input"
              type="password"
              placeholder="Enter your password or 6-character code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in...' : 'View My Child\'s Progress'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <div style={{ textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            👨‍🏫 Tutor Login
          </a>
        </div>
      </div>
    </div>
  );
}
