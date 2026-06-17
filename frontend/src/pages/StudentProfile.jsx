import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, User, DollarSign, Award, Calendar, Landmark, CheckCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/fees/student/${id}`),
      api.get(`/results/student/${id}`),
    ]).then(([s, f, r]) => {
      setStudent(s.data);
      setFees(f.data);
      setResults(r.data);
    }).finally(() => setLoading(false));
  }, [id]);

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

  const totalFeesDue = fees.reduce((s, f) => s + f.amount_due, 0);
  const totalFeesPaid = fees.reduce((s, f) => s + f.amount_paid, 0);
  const unpaidFees = fees.filter((f) => f.status !== 'paid').length;

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

      {/* Fee and performance stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Unpaid Months"
          value={unpaidFees}
          icon={<DollarSign className="w-5 h-5" />}
          color={unpaidFees > 0 ? '#ef4444' : '#10b981'}
        />
        <StatCard
          label="Total Paid"
          value={`৳${totalFeesPaid.toLocaleString()}`}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          color="#10b981"
        />
        <StatCard
          label="Total Exams"
          value={results.length}
          icon={<Award className="w-5 h-5 text-bitcoin" />}
          color="#F7931A"
        />
      </div>

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

      {/* Fee history */}
      {fees.length > 0 && (
        <Card hover={false}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading font-semibold text-pure flex items-center gap-2">
              <Landmark className="w-5 h-5 text-bitcoin" /> Fee History Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-void/40 border-y border-white/10">
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Month</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Due</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Paid</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fees.map((f) => (
                    <tr key={f.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-3 text-sm text-pure/90 font-medium">{f.month}</td>
                      <td className="px-6 py-3 text-sm text-pure font-mono">৳{f.amount_due.toLocaleString()}</td>
                      <td className={`px-6 py-3 text-sm font-mono ${f.amount_paid > 0 ? 'text-green-400' : 'text-pure/60'}`}>
                        ৳{f.amount_paid.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border ${
                          f.status === 'paid' 
                            ? 'bg-green-500/15 border-green-500/30 text-green-400' 
                            : f.status === 'partial' 
                            ? 'bg-bitcoin/15 border-bitcoin/30 text-bitcoin' 
                            : 'bg-red-500/15 border-red-500/30 text-red-400'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-stardust font-mono uppercase">{f.payment_method || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
