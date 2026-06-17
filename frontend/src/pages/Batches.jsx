import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const EMPTY_FORM = {
  name: '',
  subject: '',
  schedule: [],
  time_slot: '',
};

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'students' | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  // Batch students modal state
  const [batchStudents, setBatchStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [addStudentId, setAddStudentId] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/batches').then((r) => setBatches(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (b) => {
    setForm({
      name: b.name,
      subject: b.subject,
      schedule: Array.isArray(b.schedule) ? b.schedule : [],
      time_slot: b.time_slot,
    });
    setEditId(b.id);
    setModal('edit');
  };

  const openStudents = async (batch) => {
    setSelectedBatch(batch);
    const [bsRes, allRes] = await Promise.all([
      api.get(`/batches/${batch.id}/students`),
      api.get('/students?status=active'),
    ]);
    setBatchStudents(bsRes.data);
    setAllStudents(allRes.data);
    setModal('students');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/batches', form);
        toast.success('Batch created');
      } else {
        await api.put(`/batches/${editId}`, form);
        toast.success('Batch updated');
      }
      setModal(null);
      load();
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const archiveBatch = async (id) => {
    if (!confirm('Archive this batch?')) return;
    await api.delete(`/batches/${id}`);
    toast.success('Batch archived');
    load();
  };

  const addStudent = async () => {
    if (!addStudentId) return;
    try {
      await api.post(`/batches/${selectedBatch.id}/students`, { student_id: parseInt(addStudentId) });
      toast.success('Student added to batch');
      const res = await api.get(`/batches/${selectedBatch.id}/students`);
      setBatchStudents(res.data);
      setAddStudentId('');
    } catch {}
  };

  const removeStudent = async (studentId) => {
    await api.delete(`/batches/${selectedBatch.id}/students/${studentId}`);
    toast.success('Student removed');
    const res = await api.get(`/batches/${selectedBatch.id}/students`);
    setBatchStudents(res.data);
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.includes(day)
        ? f.schedule.filter((d) => d !== day)
        : [...f.schedule, day],
    }));
  };

  const columns = [
    { key: 'name', label: 'Batch Name' },
    { key: 'subject', label: 'Subject' },
    { key: 'schedule', label: 'Schedule', render: (b) => (
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {(Array.isArray(b.schedule) ? b.schedule : []).map((d) => (
          <span key={d} className="badge badge-info">{d}</span>
        ))}
      </div>
    )},
    { key: 'time_slot', label: 'Time' },
    { key: 'student_count', label: 'Students', render: (b) => (
      <span className="badge badge-default">{b.student_count ?? 0}</span>
    )},
    { key: 'status', label: 'Status', render: (b) => (
      <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-default'}`}>
        {b.status}
      </span>
    )},
    { key: 'actions', label: '', render: (b) => (
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => openStudents(b)}>Roster</button>
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => archiveBatch(b.id)}>Archive</button>
      </div>
    )},
  ];

  const enrolledIds = new Set(batchStudents.map((s) => s.id));
  const notEnrolled = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">Manage class groups and student rosters</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Create Batch</button>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        loading={loading}
        searchPlaceholder="Search batches..."
        searchKeys={['name', 'subject']}
        emptyTitle="No batches yet"
        emptyDesc="Create your first batch to organize students."
        emptyAction={<button className="btn btn-primary" onClick={openAdd}>Create Batch</button>}
      />

      {/* Add/Edit Batch Modal */}
      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create Batch' : 'Edit Batch'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="batch-form" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              Save
            </button>
          </>
        }
      >
        <form id="batch-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. SSC Math — Batch A"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                className="form-input"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <input
                className="form-input"
                value={form.time_slot}
                onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
                required
                placeholder="e.g. 5:00 PM"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Schedule Days *</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`btn btn-sm ${form.schedule.includes(day) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Batch Students Modal */}
      <Modal
        isOpen={modal === 'students'}
        onClose={() => setModal(null)}
        title={`Roster — ${selectedBatch?.name}`}
        size="lg"
      >
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <select
              className="form-select"
              value={addStudentId}
              onChange={(e) => setAddStudentId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select student to add...</option>
              {notEnrolled.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class_level})
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={addStudent} disabled={!addStudentId}>
              Add
            </button>
          </div>

          {batchStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {batchStudents.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.625rem 0.875rem',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="text-xs text-muted">{s.class_level} · {s.guardian_phone}</div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeStudent(s.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
