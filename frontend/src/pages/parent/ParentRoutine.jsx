import { useEffect, useState } from 'react';
import api from '../../api/client';

const DAYS_ORDER = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function ParentRoutine() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/routine').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Weekly Routine</h1></div>
        <div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const timetable = data?.weekly_timetable || {};

  // Check if any batch has timetable data saved
  const hasTimetable = DAYS_ORDER.some((d) => (timetable[d] || []).length > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Routine</h1>
          <p className="page-subtitle">Class schedule for {data?.student_name}</p>
        </div>
      </div>

      {/* Batch Details */}
      {data?.batches?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header"><h2 className="card-title">📚 Enrolled Batches</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.batches.map((b, i) => (
              <div
                key={i}
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
                  <div style={{ fontWeight: 600 }}>{b.batch_name}</div>
                  <div className="text-xs text-muted">{b.subject}</div>
                </div>
                <span className="badge badge-info">{b.time_slot}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {(b.days || []).map((d) => (
                    <span key={d} className="badge badge-default" style={{ fontSize: '10px' }}>{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly timetable */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">📅 Weekly Timetable</h2></div>

        {!hasTimetable ? (
          <div className="empty-state" style={{ padding: '2.5rem' }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No timetable set yet</div>
            <div className="empty-state-desc">Your tutor hasn't configured the weekly subjects yet.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DAYS_ORDER.map((day) => {
              const subjects = timetable[day] || [];
              const isToday = today === day;
              const isOff = subjects.length === 0;

              return (
                <div
                  key={day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.875rem 1rem',
                    background: isToday ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    border: isToday ? '1px solid var(--border-brand)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    width: 40,
                    fontWeight: 700,
                    fontSize: 'var(--font-size-sm)',
                    color: isToday ? 'var(--color-brand-light)' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}>
                    {day}
                    {isToday && <div style={{ fontSize: '9px', color: 'var(--color-brand)' }}>Today</div>}
                  </div>

                  {isOff ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', fontStyle: 'italic' }}>
                      🏖️ Off Day
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {subjects.map((sub) => (
                        <span key={sub} className="badge badge-info">{sub}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
