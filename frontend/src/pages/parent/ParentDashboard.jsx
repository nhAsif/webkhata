import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';

export default function ParentDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/parent/profile'),
      api.get('/parent/attendance'),
    ]).then(([p, a]) => {
      setProfile(p.data);
      setAttendance(a.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="stats-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton skeleton-text" style={{ height: '12px', width: '80px' }} />
              <div className="skeleton skeleton-text" style={{ height: '36px', width: '60px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const student = profile?.student;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome{student ? `, ${student.name.split(' ')[0]}` : ''}!</h1>
          <p className="page-subtitle">Your child's academic overview</p>
        </div>
      </div>

      {student && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                flexShrink: 0,
              }}
            >
              👨‍🎓
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{student.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Class {student.class_level} · Enrolled since {student.enrollment_date}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {(student.subjects || []).map((sub) => (
                  <span key={sub} className="badge badge-info">{sub}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Attendance Rate"
          value={attendance ? `${attendance.summary.attendance_rate}%` : '—'}
          icon="✅"
          color={attendance?.summary.attendance_rate >= 75 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          label="Classes Present"
          value={attendance?.summary.present ?? '—'}
          icon="📅"
          color="#6366f1"
        />
        <StatCard
          label="Batches Enrolled"
          value={profile?.batches?.length ?? '—'}
          icon="🏫"
          color="#f59e0b"
        />
      </div>

      {profile?.batches?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📚 Enrolled Batches</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {profile.batches.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <div className="text-xs text-muted">{b.subject}</div>
                </div>
                <span className="badge badge-info">{b.time_slot}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
