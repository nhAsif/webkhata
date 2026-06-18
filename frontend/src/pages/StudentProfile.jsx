import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input, Textarea } from '../components/Input';
import toast from 'react-hot-toast';
import { ArrowLeft, User, DollarSign, Award, Calendar, Landmark, CheckCircle, TrendingUp, Wallet, PlusCircle } from 'lucide-react';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/fees/student/${id}`),
      api.get(`/results/student/${id}`),
      api.get(`/students/${id}/financial`),
    ]).then(([s, f, r, fin]) => {
      setStudent(s.data);
      setFees(f.data);  // now these are FeeCycleResponse objects
      setResults(r.data);
      setFinancial(fin.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.post('/payments', { student_id: parseInt(id), ...payForm, amount: parseFloat(payForm.amount) });
      toast.success('Payment recorded successfully');
      setPayModal(false);
      setPayForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      // Refresh financial data
      api.get(`/students/${id}/financial`).then((r) => setFinancial(r.data)).catch(() => {});
    } catch {
      // handled by interceptor
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white/5 rounded-2xl w-1/3" />
        <div className="h-48 bg-white/5 rounded-2xl w-full" />
        <div className="h-64 bg-white/5 rounded-2xl w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center font-body">
        <div className="text-4xl mb-3">❓</div>
        <div className="text-lg font-heading font-semibold text-pure mb-4">Student not found</div>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Students
        </Button>
      </div>
    );
  }

  const chartData = [...results]
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .map((r) => ({
      name: `${r.exam_name.slice(0, 8)} (${r.subject.slice(0, 4)})`,
      score: Math.round((r.score / r.total_marks) * 100),
      grade: r.grade,
    }));

  // Cycle-based fee stats
  const totalCycles = fees.length;
  const paidCycles = fees.filter(c => c.is_paid).length;
  const unpaidCycles = totalCycles - paidCycles;

  return (
    <div className="space-y-6 font-body">
      <div className="flex items-center gap-3">
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
          onClick={() => navigate('/students')}
        >
          <ArrowLeft className="w-4 h-4 text-pure" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight">{student.name}</h1>
          <p className="text-xs text-stardust mt-0.5 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
              {student.class_level}
            </span>
            <span className={`inline-flex px-1.5 py-0.5 rounded capitalize ${
              student.status === 'active' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-white/10 text-stardust'
            }`}>
              {student.status}
            </span>
          </p>
        </div>
      </div>

      {/* Student Personal Info */}
      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between border-b border-white/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-heading font-semibold text-pure">
            <User className="w-5 h-5 text-bitcoin" /> Personal Information
          </CardTitle>
          <code className="text-xs bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-bitcoin font-mono">
            Parent Code: {student.parent_code}
          </code>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Guardian Name</span>
              <span className="text-sm font-medium text-pure">{student.guardian_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Guardian Phone</span>
              <span className="text-sm font-medium text-pure font-mono">{student.guardian_phone}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Parent Username</span>
              <span className="text-sm font-medium text-pure font-mono">{student.parent_username || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Address</span>
              <span className="text-sm font-medium text-pure">{student.address || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Enrolled Since</span>
              <span className="text-sm font-medium text-pure font-mono">{student.enrollment_date}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Subjects</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(Array.isArray(student.subjects) ? student.subjects : []).map((s) => (
                  <span key={s} className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-pure font-mono uppercase">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Card */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        <StatCard
          label="Total Exams"
          value={results.length}
          icon={<Award className="w-5 h-5 text-bitcoin" />}
          color="#F7931A"
        />
      </div>

      {/* Financial Dashboard */}
      {financial && (() => {
        const statusColor =
          financial.status === 'paid' ? 'border-green-500/40'
          : financial.status === 'partial' ? 'border-yellow-500/40'
          : 'border-red-500/40';
        const badgeClass =
          financial.status === 'paid'
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : financial.status === 'partial'
            ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400';
        return (
          <Card hover={false} className={`border-2 ${statusColor}`}>
            <CardHeader className="flex-row items-center justify-between border-b border-white/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-heading font-semibold text-pure">
                <Wallet className="w-5 h-5 text-bitcoin" /> Financial Overview
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border uppercase ${badgeClass}`}>
                  {financial.status}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPayModal(true)}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Monthly Fee</span>
                  <span className="text-lg font-bold text-bitcoin font-mono">৳{(financial.monthly_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Start Date</span>
                  <span className="text-sm font-medium text-pure font-mono">{financial.start_date || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Completed Cycles</span>
                  <span className="text-lg font-bold text-gold font-mono">{totalCycles}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Paid Cycles</span>
                  <span className="text-lg font-bold text-green-400 font-mono">{paidCycles}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Pending Cycles</span>
                  <span className={`text-lg font-bold font-mono ${unpaidCycles === 0 ? 'text-green-400' : unpaidCycles === 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {unpaidCycles}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Pending Amount</span>
                  <span className={`text-lg font-bold font-mono ${(financial.outstanding_balance ?? 0) === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ৳{(financial.outstanding_balance ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Results chart */}
      {chartData.length > 0 && (
        <Card hover={false}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading font-semibold text-pure flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-bitcoin" /> Academic Progress Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} stroke="rgba(255, 255, 255, 0.1)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} unit="%" stroke="rgba(255, 255, 255, 0.1)" />
                  <Tooltip
                    contentStyle={{ 
                      background: '#0F1115', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      color: '#FFFFFF'
                    }}
                    formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, 'Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#F7931A" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#FFD600', stroke: '#F7931A', r: 4 }} 
                    activeDot={{ r: 6, fill: '#FFD600', stroke: '#FFFFFF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cycle history */}
      {fees.length > 0 && (
        <Card hover={false}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading font-semibold text-pure flex items-center gap-2">
              <Landmark className="w-5 h-5 text-bitcoin" /> Fee Cycle History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-void/40 border-y border-white/10">
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Cycle</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Period</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Amount</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fees.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-3 text-sm font-bold text-pure font-mono">#{c.cycle_number}</td>
                      <td className="px-6 py-3 text-sm text-stardust font-mono">
                        {c.cycle_start_date} → {c.cycle_end_date}
                      </td>
                      <td className="px-6 py-3 text-sm text-pure font-mono">৳{c.fee_amount.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        {c.is_paid
                          ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border bg-green-500/15 border-green-500/30 text-green-400">Paid</span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border bg-red-500/15 border-red-500/30 text-red-400">Unpaid</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-sm text-stardust font-mono">{c.payment_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title="Record Payment"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
            <Button variant="primary" form="pay-form" type="submit" disabled={paying}>
              {paying ? <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" /> : null}
              Save Payment
            </Button>
          </div>
        }
      >
        <form id="pay-form" onSubmit={handlePaySubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Amount (৳) *</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              required
              placeholder="e.g. 500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Payment Date *</label>
            <Input
              type="date"
              value={payForm.payment_date}
              onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Notes (optional)</label>
            <Textarea
              value={payForm.notes}
              onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Cash payment for June"
              rows={2}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
