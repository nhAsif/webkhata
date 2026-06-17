import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const STATUS_OPTS = ['not_submitted', 'submitted', 'late'];
const STATUS_BADGE = {
  submitted: 'badge-success',
  not_submitted: 'badge-danger',
  late: 'badge-warning',
};
const STATUS_ICON = {
  submitted: '✓',
  not_submitted: '✗',
  late: '⚠',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Homework() {
  const [batches, setBatches] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    batch_id: '',
    title: '',
    description: '',
    assigned_date: today(),
    due_date: '',
  });
  const [saving, setSaving] = useState(false);

  // Submissions modal
  const [submModal, setSubmModal] = useState(false);
  const [selectedHw, setSelectedHw] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submSaving, setSubmSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const url = filterBatch ? `/homework?batch_id=${filterBatch}` : '/homework';
    api.get(url).then((r) => setHomework(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/batches?status=active').then((r) => setBatches(r.data));
  }, []);

  useEffect(load, [filterBatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/homework', {
        ...form,
        batch_id: parseInt(form.batch_id),
      });
      toast.success('Homework assigned');
      setCreateModal(false);
      load();
    } catch {} finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (hw) => {
    setSelectedHw(hw);
    const res = await api.get(`/homework/${hw.id}/submissions`);
    setSubmissions(res.data.map((s) => ({ ...s })));
    setSubmModal(true);
  };

  const cycleStatus = (idx) => {
    setSubmissions((prev) => {
      const updated = [...prev];
      const cur = updated[idx].status;
      const next = STATUS_OPTS[(STATUS_OPTS.indexOf(cur) + 1) % STATUS_OPTS.length];
      updated[idx] = { ...updated[idx], status: next };
      return updated;
    });
  };

  const handleSaveSubmissions = async () => {
    setSubmSaving(true);
    try {
      await api.put(`/homework/${selectedHw.id}/submissions`, submissions.map((s) => ({
        student_id: s.student_id,
        status: s.status,
        feedback: s.feedback,
      })));
      toast.success('Submissions updated');
      setSubmModal(false);
    } catch {} finally {
      setSubmSaving(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'batch_id', label: 'Batch', render: (hw) => {
      const batch = batches.find((b) => b.id === hw.batch_id);
      return batch ? <span className="badge badge-info">{batch.name}</span> : '—';
    }},
    { key: 'assigned_date', label: 'Assigned' },
    { key: 'due_date', label: 'Due Date', render: (hw) => {
      const overdue = new Date(hw.due_date) < new Date() && hw.due_date !== today();
      return (
        <span style={{ color: overdue ? 'var(--color-danger)' : 'inherit' }}>
          {hw.due_date} {overdue ? '⚠' : ''}
        </span>
      );
    }},
    { key: 'submission_count', label: 'Submissions', render: (hw) => (
      <span className="badge badge-default">{hw.submission_count} students</span>
    )},
    { key: 'actions', label: '', render: (hw) => (
      <button className="btn btn-secondary btn-sm" onClick={() => openSubmissions(hw)}>
        Track Submissions
      </button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Homework</h1>
          <p className="page-subtitle">Assign and track homework submissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Assign Homework</button>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-3 items-center">
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Filter by batch:</label>
          <select
            className="form-select"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <option value="">All batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={homework}
        loading={loading}
        searchPlaceholder="Search homework..."
        searchKeys={['title']}
        emptyTitle="No homework assigned"
        emptyDesc="Assign homework to a batch to get started."
        emptyAction={<button className="btn btn-primary" onClick={() => setCreateModal(true)}>Assign Homework</button>}
      />

      {/* Create Homework Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Assign Homework"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="hw-form" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : null} Assign
            </button>
          </>
        }
      >
        <form id="hw-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Batch *</label>
            <select
              className="form-select"
              value={form.batch_id}
              onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
              required
            >
              <option value="">Select batch...</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Chapter 3 exercises"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Assigned Date</label>
              <input
                type="date"
                className="form-input"
                value={form.assigned_date}
                onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                required
                min={form.assigned_date}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Submissions Tracking Modal */}
      <Modal
        isOpen={submModal}
        onClose={() => setSubmModal(false)}
        title={`Submissions — ${selectedHw?.title}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSubmModal(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleSaveSubmissions} disabled={submSaving}>
              {submSaving ? <span className="spinner" /> : null} Save
            </button>
          </>
        }
      >
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Click a student row to cycle through submission statuses. Add feedback below.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {submissions.map((sub, i) => (
            <div
              key={sub.id}
              style={{
                padding: '0.75rem',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <div style={{ flex: 1, fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                  {sub.student_name}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {STATUS_OPTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm ${sub.status === s ? STATUS_BADGE[s].replace('badge-', 'btn-') : 'btn-secondary'}`}
                      onClick={() => {
                        setSubmissions((prev) => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], status: s };
                          return updated;
                        });
                      }}
                    >
                      {STATUS_ICON[s]} {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className="form-input"
                style={{ fontSize: 'var(--font-size-xs)' }}
                placeholder="Feedback (optional)..."
                value={sub.feedback || ''}
                onChange={(e) => {
                  setSubmissions((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], feedback: e.target.value };
                    return updated;
                  });
                }}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
