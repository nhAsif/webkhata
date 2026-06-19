import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Input, Select } from '../components/Input';
import Button from '../components/Button';
import { Calendar, Trash2, Edit2, Users, BookOpen, Clock, AlertTriangle, Plus, X } from 'lucide-react';

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
  'Bangla First Paper',
  'Bangla Second Paper',
  'English First Paper',
  'English Second Paper',
  'Religion and Moral Education',
  'Physics',
  'Chemistry',
  'Biology',
  'Higher Mathematics',
  'Accounting',
  'Finance and Banking',
  'Business Entrepreneurship',
  'History of Bangladesh and World Civilization',
  'Geography and Environment',
  'Civics and Citizenship',
  'Economics',
  'Arabic',
  'Sanskrit',
  'Pali',
  'Christianity',
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

  const deleteBatch = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this batch? This action cannot be undone.')) return;
    await api.delete(`/batches/${id}/permanent`);
    toast.success('Batch deleted permanently');
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
    { key: 'name', label: 'Batch Name', render: (b) => (
      <span className="font-semibold text-pure">{b.name}</span>
    ) },
    { key: 'subject', label: 'Subject' },
    { key: 'schedule', label: 'Schedule Days', render: (b) => (
      <div className="flex gap-1.5 flex-wrap">
        {(Array.isArray(b.schedule) ? b.schedule : []).map((d) => (
          <span key={d} className="inline-flex px-2 py-0.5 border-2 border-black text-black bg-[#C4B5FD]/30 font-mono text-[10px] uppercase font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            {d}
          </span>
        ))}
      </div>
    )},
    { key: 'time_slot', label: 'Time', render: (b) => (
      <span className="font-mono text-xs text-stardust flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-bitcoin" /> {b.time_slot}
      </span>
    ) },
    { key: 'student_count', label: 'Students', render: (b) => (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border-2 border-black text-black bg-[#C4B5FD] font-mono text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <Users className="w-3.5 h-3.5" /> {b.student_count ?? 0}
      </span>
    )},
    { key: 'status', label: 'Status', render: (b) => (
      <span className={`inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase tracking-wider font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
        b.status === 'active' ? 'bg-[#4ADE80]' : 'bg-[#E2E8F0] text-black/60'
      }`}>
        {b.status}
      </span>
    )},
    { key: 'actions', label: '', render: (b) => (
      <div className="flex items-center gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={() => openStudents(b)}>Roster</Button>
        <Button variant="secondary" size="sm" onClick={() => openTimetable(b)}>Timetable</Button>
        <Button variant="secondary" size="sm" onClick={() => openEdit(b)}>Edit</Button>
        <Button variant="secondary" size="sm" onClick={() => archiveBatch(b.id)}>Archive</Button>
        <Button variant="danger" size="sm" onClick={() => deleteBatch(b.id)}>Delete</Button>
      </div>
    )},
  ];

  const enrolledIds = new Set(batchStudents.map((s) => s.id));
  const notEnrolled = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body">
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight">Batches</h1>
          <p className="text-sm text-stardust mt-1">Manage class groups and student rosters</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Create Batch</Button>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        loading={loading}
        searchPlaceholder="Search batches..."
        searchKeys={['name', 'subject']}
        emptyTitle="No batches yet"
        emptyDesc="Create your first batch to organize students."
        emptyAction={<Button variant="primary" onClick={openAdd}>Create Batch</Button>}
      />

      {/* Add/Edit Batch Modal */}
      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create Batch' : 'Edit Batch'}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" form="batch-form" type="submit" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </div>
        }
      >
        <form id="batch-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-sm font-medium text-stardust">Batch Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. SSC Math — Batch A"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Subject *</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Time Slot *</label>
              <Input
                value={form.time_slot}
                onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
                required
                placeholder="e.g. 5:00 PM"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Schedule Days *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map((day) => {
                const isSelected = form.schedule.includes(day);
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    className={isSelected ? 'h-9 px-4 font-semibold' : 'h-9 px-4 opacity-80'}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </Button>
                );
              })}
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
        <div className="space-y-5">
          <div className="flex gap-3 items-center">
            <Select
              value={addStudentId}
              onChange={(e) => setAddStudentId(e.target.value)}
              className="flex-1"
            >
              <option value="">Select student to add...</option>
              {notEnrolled.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class_level})
                </option>
              ))}
            </Select>
            <Button variant="primary" onClick={addStudent} disabled={!addStudentId}>
              Add
            </Button>
          </div>

          {batchStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-4 border-black bg-[#FAF6EE] text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-semibold text-black">No students yet</div>
              <div className="text-xs text-black/65 mt-1">Select a student from the dropdown above to add them.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {batchStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3.5 bg-white border-2 border-black gap-3 transition-colors hover:bg-neutral-50"
                >
                  <div>
                    <div className="font-semibold text-black text-sm">{s.name}</div>
                    <div className="text-xs text-black/60 font-mono mt-0.5">{s.class_level} · {s.guardian_phone}</div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeStudent(s.id)}
                  >
                    Remove
                  </Button>
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
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveTimetable} disabled={ttSaving || ttLoading}>
              {ttSaving ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : null}
              Save Timetable
            </Button>
          </div>
        }
      >
        {ttLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-8 h-8 border-2 border-bitcoin/30 border-t-bitcoin rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active days notice */}
            {schedule.length > 0 && (
              <div className="p-3 bg-[#FAF6EE] border-2 border-black text-xs text-black/75 flex items-center gap-2 flex-wrap">
                <span className="font-mono uppercase font-bold text-black">📅 Active days:</span>
                {schedule.map((d) => (
                  <span key={d} className="inline-flex px-2 py-0.5 border-2 border-black bg-[#FFD93D] text-black font-mono text-[10px] uppercase font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {DAY_LABELS[d] || d}
                  </span>
                ))}
              </div>
            )}

            {/* Per-day timetable editor */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {DAYS.map((day) => {
                const isActive = schedule.includes(day);
                return (
                  <div
                    key={day}
                    className={`relative border-2 border-black transition-all duration-300 ${ttDropdown[day] ? 'z-50' : 'z-0'} ${
                      isActive 
                        ? 'bg-[#FFD93D]/5' 
                        : 'bg-neutral-100 opacity-60'
                    }`}
                  >
                    {/* Day header */}
                    <div className={`flex items-center justify-between px-4 py-2.5 border-b-2 border-black ${
                      isActive ? 'bg-[#FFD93D]/10' : 'bg-neutral-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-black">
                          {DAY_LABELS[day]}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                          isActive ? 'text-black' : 'text-black/55'
                        }`}>
                          {isActive ? '● Active' : '○ Off'}
                        </span>
                      </div>
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-bold font-mono border border-black bg-white text-black">
                        {timetable[day].length}
                      </span>
                    </div>

                    {/* Subjects list + input */}
                    <div className="p-4 space-y-3">
                      {/* Subject chips */}
                      {timetable[day].length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {timetable[day].map((subj, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border border-black text-xs font-bold font-body ${
                                isActive
                                  ? 'bg-[#FFD93D]/20 text-black'
                                  : 'bg-[#E2E8F0] text-black/70'
                              }`}
                            >
                              {subj}
                              <button
                                type="button"
                                onClick={() => removeSubject(day, idx)}
                                className="text-[10px] opacity-60 hover:opacity-100 hover:text-red-400 transition-colors"
                                title={`Remove ${subj}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Input row */}
                      <div className="flex gap-2 relative" ref={el => dropdownRefs.current[day] = el}>
                        <input
                          ref={(el) => { inputRefs.current[day] = el; }}
                          className="flex h-9 flex-1 bg-white border-2 border-black px-3 text-xs text-black transition-all duration-200 placeholder:text-black/30 focus-visible:border-black focus-visible:outline-none"
                          placeholder={`Add subject for ${day}…`}
                          value={ttInputs[day]}
                          onChange={(e) => setTtInputs((inp) => ({ ...inp, [day]: e.target.value }))}
                          onKeyDown={(e) => handleTtKeyDown(e, day)}
                          onFocus={() => setTtDropdown(dd => ({...dd, [day]: true}))}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 px-3 rounded-lg text-xs"
                          onClick={() => addSubject(day)}
                          disabled={!ttInputs[day].trim()}
                        >
                          Add
                        </Button>

                        {/* Dropdown */}
                        {ttDropdown[day] && getSuggestions(day).length > 0 && (
                          <div className="absolute top-full left-0 right-14 mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-40 overflow-y-auto p-1">
                            {getSuggestions(day).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => addSubject(day, s)}
                                className="w-full text-left px-3 py-1.5 text-xs text-black hover:bg-neutral-100 transition-colors font-body"
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
          </div>
        )}
      </Modal>
    </div>
  );
}
