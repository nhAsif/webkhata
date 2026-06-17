import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

function GradeTag({ grade }) {
  const color = GRADE_COLORS[grade] || '#8b92a8';
  return (
    <span style={{
      fontWeight: 700,
      color,
      background: color + '22',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: 'var(--font-size-xs)',
    }}>
      {grade}
    </span>
  );
}

const EXAM_TYPES = ['Class Test', 'Monthly Test', 'Half-Yearly', 'Annual', 'Mock Test'];

export default function Results() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [chartData, setChartData] = useState([]);

  // Add result modal
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    subject: '',
    exam_name: '',
    exam_date: new Date().toISOString().split('T')[0],
    score: '',
    total_marks: '100',
  });
  const [saving, setSaving] = useState(false);

  // Bulk entry modal
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkBatch, setBulkBatch] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkExamName, setBulkExamName] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkTotalMarks, setBulkTotalMarks] = useState('100');
  const [bulkStudents, setBulkStudents] = useState([]);
  const [bulkScores, setBulkScores] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/students?status=active'),
      api.get('/batches?status=active'),
    ]).then(([s, b]) => {
      setStudents(s.data);
      setBatches(b.data);
    });
  }, []);

  const loadResults = (studentId) => {
    if (!studentId) return;
    setLoading(true);
    api.get(`/results/student/${studentId}`).then((r) => {
      setResults(r.data);
      // Build chart data
      const sorted = [...r.data].sort((a, b) => a.exam_date.localeCompare(b.exam_date));
      setChartData(sorted.map((res) => ({
        name: `${res.exam_name} (${res.subject})`,
        score: Math.round((res.score / res.total_marks) * 100),
        grade: res.grade,
      })));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadResults(filterStudent); }, [filterStudent]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/results', {
        student_id: parseInt(form.student_id),
        subject: form.subject,
        exam_name: form.exam_name,
        exam_date: form.exam_date,
        score: parseFloat(form.score),
        total_marks: parseFloat(form.total_marks),
      });
      toast.success('Result added');
      setAddModal(false);
      loadResults(filterStudent);
    } catch {} finally {
      setSaving(false);
    }
  };

  const loadBulkStudents = async (batchId) => {
    if (!batchId) return;
    const res = await api.get(`/batches/${batchId}/students`);
    setBulkStudents(res.data);
    const init = {};
    res.data.forEach((s) => { init[s.id] = ''; });
    setBulkScores(init);
  };

  const handleBulk = async () => {
    setBulkSaving(true);
    try {
      const payload = bulkStudents
        .filter((s) => bulkScores[s.id] !== '')
        .map((s) => ({
          student_id: s.id,
          subject: bulkSubject,
          exam_name: bulkExamName,
          exam_date: bulkDate,
          score: parseFloat(bulkScores[s.id]),
          total_marks: parseFloat(bulkTotalMarks),
        }));

      const res = await api.post('/results/bulk', payload);
      toast.success(`Added ${res.data.created} results`);
      setBulkModal(false);
      loadResults(filterStudent);
    } catch {} finally {
      setBulkSaving(false);
    }
  };

  const columns = [
    { key: 'subject', label: 'Subject' },
    { key: 'exam_name', label: 'Exam' },
    { key: 'exam_date', label: 'Date' },
    { key: 'score', label: 'Score', render: (r) => `${r.score} / ${r.total_marks}` },
    { key: 'percentage', label: '%', render: (r) => `${((r.score / r.total_marks) * 100).toFixed(1)}%` },
    { key: 'grade', label: 'Grade', render: (r) => <GradeTag grade={r.grade} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">Exam scores and academic progress</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setBulkModal(true)}>📋 Bulk Entry</button>
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add Result</button>
        </div>
      </div>

      {/* Student Filter */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-3 items-center">
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Student:</label>
          <select
            className="form-select"
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            style={{ width: 'auto', minWidth: '240px' }}
          >
            <option value="">Choose a student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.class_level})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Chart */}
      {filterStudent && chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <h2 className="card-title">📈 Progress Chart</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [`${val}%`, 'Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-brand)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-brand)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {filterStudent ? (
        <DataTable
          columns={columns}
          data={results}
          loading={loading}
          emptyTitle="No results yet"
          emptyDesc="Add exam results using the button above."
          emptyAction={<button className="btn btn-primary" onClick={() => setAddModal(true)}>Add Result</button>}
        />
      ) : (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">Select a student to view results</div>
        </div>
      )}

      {/* Add Result Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add Exam Result"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="result-form" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : null} Add Result
            </button>
          </>
        }
      >
        <form id="result-form" onSubmit={handleAdd}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select
                className="form-select"
                value={form.student_id}
                onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                required
              >
                <option value="">Select student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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
              <label className="form-label">Exam Name *</label>
              <input
                className="form-input"
                list="exam-types"
                value={form.exam_name}
                onChange={(e) => setForm((f) => ({ ...f, exam_name: e.target.value }))}
                required
                placeholder="e.g. Class Test 1"
              />
              <datalist id="exam-types">
                {EXAM_TYPES.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Exam Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.exam_date}
                onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Score *</label>
              <input
                type="number"
                className="form-input"
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                required
                min="0"
                max={form.total_marks}
                step="0.5"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Marks *</label>
              <input
                type="number"
                className="form-input"
                value={form.total_marks}
                onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))}
                required
                min="1"
                step="0.5"
                placeholder="100"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Bulk Entry Modal */}
      <Modal
        isOpen={bulkModal}
        onClose={() => setBulkModal(false)}
        title="Bulk Result Entry"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBulkModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBulk} disabled={bulkSaving || !bulkStudents.length}>
              {bulkSaving ? <span className="spinner" /> : null} Save All
            </button>
          </>
        }
      >
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Batch *</label>
            <select
              className="form-select"
              value={bulkBatch}
              onChange={(e) => { setBulkBatch(e.target.value); loadBulkStudents(e.target.value); }}
            >
              <option value="">Select batch...</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              className="form-input"
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Exam Name *</label>
            <input
              className="form-input"
              list="bulk-exam-types"
              value={bulkExamName}
              onChange={(e) => setBulkExamName(e.target.value)}
              placeholder="e.g. Class Test 1"
            />
            <datalist id="bulk-exam-types">
              {EXAM_TYPES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Exam Date</label>
            <input
              type="date"
              className="form-input"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Total Marks</label>
            <input
              type="number"
              className="form-input"
              value={bulkTotalMarks}
              onChange={(e) => setBulkTotalMarks(e.target.value)}
              min="1"
            />
          </div>
        </div>

        {bulkStudents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bulkStudents.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.625rem 0.875rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1, fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{s.name}</div>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '100px' }}
                  placeholder="Score"
                  value={bulkScores[s.id] || ''}
                  onChange={(e) => setBulkScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  min="0"
                  max={bulkTotalMarks}
                  step="0.5"
                />
                {bulkScores[s.id] && bulkTotalMarks && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', width: '40px', textAlign: 'right' }}>
                    {((parseFloat(bulkScores[s.id]) / parseFloat(bulkTotalMarks)) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!bulkBatch && (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">Select a batch to enter scores</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
