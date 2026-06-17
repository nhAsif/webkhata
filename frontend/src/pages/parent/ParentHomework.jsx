import { useEffect, useState } from 'react';
import api from '../../api/client';

const STATUS_BADGE = {
  submitted: { cls: 'badge-success', icon: '✓', label: 'Submitted' },
  not_submitted: { cls: 'badge-danger', icon: '✗', label: 'Not Submitted' },
  late: { cls: 'badge-warning', icon: '⚠', label: 'Late' },
};

export default function ParentHomework() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/homework').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Homework</h1></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
        </div>
      </div>
    );
  }

  const homework = data?.homework || [];
  const pending = homework.filter((h) => h.submission_status !== 'submitted');
  const submitted = homework.filter((h) => h.submission_status === 'submitted');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Homework</h1>
          <p className="page-subtitle">Assignments and submission status</p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-danger">{pending.length} pending</span>
          <span className="badge badge-success">{submitted.length} submitted</span>
        </div>
      </div>

      {homework.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No homework assigned yet</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {homework.map((hw, i) => {
            const statusInfo = STATUS_BADGE[hw.submission_status] || STATUS_BADGE.not_submitted;
            const isOverdue = hw.due_date < today && hw.submission_status !== 'submitted';
            const isPending = hw.due_date >= today && hw.submission_status !== 'submitted';

            return (
              <div
                key={i}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{hw.title}</div>
                    {hw.description && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '0.25rem' }}>
                        {hw.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="text-xs text-muted">
                        📅 Assigned: {hw.assigned_date}
                      </span>
                      <span className="text-xs" style={{ color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                        ⏰ Due: {hw.due_date} {isOverdue ? '(Overdue!)' : ''}
                      </span>
                    </div>
                    {hw.feedback && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        borderLeft: '3px solid var(--color-brand)',
                      }}>
                        <strong>Feedback:</strong> {hw.feedback}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${statusInfo.cls}`} style={{ fontSize: 'var(--font-size-sm)', padding: '0.3rem 0.75rem' }}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
