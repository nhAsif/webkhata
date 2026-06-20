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
import { ArrowLeft, User, DollarSign, Award, Calendar, Landmark, CheckCircle, TrendingUp, Wallet, UserX, Check, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

export default function StudentProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cycle mark paid state
  const [markModal, setMarkModal] = useState(false);
  const [markCycle, setMarkCycle] = useState(null);
  const [markForm, setMarkForm] = useState({ payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [marking, setMarking] = useState(false);

  const loadFeesAndFinancial = () => {
    Promise.all([
      api.get(`/fees/student/${id}`),
      api.get(`/students/${id}/financial`),
    ]).then(([f, fin]) => {
      setFees(f.data);
      setFinancial(fin.data);
    }).catch(() => {});
  };

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
      toast.success(t('Cycle marked as paid'));
      setMarkModal(false);
      loadFeesAndFinancial();
    } catch {} finally {
      setMarking(false);
    }
  };

  const handleMarkUnpaid = async (cycle) => {
    try {
      await api.post(`/fees/cycle/${cycle.id}/mark-unpaid`);
      toast.success(t('Cycle marked as unpaid'));
      loadFeesAndFinancial();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white border-4 border-black shadow-[4px_4px_0px_var(--neo-shadow)] w-1/3" />
        <div className="h-48 bg-white border-4 border-black shadow-[6px_6px_0px_var(--neo-shadow)] w-full" />
        <div className="h-64 bg-white border-4 border-black shadow-[8px_8px_0px_var(--neo-shadow)] w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center font-body">
        <div className="text-black mb-3">
          <UserX className="w-12 h-12 stroke-[2px]" />
        </div>
        <div className="text-lg font-heading font-semibold text-pure mb-4">{t('Student not found')}</div>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('Back to Students')}
        </Button>
      </div>
    );
  }

  const chartData = [...results]
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .map((r) => ({
      name: `${r.exam_name.slice(0, 8)} (${t(r.subject).slice(0, 4)})`,
      score: Math.round((r.score / r.total_marks) * 100),
      grade: r.grade,
    }));

  // Cycle-based fee stats
  const totalCycles = fees.length;
  const paidCycles = fees.filter(c => c.is_paid).length;
  const unpaidCycles = totalCycles - paidCycles;

  return (
    <div className="space-y-6 font-body">
      <div className="flex items-center gap-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-9 w-9 p-0 flex items-center justify-center shrink-0"
          onClick={() => navigate('/students')}
        >
          <ArrowLeft className="w-4 h-4 text-black" />
        </Button>
        <div className="w-24 h-24 border-4 border-black bg-[#FFD93D] flex items-center justify-center shadow-[4px_4px_0px_var(--neo-shadow)] shrink-0 relative overflow-hidden">
          {student.photo_path ? (
            <img src={`/${student.photo_path}`} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-black tracking-tight">{student.name}</h1>
          <p className="text-xs text-black mt-0.5 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <span className="border-2 border-black bg-[#FFD93D] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">
              {t(student.class_level)}
            </span>
            <span className={`border-2 border-black px-2 py-0.5 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_var(--neo-shadow)] ${
              student.status === 'active' ? 'bg-[#C4B5FD] text-black' : 'bg-[#FAF6EE] text-black/50'
            }`}>
              {t(student.status)}
            </span>
          </p>
        </div>
      </div>

      {/* Student Personal Info */}
      <Card hover={false}>
        <CardHeader className="flex-row items-center justify-between border-b-4 border-black pb-4 bg-[#FF6B6B]/10">
          <CardTitle className="flex items-center gap-2 text-lg font-heading font-semibold text-pure">
            <User className="w-5 h-5 text-black stroke-[2.5px]" /> {t('Personal Info')}
          </CardTitle>
          <code className="text-xs bg-white border-2 border-black px-2.5 py-1 font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)] text-black">
            {t('Parent Username')}: {student.parent_username || '—'}
          </code>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Guardian Name')}</span>
              <span className="text-sm font-bold text-black">{student.guardian_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Guardian Phone')}</span>
              <span className="text-sm font-bold text-black font-mono">{student.guardian_phone}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Parent Username')}</span>
              <span className="text-sm font-bold text-black font-mono">{student.parent_username || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Address')}</span>
              <span className="text-sm font-bold text-black">{student.address || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Enrolled Since')}</span>
              <span className="text-sm font-bold text-black font-mono">{student.enrollment_date}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Subjects')}</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(Array.isArray(student.subjects) ? student.subjects : []).map((s) => (
                  <span key={s} className="border-2 border-black bg-[#C4B5FD] text-black px-2 py-0.5 text-[10px] font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)] uppercase">
                    {t(s)}
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
          label={t('Total Exams')}
          value={results.length}
          icon={<Award className="w-5 h-5 text-bitcoin" />}
          color="#F7931A"
        />
      </div>

      {/* Financial Dashboard */}
      {financial && (() => {
        return (
          <Card hover={false}>
            <CardHeader className="flex-row items-center justify-between border-b-4 border-black pb-4 bg-[#FF6B6B]/10">
              <CardTitle className="flex items-center gap-2 text-lg font-heading font-semibold text-pure">
                <Wallet className="w-5 h-5 text-black stroke-[2.5px]" /> {t('Financial Overview')}
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className={`border-2 border-black px-2.5 py-0.5 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_var(--neo-shadow)] ${
                  financial.status === 'paid' ? 'bg-[#C4B5FD] text-black' : financial.status === 'partial' ? 'bg-[#FFD93D] text-black' : 'bg-[#FF6B6B] text-black'
                }`}>
                  {t(financial.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Monthly Fee')}</span>
                  <span className="text-lg font-bold text-black font-mono">৳{(financial.monthly_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Start Date')}</span>
                  <span className="text-sm font-bold text-black font-mono">{financial.start_date || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Completed Cycles')}</span>
                  <span className="text-lg font-bold text-black font-mono">{totalCycles}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Paid Cycles')}</span>
                  <span className="text-lg font-bold text-green-700 font-mono">{paidCycles}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Pending Cycles')}</span>
                  <span className={`text-lg font-bold font-mono ${unpaidCycles === 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {unpaidCycles}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-black/60 uppercase tracking-wider font-mono">{t('Pending Amount')}</span>
                  <span className={`text-lg font-bold font-mono ${(financial.outstanding_balance ?? 0) === 0 ? 'text-green-700' : 'text-red-600'}`}>
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
              <TrendingUp className="w-5 h-5 text-bitcoin" /> {t('Academic Progress Graph')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#181B20', fontWeight: 'bold' }} stroke="rgba(0, 0, 0, 0.2)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#181B20', fontWeight: 'bold' }} unit="%" stroke="rgba(0, 0, 0, 0.2)" />
                  <Tooltip
                    contentStyle={{ 
                      background: '#FFFFFF', 
                      border: '4px solid #181B20', 
                      borderRadius: '0px', 
                      boxShadow: '4px 4px 0px 0px var(--neo-shadow)', 
                      fontSize: '12px',
                      color: '#181B20',
                      fontFamily: 'Space Grotesk'
                    }}
                    formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, t('Score')]}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cycle history */}
      {fees.length > 0 && (
        <Card hover={false}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading font-semibold text-pure flex items-center gap-2">
              <Landmark className="w-5 h-5 text-bitcoin" /> {t('Fee Cycle History')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b-4 border-black text-black">
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono">{t('Cycle')}</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono">{t('Period')}</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono">{t('Amount')}</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono">{t('Status')}</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono">{t('Paid On')}</th>
                    <th className="px-6 py-3.5 text-xs font-black uppercase font-mono text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white">
                  {fees.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-all">
                      <td className="px-6 py-3 text-sm font-bold text-black font-mono">#{c.cycle_number}</td>
                      <td className="px-6 py-3 text-sm text-black/75 font-mono">
                        {c.cycle_start_date} → {c.cycle_end_date}
                      </td>
                      <td className="px-6 py-3 text-sm text-black font-mono font-bold">৳{c.fee_amount.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        {c.is_paid
                          ? <span className="inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase tracking-wider font-mono bg-[#C4B5FD] text-black shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">{t('Paid')}</span>
                          : <span className="inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase tracking-wider font-mono bg-[#FF6B6B] text-black shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">{t('Unpaid')}</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-sm text-stardust font-mono">{c.payment_date || '—'}</td>
                      <td className="px-6 py-3 text-right">
                        {!c.is_paid ? (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => openMarkPaid(c)}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> {t('Mark Paid')}
                          </Button>
                        ) : (
                          <button
                            className="text-xs font-black text-black hover:text-[#FF6B6B] transition-colors font-mono underline underline-offset-2 cursor-pointer"
                            onClick={() => handleMarkUnpaid(c)}
                          >
                            {t('Mark Unpaid')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Paid Modal */}
      <Modal
        isOpen={markModal}
        onClose={() => setMarkModal(false)}
        title={`${t('Mark Paid')} — ${t('Cycle')} #${markCycle?.cycle_number}`}
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setMarkModal(false)}>{t('Cancel')}</Button>
            <Button variant="secondary" size="sm" form="mark-paid-form" type="submit" disabled={marking}>
              {marking ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1.5 stroke-[2.5px]" />}
              {t('Confirm Payment')}
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
                  {markCycle.cycle_start_date} → {markCycle.cycle_end_date}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black font-heading text-black uppercase tracking-wider">{t('Payment Date')}</label>
              <Input
                type="date"
                value={markForm.payment_date}
                onChange={(e) => setMarkForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black font-heading text-black uppercase tracking-wider">{t('Notes (optional)')}</label>
              <Textarea
                value={markForm.notes}
                onChange={(e) => setMarkForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t('e.g. Cash payment received')}
                rows={2}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
