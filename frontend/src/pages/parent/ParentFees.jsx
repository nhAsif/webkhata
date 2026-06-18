import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';

function CycleBadge({ isPaid }) {
  return isPaid
    ? <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">Paid</span>
    : <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">Unpaid</span>;
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
        <div className="mb-8"><h1 className="text-2xl font-heading text-pure font-bold">Fees</h1></div>
        <div className="animate-pulse bg-white/5 h-[200px] rounded-lg border border-white/10" />
      </div>
    );
  }

  const summary = data?.summary;

  const statusColor =
    !summary ? 'border-white/10'
    : summary.unpaid_cycles === 0 ? 'border-green-500/30'
    : summary.unpaid_cycles === 1 ? 'border-yellow-500/30'
    : 'border-red-500/30';

  const statusBadgeClass =
    !summary ? 'bg-white/10 text-stardust border-white/20'
    : summary.unpaid_cycles === 0 ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : summary.unpaid_cycles === 1 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';

  const statusText =
    !summary ? 'No Data'
    : summary.unpaid_cycles === 0 ? 'No Due'
    : summary.unpaid_cycles === 1 ? '1 Pending Cycle'
    : `${summary.unpaid_cycles} Pending Cycles`;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-heading text-pure font-bold">Fees</h1>
        <p className="text-stardust font-body mt-1">Cycle-based fee status and payment history</p>
      </div>

      {/* Summary Card */}
      <Card className={`bg-matter border-2 ${statusColor} mb-6`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 flex-wrap gap-4">
          <CardTitle className="font-heading text-pure">Fee Summary</CardTitle>
          <span className={`rounded-full px-3 py-1 text-xs font-bold font-mono border ${statusBadgeClass}`}>
            {statusText}
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Monthly Fee</div>
              <div className="text-xl font-heading text-bitcoin font-bold">৳{(data?.monthly_fee ?? 0).toLocaleString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Completed</div>
              <div className="text-xl font-heading text-pure font-bold">{summary?.completed_cycles ?? 0}</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Paid</div>
              <div className="text-xl font-heading text-green-400 font-bold">{summary?.paid_cycles ?? 0}</div>
            </div>
            <div className={`rounded-lg p-4 flex flex-col justify-center border ${
              (summary?.unpaid_cycles ?? 0) === 0
                ? 'bg-green-500/10 border-green-500/20'
                : (summary?.unpaid_cycles ?? 0) === 1
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Pending</div>
              <div className={`text-xl font-heading font-bold ${
                (summary?.unpaid_cycles ?? 0) === 0 ? 'text-green-400'
                : (summary?.unpaid_cycles ?? 0) === 1 ? 'text-yellow-400'
                : 'text-red-400'
              }`}>
                {summary?.unpaid_cycles ?? 0}
              </div>
            </div>
          </div>
          {(summary?.pending_amount ?? 0) > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-sm font-bold text-red-400 font-heading">Pending Amount</div>
                <div className="text-xl font-mono font-bold text-red-300">
                  ৳{(summary.pending_amount).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cycle History */}
      <Card className="bg-matter border-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-pure">Cycle History</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.cycles?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">📜</div>
              <div className="text-pure font-heading text-lg">No fee cycles yet</div>
              <div className="text-stardust font-body text-sm mt-1">Cycles are generated every 30 days from your start date.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body min-w-[500px]">
                <thead className="bg-white/5 text-stardust font-heading border-y border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cycle</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.cycles.map((c) => (
                    <tr key={c.cycle_number} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-pure font-mono">#{c.cycle_number}</td>
                      <td className="px-4 py-3 text-stardust font-mono text-xs">
                        {c.cycle_start_date} → {c.cycle_end_date}
                      </td>
                      <td className="px-4 py-3 text-pure font-mono">৳{c.fee_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><CycleBadge isPaid={c.is_paid} /></td>
                      <td className="px-4 py-3 text-stardust font-mono text-xs">{c.payment_date || '—'}</td>
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
