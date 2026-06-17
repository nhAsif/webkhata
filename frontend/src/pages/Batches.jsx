import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const DAY_LABELS = {
  Sat: 'Saturday',
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

// NCTB Bangladesh curriculum subjects (Classes 6–10)
const SUBJECTS = [
  'Bangla',
  'Bangla Grammar & Composition',
  'English',
  'English Grammar & Composition',
  'Mathematics',
  'Science',
  'Bangladesh and Global Studies',
  'Information and Communication Technology (ICT)',
  'Agriculture Studies',
  'Home Science',
  'Arts and Crafts',
  'Physical Education and Health',
  'Work and Life-Oriented Education',
  'Music',
  'Islam and Moral Education',
  'Hindu Religion and Moral Education',
  'Buddhist Religion and Moral Education',
  'Christian Religion and Moral Education',
  // SSC Compulsory
  'Bangla First Paper',
  'Bangla Second Paper',
  'English First Paper',
  'English Second Paper',
  'Religion and Moral Education',
  // Science Group
  'Physics',
  'Chemistry',
  'Biology',
  'Higher Mathematics',
  // Business Studies Group
  'Accounting',
  'Finance and Banking',
  'Business Entrepreneurship',
  // Humanities Group
  'History of Bangladesh and World Civilization',
  'Geography and Environment',
  'Civics and Citizenship',
  'Economics',
  // Optional
  'Arabic',
  'Sanskrit',
  'Pali',
];

const EMPTY_FORM = {
  name: '',
  subject: '',
  schedule: [],
  time_slot: '',
};

const buildEmptyTimetable = () =>
  Object.fromEntries(DAYS.map((d) => [d, []]));

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'students' | 'timetable' | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  // Batch students modal state
  const [batchStudents, setBatchStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [addStudentId, setAddStudentId] = useState('');

  // Timetable modal state
  const [timetable, setTimetable] = useState(buildEmptyTimetable());
  const [ttLoading, setTtLoading] = useState(false);
  const [ttSaving, setTtSaving] = useState(false);
  const [ttInputs, setTtInputs] = useState(Object.fromEntries(DAYS.map((d) => [d, ''])));
  const [ttDropdown, setTtDropdown] = useState(Object.fromEntries(DAYS.map((d) => [d, false])));
  const inputRefs = useRef({});
  const dropdownRefs = useRef({});

  const load = () => {
    setLoading(true);
    api.get('/batches').then((r) => setBatches(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      let anyOpen = false;
      const newDd = { ...ttDropdown };
      for (const day of DAYS) {
        if (ttDropdown[day]) {
          const ref = dropdownRefs.current[day];
          if (ref && !ref.contains(event.target)) {
            newDd[day] = false;
            anyOpen = true;
          }
        }
      }
      if (anyOpen) setTtDropdown(newDd);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ttDropdown]);

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

  const openTimetable = async (batch) => {
    setSelectedBatch(batch);
    setTtLoading(true);
    setModal('timetable');
    try {
      const res = await api.get(`/batches/${batch.id}/routine`);
      const saved = res.data.weekly_timetable || {};
      // Merge with empty defaults to ensure all 7 days exist
      const merged = buildEmptyTimetable();
      for (const day of DAYS) {
        if (Array.isArray(saved[day])) merged[day] = [...saved[day]];
      }
      setTimetable(merged);
    } catch {
      setTimetable(buildEmptyTimetable());
    } finally {
      setTtLoading(false);
    }
    setTtInputs(Object.fromEntries(DAYS.map((d) => [d, ''])));
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

  // Timetable helpers
  const addSubject = (day, val) => {
    const subject = (val ?? ttInputs[day]).trim();
    if (!subject) return;
    if (timetable[day].includes(subject)) {
      toast.error(`"${subject}" already added for ${day}`);
      return;
    }
    setTimetable((tt) => ({ ...tt, [day]: [...tt[day], subject] }));
    setTtInputs((inp) => ({ ...inp, [day]: '' }));
    setTtDropdown((dd) => ({ ...dd, [day]: false }));
    inputRefs.current[day]?.focus();
  };

  const removeSubject = (day, idx) => {
    setTimetable((tt) => ({
      ...tt,
      [day]: tt[day].filter((_, i) => i !== idx),
    }));
  };

  const handleTtKeyDown = (e, day) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubject(day);
    } else if (e.key === 'Escape') {
      setTtDropdown((dd) => ({ ...dd, [day]: false }));
    }
  };

  const getSuggestions = (day) => {
    const q = ttInputs[day].trim().toLowerCase();
    const already = timetable[day];
    if (!q) {
      // Show all not yet added
      return SUBJECTS.filter((s) => !already.includes(s)).slice(0, 8);
    }
    return SUBJECTS.filter(
      (s) => s.toLowerCase().includes(q) && !already.includes(s)
    ).slice(0, 8);
  };

  const saveTimetable = async () => {
    setTtSaving(true);
    try {
      await api.put(`/batches/${selectedBatch.id}/timetable`, { weekly_timetable: timetable });
      toast.success('Timetable saved');
      setModal(null);
    } catch {
      // handled by interceptor
    } finally {
      setTtSaving(false);
    }
  };

  const schedule = selectedBatch
    ? Array.isArray(selectedBatch.schedule)
      ? selectedBatch.schedule
      : []
    : [];

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
        <button className="btn btn-secondary btn-sm" onClick={() => openTimetable(b)}>Timetable</button>
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

      {/* Weekly Timetable Modal */}
      <Modal
        isOpen={modal === 'timetable'}
        onClose={() => setModal(null)}
        title={`Weekly Timetable — ${selectedBatch?.name}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTimetable} disabled={ttSaving || ttLoading}>
              {ttSaving ? <span className="spinner" /> : null}
              Save Timetable
            </button>
          </>
        }
      >
        {ttLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Active days notice */}
            {schedule.length > 0 && (
              <div style={{
                padding: '0.5rem 0.875rem',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <span>📅 Active days:</span>
                {schedule.map((d) => (
                  <span key={d} className="badge badge-info">{DAY_LABELS[d] || d}</span>
                ))}
              </div>
            )}

            {/* Per-day timetable editor */}
            {DAYS.map((day) => {
              const isActive = schedule.includes(day);
              return (
                  <div
                  key={day}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isActive ? 'var(--color-brand)' : 'var(--border)'}`,
                    background: isActive ? 'color-mix(in srgb, var(--color-brand) 5%, var(--bg-surface))' : 'var(--bg-surface-2)',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Day header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.875rem',
                    borderBottom: timetable[day].length > 0 || isActive ? '1px solid var(--border)' : 'none',
                    background: isActive
                      ? 'color-mix(in srgb, var(--color-brand) 12%, var(--bg-surface))'
                      : 'transparent',
                    borderTopLeftRadius: 'calc(var(--radius-md) - 1px)',
                    borderTopRightRadius: 'calc(var(--radius-md) - 1px)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {DAY_LABELS[day]}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        color: isActive ? 'var(--color-brand)' : 'var(--text-muted)',
                        fontWeight: 500,
                      }}>
                        {isActive ? '● Active' : '○ Off'}
                      </span>
                    </div>
                    <span className="badge badge-default" style={{ minWidth: '1.5rem', textAlign: 'center' }}>
                      {timetable[day].length}
                    </span>
                  </div>

                  {/* Subjects list + input */}
                  <div style={{ padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Subject chips */}
                    {timetable[day].length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {timetable[day].map((subj, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '99px',
                              background: isActive
                                ? 'color-mix(in srgb, var(--color-brand) 18%, var(--bg-surface))'
                                : 'var(--bg-surface)',
                              border: `1px solid ${isActive ? 'var(--color-brand)' : 'var(--border)'}`,
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              color: isActive ? 'var(--color-brand)' : 'var(--text-primary)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {subj}
                            <button
                              type="button"
                              onClick={() => removeSubject(day, idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                                lineHeight: 1,
                                color: 'inherit',
                                opacity: 0.6,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={`Remove ${subj}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input row */}
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }} ref={el => dropdownRefs.current[day] = el}>
                      <input
                        ref={(el) => { inputRefs.current[day] = el; }}
                        className="form-input"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.3rem 0.6rem', height: '2rem' }}
                        placeholder={`Add subject for ${day}…`}
                        value={ttInputs[day]}
                        onChange={(e) => setTtInputs((inp) => ({ ...inp, [day]: e.target.value }))}
                        onKeyDown={(e) => handleTtKeyDown(e, day)}
                        onFocus={() => setTtDropdown(dd => ({...dd, [day]: true}))}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => addSubject(day)}
                        disabled={!ttInputs[day].trim()}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        + Add
                      </button>

                      {/* Dropdown */}
                      {ttDropdown[day] && getSuggestions(day).length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: '60px',
                          marginTop: '4px',
                          background: 'var(--bg-surface-3)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-md)',
                          zIndex: 10,
                          maxHeight: '150px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.25rem'
                        }}>
                          {getSuggestions(day).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => addSubject(day, s)}
                              style={{
                                textAlign: 'left',
                                padding: '0.4rem 0.6rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                borderRadius: '4px'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
