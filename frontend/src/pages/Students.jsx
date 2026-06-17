import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const CLASS_LEVELS = ['JSC', 'SSC'];
const SUBJECTS_LIST = ['Math', 'English', 'Science', 'Bangla', 'BGS', 'Religion', 'Physics', 'Chemistry', 'Biology', 'ICT'];

const EMPTY_FORM = {
  name: '',
  class_level: 'SSC',
  subjects: [],
  guardian_name: '',
  guardian_phone: '',
  parent_username: '',
  parent_password: '',
  address: '',
};

function statusBadge(status) {
  return (
    <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-default'}`}>
      {status}
    </span>
  );
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/students').then((r) => setStudents(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (s) => {
    setForm({
      name: s.name,
      class_level: s.class_level,
      subjects: Array.isArray(s.subjects) ? s.subjects : [],
      guardian_name: s.guardian_name,
      guardian_phone: s.guardian_phone,
      parent_username: s.parent_username || '',
      parent_password: '', // Leave blank when editing to avoid overwriting unless intended
      address: s.address || '',
    });
    setEditId(s.id);
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.post('/students', form);
        toast.success('Student added successfully');
      } else {
        await api.put(`/students/${editId}`, form);
        toast.success('Student updated');
      }
      setModal(null);
      load();
    } catch (err) {
      // toast shown by interceptor
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (s) => {
    const newStatus = s.status === 'active' ? 'inactive' : 'active';
    await api.patch(`/students/${s.id}/status`, { status: newStatus });
    toast.success(`Student ${newStatus === 'active' ? 'reactivated' : 'archived'}`);
    load();
  };

  const columns = [
    { key: 'name', label: 'Name', render: (s) => (
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontWeight: 600, color: 'var(--color-brand-light)' }}
        onClick={() => navigate(`/students/${s.id}`)}
      >
        {s.name}
      </button>
    )},
    { key: 'class_level', label: 'Class', render: (s) => (
      <span className="badge badge-info">{s.class_level}</span>
    )},
    { key: 'subjects', label: 'Subjects', render: (s) => (
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
        {(Array.isArray(s.subjects) ? s.subjects : []).join(', ') || '—'}
      </span>
    )},
    { key: 'guardian_name', label: 'Guardian' },
    { key: 'guardian_phone', label: 'Phone' },
    { key: 'parent_code', label: 'Parent Username / Code', render: (s) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <code style={{ fontSize: 'var(--font-size-xs)', background: 'var(--bg-surface-3)', padding: '2px 6px', borderRadius: 4 }}>
          {s.parent_username || '-'}
        </code>
        <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          Code: {s.parent_code}
        </code>
      </div>
    )},
    { key: 'status', label: 'Status', render: (s) => statusBadge(s.status) },
    { key: 'actions', label: '', render: (s) => (
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
        <button
          className={`btn btn-sm ${s.status === 'active' ? 'btn-danger' : 'btn-success'}`}
          onClick={() => toggleStatus(s)}
        >
          {s.status === 'active' ? 'Archive' : 'Activate'}
        </button>
      </div>
    )},
  ];

  const subjectToggle = (sub) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(sub)
        ? f.subjects.filter((s) => s !== sub)
        : [...f.subjects, sub],
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        searchPlaceholder="Search by name..."
        searchKeys={['name', 'guardian_name', 'guardian_phone']}
        emptyTitle="No students yet"
        emptyDesc="Add your first student to get started."
        emptyAction={
          <button className="btn btn-primary" onClick={openAdd}>Add Student</button>
        }
      />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="student-form" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {modal === 'add' ? 'Add Student' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Student's full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Class Level *</label>
              <select
                className="form-select"
                value={form.class_level}
                onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}
              >
                {CLASS_LEVELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Name *</label>
              <input
                className="form-input"
                value={form.guardian_name}
                onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))}
                required
                placeholder="Parent/Guardian name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Phone *</label>
              <input
                className="form-input"
                value={form.guardian_phone}
                onChange={(e) => setForm((f) => ({ ...f, guardian_phone: e.target.value }))}
                required
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Username *</label>
              <input
                className="form-input"
                value={form.parent_username}
                onChange={(e) => setForm((f) => ({ ...f, parent_username: e.target.value }))}
                required
                placeholder="Parent login username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Password {modal === 'edit' && '(Leave blank to keep current)'}</label>
              <input
                className="form-input"
                type="password"
                value={form.parent_password}
                onChange={(e) => setForm((f) => ({ ...f, parent_password: e.target.value }))}
                required={modal === 'add'}
                minLength={6}
                placeholder={modal === 'add' ? "Min 6 characters" : "New password (optional)"}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Subjects *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {SUBJECTS_LIST.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`btn btn-sm ${form.subjects.includes(sub) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => subjectToggle(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Home address (optional)"
              rows={2}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
