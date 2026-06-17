import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'bank'];

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);

  // Generate modal
  const [genModal, setGenModal] = useState(false);
  const [genAmount, setGenAmount] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genSaving, setGenSaving] = useState(false);

  // Payment modal
  const [payModal, setPayModal] = useState(false);
  const [payFee, setPayFee] = useState(null);
  const [payForm, setPayForm] = useState({ amount_paid: '', payment_method: 'cash', payment_date: '', notes: '' });
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/fees?month=${month}`),
      api.get(`/fees/summary/monthly?month=${month}`),
    ]).then(([feesRes, sumRes]) => {
      setFees(feesRes.data);
      setSummary(sumRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [month]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenSaving(true);
    try {
      const res = await api.post('/fees/generate', {
        month: genMonth,
        amount_due: parseFloat(genAmount),
      });
      toast.success(res.data.message);
      setGenModal(false);
      load();
    } catch {} finally {
      setGenSaving(false);
    }
  };

  const openPayment = (fee) => {
    setPayFee(fee);
    setPayForm({
      amount_paid: fee.amount_paid || '',
      payment_method: fee.payment_method || 'cash',
      payment_date: fee.payment_date || new Date().toISOString().split('T')[0],
      notes: fee.notes || '',
    });
    setPayModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaySaving(true);
    try {
      await api.put(`/fees/${payFee.id}`, {
        amount_paid: parseFloat(payForm.amount_paid),
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date || null,
        notes: payForm.notes || null,
      });
      toast.success('Payment recorded');
      setPayModal(false);
      load();
    } catch {} finally {
      setPaySaving(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      paid: 'badge-success',
      unpaid: 'badge-danger',
      partial: 'badge-warning',
    };
    return <span className={`badge ${map[status] || 'badge-default'}`}>{status}</span>;
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'month', label: 'Month' },
    { key: 'amount_due', label: 'Amount Due', render: (f) => `৳${f.amount_due.toLocaleString()}` },
    { key: 'amount_paid', label: 'Paid', render: (f) => (
      <span style={{ color: f.amount_paid > 0 ? 'var(--color-success)' : 'var(--text-muted)' }}>
        ৳{f.amount_paid.toLocaleString()}
      </span>
    )},
    { key: 'status', label: 'Status', render: (f) => statusBadge(f.status) },
    { key: 'payment_method', label: 'Method', render: (f) => f.payment_method || '—' },
    { key: 'actions', label: '', render: (f) => (
      <button
        className="btn btn-primary btn-sm"
        onClick={() => openPayment(f)}
      >
        Record Payment
      </button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fees</h1>
          <p className="page-subtitle">Track monthly fee collection</p>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            className="form-input"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button className="btn btn-primary" onClick={() => setGenModal(true)}>
            ⚡ Generate Fees
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
            <div className="stat-label">Collected</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              ৳{summary.total_collected.toLocaleString()}
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
            <div className="stat-label">Outstanding</div>
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
              ৳{summary.outstanding.toLocaleString()}
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
            <div className="stat-label">Total Due</div>
            <div className="stat-value">৳{summary.total_due.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status Breakdown</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-success">✅ {summary.paid_count} paid</span>
              <span className="badge badge-warning">⚡ {summary.partial_count} partial</span>
              <span className="badge badge-danger">❌ {summary.unpaid_count} unpaid</span>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={fees}
        loading={loading}
        searchPlaceholder="Search student..."
        searchKeys={['student_name']}
        emptyTitle="No fee records for this month"
        emptyDesc="Generate fees for all active students using the button above."
        emptyAction={<button className="btn btn-primary" onClick={() => setGenModal(true)}>Generate Fees</button>}
      />

      {/* Generate Modal */}
      <Modal
        isOpen={genModal}
        onClose={() => setGenModal(false)}
        title="Generate Monthly Fees"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setGenModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="gen-form" type="submit" disabled={genSaving}>
              {genSaving ? <span className="spinner" /> : null}
              Generate
            </button>
          </>
        }
      >
        <form id="gen-form" onSubmit={handleGenerate}>
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <span>ℹ️</span>
            This will create fee records for all active students. Existing records will be skipped.
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Month</label>
              <input
                type="month"
                className="form-input"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Due (৳) *</label>
              <input
                type="number"
                className="form-input"
                value={genAmount}
                onChange={(e) => setGenAmount(e.target.value)}
                required
                min="1"
                placeholder="e.g. 1500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title={`Record Payment — ${payFee?.student_name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="pay-form" type="submit" disabled={paySaving}>
              {paySaving ? <span className="spinner" /> : null}
              Save Payment
            </button>
          </>
        }
      >
        {payFee && (
          <form id="pay-form" onSubmit={handlePayment}>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <span>💰</span>
              <div>
                Amount due: <strong>৳{payFee.amount_due.toLocaleString()}</strong>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Amount Paid (৳) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={payForm.amount_paid}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount_paid: e.target.value }))}
                  required
                  min="0"
                  max={payFee.amount_due}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional note..."
                rows={2}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
