import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select } from '../components/Input';
import { CheckCircle2, XCircle, Clock, Loader2, BarChart2, Users, ClipboardList } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

// Per-student status config
const STATUS_CFG = {
  present: {
    label: 'Present',
    icon: <CheckCircle2 className="w-4 h-4 stroke-[3px]" />,
    card: 'bg-[#C4B5FD] border-4 border-black text-black shadow-[3px_3px_0px_0px_var(--neo-shadow)] font-bold',
    dot: 'bg-white border-2 border-black',
  },
  absent: {
    label: 'Absent',
    icon: <XCircle className="w-4 h-4 stroke-[3px]" />,
    card: 'bg-[#FF6B6B] border-4 border-black text-black shadow-[3px_3px_0px_0px_var(--neo-shadow)] font-bold',
    dot: 'bg-white border-2 border-black',
  },
  late: {
    label: 'Late',
    icon: <Clock className="w-4 h-4 stroke-[3px]" />,
    card: 'bg-[#FFD93D] border-4 border-black text-black shadow-[3px_3px_0px_0px_var(--neo-shadow)] font-bold',
    dot: 'bg-white border-2 border-black',
  },
};

// Cycle: present → absent → late → present
const NEXT_STATUS = { present: 'absent', absent: 'late', late: 'present' };

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [sessionDate, setSessionDate] = useState(today());
  const [topic, setTopic] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // student_id → status
  const [existingSession, setExistingSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingStudents, setSavingStudents] = useState({}); // student_id → bool
  const [summaryModal, setSummaryModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [topicSaving, setTopicSaving] = useState(false);
  const topicRef = useRef(topic);
  topicRef.current = topic;

  useEffect(() => {
    api.get('/batches?status=active').then((r) => setBatches(r.data));
  }, []);

  const autoInit = useCallback(async (batchId, date) => {
    setLoading(true);
    setAttendance({});
    setExistingSession(null);
    setStudents([]);
    try {
      // Fetch students list for display metadata
      const [studRes, initRes] = await Promise.all([
        api.get(`/batches/${batchId}/students`),
        api.post('/sessions/auto-init', {
          batch_id: parseInt(batchId),
          date,
          topic: topicRef.current || null,
        }),
      ]);

      setStudents(studRes.data);
      setExistingSession(initRes.data.session);

      // Build attendance map from returned records
      const attMap = {};
      initRes.data.attendance.forEach((a) => {
        attMap[a.student_id] = a.status;
      });
      setAttendance(attMap);
    } catch {
      // error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    autoInit(selectedBatch, sessionDate);
  }, [selectedBatch, sessionDate, autoInit]);

  // Toggle a single student and instantly save
  const toggleStudent = async (studentId) => {
    if (!existingSession) return;
    const currentStatus = attendance[studentId] || 'present';
    const nextStatus = NEXT_STATUS[currentStatus];

    // Optimistic update
    setAttendance((prev) => ({ ...prev, [studentId]: nextStatus }));
    setSavingStudents((prev) => ({ ...prev, [studentId]: true }));

    try {
      await api.patch(`/attendance/${sessionDate}/${studentId}`, { status: nextStatus });
    } catch {
      // Revert on error
      setAttendance((prev) => ({ ...prev, [studentId]: currentStatus }));
    } finally {
      setSavingStudents((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // Update topic on the existing session if it changes
  const saveTopicToSession = async () => {
    if (!existingSession || !topic) return;
    setTopicSaving(true);
    try {
      // We reuse auto-init which is idempotent — topic won't update existing session this way.
      // Just update via a regular sessions endpoint if available, else skip.
      // For now: reload with updated topic awareness.
      toast.success('Topic noted — will apply on next session creation');
    } finally {
      setTopicSaving(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.get(`/attendance/summary/monthly?month=${summaryMonth}`);
      setSummary(res.data);
      setSummaryModal(true);
    } catch {}
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Attendance</h1>
          <p className="text-stardust text-sm mt-1">
            All students auto-marked <span className="text-[#C4B5FD] font-mono font-bold bg-[#181B20] px-1">present</span> — tap to change status
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSummaryModal(true)}>
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 stroke-[3px]" />
            Monthly Summary
          </span>
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

      {/* Attendance List */}
      {selectedBatch ? (
        <Card>
          <CardContent className="p-6">
            {/* Summary bar */}
            {!loading && students.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="border-2 border-black bg-white text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">
                  {students.length} students
                </span>
                <span className="border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
                  {presentCount} present
                </span>
                {absentCount > 0 && (
                  <span className="border-2 border-black bg-[#FF6B6B] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 stroke-[3px]" />
                    {absentCount} absent
                  </span>
                )}
                {lateCount > 0 && (
                  <span className="border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 stroke-[3px]" />
                    {lateCount} late
                  </span>
                )}
                <div className="flex-1" />
                <p className="text-xs text-stardust font-body italic hidden sm:block">
                  Tap to cycle: Present → Absent → Late
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white border-4 border-black shadow-[3px_3px_0px_var(--neo-shadow)] animate-pulse" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white border-4 border-black shadow-[6px_6px_0px_var(--neo-shadow)] text-black">
                <Users className="w-8 h-8 mb-2 text-black stroke-[3px]" />
                <div className="text-sm font-heading font-black uppercase">No students in this batch</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {students.map((student) => {
                  const status = attendance[student.id] || 'present';
                  const cfg = STATUS_CFG[status];
                  const isSaving = savingStudents[student.id];

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center p-4 border-4 border-black gap-4 cursor-pointer transition-all duration-100 select-none hover:opacity-95 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${cfg.card}`}
                      onClick={() => toggleStudent(student.id)}
                      title="Tap to change status"
                    >
                      {/* Status dot */}
                      <div className={`h-3 w-3 rounded-full shrink-0 ${cfg.dot} transition-all duration-200`} />

                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm font-body text-pure truncate">{student.name}</div>
                        <div className="text-xs opacity-60 font-mono mt-0.5">{student.class_level}</div>
                      </div>

                      {/* Saving spinner or status label */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase">
                            {cfg.icon} {cfg.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info note at bottom */}
            {!loading && students.length > 0 && (
              <div className="mt-5 flex items-center gap-2 text-xs text-stardust/60 font-mono">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Auto-saved
                </span>
                <span>·</span>
                <span>Changes save instantly on tap</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border-4 border-black shadow-[8px_8px_0px_var(--neo-shadow)] text-black">
          <ClipboardList className="w-12 h-12 mb-4 text-black stroke-[2.5px]" />
          <div className="text-lg font-heading font-black uppercase">Select a batch to mark attendance</div>
          <p className="text-sm text-black/60 font-body font-bold mt-1">All students will be auto-marked present</p>
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
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {summary.summary?.map((row) => (
                <div
                  key={row.student_id}
                  className="flex items-center gap-4 py-2.5 px-4 bg-white border-2 border-black shadow-[3px_3px_0px_var(--neo-shadow)]"
                >
                  <div className="flex-1 font-bold text-sm text-black">{row.student_name}</div>
                  <span className="border-2 border-black bg-[#C4B5FD] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
                    {row.present}P
                  </span>
                  <span className="border-2 border-black bg-[#FF6B6B] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
                    {row.absent}A
                  </span>
                  <span className="border-2 border-black bg-[#FFD93D] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
                    {row.late}L
                  </span>
                  <span
                    className={`border-2 border-black px-2 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)] ${
                      row.attendance_rate >= 75
                        ? 'bg-[#C4B5FD] text-black'
                        : 'bg-[#FF6B6B] text-black'
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
