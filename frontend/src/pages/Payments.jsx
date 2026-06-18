import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import Button from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Wallet, Trash2, Pencil, PlusCircle } from 'lucide-react';

function today() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_FORM = {
  student_id: '',
  amount: '',
  payment_date: today(),
  notes: '',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Payments() {
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id') || '';

  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | null
  const [form, setForm] = useState({ ...EMPTY_FORM, student_id: preselectedStudentId });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    const params = preselectedStudentId ? `?student_id=${preselectedStudentId}` : '';
    api.get(`/payments${params}`)
      .then((r) => setPayments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/students').then((r) => setStudents(r.data.filter((s) => s.status === 'active')));
    load();
  }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, student_id: preselectedStudentId });
    setEditId(null);
    setModal('add');
  };

  const openEdit = (p) => {
    setForm({
      student_id: String(p.student_id),
      amount: p.amount,
      payment_date: p.payment_date || today(),
      notes: p.notes || '',
    });
    setEditId(p.id);
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        student_id: parseInt(form.student_id),
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        notes: form.notes || null,
      };
      if (modal === 'add') {
        await api.post('/payments', payload);
        toast.success('Payment recorded');
      } else {
        await api.put(`/payments/${editId}`, payload);
        toast.success('Payment updated');
      }
      setModal(null);
      load();
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${deleteConfirm}`);
      toast.success('Payment deleted');
      setDeleteConfirm(null);
      load();
    } catch {
      // handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  const studentName = (id) => {
    const s = students.find((s) => s.id === id);
    return s ? s.name : `Student #${id}`;
  };

  const filterLabel = preselectedStudentId
    ? `Payments for ${studentName(parseInt(preselectedStudentId))}`
    : 'All Payments';

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const columns = [
    {
      key: 'student_id',
      label: 'Student',
      render: (p) => (
        <span className="font-medium text-pure font-body">{p.student_name || studentName(p.student_id)}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (p) => (
        <span className="font-mono font-bold text-green-400">৳{(p.amount || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'payment_date',
      label: 'Date',
      render: (p) => (
        <span className="font-mono text-sm text-stardust">{fmtDate(p.payment_date)}</span>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (p) => (
        <span className="text-sm text-stardust font-body">{p.notes || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirm(p.id)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body">
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-bitcoin" />
            Payments
          </h1>
          <p className="text-sm text-stardust mt-1">{filterLabel}</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add Payment
        </Button>
      </div>

      {/* Summary card */}
      {!loading && payments.length > 0 && (
        <Card hover={false}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-mono text-stardust uppercase tracking-wider">Total Payments</span>
                <span className="text-xl font-bold font-mono text-pure">{payments.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-stardust uppercase tracking-wider">Total Collected</span>
                <span className="text-xl font-bold font-mono text-green-400">৳{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        searchPlaceholder="Search payments..."
        searchKeys={['student_name', 'notes']}
        emptyTitle="No payments yet"
        emptyDesc="Record your first payment to get started."
        emptyAction={
          <Button variant="primary" onClick={openAdd}>Add Payment</Button>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Record Payment' : 'Edit Payment'}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" form="payment-form" type="submit" disabled={saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : null}
              {modal === 'add' ? 'Save Payment' : 'Update Payment'}
            </Button>
          </div>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Student *</label>
            <Select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Amount (৳) *</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              placeholder="e.g. 500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Payment Date *</label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stardust">Notes (optional)</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Cash payment for June"
              rows={2}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Payment"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <span className="w-4 h-4 border-2 border-pure/30 border-t-pure rounded-full animate-spin mr-2" />
              ) : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-stardust text-sm font-body">
          Are you sure you want to delete this payment record? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
