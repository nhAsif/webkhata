import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';

const STATUS_OPTIONS = ['present', 'absent', 'late'];

const STATUS_STYLES = {
  present: { background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)' },
  absent: { background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' },
  late: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.3)' },
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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark and track student attendance</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setSummaryModal(true)}>
          📊 Monthly Summary
        </button>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Batch *</label>
            <select
              className="form-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">Select batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Session Date *</label>
            <input
              type="date"
              className="form-input"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Topic (optional)</label>
            <input
              className="form-input"
              placeholder="What was covered today?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
      </div>

      {selectedBatch && (
        <div className="card">
          {/* Summary bar */}
          {students.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-success">✅ Present: {presentCount}</span>
              <span className="badge badge-danger">❌ Absent: {absentCount}</span>
              <span className="badge badge-warning">⏰ Late: {lateCount}</span>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary btn-sm" onClick={() => markAll('present')}>Mark All Present</button>
              <button className="btn btn-secondary btn-sm" onClick={() => markAll('absent')}>Mark All Absent</button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '56px' }} />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students in this batch</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {students.map((student) => {
                const status = attendance[student.id] || 'present';
                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.875rem 1rem',
                      background: 'var(--bg-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      ...STATUS_STYLES[status],
                    }}
                    onClick={() => cycleStatus(student.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{student.name}</div>
                      <div className="text-xs" style={{ opacity: 0.7 }}>{student.class_level}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="btn btn-sm"
                          style={{
                            opacity: status === s ? 1 : 0.3,
                            fontWeight: status === s ? 700 : 400,
                            background: status === s ? (s === 'present' ? 'var(--color-success)' : s === 'absent' ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--bg-surface-3)',
                            color: status === s ? 'white' : 'var(--text-muted)',
                            border: 'none',
                          }}
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
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : null}
                {existingSession ? 'Update Attendance' : 'Save Attendance'}
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedBatch && (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Select a batch to mark attendance</div>
        </div>
      )}

      {/* Monthly Summary Modal */}
      <Modal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        title="Monthly Attendance Summary"
        size="lg"
      >
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Select Month</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="month"
              className="form-input"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
            />
            <button className="btn btn-primary" onClick={loadSummary}>Load</button>
          </div>
        </div>

        {summary && (
          <div>
            <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
              {summary.total_sessions} sessions in {summary.month}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {summary.summary?.map((row) => (
                <div
                  key={row.student_id}
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
                  <div style={{ flex: 1, fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
                    {row.student_name}
                  </div>
                  <span className="badge badge-success">{row.present}P</span>
                  <span className="badge badge-danger">{row.absent}A</span>
                  <span className="badge badge-warning">{row.late}L</span>
                  <span
                    className="badge"
                    style={{
                      background: row.attendance_rate >= 75 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                      color: row.attendance_rate >= 75 ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
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
