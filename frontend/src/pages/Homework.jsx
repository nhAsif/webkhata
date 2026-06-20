import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const STATUS_OPTS = ['not_submitted', 'submitted', 'late'];
const STATUS_BADGE = {
  submitted: 'bg-[#C4B5FD] text-black border-2 border-black font-bold shadow-[2px_2px_0px_var(--neo-shadow)]',
  not_submitted: 'bg-[#FF6B6B] text-black border-2 border-black font-bold shadow-[2px_2px_0px_var(--neo-shadow)]',
  late: 'bg-[#FFD93D] text-black border-2 border-black font-bold shadow-[2px_2px_0px_var(--neo-shadow)]',
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
  const { t } = useTranslation();
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
      toast.success(t('Homework assigned'));
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
      toast.success(t('Submissions updated'));
      setSubmModal(false);
    } catch {} finally {
      setSubmSaving(false);
    }
  };

  const columns = [
    { key: 'title', label: t('Title'), render: (hw) => (
      <span className="font-medium text-pure">{hw.title}</span>
    ) },
    { key: 'batch_id', label: t('Batch'), render: (hw) => {
      const batch = batches.find((b) => b.id === hw.batch_id);
      return batch ? (
        <span className="border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
          {batch.name}
        </span>
      ) : <span className="text-black/60 font-mono font-bold">—</span>;
    }},
    { key: 'assigned_date', label: t('Assigned'), render: (hw) => (
      <span className="text-stardust font-mono text-sm">{hw.assigned_date}</span>
    ) },
    { key: 'due_date', label: t('Due Date'), render: (hw) => {
      const overdue = new Date(hw.due_date) < new Date() && hw.due_date !== today();
      return (
        <span className={`font-mono text-sm flex items-center gap-1.5 font-bold ${overdue ? 'text-[#FF6B6B]' : 'text-black/70'}`}>
          {hw.due_date} {overdue && <AlertTriangle className="w-4 h-4 text-[#FF6B6B] stroke-[3px]" />}
        </span>
      );
    }},
    { key: 'submission_count', label: t('Submissions'), render: (hw) => (
      <span className="border-2 border-black bg-white text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
        {hw.submission_count} {t("students")}
      </span>
    )},
    { key: 'actions', label: '', render: (hw) => (
      <Button variant="secondary" size="sm" onClick={() => openSubmissions(hw)}>
        {t("Track Submissions")}
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure tracking-tight">{t("Homework")}</h1>
          <p className="text-sm text-stardust mt-1 font-body">{t("Assign and track homework submissions")}</p>
        </div>
        <Button variant="primary" onClick={() => setCreateModal(true)}>+ {t("Assign Homework")}</Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm font-medium text-stardust whitespace-nowrap">{t("Filter by batch:")}</label>
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
              >
                <option value="">{t("All batches")}</option>
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
        searchPlaceholder={t("Search homework...")}
        searchKeys={['title']}
        emptyTitle={t("No homework assigned")}
        emptyDesc={t("Assign homework to a batch to get started.")}
        emptyAction={<Button variant="primary" onClick={() => setCreateModal(true)}>{t("Assign Homework")}</Button>}
      />

      {/* Create Homework Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title={t("Assign Homework")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModal(false)}>{t("Cancel")}</Button>
            <Button variant="primary" form="hw-form" type="submit" disabled={saving}>
              {saving ? t('Assigning...') : t('Assign')}
            </Button>
          </>
        }
      >
        <form id="hw-form" onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">{t("Batch")} *</label>
            <Select
              value={form.batch_id}
              onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
              required
            >
              <option value="">{t("Select batch...")}</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">{t("Title")} *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder={t("e.g. Chapter 3 exercises")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stardust">{t("Description")}</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t("Additional details...")}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">{t("Assigned Date")}</label>
              <Input
                type="date"
                value={form.assigned_date}
                onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stardust">{t("Due Date")} *</label>
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
        title={`${t("Submissions")} — ${selectedHw?.title}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmModal(false)}>{t("Close")}</Button>
            <Button variant="primary" onClick={handleSaveSubmissions} disabled={submSaving}>
              {submSaving ? t('Saving...') : t('Save')}
            </Button>
          </>
        }
      >
        <div className="text-xs text-stardust mb-4 font-body">
          {t("Click a student row to cycle through submission statuses. Add feedback below.")}
        </div>
        <div className="flex flex-col gap-3">
          {submissions.map((sub, i) => (
            <div
              key={sub.id}
              className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_var(--neo-shadow)] mb-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="font-bold text-sm text-black flex-1">
                  {sub.student_name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`border-2 border-black px-3 py-1 text-xs font-mono font-bold transition-all duration-100 shadow-[1px_1px_0px_var(--neo-shadow)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer ${
                        sub.status === s 
                          ? STATUS_BADGE[s] 
                          : 'bg-white text-black hover:bg-neutral-50'
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
                        <span>{t(s)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <Input
                className="h-10 text-xs shadow-[2px_2px_0px_var(--neo-shadow)] focus-visible:bg-[#FFD93D] focus-visible:shadow-[2px_2px_0px_var(--neo-shadow)]"
                placeholder={t("Feedback (optional)...")}
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
