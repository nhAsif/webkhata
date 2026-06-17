import { useEffect, useState } from 'react';
import api from '../../api/client';

const STATUS_COLORS = {
  present: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'P' },
  absent: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'A' },
  late: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'L' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

export default function ParentAttendance() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/parent/attendance?month=${month}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [month]);

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, mon);
  const firstDay = getFirstDayOfMonth(year, mon);
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Monthly attendance calendar</p>
        </div>
        <input
          type="month"
          className="form-input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {data && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-success">✅ Present: {data.summary.present}</span>
          <span className="badge badge-danger">❌ Absent: {data.summary.absent}</span>
          <span className="badge badge-warning">⏰ Late: {data.summary.late}</span>
          <span className="badge badge-info">📅 Sessions: {data.summary.total_sessions}</span>
          <span
            className="badge"
            style={{
              background: data.summary.attendance_rate >= 75 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: data.summary.attendance_rate >= 75 ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            📊 {data.summary.attendance_rate}%
          </span>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: '300px' }} />
        ) : (
          <div>
            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DAY_LABELS.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600, padding: '4px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {/* Empty cells for first day offset */}
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const status = data?.calendar?.[dateStr];
                const style = status ? STATUS_COLORS[status] : null;

                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)',
                      background: style ? style.bg : 'var(--bg-surface-2)',
                      color: style ? style.color : 'var(--text-muted)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: status ? 700 : 400,
                      border: `1px solid ${style ? style.color + '30' : 'transparent'}`,
                      transition: 'all 0.15s',
                      cursor: 'default',
                    }}
                    title={status ? `${dateStr}: ${status}` : dateStr}
                  >
                    <div>{day}</div>
                    {status && <div style={{ fontSize: '9px', opacity: 0.8 }}>{style.label}</div>}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Object.entries(STATUS_COLORS).map(([s, style]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: style.bg, border: `1px solid ${style.color}30` }} />
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
