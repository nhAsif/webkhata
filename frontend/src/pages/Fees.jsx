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
  const colorMap = {
    red: 'bg-[#FF6B6B]',
    yellow: 'bg-[#FFD93D]',
    green: 'bg-[#C4B5FD]', // success/green uses lavender
    indigo: 'bg-[#BAE6FD]', // sky blue for Collected
  };
  const bgClass = colorMap[color] || 'bg-white';

  return (
    <div className={`p-5 border-4 border-black text-black ${bgClass} shadow-[4px_4px_0px_0px_var(--neo-shadow)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--neo-shadow)] transition-all duration-150`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono font-black uppercase tracking-wider text-black/75 mb-1.5">{label}</div>
          <div className="text-2xl md:text-3xl font-black font-heading tracking-tight text-black">{value}</div>
          {sub && <div className="text-[11px] font-bold font-body text-black/60 mt-1">{sub}</div>}
        </div>
        <div className="p-2 border-2 border-black bg-white/40 text-black shadow-[2px_2px_0px_0px_var(--neo-shadow)]">{icon}</div>
      </div>
    </div>
  );
}

// ─── Cycle Status Badge ───────────────────────────────────────────────────────
function CycleBadge({ isPaid }) {
  return isPaid
    ? <span className="inline-flex items-center gap-1 border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-[11px] font-black font-mono uppercase tracking-wide shadow-[1px_1px_0px_var(--neo-shadow)]">
        <Check className="w-3 h-3 stroke-[3px]" /> Paid
      </span>
    : <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] text-black px-2.5 py-0.5 text-[11px] font-black font-mono uppercase tracking-wide shadow-[1px_1px_0px_var(--neo-shadow)]">
        <X className="w-3 h-3 stroke-[3px]" /> Unpaid
      </span>;
}

