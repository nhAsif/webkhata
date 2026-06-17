import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/students', icon: '👨‍🎓', label: 'Students' },
  { to: '/batches', icon: '🏫', label: 'Batches' },
  { to: '/attendance', icon: '✅', label: 'Attendance' },
  { to: '/fees', icon: '💰', label: 'Fees' },
  { to: '/homework', icon: '📝', label: 'Homework' },
  { to: '/results', icon: '📈', label: 'Results' },
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
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📒</div>
          <span className="sidebar-logo-text">WebKhata</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main Menu</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-role">{user?.role || 'tutor'}</div>
            </div>
            <button
              className="btn-logout"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Change Password"
              style={{ marginRight: '0.25rem' }}
            >
              🔑
            </button>
            <button
              className="btn-logout"
              onClick={handleLogout}
              title="Logout"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="topbar-title" />
          <div className="topbar-actions">
            <span className="text-xs text-muted">
              {new Date().toLocaleDateString('en-BD', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
