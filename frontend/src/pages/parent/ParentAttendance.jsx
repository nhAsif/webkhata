import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardContent } from '../../components/Card';
import { Input } from '../../components/Input';
import { CheckCircle2, XCircle, Clock, Calendar, BarChart2 } from 'lucide-react';

const STATUS_COLORS = {
  present: { bg: 'bg-[#4ADE80]', color: 'text-black', border: 'border-2 border-black', label: 'P' },
  absent: { bg: 'bg-[#FF6B6B]', color: 'text-black', border: 'border-2 border-black', label: 'A' },
  late: { bg: 'bg-[#FFD93D]', color: 'text-black', border: 'border-2 border-black', label: 'L' },
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
          <h1 className="text-3xl font-heading text-black font-black uppercase tracking-tight">Attendance</h1>
          <p className="text-black/60 font-body mt-1">Monthly attendance calendar</p>
        </div>
        <div className="w-auto min-w-[150px]">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {data?.summary && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black bg-[#4ADE80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" />
            Present: {data.summary.present}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <XCircle className="w-3.5 h-3.5 stroke-[3px]" />
            Absent: {data.summary.absent}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Clock className="w-3.5 h-3.5 stroke-[3px]" />
            Late: {data.summary.late}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold border-2 border-black bg-[#C4B5FD] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" />
            Sessions: {data.summary.total_sessions}
          </span>
          <span
            className={`inline-flex px-3 py-1 text-xs font-mono font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              data.summary.attendance_rate >= 75
                ? 'bg-[#4ADE80] text-black'
                : 'bg-[#FF6B6B] text-black'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 stroke-[3px]" />
              {data.summary.attendance_rate}% Rate
            </span>
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6 bg-white">
          {loading ? (
            <div className="animate-pulse bg-neutral-100 border-4 border-black h-[300px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
          ) : (
            <div>
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-xs text-black font-heading font-black uppercase p-1">
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
                      className={`aspect-square flex flex-col items-center justify-center text-xs transition-all duration-150 cursor-default border-2 ${
                        style
                          ? `${style.bg} ${style.color} ${style.border} font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
                          : 'bg-[#FAF6EE] text-black/55 border-neutral-300 font-normal hover:bg-neutral-100'
                      }`}
                      title={status ? `${dateStr}: ${status}` : dateStr}
                    >
                      <div className="font-mono text-sm">{day}</div>
                      {status && <div className="text-[9px] opacity-75 mt-0.5 font-mono uppercase font-black">{style.label}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-6 justify-center flex-wrap">
                {Object.entries(STATUS_COLORS).map(([s, style]) => (
                  <div key={s} className="flex items-center gap-1.5 text-xs font-mono font-bold">
                    <div className={`w-4 h-4 ${style.bg} ${style.border} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`} />
                    <span className="text-black capitalize">{s}</span>
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
