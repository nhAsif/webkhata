import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { ClipboardList, TrendingUp, BarChart2, PenSquare } from 'lucide-react';

const GRADE_COLORS = {
  'A+': 'var(--success)', // #C4B5FD
  'A': 'var(--success)',
  'A-': 'var(--success)',
  'B': 'var(--warning)', // #FFD93D
  'C': 'var(--warning)',
  'D': 'var(--danger)', // #FF6B6B
  'F': 'var(--danger)',
};

function GradeTag({ grade }) {
  const bg = GRADE_COLORS[grade] || 'var(--neutral-primary-medium)';
  return (
    <span 
      className="inline-flex px-2 py-0.5 border-2 border-black font-mono font-bold text-xs shadow-[1.5px_1.5px_0px_var(--neo-shadow)] text-black"
      style={{
        backgroundColor: bg
      }}
    >
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
    { key: 'score', label: 'Score', render: (r) => <span className="font-mono">{r.score} / {r.total_marks}</span> },
    { key: 'percentage', label: '%', render: (r) => <span className="font-mono">{((r.score / r.total_marks) * 100).toFixed(1)}%</span> },
    { key: 'grade', label: 'Grade', render: (r) => <GradeTag grade={r.grade} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Results</h1>
          <p className="text-stardust text-sm mt-1">Exam scores and academic progress</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setBulkModal(true)}>
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 stroke-[3px]" />
              Bulk Entry
            </span>
          </Button>
          <Button variant="primary" onClick={() => setAddModal(true)}>+ Add Result</Button>
        </div>
      </div>

      {/* Student Filter */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex gap-3 items-center flex-wrap">
            <label className="text-sm font-medium text-stardust whitespace-nowrap">Select Student:</label>
            <Select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="w-auto min-w-[240px]"
            >
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.class_level})</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress Chart */}
      {filterStudent && chartData.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-black stroke-[3px]" />
              Progress Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#181B20', fontWeight: 'bold' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#181B20', fontWeight: 'bold' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '4px solid #181B20', borderRadius: '0px', boxShadow: '4px 4px 0px 0px var(--neo-shadow)', fontSize: 12, color: '#181B20', fontFamily: 'Space Grotesk' }}
                  itemStyle={{ color: '#FF6B6B', fontWeight: 'bold' }}
                  formatter={(val) => [`${val}%`, 'Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#FF6B6B"
                  strokeWidth={2.5}
                  dot={{ fill: '#FFD93D', stroke: '#181B20', r: 4 }}
                  activeDot={{ r: 6, fill: '#FFD93D', stroke: '#181B20' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {filterStudent ? (
        <DataTable
          columns={columns}
          data={results}
          loading={loading}
          emptyTitle="No results yet"
          emptyDesc="Add exam results using the button above."
          emptyAction={<Button variant="primary" onClick={() => setAddModal(true)}>Add Result</Button>}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border-4 border-black shadow-[8px_8px_0px_var(--neo-shadow)] text-black">
          <div className="text-black mb-4">
            <BarChart2 className="w-12 h-12 stroke-[3px]" />
          </div>
          <div className="text-lg font-heading font-black uppercase">Select a student to view results</div>
        </div>
      )}

      {/* Add Result Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add Exam Result"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="primary" form="result-form" type="submit" disabled={saving}>
              {saving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" /> : null} Add Result
            </Button>
          </div>
        }
      >
        <form id="result-form" onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Student *</label>
              <Select
                value={form.student_id}
                onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                required
              >
                <option value="">Select student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Subject *</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
                placeholder="e.g. Mathematics"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Exam Name *</label>
              <Input
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Exam Date *</label>
              <Input
                type="date"
                value={form.exam_date}
                onChange={(e) => setForm((f) => ({ ...f, exam_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Score *</label>
              <Input
                type="number"
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                required
                min="0"
                max={form.total_marks}
                step="0.5"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Total Marks *</label>
              <Input
                type="number"
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
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setBulkModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulk} disabled={bulkSaving || !bulkStudents.length}>
              {bulkSaving ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" /> : null} Save All
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Batch *</label>
            <Select
              value={bulkBatch}
              onChange={(e) => { setBulkBatch(e.target.value); loadBulkStudents(e.target.value); }}
            >
              <option value="">Select batch...</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Subject *</label>
            <Input
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Exam Name *</label>
            <Input
              list="bulk-exam-types"
              value={bulkExamName}
              onChange={(e) => setBulkExamName(e.target.value)}
              placeholder="e.g. Class Test 1"
            />
            <datalist id="bulk-exam-types">
              {EXAM_TYPES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Exam Date</label>
            <Input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Total Marks</label>
            <Input
              type="number"
              value={bulkTotalMarks}
              onChange={(e) => setBulkTotalMarks(e.target.value)}
              min="1"
            />
          </div>
        </div>

        {bulkStudents.length > 0 && (
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {bulkStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 py-2 px-3 bg-white border-2 border-black shadow-[3px_3px_0px_var(--neo-shadow)] mb-2"
              >
                <div className="flex-1 font-bold text-sm text-black">{s.name}</div>
                <Input
                  type="number"
                  className="w-24 h-10 shadow-[2px_2px_0px_var(--neo-shadow)] focus-visible:bg-[#FFD93D] focus-visible:shadow-[2px_2px_0px_var(--neo-shadow)]"
                  placeholder="Score"
                  value={bulkScores[s.id] || ''}
                  onChange={(e) => setBulkScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  min="0"
                  max={bulkTotalMarks}
                  step="0.5"
                />
                {bulkScores[s.id] && bulkTotalMarks && (
                  <span className="text-xs font-mono font-bold text-black w-10 text-right">
                    {((parseFloat(bulkScores[s.id]) / parseFloat(bulkTotalMarks)) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!bulkBatch && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white border-4 border-black shadow-[4px_4px_0px_var(--neo-shadow)] mt-4">
            <div className="text-black mb-2">
              <PenSquare className="w-8 h-8 stroke-[3px]" />
            </div>
            <div className="text-sm text-black font-heading font-black uppercase">Select a batch to enter scores</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
