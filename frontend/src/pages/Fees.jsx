import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'bank'];

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);

  // Generate modal
  const [genModal, setGenModal] = useState(false);
  const [genAmount, setGenAmount] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genSaving, setGenSaving] = useState(false);

  // Payment modal
  const [payModal, setPayModal] = useState(false);
  const [payFee, setPayFee] = useState(null);
  const [payForm, setPayForm] = useState({ amount_paid: '', payment_method: 'cash', payment_date: '', notes: '' });
  const [paySaving, setPaySaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/fees?month=${month}`),
      api.get(`/fees/summary/monthly?month=${month}`),
    ]).then(([feesRes, sumRes]) => {
      setFees(feesRes.data);
      setSummary(sumRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [month]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenSaving(true);
    try {
      const res = await api.post('/fees/generate', {
        month: genMonth,
        amount_due: parseFloat(genAmount),
      });
      toast.success(res.data.message);
      setGenModal(false);
      load();
    } catch {} finally {
      setGenSaving(false);
    }
  };

  const openPayment = (fee) => {
    setPayFee(fee);
    setPayForm({
      amount_paid: fee.amount_paid || '',
      payment_method: fee.payment_method || 'cash',
      payment_date: fee.payment_date || new Date().toISOString().split('T')[0],
      notes: fee.notes || '',
    });
    setPayModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaySaving(true);
    try {
      await api.put(`/fees/${payFee.id}`, {
        amount_paid: parseFloat(payForm.amount_paid),
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date || null,
        notes: payForm.notes || null,
      });
      toast.success('Payment recorded');
      setPayModal(false);
      load();
    } catch {} finally {
      setPaySaving(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      unpaid: 'bg-red-500/20 text-red-400 border-red-500/30',
      partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono border ${map[status] || 'bg-white/10 text-pure border-white/20'}`}>{status}</span>;
  };

  const columns = [
    { key: 'student_name', label: 'Student' },
    { key: 'month', label: 'Month' },
    { key: 'amount_due', label: 'Amount Due', render: (f) => <span className="font-mono">৳{f.amount_due.toLocaleString()}</span> },
    { key: 'amount_paid', label: 'Paid', render: (f) => (
      <span className={f.amount_paid > 0 ? 'text-green-400 font-mono' : 'text-stardust font-mono'}>
        ৳{f.amount_paid.toLocaleString()}
      </span>
    )},
    { key: 'status', label: 'Status', render: (f) => statusBadge(f.status) },
    { key: 'payment_method', label: 'Method', render: (f) => <span className="font-mono">{f.payment_method || '—'}</span> },
    { key: 'actions', label: '', render: (f) => (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openPayment(f)}
      >
        Record Payment
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Fees</h1>
          <p className="text-stardust text-sm mt-1">Track monthly fee collection</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button variant="primary" onClick={() => setGenModal(true)}>
            ⚡ Generate Fees
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-500/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.15)] hover:border-green-500/50 hover:shadow-[0_0_20px_-5px_rgba(34,197,94,0.2)]">
            <CardContent className="p-6">
              <div className="text-sm text-stardust mb-1 font-body">Collected</div>
              <div className="text-2xl font-mono font-semibold text-green-400">
                ৳{summary.total_collected.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.15)] hover:border-red-500/50 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]">
            <CardContent className="p-6">
              <div className="text-sm text-stardust mb-1 font-body">Outstanding</div>
              <div className="text-2xl font-mono font-semibold text-red-400">
                ৳{summary.outstanding.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-indigo-500/30 shadow-[0_0_15px_-5px_rgba(99,102,241,0.15)] hover:border-indigo-500/50 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]">
            <CardContent className="p-6">
              <div className="text-sm text-stardust mb-1 font-body">Total Due</div>
              <div className="text-2xl font-mono font-semibold text-indigo-400">
                ৳{summary.total_due.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-stardust mb-2 font-body">Status Breakdown</div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">✅ {summary.paid_count} paid</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⚡ {summary.partial_count} partial</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">❌ {summary.unpaid_count} unpaid</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={fees}
        loading={loading}
        searchPlaceholder="Search student..."
        searchKeys={['student_name']}
        emptyTitle="No fee records for this month"
        emptyDesc="Generate fees for all active students using the button above."
        emptyAction={<Button variant="primary" onClick={() => setGenModal(true)}>Generate Fees</Button>}
      />

      {/* Generate Modal */}
      <Modal
        isOpen={genModal}
        onClose={() => setGenModal(false)}
        title="Generate Monthly Fees"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setGenModal(false)}>Cancel</Button>
            <Button variant="primary" form="gen-form" type="submit" disabled={genSaving}>
              {genSaving ? <span className="animate-pulse bg-white/20 w-4 h-4 rounded-full mr-2" /> : null}
              Generate
            </Button>
          </div>
        }
      >
        <form id="gen-form" onSubmit={handleGenerate} className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm flex gap-3">
            <span>ℹ️</span>
            <div>This will create fee records for all active students. Existing records will be skipped.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Month</label>
              <Input
                type="month"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Amount Due (৳) *</label>
              <Input
                type="number"
                value={genAmount}
                onChange={(e) => setGenAmount(e.target.value)}
                required
                min="1"
                placeholder="e.g. 1500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title={`Record Payment — ${payFee?.student_name}`}
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
            <Button variant="primary" form="pay-form" type="submit" disabled={paySaving}>
              {paySaving ? <span className="animate-pulse bg-white/20 w-4 h-4 rounded-full mr-2" /> : null}
              Save Payment
            </Button>
          </div>
        }
      >
        {payFee && (
          <form id="pay-form" onSubmit={handlePayment} className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                Amount due: <strong className="font-mono">৳{payFee.amount_due.toLocaleString()}</strong>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stardust">Amount Paid (৳) *</label>
                <Input
                  type="number"
                  value={payForm.amount_paid}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount_paid: e.target.value }))}
                  required
                  min="0"
                  max={payFee.amount_due}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stardust">Payment Method</label>
                <Select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stardust">Payment Date</label>
                <Input
                  type="date"
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-medium text-stardust">Notes</label>
              <Textarea
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional note..."
                rows={2}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
