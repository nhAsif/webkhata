import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardContent } from '../../components/Card';

const STATUS_BADGE = {
  submitted: { cls: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✓', label: 'Submitted' },
  not_submitted: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '✗', label: 'Not Submitted' },
  late: { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⚠', label: 'Late' },
};

export default function ParentHomework() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/homework').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8"><h1 className="text-2xl font-heading text-pure font-bold">Homework</h1></div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/5 border-white/10">
              <CardContent className="h-20 p-6" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const homework = data?.homework || [];
  const pending = homework.filter((h) => h.submission_status !== 'submitted');
  const submitted = homework.filter((h) => h.submission_status === 'submitted');

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-heading text-pure font-bold">Homework</h1>
          <p className="text-stardust font-body mt-1">Assignments and submission status</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">{pending.length} pending</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">{submitted.length} submitted</span>
        </div>
      </div>

      {homework.length === 0 ? (
        <Card className="bg-matter border-white/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-pure font-heading text-lg">No homework assigned yet</div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {homework.map((hw, i) => {
            const statusInfo = STATUS_BADGE[hw.submission_status] || STATUS_BADGE.not_submitted;
            const isOverdue = hw.due_date < today && hw.submission_status !== 'submitted';

            return (
              <Card
                key={i}
                className={`bg-matter transition-colors ${isOverdue ? 'border-red-500/30' : 'border-white/10 hover:border-bitcoin/30'}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-heading text-pure font-bold text-base">{hw.title}</div>
                      {hw.description && (
                        <div className="text-stardust font-body text-sm mt-1">
                          {hw.description}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 flex-wrap">
                        <span className="text-xs text-stardust font-mono">
                          📅 Assigned: {hw.assigned_date}
                        </span>
                        <span className={`text-xs font-mono ${isOverdue ? 'text-red-400' : 'text-stardust'}`}>
                          ⏰ Due: {hw.due_date} {isOverdue ? '(Overdue!)' : ''}
                        </span>
                      </div>
                      {hw.feedback && (
                        <div className="mt-3 p-3 bg-white/5 rounded-md text-sm text-pure font-body border-l-2 border-bitcoin/50">
                          <strong className="text-bitcoin font-heading">Feedback:</strong> {hw.feedback}
                        </div>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono border flex-shrink-0 ${statusInfo.cls}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
