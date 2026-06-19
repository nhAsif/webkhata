import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Check, X, AlertTriangle } from 'lucide-react';

const STATUS_OPTS = ['not_submitted', 'submitted', 'late'];
const STATUS_BADGE = {
  submitted: 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  not_submitted: 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  late: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
};
const STATUS_ICON = {
  submitted: <Check className="w-3.5 h-3.5 stroke-[3px]" />,
  not_submitted: <X className="w-3.5 h-3.5 stroke-[3px]" />,
  late: <AlertTriangle className="w-3.5 h-3.5 stroke-[3px]" />,
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Homework() {
  const [batches, setBatches] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState('');

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    batch_id: '',
    title: '',
    description: '',
    assigned_date: today(),
    due_date: '',
  });
  const [saving, setSaving] = useState(false);

  // Submissions modal
  const [submModal, setSubmModal] = useState(false);
  const [selectedHw, setSelectedHw] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submSaving, setSubmSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const url = filterBatch ? `/homework?batch_id=${filterBatch}` : '/homework';
    api.get(url).then((r) => setHomework(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/batches?status=active').then((r) => setBatches(r.data));
  }, []);

  useEffect(load, [filterBatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/homework', {
        ...form,
        batch_id: parseInt(form.batch_id),
      });
      toast.success('Homework assigned');
      setCreateModal(false);
      load();
    } catch {} finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (hw) => {
    setSelectedHw(hw);
    const res = await api.get(`/homework/${hw.id}/submissions`);
    setSubmissions(res.data.map((s) => ({ ...s })));
    setSubmModal(true);
  };

  const cycleStatus = (idx) => {
    setSubmissions((prev) => {
      const updated = [...prev];
      const cur = updated[idx].status;
      const next = STATUS_OPTS[(STATUS_OPTS.indexOf(cur) + 1) % STATUS_OPTS.length];
      updated[idx] = { ...updated[idx], status: next };
      return updated;
    });
  };

  const handleSaveSubmissions = async () => {
    setSubmSaving(true);
    try {
      await api.put(`/homework/${selectedHw.id}/submissions`, submissions.map((s) => ({
        student_id: s.student_id,
        status: s.status,
        feedback: s.feedback,
      })));
      toast.success('Submissions updated');
      setSubmModal(false);
    } catch {} finally {
      setSubmSaving(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (hw) => (
      <span className="font-medium text-pure">{hw.title}</span>
    ) },
    { key: 'batch_id', label: 'Batch', render: (hw) => {
      const batch = batches.find((b) => b.id === hw.batch_id);
      return batch ? (
        <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-blue-500/10 text-blue-400 border-blue-500/30">
          {batch.name}
        </span>
      ) : <span className="text-stardust">—</span>;
    }},
    { key: 'assigned_date', label: 'Assigned', render: (hw) => (
      <span className="text-stardust font-mono text-sm">{hw.assigned_date}</span>
    ) },
    { key: 'due_date', label: 'Due Date', render: (hw) => {
      const overdue = new Date(hw.due_date) < new Date() && hw.due_date !== today();
      return (
        <span className={`font-mono text-sm flex items-center gap-1.5 ${overdue ? 'text-red-400 font-medium' : 'text-stardust'}`}>
          {hw.due_date} {overdue && <AlertTriangle className="w-4 h-4 text-red-400 stroke-[3px]" />}
        </span>
      );
    }},
    { key: 'submission_count', label: 'Submissions', render: (hw) => (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-white/5 text-stardust border-white/10">
        {hw.submission_count} students
      </span>
    )},
    { key: 'actions', label: '', render: (hw) => (
      <Button variant="secondary" size="sm" onClick={() => openSubmissions(hw)}>
        Track Submissions
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure tracking-tight">Homework</h1>
          <p className="text-sm text-stardust mt-1 font-body">Assign and track homework submissions</p>
        </div>
        <Button variant="primary" onClick={() => setCreateModal(true)}>+ Assign Homework</Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-stardust whitespace-nowrap">Filter by batch:</label>
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
              >
                <option value="">All batches</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={homework}
        loading={loading}
        searchPlaceholder="Search homework..."
        searchKeys={['title']}
        emptyTitle="No homework assigned"
        emptyDesc="Assign homework to a batch to get started."
        emptyAction={<Button variant="primary" onClick={() => setCreateModal(true)}>Assign Homework</Button>}
      />

      {/* Create Homework Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Assign Homework"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" form="hw-form" type="submit" disabled={saving}>
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </>
        }
      >
        <form id="hw-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Batch *</label>
            <Select
              value={form.batch_id}
              onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
              required
            >
              <option value="">Select batch...</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Chapter 3 exercises"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Assigned Date</label>
              <Input
                type="date"
                value={form.assigned_date}
                onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">Due Date *</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                required
                min={form.assigned_date}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Submissions Tracking Modal */}
      <Modal
        isOpen={submModal}
        onClose={() => setSubmModal(false)}
        title={`Submissions — ${selectedHw?.title}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleSaveSubmissions} disabled={submSaving}>
              {submSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="text-xs text-stardust mb-4 font-body">
          Click a student row to cycle through submission statuses. Add feedback below.
        </div>
        <div className="flex flex-col gap-3">
          {submissions.map((sub, i) => (
            <div
              key={sub.id}
              className="p-4 bg-white/5 rounded-xl border border-white/10 transition-colors hover:border-white/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="font-medium text-sm text-pure flex-1">
                  {sub.student_name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-mono font-medium transition-all duration-200 border ${
                        sub.status === s 
                          ? STATUS_BADGE[s] 
                          : 'bg-transparent text-stardust border-white/10 hover:border-white/30 hover:text-pure hover:bg-white/5'
                      }`}
                      onClick={() => {
                        setSubmissions((prev) => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], status: s };
                          return updated;
                        });
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {STATUS_ICON[s]}
                        <span>{s.replace('_', ' ')}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <Input
                className="h-10 text-xs bg-black/30 border-white/10 focus-visible:border-bitcoin/50"
                placeholder="Feedback (optional)..."
                value={sub.feedback || ''}
                onChange={(e) => {
                  setSubmissions((prev) => {
                    const updated = [...prev];
                    updated[i] = { ...updated[i], feedback: e.target.value };
                    return updated;
                  });
                }}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
