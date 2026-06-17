import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import ChangePasswordModal from '../../components/ChangePasswordModal';

const PARENT_NAV = [
  { to: '/parent', icon: '🏠', label: 'Overview', end: true },
  { to: '/parent/attendance', icon: '✅', label: 'Attendance' },
  { to: '/parent/fees', icon: '💰', label: 'Fees' },
  { to: '/parent/routine', icon: '📅', label: 'Routine' },
  { to: '/parent/homework', icon: '📝', label: 'Homework' },
  { to: '/parent/results', icon: '📈', label: 'Results' },
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
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">👪</div>
          <span className="sidebar-logo-text">Parent Portal</span>
        </div>

        <nav className="sidebar-nav">
          {PARENT_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👪</div>
            <div className="user-meta">
              <div className="user-name">{user?.username || 'Parent'}</div>
              <div className="user-role">Parent</div>
            </div>
            <button className="btn-logout" onClick={() => setIsPasswordModalOpen(true)} title="Change Password" style={{ marginRight: '0.25rem' }}>🔑</button>
            <button className="btn-logout" onClick={handleLogout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <div className="main-content">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">☰</button>
          <div className="topbar-title" />
          <div className="topbar-actions">
            <span className="badge badge-info">Read-Only Portal</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
