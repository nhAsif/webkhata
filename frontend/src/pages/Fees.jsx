import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Input, Textarea } from '../components/Input';
import {
  Users, AlertCircle, CheckCircle2, Clock, DollarSign,
  TrendingUp, TrendingDown, ChevronRight, Calendar, X, Check,
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatBadge({ label, value, sub, color, icon }) {
  return (
    <Card className={`border-${color}-500/30 shadow-[0_0_18px_-6px_rgba(var(--tw-shadow-color),0.3)] shadow-${color}-500/20`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-stardust font-mono uppercase tracking-wider mb-1.5">{label}</div>
            <div className={`text-2xl font-bold font-mono text-${color}-400`}>{value}</div>
            {sub && <div className="text-xs text-stardust mt-1">{sub}</div>}
          </div>
          <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cycle Status Badge ───────────────────────────────────────────────────────
function CycleBadge({ isPaid }) {
  return isPaid
    ? <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono border bg-green-500/15 text-green-400 border-green-500/30 uppercase tracking-wide">
        <Check className="w-3 h-3" /> Paid
      </span>
    : <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono border bg-red-500/15 text-red-400 border-red-500/30 uppercase tracking-wide">
        <X className="w-3 h-3" /> Unpaid
      </span>;
}

// ─── Fee Status Badge (for student row) ───────────────────────────────────────
function FeeStatusBadge({ unpaid }) {
  if (unpaid === 0) return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono border bg-green-500/15 text-green-400 border-green-500/30">
      <CheckCircle2 className="w-3 h-3" /> Clear
    </span>
  );
  if (unpaid === 1) return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
      <Clock className="w-3 h-3" /> {unpaid} Pending
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold font-mono border bg-red-500/15 text-red-400 border-red-500/30">
      <AlertCircle className="w-3 h-3" /> {unpaid} Pending
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Fees() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student detail modal
  const [detailStudent, setDetailStudent] = useState(null); // { id, name }
  const [cycles, setCycles] = useState([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  // Mark paid modal
  const [markModal, setMarkModal] = useState(false);
  const [markCycle, setMarkCycle] = useState(null);
  const [markForm, setMarkForm] = useState({ payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [marking, setMarking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/fees/dashboard/stats'),
      api.get('/fees/dashboard'),
    ]).then(([s, d]) => {
      setStats(s.data);
      setDashboard(d.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openStudentDetail = async (student) => {
    setDetailStudent(student);
    setDetailModal(true);
    setCyclesLoading(true);
    try {
      const res = await api.get(`/fees/student/${student.student_id}`);
      setCycles(res.data);
    } catch {
      setCycles([]);
    } finally {
      setCyclesLoading(false);
    }
  };

  const openMarkPaid = (cycle) => {
    setMarkCycle(cycle);
    setMarkForm({ payment_date: new Date().toISOString().split('T')[0], notes: '' });
    setMarkModal(true);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setMarking(true);
    try {
      await api.post(`/fees/cycle/${markCycle.id}/mark-paid`, {
        payment_date: markForm.payment_date || null,
        notes: markForm.notes || null,
      });
      toast.success(`Cycle #${markCycle.cycle_number} marked as paid ✓`);
      setMarkModal(false);
      // Refresh cycles
      const res = await api.get(`/fees/student/${detailStudent.student_id}`);
      setCycles(res.data);
      load();
    } catch {} finally {
      setMarking(false);
    }
  };

  const handleMarkUnpaid = async (cycle) => {
    try {
      await api.post(`/fees/cycle/${cycle.id}/mark-unpaid`);
      toast.success(`Cycle #${cycle.cycle_number} marked as unpaid`);
      const res = await api.get(`/fees/student/${detailStudent.student_id}`);
      setCycles(res.data);
      load();
    } catch {}
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Fee Cycles</h1>
          <p className="text-stardust text-sm mt-1">Cycle-based fee collection — 30-day billing periods</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBadge
            label="Students w/ Due"
            value={stats.students_with_due}
            sub={`of ${stats.total_students} active`}
            color="red"
            icon={<AlertCircle className="w-5 h-5" />}
          />
          <StatBadge
            label="Unpaid Cycles"
            value={stats.total_unpaid_cycles}
            sub={`৳${(stats.total_pending ?? 0).toLocaleString()} pending`}
            color="yellow"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatBadge
            label="Paid Cycles"
            value={stats.total_paid_cycles}
            sub={`of ${stats.total_completed_cycles} completed`}
            color="green"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatBadge
            label="Collected"
            value={`৳${(stats.total_collected ?? 0).toLocaleString()}`}
            sub={`৳${(stats.total_pending ?? 0).toLocaleString()} pending`}
            color="indigo"
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Dashboard Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b border-white/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-heading text-pure">
            <Users className="w-5 h-5 text-bitcoin" /> Students with Pending Fees
          </CardTitle>
          <span className="text-xs font-mono text-stardust bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            {dashboard.length} student{dashboard.length !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : dashboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-lg font-heading font-semibold text-pure mb-1">All fees are clear!</div>
              <p className="text-stardust text-sm">No students have pending fee cycles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] whitespace-nowrap">
                <thead>
                  <tr className="bg-void/40 border-y border-white/10">
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Student</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Monthly Fee</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Completed</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Unpaid</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Amount Due</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dashboard.map((row) => (
                    <tr
                      key={row.student_id}
                      className="hover:bg-white/5 transition-all cursor-pointer group"
                      onClick={() => openStudentDetail(row)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-pure text-sm group-hover:text-bitcoin transition-colors">{row.student_name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-stardust">৳{row.monthly_fee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-mono text-pure">{row.completed_cycles}</td>
                      <td className="px-6 py-4 text-sm font-bold font-mono text-red-400">{row.unpaid_cycles}</td>
                      <td className="px-6 py-4 text-sm font-bold font-mono text-red-400">৳{row.amount_due.toLocaleString()}</td>
                      <td className="px-6 py-4"><FeeStatusBadge unpaid={row.unpaid_cycles} /></td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-stardust group-hover:text-bitcoin transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Fee Detail Modal */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title={`Fee Cycles — ${detailStudent?.student_name ?? ''}`}
      >
        {cyclesLoading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
          </div>
        ) : cycles.length === 0 ? (
          <div className="py-10 text-center text-stardust">No cycles found.</div>
        ) : (
          <div className="space-y-3">
            {/* Summary row */}
            {(() => {
              const total = cycles.length;
              const paid = cycles.filter(c => c.is_paid).length;
              const unpaid = total - paid;
              const student = dashboard.find(d => d.student_id === detailStudent?.student_id);
              return (
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-xs text-stardust font-mono uppercase mb-1">Completed</div>
                    <div className="text-xl font-bold text-pure font-mono">{total}</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-stardust font-mono uppercase mb-1">Paid</div>
                    <div className="text-xl font-bold text-green-400 font-mono">{paid}</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-stardust font-mono uppercase mb-1">Unpaid</div>
                    <div className="text-xl font-bold text-red-400 font-mono">{unpaid}</div>
                  </div>
                </div>
              );
            })()}

            {/* Cycles list */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    cycle.is_paid
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-pure font-mono">Cycle #{cycle.cycle_number}</span>
                      <CycleBadge isPaid={cycle.is_paid} />
                    </div>
                    <div className="text-xs text-stardust font-mono flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cycle.cycle_start_date)} → {formatDate(cycle.cycle_end_date)}
                    </div>
                    <div className="text-xs font-mono text-pure/70">
                      ৳{cycle.fee_amount.toLocaleString()}
                      {cycle.is_paid && cycle.payment_date && (
                        <span className="text-green-400 ml-2">Paid {formatDate(cycle.payment_date)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    {!cycle.is_paid ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openMarkPaid(cycle)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Mark Paid
                      </Button>
                    ) : (
                      <button
                        className="text-xs text-stardust hover:text-red-400 transition-colors font-mono underline underline-offset-2"
                        onClick={() => handleMarkUnpaid(cycle)}
                      >
                        Mark Unpaid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Mark Paid Modal */}
      <Modal
        isOpen={markModal}
        onClose={() => setMarkModal(false)}
        title={`Mark Paid — Cycle #${markCycle?.cycle_number}`}
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setMarkModal(false)}>Cancel</Button>
            <Button variant="primary" form="mark-paid-form" type="submit" disabled={marking}>
              {marking ? <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1.5" />}
              Confirm Payment
            </Button>
          </div>
        }
      >
        {markCycle && (
          <form id="mark-paid-form" onSubmit={handleMarkPaid} className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400 flex items-center gap-3">
              <DollarSign className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-bold font-mono">৳{markCycle.fee_amount?.toLocaleString()}</div>
                <div className="text-xs text-green-400/70 mt-0.5">
                  {formatDate(markCycle.cycle_start_date)} → {formatDate(markCycle.cycle_end_date)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Payment Date</label>
              <Input
                type="date"
                value={markForm.payment_date}
                onChange={(e) => setMarkForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stardust">Notes (optional)</label>
              <Textarea
                value={markForm.notes}
                onChange={(e) => setMarkForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Cash payment received"
                rows={2}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
