import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';

const DAYS_ORDER = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function ParentRoutine() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/routine').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-pure">Weekly Routine</h1>
        </div>
        <div className="animate-pulse bg-white/5 h-[400px] rounded-2xl" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const timetable = data?.weekly_timetable || {};

  // Check if any batch has timetable data saved
  const hasTimetable = DAYS_ORDER.some((d) => (timetable[d] || []).length > 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-pure">Weekly Routine</h1>
        <p className="text-stardust font-body mt-1">Class schedule for <span className="text-bitcoin font-medium">{data?.student_name}</span></p>
      </div>

      {/* Batch Details */}
      {data?.batches?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📚 Enrolled Batches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.batches.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-void rounded-xl border border-white/10"
              >
                <div className="flex-1">
                  <div className="font-semibold text-pure font-body">{b.batch_name}</div>
                  <div className="text-xs text-stardust font-body">{b.subject}</div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {b.time_slot}
                </span>
                <div className="flex gap-1.5">
                  {(b.days || []).map((d) => (
                    <span key={d} className="rounded-full px-2 py-0.5 text-[10px] font-mono border bg-white/5 text-stardust border-white/10">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly timetable */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Weekly Timetable</CardTitle>
        </CardHeader>

        <CardContent>
          {!hasTimetable ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-lg font-heading font-semibold text-pure">No timetable set yet</div>
              <div className="text-sm text-stardust mt-1">Your tutor hasn't configured the weekly subjects yet.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {DAYS_ORDER.map((day) => {
                const subjects = timetable[day] || [];
                const isToday = today === day;
                const isOff = subjects.length === 0;

                return (
                  <div
                    key={day}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border ${
                      isToday ? 'bg-bitcoin/10 border-bitcoin/30' : 'bg-void border-white/10'
                    }`}
                  >
                    <div className={`w-10 font-bold font-mono text-sm shrink-0 ${isToday ? 'text-bitcoin' : 'text-stardust'}`}>
                      {day}
                      {isToday && <div className="text-[9px] text-gold mt-0.5">Today</div>}
                    </div>

                    {isOff ? (
                      <span className="text-stardust/70 text-sm italic font-body">
                        🏖️ Off Day
                      </span>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {subjects.map((sub) => (
                          <span key={sub} className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
