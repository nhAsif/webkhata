import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';

const STATUS_OPTIONS = ['present', 'absent', 'late'];

const STATUS_STYLES = {
  present: 'bg-green-500/10 text-green-400 border-green-500/30',
  absent: 'bg-red-500/10 text-red-400 border-red-500/30',
  late: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [sessionDate, setSessionDate] = useState(today());
  const [topic, setTopic] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // student_id → status
  const [existingSession, setExistingSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summaryModal, setSummaryModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.get('/batches?status=active').then((r) => setBatches(r.data));
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    setLoading(true);

    Promise.all([
      api.get(`/batches/${selectedBatch}/students`),
      api.get(`/sessions?batch_id=${selectedBatch}&from_date=${sessionDate}&to_date=${sessionDate}`),
    ]).then(([studRes, sessRes]) => {
      const studs = studRes.data;
      setStudents(studs);

      const sess = sessRes.data?.[0] || null;
      setExistingSession(sess);

      // Initialize all as present
      const init = {};
      studs.forEach((s) => { init[s.id] = 'present'; });

      if (sess) {
        // Load existing attendance
        api.get(`/attendance/${sess.id}`).then((r) => {
          r.data.forEach((a) => { init[a.student_id] = a.status; });
          setAttendance(init);
        });
      } else {
        setAttendance(init);
      }
    }).finally(() => setLoading(false));
  }, [selectedBatch, sessionDate]);

  const cycleStatus = (studentId) => {
    setAttendance((prev) => {
      const current = prev[studentId] || 'present';
      const idx = STATUS_OPTIONS.indexOf(current);
      return { ...prev, [studentId]: STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length] };
    });
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let sessionId = existingSession?.id;

      if (!sessionId) {
        // Create session first
        const sessRes = await api.post('/sessions', {
          batch_id: parseInt(selectedBatch),
          date: sessionDate,
          topic: topic || null,
        });
        sessionId = sessRes.data.id;
        setExistingSession(sessRes.data);
      }

      const records = Object.entries(attendance).map(([sid, status]) => ({
        student_id: parseInt(sid),
        status,
      }));

      await api.post('/attendance', { session_id: sessionId, records });
      toast.success(`Attendance saved for ${records.length} students`);
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const loadSummary = async () => {
    const res = await api.get(`/attendance/summary/monthly?month=${summaryMonth}`);
    setSummary(res.data);
    setSummaryModal(true);
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Attendance</h1>
          <p className="text-stardust text-sm mt-1">Mark and track student attendance</p>
        </div>
        <Button variant="secondary" onClick={() => setSummaryModal(true)}>
          📊 Monthly Summary
        </Button>
      </div>

      {/* Controls */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Batch *</label>
              <Select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">Select batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Session Date *</label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Topic (optional)</label>
              <Input
                placeholder="What was covered today?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBatch && (
        <Card>
          <CardContent className="p-6">
            {/* Summary bar */}
            {students.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">✅ Present: {presentCount}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">❌ Absent: {absentCount}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⏰ Late: {lateCount}</span>
                <div className="flex-1" />
                <Button variant="secondary" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
                <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>Mark All Absent</Button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl border border-white/10" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-sm font-heading text-pure">No students in this batch</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {students.map((student) => {
                  const status = attendance[student.id] || 'present';
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center p-3.5 rounded-xl border gap-4 cursor-pointer transition-all duration-200 ${STATUS_STYLES[status]}`}
                      onClick={() => cycleStatus(student.id)}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm font-body">{student.name}</div>
                        <div className="text-xs opacity-70 font-mono mt-0.5">{student.class_level}</div>
                      </div>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                              status === s
                                ? s === 'present' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : s === 'absent' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                : 'bg-white/5 text-stardust hover:bg-white/10'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttendance((prev) => ({ ...prev, [student.id]: s }));
                            }}
                          >
                            {s === 'present' ? '✓' : s === 'absent' ? '✗' : '⏰'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="animate-pulse bg-white/20 w-4 h-4 rounded-full mr-2" /> : null}
                  {existingSession ? 'Update Attendance' : 'Save Attendance'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedBatch && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-2xl border border-white/10">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-lg font-heading text-pure">Select a batch to mark attendance</div>
        </div>
      )}

      {/* Monthly Summary Modal */}
      <Modal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        title="Monthly Attendance Summary"
        size="lg"
      >
        <div className="mb-6 space-y-1.5">
          <label className="text-sm font-medium text-stardust">Select Month</label>
          <div className="flex gap-3">
            <Input
              type="month"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              className="max-w-[200px]"
            />
            <Button variant="primary" onClick={loadSummary}>Load</Button>
          </div>
        </div>

        {summary && (
          <div>
            <div className="text-xs text-stardust mb-3 font-mono">
              {summary.total_sessions} sessions in {summary.month}
            </div>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {summary.summary?.map((row) => (
                <div
                  key={row.student_id}
                  className="flex items-center gap-4 py-2 px-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex-1 font-medium text-sm text-pure">
                    {row.student_name}
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">{row.present}P</span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">{row.absent}A</span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{row.late}L</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-mono border ${
                      row.attendance_rate >= 75
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {row.attendance_rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
