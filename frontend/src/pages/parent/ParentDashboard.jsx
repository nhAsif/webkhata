import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { CheckSquare, Calendar, BookOpen, Clock, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [vocabStats, setVocabStats] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/parent/profile'),
      api.get('/parent/attendance'),
      api.get('/vocabulary/progress/stats').catch(() => ({ data: null })),
      api.get('/parent/routine').catch(() => ({ data: null }))
    ]).then(([p, a, v, r]) => {
      setProfile(p.data);
      setAttendance(a.data);
      setVocabStats(v.data);
      setRoutine(r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-neutral-primary-soft border border-border-muted/30">
              <CardContent className="p-6">
                <div className="h-3 bg-neutral-primary-medium rounded w-20 mb-4" />
                <div className="h-9 bg-neutral-primary-medium rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const student = profile?.student;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-heading text-heading font-bold">Welcome{student ? `, ${student.name.split(' ')[0]}` : ''}!</h1>
        <p className="text-body-subtle font-body mt-1 font-bold">Your child's academic overview</p>
      </div>

      {student && (
        <Card className="bg-neutral-primary-soft border-2 border-border-default mb-6">
          <CardContent className="p-6">
            <div className="flex gap-6 items-center flex-wrap">
              <div className="w-24 h-24 border-4 border-black bg-[#FF6B6B] flex items-center justify-center shadow-[4px_4px_0px_var(--neo-shadow)] flex-shrink-0 relative overflow-hidden">
                {student.photo_path ? (
                  <img src={`/${student.photo_path}`} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-xl font-heading text-heading font-bold">{student.name}</div>
                <div className="text-body-subtle font-body text-sm mt-1">
                  Class {student.class_level} · Enrolled since {student.enrollment_date}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {(student.subjects || []).map((sub) => (
                    <span key={sub} className="border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          label="Attendance Rate"
          value={attendance ? `${attendance.summary.attendance_rate}%` : '—'}
          icon={<CheckSquare className="w-5 h-5" />}
          color={attendance?.summary.attendance_rate >= 75 ? 'var(--success)' : 'var(--danger)'}
        />
        <StatCard
          label="Classes Present"
          value={attendance?.summary.present ?? '—'}
          icon={<Calendar className="w-5 h-5" />}
          color="var(--brand)"
        />
        <StatCard
          label="Batches Enrolled"
          value={profile?.batches?.length ?? '—'}
          icon={<BookOpen className="w-5 h-5" />}
          color="var(--warning)"
        />
      </div>

      {profile?.batches?.length > 0 && (
        <Card className="bg-neutral-primary-soft border-2 border-border-default mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-heading font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-black stroke-[3px]" />
              Enrolled Batches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-3">
              {profile.batches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 py-3 px-4 bg-white border-2 border-black shadow-[3px_3px_0px_var(--neo-shadow)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_var(--neo-shadow)] transition-all duration-100"
                >
                  <div className="flex-1">
                    <div className="font-heading text-heading font-bold">{b.name}</div>
                    <div className="text-xs text-body-subtle font-body mt-1 font-bold">{b.subject}</div>
                  </div>
                  <span className="border-2 border-black bg-[#FFD93D] text-black px-2 py-0.5 text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_var(--neo-shadow)]">
                    {b.time_slot}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {routine && (
        <Card className="bg-neutral-primary-soft border-2 border-border-default mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-heading flex items-center gap-2 font-bold">
              <Clock className="w-5 h-5 text-brand" />
              Today's Routine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {(() => {
              const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
              const subjects = routine?.weekly_timetable?.[today] || [];
              const isOff = subjects.length === 0;

              return (
                <div
                  className="flex items-center gap-4 p-4 border-2 border-black bg-[#FF6B6B]/10 shadow-[4px_4px_0px_var(--neo-shadow)]"
                >
                  <div className="w-12 font-bold font-heading text-base text-brand text-center shrink-0">
                    {today}
                  </div>

                  {isOff ? (
                    <span className="text-body-subtle text-sm italic font-body flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 stroke-[2px]" />
                      No classes today
                    </span>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {subjects.map((sub, idx) => (
                        <span key={idx} className="border-2 border-black bg-[#C4B5FD] text-black px-3 py-1 text-sm font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {vocabStats && (
        <Card className="bg-neutral-primary-soft border-2 border-border-brand shadow-sm relative overflow-hidden group mb-6">
          <CardHeader className="flex flex-row items-center justify-between z-10 relative border-b border-border-muted/30 pb-4">
            <CardTitle className="font-heading text-heading flex items-center gap-2 font-bold">
              <BookOpen className="w-5 h-5 text-brand" />
              Today's Vocabulary
            </CardTitle>
            <div className="text-xs font-heading font-black text-black bg-[#FFD93D] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_var(--neo-shadow)]">
              Progress: {vocabStats.today_viewed}/{vocabStats.today_total}
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-5 z-10 relative">
            <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
              <div className="text-sm text-body font-body font-bold">
                Learn {vocabStats.today_total} new English words today to improve your vocabulary.
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap">
                <Link 
                  to="/parent/vocabulary"
                  className="inline-flex items-center justify-center h-12 px-[26px] bg-[#FF6B6B] text-black border-4 border-black font-heading font-black text-sm uppercase tracking-tight shadow-[4px_4px_0px_var(--neo-shadow)] hover:bg-[#FF6B6B]/90 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 select-none cursor-pointer"
                >
                  View Today's Vocabulary
                </Link>
                <Link 
                  to="/parent/vocabulary"
                  state={{ tab: 'practice' }}
                  className="inline-flex items-center justify-center h-12 px-[26px] bg-[#FFD93D] text-black border-4 border-black font-heading font-black text-sm uppercase tracking-tight shadow-[4px_4px_0px_var(--neo-shadow)] hover:bg-[#FFD93D]/90 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 select-none cursor-pointer"
                >
                  Practice
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
