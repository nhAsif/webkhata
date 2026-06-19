import { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { BarChart2, Download, Search, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

function statusBadge(outstanding, totalDue) {
  if (outstanding === 0) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border bg-green-500/15 border-green-500/30 text-green-400">
        Paid
      </span>
    );
  }
  if (outstanding === totalDue && totalDue > 0) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border bg-red-500/15 border-red-500/30 text-red-400">
        Unpaid
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border bg-yellow-500/15 border-yellow-500/30 text-yellow-400">
      Partial
    </span>
  );
}

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly-collection?month=${month}`);
      setData(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const filtered = data.filter((r) =>
    r.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = filtered.reduce((s, r) => s + (r.total_due || 0), 0);
  const totalPaid = filtered.reduce((s, r) => s + (r.total_paid || 0), 0);
  const totalOutstanding = filtered.reduce((s, r) => s + (r.outstanding_balance || 0), 0);

  const exportCSV = () => {
    const headers = ['Student Name', 'Monthly Fee (৳)', 'Total Due (৳)', 'Total Paid (৳)', 'Outstanding (৳)', 'Status'];
    const rows = filtered.map((r) => {
      const outstanding = r.outstanding_balance ?? 0;
      const due = r.total_due ?? 0;
      const status = outstanding === 0 ? 'Paid' : outstanding === due && due > 0 ? 'Unpaid' : 'Partial';
      return [r.student_name, r.monthly_fee ?? 0, due, r.total_paid ?? 0, outstanding, status];
    });
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body">
        <div>
          <h1 className="text-3xl font-heading font-bold text-pure tracking-tight flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-bitcoin" />
            Monthly Report
          </h1>
          <p className="text-sm text-stardust mt-1">Collection & fee status for {month}</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
          <label className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Month</label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-semibold text-stardust uppercase tracking-wider font-mono">Search Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stardust pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-matter border border-white/10 rounded-2xl animate-pulse p-5 space-y-3">
              <div className="h-3.5 bg-white/5 rounded w-2/3" />
              <div className="h-8 bg-white/5 rounded w-1/2" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Students in Report"
              value={filtered.length}
              icon={<Users className="w-5 h-5 text-bitcoin" />}
              color="#F7931A"
            />
            <StatCard
              label="Total Due"
              value={`৳${totalDue.toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#ef4444"
            />
            <StatCard
              label="Total Collected"
              value={`৳${totalPaid.toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5 text-green-400" />}
              color="#10b981"
            />
            <StatCard
              label="Outstanding"
              value={`৳${totalOutstanding.toLocaleString()}`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={totalOutstanding > 0 ? '#ef4444' : '#10b981'}
            />
          </>
        )}
      </div>

      {/* Report Table */}
      <Card hover={false}>
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-lg font-heading font-semibold text-pure flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-bitcoin" /> Collection Report — {month}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl border border-white/10" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-lg font-heading font-semibold text-pure mb-1">No data for this period</div>
              <div className="text-sm text-stardust">Try selecting a different month or adding students with fees.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-void/40 border-y border-white/10">
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Student Name</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Monthly Fee</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Total Due</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Total Paid</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Outstanding</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-stardust uppercase font-mono">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((r) => {
                    const outstanding = r.outstanding_balance ?? 0;
                    const due = r.total_due ?? 0;
                    return (
                      <tr key={r.student_id} className="hover:bg-white/5 transition-all">
                        <td className="px-6 py-3.5 text-sm font-medium text-pure font-body">{r.student_name}</td>
                        <td className="px-6 py-3.5 text-sm font-mono text-bitcoin font-bold">
                          ৳{(r.monthly_fee ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-mono text-red-400">
                          ৳{due.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-mono text-green-400">
                          ৳{(r.total_paid ?? 0).toLocaleString()}
                        </td>
                        <td className={`px-6 py-3.5 text-sm font-mono font-bold ${
                          outstanding === 0 ? 'text-green-400' : outstanding === due && due > 0 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          ৳{outstanding.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          {statusBadge(outstanding, due)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="bg-white/5 border-t-2 border-white/10">
                    <td className="px-6 py-3.5 text-sm font-bold text-pure font-mono uppercase tracking-wider">
                      TOTALS ({filtered.length} students)
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-stardust">—</td>
                    <td className="px-6 py-3.5 text-sm font-mono font-bold text-red-400">
                      ৳{totalDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono font-bold text-green-400">
                      ৳{totalPaid.toLocaleString()}
                    </td>
                    <td className={`px-6 py-3.5 text-sm font-mono font-bold ${totalOutstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      ৳{totalOutstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
