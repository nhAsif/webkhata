import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ParentFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/fees').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const map = { paid: 'badge-success', unpaid: 'badge-danger', partial: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Fees</h1></div>
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fees</h1>
          <p className="page-subtitle">Monthly fee status and payment history</p>
        </div>
      </div>

      {/* Current Month */}
      {data?.current_month && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Current Month — {data.current_month.month}</h2>
            {statusBadge(data.current_month.status)}
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
              <div className="stat-label">Amount Due</div>
              <div className="stat-value">৳{data.current_month.amount_due?.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
              <div className="stat-label">Amount Paid</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                ৳{data.current_month.amount_paid?.toLocaleString()}
              </div>
            </div>
            <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
              <div className="stat-label">Remaining</div>
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
                ৳{(data.current_month.amount_due - data.current_month.amount_paid)?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {!data?.current_month && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No fee record for current month</div>
            <div className="empty-state-desc">Contact your tutor for fee information.</div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Payment History</h2>
        </div>

        {data?.history?.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">No payment history</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {data?.history?.map((fee, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{fee.month}</td>
                    <td>৳{fee.amount_due?.toLocaleString()}</td>
                    <td style={{ color: fee.amount_paid > 0 ? 'var(--color-success)' : 'inherit' }}>
                      ৳{fee.amount_paid?.toLocaleString()}
                    </td>
                    <td>{statusBadge(fee.status)}</td>
                    <td>{fee.payment_date || '—'}</td>
                    <td>{fee.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
