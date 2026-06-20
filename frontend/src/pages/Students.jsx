import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import Button from '../components/Button';
import { useTranslation } from '../contexts/LanguageContext';

const CLASS_LEVELS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'JSC', 'SSC'];
const SUBJECTS_LIST = ['Math', 'English', 'Science', 'Bangla', 'BGS', 'Religion', 'Physics', 'Chemistry', 'Biology', 'ICT'];

const EMPTY_FORM = {
  name: '',
  class_level: 'Class 6',
  subjects: [],
  guardian_name: '',
  guardian_phone: '',
  parent_username: '',
  parent_password: '',
  address: '',
  monthly_fee: '',
  start_date: new Date().toISOString().split('T')[0],
};

function statusBadge(status, t) {
  const isActive = status === 'active';
  return (
    <span 
      className={`inline-flex px-2.5 py-0.5 border-2 border-black text-xs font-mono font-bold capitalize shadow-[2.5px_2.5px_0px_var(--neo-shadow)] ${
        isActive 
          ? 'bg-[#C4B5FD] text-black' 
          : 'bg-[#FAF6EE] text-black/50'
      }`}
    >
      {t(status)}
    </span>
  );
}

export default function Students() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
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
    setPhotoFile(null);
    setPhotoPreview(null);
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
      monthly_fee: s.monthly_fee || '',
      start_date: s.start_date || new Date().toISOString().split('T')[0],
    });
    setEditId(s.id);
    setPhotoFile(null);
    setPhotoPreview(s.photo_path ? `/${s.photo_path}` : null);
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let studentId = editId;
      if (modal === 'add') {
        const res = await api.post('/students', form);
        studentId = res.data.id;
        toast.success(t('Student added successfully'));
      } else {
        await api.put(`/students/${studentId}`, form);
        toast.success(t('Student updated successfully'));
      }

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/students/${studentId}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
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
    toast.success(newStatus === 'active' ? t('Student reactivated') : t('Student archived'));
    load();
  };

  const deleteStudent = async (id) => {
    if (!confirm(t('Are you sure you want to permanently delete this student? All their records will be lost.'))) return;
    await api.delete(`/students/${id}`);
    toast.success(t('Student deleted permanently'));
    load();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const columns = [
    { key: 'photo', label: t('Photo'), render: (s) => (
      <div className="w-10 h-10 border-2 border-black bg-[#FFD93D] flex items-center justify-center shadow-[2px_2px_0px_var(--neo-shadow)] shrink-0 relative overflow-hidden">
        {s.photo_path ? (
          <img src={`/${s.photo_path}`} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
    )},
    { key: 'name', label: t('Name'), render: (s) => (
      <Button
        variant="link"
        className="font-bold text-bitcoin hover:text-gold text-left justify-start"
        onClick={() => navigate(`/students/${s.id}`)}
      >
        {s.name}
      </Button>
    )},
    { key: 'class_level', label: t('Class'), render: (s) => (
      <span className="border-2 border-black bg-[#FFD93D] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">
        {t(s.class_level)}
      </span>
    )},
    { key: 'subjects', label: t('Subjects'), className: 'hidden', render: (s) => (
      <span className="text-xs text-stardust font-body">
        {(Array.isArray(s.subjects) ? s.subjects : []).map(sub => t(sub)).join(', ') || '—'}
      </span>
    )},
    { key: 'guardian_name', label: t('Guardian'), className: 'hidden' },
    { key: 'guardian_phone', label: t('Phone'), className: 'hidden', render: (s) => (
      <span className="font-mono text-sm">{s.guardian_phone}</span>
    ) },
    { key: 'monthly_fee', label: t('Monthly Fee'), render: (s) => (
      <span className="font-mono text-sm font-bold text-bitcoin">৳{(s.monthly_fee ?? 0).toLocaleString()}</span>
    ) },
    { key: 'start_date', label: t('Start Date'), render: (s) => (
      <span className="font-mono text-xs text-stardust">{s.start_date || '—'}</span>
    ) },
    { key: 'parent_code', label: t('Parent Login / Code'), className: 'hidden', render: (s) => (
      <div className="flex flex-col gap-1">
        <code className="text-xs bg-white border-2 border-black px-2 py-0.5 text-black font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)] w-max">
          {s.parent_username || '-'}
        </code>
        <code className="text-[10px] text-black/60 font-mono font-bold">
          {t("Code")}: {s.parent_code}
        </code>
      </div>
    )},
    { key: 'status', label: t('Status'), className: 'hidden', render: (s) => statusBadge(s.status, t) },
    { key: 'actions', label: '', render: (s) => (
      <div className="flex items-center gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>{t('Edit')}</Button>
        <Button
          size="sm"
          variant={s.status === 'active' ? 'secondary' : 'success'}
          onClick={() => toggleStatus(s)}
        >
          {s.status === 'active' ? t('Archive') : t('Activate')}
        </Button>
        <Button variant="danger" size="sm" onClick={() => deleteStudent(s.id)}>{t('Delete')}</Button>
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
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight">{t('Students')}</h1>
          <p className="text-sm text-stardust mt-1">{students.length} {t('students enrolled')}</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ {t('Add Student')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        searchPlaceholder={t('Search students...')}
        searchKeys={['name', 'guardian_name', 'guardian_phone']}
        emptyTitle={t('No students yet')}
        emptyDesc={t('Add your first student to get started.')}
        emptyAction={
          <Button variant="primary" onClick={openAdd}>{t('Add Student')}</Button>
        }
      />

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? t('Add New Student') : t('Edit Student')}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setModal(null)}>{t('Cancel')}</Button>
            <Button variant="primary" form="student-form" type="submit" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : null}
              {modal === 'add' ? t('Add Student') : t('Save Changes')}
            </Button>
          </div>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3 pb-3 border-b-4 border-black">
            <div className="relative group w-24 h-24 border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_var(--neo-shadow)] transition-colors hover:border-black overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-black/40 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{t('Upload')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-xs text-black/60 font-bold uppercase font-heading tracking-wider">{t('Profile Picture (Optional)')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Full Name *')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder={t("Student's full name")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Class Level *')}</label>
              <Select
                value={form.class_level}
                onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}
              >
                {CLASS_LEVELS.map((c) => <option key={c} value={c}>{t(c)}</option>)}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Guardian Name *')}</label>
              <Input
                value={form.guardian_name}
                onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))}
                required
                placeholder={t('Parent/Guardian name')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Guardian Phone *')}</label>
              <Input
                value={form.guardian_phone}
                onChange={(e) => setForm((f) => ({ ...f, guardian_phone: e.target.value }))}
                required
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Parent Username *')}</label>
              <Input
                value={form.parent_username}
                onChange={(e) => setForm((f) => ({ ...f, parent_username: e.target.value }))}
                required
                placeholder={t('Parent login username')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">
                {t('Parent Password')} {modal === 'edit' && `(${t('Leave blank to keep current')})`}
              </label>
              <Input
                type="password"
                value={form.parent_password}
                onChange={(e) => setForm((f) => ({ ...f, parent_password: e.target.value }))}
                required={modal === 'add'}
                minLength={6}
                placeholder={modal === 'add' ? t('Min 6 characters') : t('New password (optional)')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Monthly Fee (৳) *')}</label>
              <Input
                type="number"
                min="1"
                value={form.monthly_fee}
                onChange={(e) => setForm((f) => ({ ...f, monthly_fee: e.target.value }))}
                required
                placeholder="e.g. 500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Start Date *')}</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Subjects *')}</label>
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
                    {t(sub)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-black font-heading uppercase tracking-wider">{t('Address')}</label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder={t('Home address (optional)')}
              rows={2}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
