import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';

function CycleBadge({ isPaid }) {
  return isPaid
    ? <span className="inline-flex px-2.5 py-0.5 border-2 border-black text-xs font-mono font-bold bg-[#4ADE80] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Paid</span>
    : <span className="inline-flex px-2.5 py-0.5 border-2 border-black text-xs font-mono font-bold bg-[#FF6B6B] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">Unpaid</span>;
}

export default function ParentFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/fees').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight">Fees</h1>
        </div>
        <div className="animate-pulse bg-neutral-100 border-4 border-black h-[200px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse" />
      </div>
    );
  }

  const summary = data?.summary;

  const statusColor =
    !summary ? 'border-black'
    : summary.unpaid_cycles === 0 ? 'border-emerald-500'
    : summary.unpaid_cycles === 1 ? 'border-[#FFD93D]'
    : 'border-[#FF6B6B]';

  const statusBadgeClass =
    !summary ? 'bg-neutral-100 text-black/50 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
    : summary.unpaid_cycles === 0 ? 'bg-[#4ADE80] text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
    : summary.unpaid_cycles === 1 ? 'bg-[#FFD93D] text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
    : 'bg-[#FF6B6B] text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]';

  const statusText =
    !summary ? 'No Data'
    : summary.unpaid_cycles === 0 ? 'No Due'
    : summary.unpaid_cycles === 1 ? '1 Pending'
    : `${summary.unpaid_cycles} Pending`;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight">Fees</h1>
        <p className="text-black/60 font-body font-bold mt-1">Cycle-based fee status and payment history</p>
      </div>

      {/* Summary Card */}
      <Card className={`bg-white border-4 ${statusColor} mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 flex-wrap gap-4 border-b-2 border-black">
          <CardTitle className="font-heading font-black text-black uppercase tracking-tight">Fee Summary</CardTitle>
          <span className={`px-3 py-1 text-xs font-bold font-mono border-2 border-black ${statusBadgeClass}`}>
            {statusText}
          </span>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#FAF6EE] border-2 border-black p-4 flex flex-col justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs text-black/60 font-body uppercase tracking-wider mb-1 font-bold">Monthly Fee</div>
              <div className="text-xl font-display text-black font-black">৳{(data?.monthly_fee ?? 0).toLocaleString()}</div>
            </div>
            <div className="bg-[#FAF6EE] border-2 border-black p-4 flex flex-col justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs text-black/60 font-body uppercase tracking-wider mb-1 font-bold">Completed</div>
              <div className="text-xl font-display text-black font-black">{summary?.completed_cycles ?? 0}</div>
            </div>
            <div className="bg-[#4ADE80]/15 border-2 border-black p-4 flex flex-col justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs text-black/60 font-body uppercase tracking-wider mb-1 font-bold">Paid</div>
              <div className="text-xl font-display text-emerald-800 font-black">{summary?.paid_cycles ?? 0}</div>
            </div>
            <div className={`p-4 flex flex-col justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              (summary?.unpaid_cycles ?? 0) === 0
                ? 'bg-[#4ADE80]/15'
                : (summary?.unpaid_cycles ?? 0) === 1
                ? 'bg-[#FFD93D]/15'
                : 'bg-[#FF6B6B]/15'
            }`}>
              <div className="text-xs text-black/60 font-body uppercase tracking-wider mb-1 font-bold">Pending</div>
              <div className={`text-xl font-display font-black ${
                (summary?.unpaid_cycles ?? 0) === 0 ? 'text-emerald-800'
                : (summary?.unpaid_cycles ?? 0) === 1 ? 'text-amber-700'
                : 'text-red-600'
              }`}>
                {summary?.unpaid_cycles ?? 0}
              </div>
            </div>
          </div>
          {(summary?.pending_amount ?? 0) > 0 && (
            <div className="bg-[#FF6B6B]/10 border-2 border-black p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-sm font-black text-red-700 font-heading uppercase tracking-tight">Pending Amount</div>
                <div className="text-xl font-mono font-black text-red-600">
                  ৳{(summary.pending_amount).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cycle History */}
      <Card className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-4 border-black bg-[#C4B5FD]/10 pb-4">
          <CardTitle className="font-heading font-black text-black uppercase tracking-tight">Cycle History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.cycles?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white">
              <div className="text-4xl mb-4">📜</div>
              <div className="text-black font-heading font-black text-lg uppercase tracking-tight">No fee cycles yet</div>
              <div className="text-black/60 font-body text-sm font-semibold mt-1">Cycles are generated every 30 days from your start date.</div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left text-sm font-body min-w-[500px] whitespace-nowrap">
                <thead className="bg-[#FAF6EE] text-black font-heading border-b-4 border-black font-black uppercase">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-black">Cycle</th>
                    <th className="px-6 py-3.5 text-xs font-black">Period</th>
                    <th className="px-6 py-3.5 text-xs font-black">Amount</th>
                    <th className="px-6 py-3.5 text-xs font-black">Status</th>
                    <th className="px-6 py-3.5 text-xs font-black">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white">
                  {data.cycles.map((c) => (
                    <tr key={c.cycle_number} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-black font-mono">#{c.cycle_number}</td>
                      <td className="px-6 py-3.5 text-black/80 font-mono text-xs">
                        {c.cycle_start_date} → {c.cycle_end_date}
                      </td>
                      <td className="px-6 py-3.5 text-black font-mono font-bold">৳{c.fee_amount?.toLocaleString()}</td>
                      <td className="px-6 py-3.5"><CycleBadge isPaid={c.is_paid} /></td>
                      <td className="px-6 py-3.5 text-black/70 font-mono text-xs">{c.payment_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