// ─── Fee Status Badge (for student row) ───────────────────────────────────────
function FeeStatusBadge({ unpaid }) {
  if (unpaid === 0) return (
    <span className="inline-flex items-center gap-1 border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-[11px] font-black font-mono shadow-[2px_2px_0px_var(--neo-shadow)]">
      <CheckCircle2 className="w-3 h-3 stroke-[2.5px]" /> Clear
    </span>
  );
  if (unpaid === 1) return (
    <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-[11px] font-black font-mono shadow-[2px_2px_0px_var(--neo-shadow)]">
      <Clock className="w-3 h-3 stroke-[2.5px]" /> {unpaid} Pending
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] text-black px-2.5 py-0.5 text-[11px] font-black font-mono shadow-[2px_2px_0px_var(--neo-shadow)]">
      <AlertCircle className="w-3 h-3 stroke-[2.5px]" /> {unpaid} Pending
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
      toast.success(`Cycle #${markCycle.cycle_number} marked as paid`);
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
    <div className="space-y-8 animate-bounce-spring">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-2">
        <h1 className="text-3xl md:text-4xl font-heading font-black text-black uppercase tracking-tight flex items-center gap-3">
          <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-black bg-[#FFD93D] border-4 border-black shadow-[3px_3px_0px_var(--neo-shadow)] p-1.5 stroke-[2.5px] springy-bounce" />
          Fee Cycles
        </h1>
        <p className="text-black/70 font-body font-bold text-sm mt-2">
          Cycle-based fee collection — 30-day billing periods
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBadge
            label="Students w/ Due"
            value={stats.students_with_due}
            sub={`of ${stats.total_students} active`}
            color="red"
            icon={<AlertCircle className="w-5 h-5 stroke-[2.5px]" />}
          />
          <StatBadge
            label="Unpaid Cycles"
            value={stats.total_unpaid_cycles}
            sub={`৳${(stats.total_pending ?? 0).toLocaleString()} pending`}
            color="yellow"
            icon={<Clock className="w-5 h-5 stroke-[2.5px]" />}
          />
          <StatBadge
            label="Paid Cycles"
            value={stats.total_paid_cycles}
            sub={`of ${stats.total_completed_cycles} completed`}
            color="green"
            icon={<CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />}
          />
          <StatBadge
            label="Collected"
            value={`৳${(stats.total_collected ?? 0).toLocaleString()}`}
            sub={`৳${(stats.total_pending ?? 0).toLocaleString()} pending`}
            color="indigo"
            icon={<DollarSign className="w-5 h-5 stroke-[2.5px]" />}
          />
        </div>
      )}

      {/* Dashboard Table */}
      <Card className="hover:shadow-[12px_12px_0px_var(--neo-shadow)]">
        <CardHeader className="flex-row items-center justify-between pb-4 bg-[#BAE6FD]/20">
          <CardTitle className="flex items-center gap-2.5 text-lg font-heading text-black">
            <Users className="w-6 h-6 text-black stroke-[2.5px]" /> Students with Pending Fees
          </CardTitle>
          <span className="text-xs font-black font-mono text-black border-2 border-black bg-white px-2.5 py-1 shadow-[2px_2px_0px_var(--neo-shadow)]">
            {dashboard.length} student{dashboard.length !== 1 ? 's' : ''}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-black/5 border-2 border-black/20" />
              ))}
            </div>
          ) : dashboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center p-6">
              <div className="p-4 border-4 border-black bg-[#C4B5FD] shadow-[4px_4px_0px_var(--neo-shadow)] mb-4">
                <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5px]" />
              </div>
              <div className="text-xl font-heading font-black text-black uppercase tracking-tight">All fees are clear!</div>
              <p className="text-black/60 text-sm font-bold font-body mt-1">No students have pending fee cycles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] whitespace-nowrap">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b-4 border-black">
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Student</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Monthly Fee</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Completed</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Unpaid</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Amount Due</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider border-r border-black/10">Status</th>
                    <th className="px-6 py-4 text-xs font-black text-black uppercase font-mono tracking-wider" />
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 bg-white">
                  {dashboard.map((row) => (
                    <tr
                      key={row.student_id}
                      className="hover:bg-[#FFD93D]/10 transition-colors cursor-pointer group"
                      onClick={() => openStudentDetail(row)}
                    >
                      <td className="px-6 py-4 border-r border-black/5">
                        <span className="font-black text-black text-sm group-hover:text-[#FF6B6B] transition-colors">{row.student_name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black font-mono text-black/80 border-r border-black/5">৳{row.monthly_fee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold font-mono text-black border-r border-black/5">{row.completed_cycles}</td>
                      <td className="px-6 py-4 text-sm font-black font-mono text-[#FF6B6B] border-r border-black/5">{row.unpaid_cycles}</td>
                      <td className="px-6 py-4 text-sm font-black font-mono text-[#FF6B6B] border-r border-black/5">৳{row.amount_due.toLocaleString()}</td>
                      <td className="px-6 py-4 border-r border-black/5"><FeeStatusBadge unpaid={row.unpaid_cycles} /></td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-1 group-hover:text-[#FF6B6B] transition-all" />
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
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-black/5 border-2 border-black/20" />)}
          </div>
        ) : cycles.length === 0 ? (
          <div className="py-10 text-center font-bold text-black/60">No cycles found.</div>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            {(() => {
              const total = cycles.length;
              const paid = cycles.filter(c => c.is_paid).length;
              const unpaid = total - paid;
              return (
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-[#BAE6FD] border-2 border-black p-3 text-center shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
                    <div className="text-[10px] text-black/70 font-mono uppercase font-black tracking-wider mb-1">Completed</div>
                    <div className="text-xl font-black text-black font-mono">{total}</div>
                  </div>
                  <div className="bg-[#C4B5FD] border-2 border-black p-3 text-center shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
                    <div className="text-[10px] text-black/70 font-mono uppercase font-black tracking-wider mb-1">Paid</div>
                    <div className="text-xl font-black text-black font-mono">{paid}</div>
                  </div>
                  <div className="bg-[#FF6B6B] border-2 border-black p-3 text-center shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
                    <div className="text-[10px] text-black/70 font-mono uppercase font-black tracking-wider mb-1">Unpaid</div>
                    <div className="text-xl font-black text-black font-mono">{unpaid}</div>
                  </div>
                </div>
              );
            })()}

            {/* Cycles list */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-black gap-3 transition-all ${
                    cycle.is_paid
                      ? 'bg-[#C4B5FD]/10 hover:bg-[#C4B5FD]/20 border-black'
                      : 'bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 border-black'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-black font-mono">Cycle #{cycle.cycle_number}</span>
                      <CycleBadge isPaid={cycle.is_paid} />
                    </div>
                    <div className="text-xs text-black/60 font-mono font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.5px] text-black/50" />
                      {formatDate(cycle.cycle_start_date)} → {formatDate(cycle.cycle_end_date)}
                    </div>
                    <div className="text-xs font-mono font-bold text-black">
                      ৳{cycle.fee_amount.toLocaleString()}
                      {cycle.is_paid && cycle.payment_date && (
                        <span className="text-emerald-800 ml-2 font-black">Paid {formatDate(cycle.payment_date)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end self-start sm:self-auto">
                    {!cycle.is_paid ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => openMarkPaid(cycle)}
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Paid
                      </Button>
                    ) : (
                      <button
                        className="text-xs font-black text-black hover:text-[#FF6B6B] transition-colors font-mono underline underline-offset-2 cursor-pointer"
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
            <Button variant="outline" size="sm" onClick={() => setMarkModal(false)}>Cancel</Button>
            <Button variant="secondary" size="sm" form="mark-paid-form" type="submit" disabled={marking}>
              {marking ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1.5 stroke-[2.5px]" />}
              Confirm Payment
            </Button>
          </div>
        }
      >
        {markCycle && (
          <form id="mark-paid-form" onSubmit={handleMarkPaid} className="space-y-4">
            <div className="bg-[#C4B5FD] border-2 border-black p-4 text-black flex items-center gap-3 shadow-[3px_3px_0px_0px_var(--neo-shadow)]">
              <DollarSign className="w-6 h-6 shrink-0 stroke-[2.5px]" />
              <div>
                <div className="font-black font-heading text-lg">৳{markCycle.fee_amount?.toLocaleString()}</div>
                <div className="text-xs font-mono font-black text-black/75 mt-0.5">
                  {formatDate(markCycle.cycle_start_date)} → {formatDate(markCycle.cycle_end_date)}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black font-heading text-black uppercase tracking-wider">Payment Date</label>
              <Input
                type="date"
                value={markForm.payment_date}
                onChange={(e) => setMarkForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black font-heading text-black uppercase tracking-wider">Notes (optional)</label>
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
