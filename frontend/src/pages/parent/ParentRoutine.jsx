import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { BookOpen, Calendar, Clock, Coffee, ClipboardList, GraduationCap } from 'lucide-react';

const DAYS_ORDER = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function ParentRoutine() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/routine').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="mb-6 border-b-4 border-black pb-4">
          <h1 className="text-3xl font-heading font-black text-black uppercase tracking-tight">Weekly Routine</h1>
        </div>
        <div className="bg-white border-4 border-black h-[400px] shadow-[8px_8px_0px_var(--neo-shadow)]" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  const timetable = data?.weekly_timetable || {};

  // Check if any batch has timetable data saved
  const hasTimetable = DAYS_ORDER.some((d) => (timetable[d] || []).length > 0);

  return (
    <div className="space-y-8 animate-bounce-spring">
      {/* Header */}
      <div className="border-b-4 border-black pb-4">
        <h1 className="text-3xl md:text-4xl font-heading font-black text-black uppercase tracking-tight flex items-center gap-3">
          <Calendar className="w-8 h-8 md:w-10 md:h-10 text-black bg-[#FF6B6B] border-4 border-black shadow-[3px_3px_0px_var(--neo-shadow)] p-1.5 stroke-[2.5px] springy-bounce" />
          Weekly Routine
        </h1>
        <p className="text-black/70 font-body font-bold text-sm mt-2">
          Class schedule for <span className="text-[#FF6B6B] font-black underline underline-offset-2">{data?.student_name}</span>
        </p>
      </div>

      {/* Batch Details */}
      {data?.batches?.length > 0 && (
        <Card className="hover:shadow-[12px_12px_0px_var(--neo-shadow)]">
          <CardHeader className="bg-[#BAE6FD]/20">
            <CardTitle className="flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-black stroke-[2.5px]" />
              Enrolled Batches
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-6">
            {data.batches.map((b, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF6EE] border-2 border-black shadow-[3px_3px_0px_0px_var(--neo-shadow)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--neo-shadow)] transition-all duration-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 border-2 border-black bg-[#C4B5FD] text-black shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
                    <GraduationCap className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <div>
                    <div className="font-black text-black font-heading text-lg leading-tight">{b.batch_name}</div>
                    <div className="text-xs text-black/60 font-mono font-bold uppercase tracking-wider mt-0.5">{b.subject}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-xs font-black font-mono shadow-[2px_2px_0px_var(--neo-shadow)]">
                    <Clock className="w-3.5 h-3.5 stroke-[2.5px]" /> {b.time_slot}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {(b.days || []).map((d) => (
                      <span key={d} className="border-2 border-black bg-white text-black px-2 py-0.5 text-[10px] font-black font-mono shadow-[1px_1px_0px_var(--neo-shadow)]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly timetable */}
      <Card className="notebook-spirals bg-white hover:shadow-[12px_12px_0px_var(--neo-shadow)]">
        <CardHeader className="bg-[#C4B5FD]/20">
          <CardTitle className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-black stroke-[2.5px]" />
            Weekly Timetable
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {!hasTimetable ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="p-4 border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_var(--neo-shadow)] mb-4 animate-float">
                <ClipboardList className="w-10 h-10 text-black stroke-[2.5px]" />
              </div>
              <div className="text-xl font-heading font-black text-black uppercase tracking-tight">No timetable set yet</div>
              <div className="text-sm font-bold font-body text-black/60 mt-2">Your tutor hasn't configured the weekly subjects yet.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {DAYS_ORDER.map((day) => {
                const subjects = timetable[day] || [];
                const isToday = today === day;
                const isOff = subjects.length === 0;

                const rowBg = isToday
                  ? 'bg-[#FFD93D] border-4 border-black shadow-[6px_6px_0px_0px_var(--neo-shadow)] -translate-y-1'
                  : 'bg-white border-2 border-black shadow-[3px_3px_0px_0px_var(--neo-shadow)]';

                return (
                  <div
                    key={day}
                    className={`flex items-center gap-4 p-4 border transition-all duration-150 hover:-translate-y-0.5 ${rowBg}`}
                  >
                    <div className="w-14 shrink-0 flex flex-col items-center">
                      <span className={`font-black font-heading text-lg ${isToday ? 'text-black' : 'text-black/70'}`}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="block text-[9px] font-black uppercase font-mono tracking-wider text-white border-2 border-black bg-[#FF6B6B] px-1.5 py-0.5 mt-1 shadow-[1.5px_1.5px_0px_var(--neo-shadow)] text-center">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="h-8 w-1 border-r-2 border-dashed border-black/20 mx-2 hidden sm:block" />

                    <div className="flex-1">
                      {isOff ? (
                        <div className="flex items-center gap-1.5 text-black/55 text-sm font-bold font-body italic">
                          <Coffee className="w-4 h-4 shrink-0 stroke-[2.2px]" />
                          <span>Study Break / Off Day</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {subjects.map((sub) => (
                            <span
                              key={sub}
                              className="border-2 border-black bg-[#C4B5FD] text-black px-3 py-1 text-xs font-black font-mono uppercase tracking-wide shadow-[2px_2px_0px_var(--neo-shadow)] hover:scale-105 transition-transform cursor-default"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
