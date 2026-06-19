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
      <span className="inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase font-mono bg-[#4ADE80] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        Paid
      </span>
    );
  }
  if (outstanding === totalDue && totalDue > 0) {
    return (
      <span className="inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase font-mono bg-[#FF6B6B] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        Unpaid
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 border-2 border-black text-[10px] font-bold uppercase font-mono bg-[#FFD93D] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
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
            <div key={i} className="h-28 bg-white border-4 border-black p-5 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              <div className="h-3.5 bg-neutral-200 border border-black rounded-none w-2/3" />
              <div className="h-8 bg-neutral-200 border border-black rounded-none w-1/2" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Students in Report"
              value={filtered.length}
              icon={<Users className="w-5 h-5 text-black" />}
              color="#FFD93D"
            />
            <StatCard
              label="Total Due"
              value={`৳${totalDue.toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5 text-black" />}
              color="#FF6B6B"
            />
            <StatCard
              label="Total Collected"
              value={`৳${totalPaid.toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5 text-black" />}
              color="#4ADE80"
            />
            <StatCard
              label="Outstanding"
              value={`৳${totalOutstanding.toLocaleString()}`}
              icon={<AlertTriangle className="w-5 h-5 text-black" />}
              color={totalOutstanding > 0 ? '#FF6B6B' : '#4ADE80'}
            />
          </>
        )}
      </div>

      {/* Report Table */}
      <Card hover={false}>
        <CardHeader className="border-b-4 border-black bg-[#C4B5FD]/10 pb-4">
          <CardTitle className="text-lg font-heading font-black text-black flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-black stroke-[2.5px]" /> Collection Report — {month}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3 bg-white">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white animate-pulse border-2 border-black" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white">
              <div className="text-black mb-3">
                <BarChart2 className="w-12 h-12 stroke-[2px]" />
              </div>
              <div className="text-lg font-heading font-black text-black mb-1">No data for this period</div>
              <div className="text-sm text-black/60 font-bold">Try selecting a different month or adding students with fees.</div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b-4 border-black">
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Student Name</th>
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Monthly Fee</th>
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Total Due</th>
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Total Paid</th>
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Outstanding</th>
                    <th className="px-6 py-3.5 text-xs font-black text-black uppercase font-heading">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black bg-white">
                  {filtered.map((r) => {
                    const outstanding = r.outstanding_balance ?? 0;
                    const due = r.total_due ?? 0;
                    return (
                      <tr key={r.student_id} className="hover:bg-neutral-50 transition-all">
                        <td className="px-6 py-3.5 text-sm font-medium text-black font-body">{r.student_name}</td>
                        <td className="px-6 py-3.5 text-sm font-mono text-black font-bold">
                          ৳{(r.monthly_fee ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-mono text-red-600 font-bold">
                          ৳{due.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-mono text-emerald-700 font-bold">
                          ৳{(r.total_paid ?? 0).toLocaleString()}
                        </td>
                        <td className={`px-6 py-3.5 text-sm font-mono font-bold ${
                          outstanding === 0 ? 'text-emerald-700' : outstanding === due && due > 0 ? 'text-red-600' : 'text-amber-700'
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
                  <tr className="bg-[#FAF6EE] border-t-4 border-black font-bold">
                    <td className="px-6 py-3.5 text-sm font-black text-black font-heading uppercase tracking-wider">
                      TOTALS ({filtered.length} students)
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-black/60">—</td>
                    <td className="px-6 py-3.5 text-sm font-mono font-bold text-red-600">
                      ৳{totalDue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono font-bold text-emerald-700">
                      ৳{totalPaid.toLocaleString()}
                    </td>
                    <td className={`px-6 py-3.5 text-sm font-mono font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
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
