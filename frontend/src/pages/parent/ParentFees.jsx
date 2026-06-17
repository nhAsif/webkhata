import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';

export default function ParentFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/fees').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status) => {
    const map = { 
      paid: 'bg-green-500/20 text-green-400 border-green-500/30', 
      unpaid: 'bg-red-500/20 text-red-400 border-red-500/30', 
      partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
    };
    const defaultCls = 'bg-white/10 text-pure border-white/20';
    const cls = map[status.toLowerCase()] || defaultCls;
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono border ${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8"><h1 className="text-2xl font-heading text-pure font-bold">Fees</h1></div>
        <div className="animate-pulse bg-white/5 h-[200px] rounded-lg border border-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-heading text-pure font-bold">Fees</h1>
        <p className="text-stardust font-body mt-1">Monthly fee status and payment history</p>
      </div>

      {/* Current Month */}
      {data?.current_month && (
        <Card className="bg-matter border-white/10 mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2 flex-wrap gap-4">
            <CardTitle className="font-heading text-pure">Current Month — {data.current_month.month}</CardTitle>
            {statusBadge(data.current_month.status)}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center border-b-4 border-b-blue-500/50">
                <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Amount Due</div>
                <div className="text-xl font-heading text-pure font-bold">৳{data.current_month.amount_due?.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center border-b-4 border-b-green-500/50">
                <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Amount Paid</div>
                <div className="text-xl font-heading text-green-400 font-bold">৳{data.current_month.amount_paid?.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-center border-b-4 border-b-red-500/50">
                <div className="text-xs text-stardust font-body uppercase tracking-wider mb-1">Remaining</div>
                <div className="text-xl font-heading text-red-400 font-bold">৳{(data.current_month.amount_due - data.current_month.amount_paid)?.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!data?.current_month && (
        <Card className="bg-matter border-white/10 mb-6">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="text-4xl mb-4">💰</div>
            <div className="text-pure font-heading text-lg mb-2">No fee record for current month</div>
            <div className="text-stardust font-body text-sm">Contact your tutor for fee information.</div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-matter border-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-pure">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
        {data?.history?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📜</div>
            <div className="text-pure font-heading text-lg">No payment history</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body min-w-[600px]">
              <thead className="bg-white/5 text-stardust font-heading border-y border-white/10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Amount Due</th>
                  <th className="px-4 py-3 font-semibold">Amount Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment Date</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data?.history?.map((fee, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-pure">{fee.month}</td>
                    <td className="px-4 py-3 text-stardust">৳{fee.amount_due?.toLocaleString()}</td>
                    <td className={`px-4 py-3 ${fee.amount_paid > 0 ? 'text-green-400' : 'text-stardust'}`}>
                      ৳{fee.amount_paid?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{statusBadge(fee.status)}</td>
                    <td className="px-4 py-3 text-stardust font-mono text-xs">{fee.payment_date || '—'}</td>
                    <td className="px-4 py-3 text-stardust">{fee.payment_method || '—'}</td>
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
