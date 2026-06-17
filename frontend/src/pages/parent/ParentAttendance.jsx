import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardContent } from '../../components/Card';
import { Input } from '../../components/Input';

const STATUS_COLORS = {
  present: { bg: 'bg-green-500/20', color: 'text-green-400', border: 'border-green-500/30', label: 'P' },
  absent: { bg: 'bg-red-500/20', color: 'text-red-400', border: 'border-red-500/30', label: 'A' },
  late: { bg: 'bg-yellow-500/20', color: 'text-yellow-400', border: 'border-yellow-500/30', label: 'L' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

export default function ParentAttendance() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/parent/attendance?month=${month}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [month]);

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, mon);
  const firstDay = getFirstDayOfMonth(year, mon);
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-heading text-pure font-bold">Attendance</h1>
          <p className="text-stardust font-body mt-1">Monthly attendance calendar</p>
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {data && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-green-500/20 text-green-400 border-green-500/30">✅ Present: {data.summary.present}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-red-500/20 text-red-400 border-red-500/30">❌ Absent: {data.summary.absent}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⏰ Late: {data.summary.late}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-blue-500/20 text-blue-400 border-blue-500/30">📅 Sessions: {data.summary.total_sessions}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-mono border ${
              data.summary.attendance_rate >= 75
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}
          >
            📊 {data.summary.attendance_rate}%
          </span>
        </div>
      )}

      <Card className="bg-matter border-white/10">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="animate-pulse bg-white/5 border border-white/10 rounded-lg h-[300px]" />
          ) : (
            <div>
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs text-stardust font-heading font-semibold p-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells for first day offset */}
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const status = data?.calendar?.[dateStr];
                  const style = status ? STATUS_COLORS[status] : null;

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-all duration-150 cursor-default border ${
                        style
                          ? `${style.bg} ${style.color} ${style.border} font-bold`
                          : 'bg-white/5 text-stardust border-transparent font-normal'
                      }`}
                      title={status ? `${dateStr}: ${status}` : dateStr}
                    >
                      <div className="font-mono">{day}</div>
                      {status && <div className="text-[9px] opacity-80 mt-0.5 font-mono">{style.label}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-6 justify-center flex-wrap">
                {Object.entries(STATUS_COLORS).map(([s, style]) => (
                  <div key={s} className="flex items-center gap-1.5 text-xs font-mono">
                    <div className={`w-3 h-3 rounded ${style.bg} border ${style.border}`} />
                    <span className="text-stardust capitalize">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
