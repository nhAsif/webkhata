import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import Button from '../components/Button';

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
  const isActive = status === 'active';
  return (
    <span 
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border capitalize ${
        isActive 
          ? 'bg-green-500/15 border-green-500/30 text-green-400' 
          : 'bg-white/5 border-white/10 text-stardust'
      }`}
    >
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
      <Button
        variant="link"
        className="font-bold text-bitcoin hover:text-gold text-left justify-start"
        onClick={() => navigate(`/students/${s.id}`)}
      >
        {s.name}
      </Button>
    )},
    { key: 'class_level', label: 'Class', render: (s) => (
      <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono">
        {s.class_level}
      </span>
    )},
    { key: 'subjects', label: 'Subjects', render: (s) => (
      <span className="text-xs text-stardust font-body">
        {(Array.isArray(s.subjects) ? s.subjects : []).join(', ') || '—'}
      </span>
    )},
    { key: 'guardian_name', label: 'Guardian' },
    { key: 'guardian_phone', label: 'Phone', render: (s) => (
      <span className="font-mono text-sm">{s.guardian_phone}</span>
    ) },
    { key: 'parent_code', label: 'Parent Login / Code', render: (s) => (
      <div className="flex flex-col gap-1">
        <code className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-bitcoin font-mono w-max">
          {s.parent_username || '-'}
        </code>
        <code className="text-[10px] text-stardust font-mono">
          Code: {s.parent_code}
        </code>
      </div>
    )},
    { key: 'status', label: 'Status', render: (s) => statusBadge(s.status) },
    { key: 'actions', label: '', render: (s) => (
      <div className="flex items-center gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Edit</Button>
        <Button
          size="sm"
          variant={s.status === 'active' ? 'danger' : 'success'}
          onClick={() => toggleStatus(s)}
        >
          {s.status === 'active' ? 'Archive' : 'Activate'}
        </Button>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body">
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight">Students</h1>
          <p className="text-sm text-stardust mt-1">{students.length} students enrolled</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Student</Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        searchPlaceholder="Search students..."
        searchKeys={['name', 'guardian_name', 'guardian_phone']}
        emptyTitle="No students yet"
        emptyDesc="Add your first student to get started."
        emptyAction={
          <Button variant="primary" onClick={openAdd}>Add Student</Button>
        }
      />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" form="student-form" type="submit" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : null}
              {modal === 'add' ? 'Add Student' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Full Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Student's full name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Class Level *</label>
              <Select
                value={form.class_level}
                onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}
              >
                {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Guardian Name *</label>
              <Input
                value={form.guardian_name}
                onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))}
                required
                placeholder="Parent/Guardian name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Guardian Phone *</label>
              <Input
                value={form.guardian_phone}
                onChange={(e) => setForm((f) => ({ ...f, guardian_phone: e.target.value }))}
                required
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Parent Username *</label>
              <Input
                value={form.parent_username}
                onChange={(e) => setForm((f) => ({ ...f, parent_username: e.target.value }))}
                required
                placeholder="Parent login username"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">
                Parent Password {modal === 'edit' && '(Leave blank to keep current)'}
              </label>
              <Input
                type="password"
                value={form.parent_password}
                onChange={(e) => setForm((f) => ({ ...f, parent_password: e.target.value }))}
                required={modal === 'add'}
                minLength={6}
                placeholder={modal === 'add' ? "Min 6 characters" : "New password (optional)"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Subjects *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SUBJECTS_LIST.map((sub) => {
                const isSelected = form.subjects.includes(sub);
                return (
                  <Button
                    key={sub}
                    type="button"
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    className={isSelected ? 'h-9 px-3.5' : 'h-9 px-3.5 opacity-80'}
                    onClick={() => subjectToggle(sub)}
                  >
                    {sub}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Address</label>
            <Textarea
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
