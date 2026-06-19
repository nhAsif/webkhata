import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { CheckSquare, Calendar, BookOpen, Clock } from 'lucide-react';
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
            <Card key={i} className="animate-pulse bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="h-3 bg-white/5 rounded w-20 mb-4" />
                <div className="h-9 bg-white/5 rounded w-16" />
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
        <h1 className="text-2xl font-heading text-pure font-bold">Welcome{student ? `, ${student.name.split(' ')[0]}` : ''}!</h1>
        <p className="text-stardust font-body mt-1">Your child's academic overview</p>
      </div>

      {student && (
        <Card className="bg-matter border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex gap-6 items-center flex-wrap">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-bitcoin/20 to-gold/20 shadow-[0_0_15px_rgba(247,147,26,0.2)] border border-bitcoin/30 flex-shrink-0">
                {student.photo_path ? (
                  <img src={`/${student.photo_path}`} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-bitcoin/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-xl font-heading text-pure font-bold">{student.name}</div>
                <div className="text-stardust font-body text-sm mt-1">
                  Class {student.class_level} · Enrolled since {student.enrollment_date}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {(student.subjects || []).map((sub) => (
                    <span key={sub} className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-blue-500/20 text-blue-400 border-blue-500/30">
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
          color={attendance?.summary.attendance_rate >= 75 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          label="Classes Present"
          value={attendance?.summary.present ?? '—'}
          icon={<Calendar className="w-5 h-5" />}
          color="#6366f1"
        />
        <StatCard
          label="Batches Enrolled"
          value={profile?.batches?.length ?? '—'}
          icon={<BookOpen className="w-5 h-5" />}
          color="#f59e0b"
        />
      </div>

      {profile?.batches?.length > 0 && (
        <Card className="bg-matter border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-pure">📚 Enrolled Batches</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-3">
              {profile.batches.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 py-3 px-4 bg-white/5 rounded-lg border border-white/10 hover:border-bitcoin/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-heading text-pure font-semibold">{b.name}</div>
                    <div className="text-xs text-stardust font-body mt-1">{b.subject}</div>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-white/10 text-pure border-white/20">
                    {b.time_slot}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {routine && (
        <Card className="bg-matter border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-pure flex items-center gap-2">
              <Clock className="w-5 h-5 text-bitcoin" />
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
                  className={`flex items-center gap-4 p-4 rounded-xl border bg-bitcoin/5 border-bitcoin/20`}
                >
                  <div className="w-12 font-bold font-mono text-base text-bitcoin text-center shrink-0">
                    {today}
                  </div>

                  {isOff ? (
                    <span className="text-stardust/70 text-sm italic font-body">
                      🏖️ No classes today
                    </span>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {subjects.map((sub, idx) => (
                        <span key={idx} className="rounded-full px-3 py-1 text-sm font-mono border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
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
        <Card className="bg-gradient-to-br from-void to-matter border-bitcoin/20 shadow-[0_0_20px_rgba(247,147,26,0.1)] relative overflow-hidden group mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-bitcoin/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between z-10 relative">
            <CardTitle className="font-heading text-pure flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-bitcoin" />
              Today's Vocabulary
            </CardTitle>
            <div className="text-xs font-mono text-stardust bg-white/5 px-2 py-1 rounded-md">
              Progress: {vocabStats.today_viewed}/{vocabStats.today_total}
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 z-10 relative">
            <div className="flex items-center justify-between flex-wrap gap-4 mt-2">
              <div className="text-sm text-stardust font-body">
                Learn {vocabStats.today_total} new English words today to improve your vocabulary.
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <Link 
                  to="/parent/vocabulary"
                  className="px-6 py-2.5 bg-gradient-to-r from-burnt to-bitcoin hover:from-burnt/90 hover:to-bitcoin/90 text-void font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_10px_rgba(247,147,26,0.2)] text-sm uppercase tracking-wide"
                >
                  View Today's Vocabulary
                </Link>
                <Link 
                  to="/parent/vocabulary"
                  state={{ tab: 'practice' }}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-pure border border-white/20 font-bold rounded-xl flex items-center gap-2 transition-all text-sm uppercase tracking-wide"
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
