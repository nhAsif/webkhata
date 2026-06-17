import { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/alerts'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setAlerts(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const ALERT_ICONS = {
    low_attendance: '📉',
    overdue_fee: '💸',
    homework_due: '📝',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your tutor activity</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton skeleton-text" style={{ height: '12px', width: '80px' }} />
              <div className="skeleton skeleton-text" style={{ height: '36px', width: '60px' }} />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Active Students"
              value={stats.total_active_students}
              icon="👨‍🎓"
              color="#6366f1"
            />
            <StatCard
              label="Today's Sessions"
              value={stats.todays_sessions}
              icon="📅"
              color="#10b981"
            />
            <StatCard
              label="Unpaid Fees"
              value={stats.unpaid_fees_count}
              icon="💰"
              color={stats.unpaid_fees_count > 0 ? '#ef4444' : '#10b981'}
            />
            <StatCard
              label="Monthly Collection"
              value={`৳${stats.monthly_collection.toLocaleString()}`}
              icon="💵"
              color="#f59e0b"
            />
            <StatCard
              label="Attendance Rate"
              value={`${stats.attendance_rate}%`}
              icon="✅"
              color={stats.attendance_rate >= 75 ? '#10b981' : '#f59e0b'}
            />
          </>
        ) : null}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔔 Alerts</h2>
            <span className="badge badge-danger">{alerts.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`alert ${
                  alert.type === 'overdue_fee' ? 'alert-danger'
                  : alert.type === 'low_attendance' ? 'alert-warning'
                  : 'alert-info'
                }`}
              >
                <span>{ALERT_ICONS[alert.type] || '⚠️'}</span>
                <div>
                  <div>{alert.message}</div>
                  {alert.student_id && (
                    <a
                      href={`/students/${alert.student_id}`}
                      style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8 }}
                    >
                      View student →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">✨</div>
            <div className="empty-state-title">All clear!</div>
            <div className="empty-state-desc">No alerts at the moment. Keep up the great work!</div>
          </div>
        </div>
      )}
    </div>
  );
}
