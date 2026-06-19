import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardContent } from '../../components/Card';
import { CheckCircle2, XCircle, AlertTriangle, Calendar, Clock, ClipboardList } from 'lucide-react';

const STATUS_BADGE = {
  submitted: { cls: 'bg-[#4ADE80] text-black border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]', icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />, label: 'Submitted' },
  not_submitted: { cls: 'bg-[#FF6B6B] text-black border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]', icon: <XCircle className="w-3.5 h-3.5 stroke-[3px]" />, label: 'Not Submitted' },
  late: { cls: 'bg-[#FFD93D] text-black border-2 border-black font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]', icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[3px]" />, label: 'Late' },
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
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight">Homework</h1>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
          <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight">Homework</h1>
          <p className="text-black/60 font-body font-bold mt-1">Assignments and submission status</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex px-2.5 py-0.5 text-xs font-mono font-bold border-2 border-black bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{pending.length} pending</span>
          <span className="inline-flex px-2.5 py-0.5 text-xs font-mono font-bold border-2 border-black bg-[#4ADE80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{submitted.length} submitted</span>
        </div>
      </div>

      {homework.length === 0 ? (
        <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center bg-white">
            <div className="text-black mb-4">
              <ClipboardList className="w-12 h-12 stroke-[2px]" />
            </div>
            <div className="text-black font-heading font-black text-lg uppercase tracking-tight">No homework assigned yet</div>
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
                className={`bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 duration-100 ${
                  isOverdue ? 'bg-red-500/5' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-heading text-black font-black text-lg uppercase tracking-tight">{hw.title}</div>
                      {hw.description && (
                        <div className="text-black/75 font-body text-sm mt-1 font-semibold">
                          {hw.description}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 flex-wrap text-xs font-mono font-bold">
                        <span className="text-black/60 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" />
                          Assigned: {hw.assigned_date}
                        </span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-black/60 font-bold'}`}>
                          <Clock className="w-3.5 h-3.5 stroke-[2.5px]" />
                          Due: {hw.due_date} {isOverdue ? '(Overdue!)' : ''}
                        </span>
                      </div>
                      {hw.feedback && (
                        <div className="mt-3 p-3 bg-[#FAF6EE] border-2 border-black text-sm text-black font-body shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <strong className="text-[#FF6B6B] font-heading font-black uppercase tracking-tight mr-1">Feedback:</strong> {hw.feedback}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-mono border flex-shrink-0 items-center gap-1.5 ${statusInfo.cls}`}>
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
