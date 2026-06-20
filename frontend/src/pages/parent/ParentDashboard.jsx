import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { useTranslation } from '../../contexts/LanguageContext';
import { CheckSquare, Calendar, BookOpen, Clock, Coffee, Sparkles, Star, Award, Bookmark, ArrowRight, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [vocabStats, setVocabStats] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/parent/profile'),
      api.get('/parent/attendance'),
      api.get('/vocabulary/progress/stats').catch(() => ({ data: null })),
      api.get('/parent/routine').catch(() => ({ data: null })),
      api.get('/dashboard/quote').catch(() => ({ data: { quote: null } }))
    ]).then(([p, a, v, r, q]) => {
      setProfile(p.data);
      setAttendance(a.data);
      setVocabStats(v.data);
      setRoutine(r.data);
      if (q && q.data) setQuote(q.data.quote);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white border-4 border-black p-6 h-36 relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-black" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-8 bg-gray-300 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const student = profile?.student;
  const attendanceRate = attendance?.summary?.attendance_rate;

  return (
    <div className="space-y-8 pb-12">
      {/* Header section with hand-drawn character */}
      <div className="relative mb-6">
        <h1 className="text-3xl md:text-4xl font-heading text-black font-black flex items-center gap-2">
          {t("Hello, ")}{student ? student.name.split(' ')[0] : t('Student')}!
          <Smile className="w-8 h-8 md:w-9 md:h-9 text-[#E5A93B] stroke-[3px] inline-block animate-bounce origin-bottom-right" />
        </h1>
        <p className="text-[#C0392B] font-mono text-xs uppercase tracking-wider font-bold mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B]" />
          {t("Here is your academic overview for this week")}
        </p>
      </div>

      {/* Quote Section */}
      {quote && (
        <div className="bg-[#C4B5FD] border-4 border-black p-4 mb-8 shadow-[4px_4px_0px_0px_var(--neo-shadow)] relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-2 right-2 text-black/10">
            <Sparkles className="w-16 h-16 stroke-[2px]" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white border-2 border-black p-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-heading font-black text-xl italic uppercase tracking-tight">"{quote.split('-')[0]?.trim()}"</p>
              {quote.includes('-') && (
                <p className="text-sm font-bold mt-1 text-black/80 font-body">— {quote.split('-').slice(1).join('-').trim()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Student Welcome Card - Pinned Polaroid slip */}
      {student && (
        <Card className="relative overflow-visible bg-white border-4 border-[#181B20] shadow-[8px_8px_0px_0px_#181B20] mb-8 wiggle-on-hover p-6 md:p-8">
          {/* Authentic-looking Paperclip holding the card */}
          <div className="paperclip" />
          
          <div className="flex gap-6 md:gap-8 items-start flex-col md:flex-row">
            {/* Polaroid Photo Frame with tilt and tape */}
            <div className="relative polaroid-frame w-36 h-40 md:w-40 md:h-44 flex-shrink-0 flex flex-col justify-between bg-white self-center mx-auto md:mx-0">
              <div className="tape-marking" />
              <div className="w-full h-[78%] border-2 border-[#181B20] bg-[#FAF6EE] overflow-hidden flex items-center justify-center relative">
                {student.photo_path ? (
                  <img src={`/${student.photo_path}`} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-14 h-14 text-black/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="text-[10px] font-display font-black text-black tracking-tight text-center truncate w-full mt-1.5">
                {student.name.split(' ')[0]}
              </div>
            </div>

            {/* Student metadata slip */}
            <div className="flex-1 font-body text-black w-full text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight leading-none text-[#1A3329]">
                  {student.name}
                </h2>
                <span className="border-4 border-dashed border-[#C0392B]/70 text-[#C0392B] text-[9px] font-heading font-black uppercase px-2 py-0.5 rotate-[1.5deg] tracking-wider">
                  {t("Student ID")}: #LK-{student.id || '26A'}
                </span>
              </div>
              
              <p className="text-xs font-bold text-black/60 mt-1 font-mono uppercase tracking-wide">
                {t("Grade")} {student.class_level} · SSC Candidate
              </p>

              {/* Hand-drawn style horizontal separator */}
              <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-black/20 to-transparent my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 bg-[#FAF6EE] p-4 border-2 border-dashed border-[#181B20]/30 rounded-xs">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-mono text-black/50 uppercase font-black tracking-wide">{t("Academic Status")}</span>
                  <span className="text-xs font-heading font-black text-[#1E4636] flex items-center gap-1.5 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1E4636] inline-block animate-pulse" />
                    {t("Enrolled Active")}
                  </span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-mono text-black/50 uppercase font-black tracking-wide">{t("Enrollment Date")}</span>
                  <span className="text-xs font-heading font-black text-black/80 mt-0.5 font-mono">{student.enrollment_date}</span>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-mono text-black/50 uppercase font-black tracking-wide">{t("Active Subjects")}</span>
                  <span className="text-xs font-heading font-black text-black/80 mt-0.5 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#E5A93B]" />
                    {student.subjects?.length || 0} {t("Syllabus Courses")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mt-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-black/40 font-mono">Curriculum:</span>
                {(student.subjects || []).map((sub) => (
                  <span 
                    key={sub} 
                    className="border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-xs font-mono font-black shadow-[2px_2px_0px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 transition-transform duration-100 uppercase"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Redesigned Metric Cards - Styled as wiggling Pinned Sticky Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
        {/* Metric 1: Attendance Rate (Yellow Notepad) */}
        <div className="group relative bg-[#FCF5D8] border-4 border-[#181B20] p-6 shadow-[6px_6px_0px_0px_#181B20] hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_0px_#181B20] transition-all duration-300 font-body rotate-[-1deg] hover:rotate-0 wiggle-on-hover pt-8">
          <div className="pushpin" />
          <div className="absolute inset-0 bg-notebook-ruled opacity-10 pointer-events-none" />
          
          <span className="block text-[10px] font-mono text-black/50 uppercase font-black tracking-widest text-center">
            {t("Attendance Rate")}
          </span>
          <div className="text-center mt-3">
            <span className={cn(
              "rubber-stamp text-2xl font-black px-3 py-1",
              (attendanceRate >= 75 || !attendanceRate) ? "stamp-green" : "stamp-red"
            )}>
              {attendanceRate ? `${attendanceRate}%` : '—'}
            </span>
          </div>
          <span className="block text-[10px] font-bold text-center mt-4 text-[#C0392B] font-mono">
            {attendanceRate >= 75 ? t('Excellent standing') : t('Action needed (<75%)')}
          </span>
        </div>

        {/* Metric 2: Classes Present (Sky Blue Notepad) */}
        <div className="group relative bg-[#E5F4FC] border-4 border-[#181B20] p-6 shadow-[6px_6px_0px_0px_#181B20] hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_0px_#181B20] transition-all duration-300 font-body rotate-[0.5deg] hover:rotate-0 wiggle-on-hover pt-8">
          <div className="pushpin" />
          <div className="absolute inset-0 bg-notebook-ruled opacity-10 pointer-events-none" />

          <span className="block text-[10px] font-mono text-black/50 uppercase font-black tracking-widest text-center">
            {t("Classes Present")}
          </span>
          <div className="text-center mt-3">
            <span className="rubber-stamp stamp-blue text-2xl font-black px-3 py-1">
              {attendance?.summary.present ?? '—'} {t("sessions")}
            </span>
          </div>
          <span className="block text-[10px] font-bold text-center mt-4 text-black/50 font-mono">
            {t("Out of")} {attendance?.summary?.total ?? '—'} {t("classes")}
          </span>
        </div>

        {/* Metric 3: Batches Enrolled (Lavender Notepad) */}
        <div className="group relative bg-[#F5EDFD] border-4 border-[#181B20] p-6 shadow-[6px_6px_0px_0px_#181B20] hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_0px_#181B20] transition-all duration-300 font-body rotate-[1.5deg] hover:rotate-0 wiggle-on-hover pt-8">
          <div className="pushpin" />
          <div className="absolute inset-0 bg-notebook-ruled opacity-10 pointer-events-none" />

          <span className="block text-[10px] font-mono text-black/50 uppercase font-black tracking-widest text-center">
            {t("Batches Enrolled")}
          </span>
          <div className="text-center mt-3">
            <span className="rubber-stamp stamp-orange text-2xl font-black px-3 py-1">
              {profile?.batches?.length ?? '0'} {t("groups")}
            </span>
          </div>
          <span className="block text-[10px] font-bold text-center mt-4 text-[#1B3B6F] font-mono">
            {t("Weekly academic schedule")}
          </span>
        </div>
      </div>

      {/* Two Column Grid for Batches and Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card: Enrolled Batches - Styled as checklist in ledger */}
        {profile?.batches?.length > 0 && (
          <Card className="bg-white border-4 border-[#181B20] shadow-[6px_6px_0px_0px_#181B20] relative overflow-hidden flex flex-col">
            <CardHeader className="bg-[#FAF6EE] border-b-4 border-[#181B20] py-4 px-6 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#C0392B]" />
              <CardTitle className="font-heading text-lg font-black text-black uppercase">
                {t("Active Enrolled Batches")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 bg-white">
              <div className="flex flex-col gap-4">
                {profile.batches.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-4 py-3 px-4 bg-[#FAF6EE]/50 border-2 border-[#181B20] shadow-[2px_2px_0px_0px_#181B20] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#181B20] transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="font-heading text-[#181B20] font-black text-base flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-[#E5A93B] text-[#E5A93B]" />
                        {b.name}
                      </div>
                      <div className="text-[10px] text-[#C0392B] font-mono font-black uppercase mt-1">
                        {t("Subject Course · ")}{b.subject}
                      </div>
                    </div>
                    <span className="border-2 border-black bg-[#E5A93B] text-black px-2.5 py-0.5 text-[10px] font-mono font-black uppercase shadow-2xs">
                      {b.time_slot}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card: Academic Timetable - Styled as stacked desk calendar pages */}
        {routine && (
          <Card className="bg-white border-4 border-[#181B20] shadow-[6px_6px_0px_0px_#181B20] relative overflow-hidden flex flex-col">
            <CardHeader className="bg-[#FAF6EE] border-b-4 border-[#181B20] py-4 px-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1B3B6F]" />
              <CardTitle className="font-heading text-lg font-black text-black uppercase">
                {t("Academic Timetable")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 bg-white flex flex-col gap-6 justify-center">
              {(() => {
                const todayDate = new Date();
                const tomorrowDate = new Date(todayDate);
                tomorrowDate.setDate(todayDate.getDate() + 1);

                const today = todayDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
                const tomorrow = tomorrowDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);

                const todaySubjects = routine?.weekly_timetable?.[today] || [];
                const tomorrowSubjects = routine?.weekly_timetable?.[tomorrow] || [];

                const isTodayOff = todaySubjects.length === 0;
                const isTomorrowOff = tomorrowSubjects.length === 0;

                return (
                  <div className="space-y-6">
                    {/* Today's Timetable Slip */}
                    <div className="border-4 border-[#181B20] bg-[#FAF6EE] p-6 shadow-[6px_6px_0px_0px_#181B20] relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[8px] bg-[#1B3B6F]" />
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                        <div>
                          <span className="text-xs font-mono text-black/60 uppercase font-black tracking-widest block mb-1">
                            {t("Today's Timetable")}
                          </span>
                          <span className="text-2xl md:text-3xl font-display font-black text-black uppercase tracking-tight">
                            {t(todayDate.toLocaleDateString('en-US', { weekday: 'long' }))}
                          </span>
                        </div>
                        <span className="border-4 border-dashed border-[#1B3B6F] text-[#1B3B6F] font-heading font-black text-sm px-3 py-1.5 uppercase tracking-wider rotate-[2deg]">
                          {t(today)}
                        </span>
                      </div>

                      <div className="h-[2px] bg-gradient-to-r from-[#181B20]/25 via-transparent to-transparent my-4" />

                      {isTodayOff ? (
                        <div className="flex items-center gap-4 py-2 px-3 bg-white/40 border-2 border-dashed border-[#181B20]/20">
                          <Coffee className="w-6 h-6 text-[#E5A93B] shrink-0" />
                          <span className="text-black/60 text-sm font-bold font-heading italic">
                            {t("No classes scheduled for today.")}
                          </span>
                          <div className="rubber-stamp stamp-orange text-xs font-black font-heading ml-auto rotate-[3deg] px-2.5 py-1">
                            {t("HOLIDAY")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap">
                          {todaySubjects.map((sub, idx) => (
                            <span 
                              key={idx} 
                              className="border-2 border-[#181B20] bg-[#C4B5FD] text-black px-4 py-1.5 text-sm font-mono font-black shadow-[3px_3px_0px_0px_#181B20] hover:-translate-y-0.5 transition-transform"
                            >
                              {t(sub)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tomorrow's Timetable Slip */}
                    <div className="border-4 border-[#181B20] bg-[#FAF6EE] p-6 shadow-[6px_6px_0px_0px_#181B20] relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[8px] bg-[#C0392B]" />
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                        <div>
                          <span className="text-xs font-mono text-black/60 uppercase font-black tracking-widest block mb-1">
                            {t("Tomorrow's Timetable")}
                          </span>
                          <span className="text-2xl md:text-3xl font-display font-black text-black uppercase tracking-tight">
                            {t(tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' }))}
                          </span>
                        </div>
                        <span className="border-4 border-dashed border-[#C0392B] text-[#C0392B] font-heading font-black text-sm px-3 py-1.5 uppercase tracking-wider rotate-[-2deg]">
                          {t(tomorrow)}
                        </span>
                      </div>

                      <div className="h-[2px] bg-gradient-to-r from-[#181B20]/25 via-transparent to-transparent my-4" />

                      {isTomorrowOff ? (
                        <div className="flex items-center gap-4 py-2 px-3 bg-white/40 border-2 border-dashed border-[#181B20]/20">
                          <Coffee className="w-6 h-6 text-[#E5A93B] shrink-0" />
                          <span className="text-black/60 text-sm font-bold font-heading italic">
                            {t("No classes scheduled for tomorrow.")}
                          </span>
                          <div className="rubber-stamp stamp-orange text-xs font-black font-heading ml-auto rotate-[3deg] px-2.5 py-1">
                            {t("HOLIDAY")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 flex-wrap">
                          {tomorrowSubjects.map((sub, idx) => (
                            <span 
                              key={idx} 
                              className="border-2 border-[#181B20] bg-[#FFD93D] text-black px-4 py-1.5 text-sm font-mono font-black shadow-[3px_3px_0px_0px_#181B20] hover:-translate-y-0.5 transition-transform"
                            >
                              {t(sub)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Today's Vocabulary Flashcard (Binder card with rings) */}
      {vocabStats && (
        <Card className="bg-[#FFFDF5] border-4 border-[#181B20] shadow-[8px_8px_0px_0px_#181B20] relative overflow-hidden group mb-6 p-6 md:p-8">
          {/* Punched Ring Binder holes in the side */}
          <div className="absolute top-1/2 -translate-y-1/2 left-3 w-3 h-3 rounded-full bg-[#FAF6EE] border-2 border-black" />
          <div className="absolute top-1/4 -translate-y-1/2 left-3 w-3 h-3 rounded-full bg-[#FAF6EE] border-2 border-black" />
          <div className="absolute top-3/4 -translate-y-1/2 left-3 w-3 h-3 rounded-full bg-[#FAF6EE] border-2 border-black" />

          <div className="pl-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-dashed border-[#181B20]/20 pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#C0392B] uppercase font-black tracking-widest block mb-0.5">
                  {t("Daily Brain Exercise")}
                </span>
                <CardTitle className="font-heading text-xl md:text-2xl font-black text-black uppercase flex items-center gap-2">
                  <BookOpen className="w-5.5 h-5.5 text-black stroke-[2.5px]" />
                  {t("Today's English Vocabulary")}
                </CardTitle>
              </div>

              {/* Progress marker stroke */}
              <div className="flex flex-col items-start md:items-end">
                <span className="text-[9px] font-mono text-black/50 uppercase font-black mb-1">
                  {t("Card Progress: ")} {vocabStats.today_viewed} / {vocabStats.today_total} {t("Words")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-36 bg-gray-200 border-2 border-black rounded-none overflow-hidden relative p-[1px]">
                    <div 
                      className="h-full bg-[#E5A93B] transition-all duration-500" 
                      style={{ width: `${(vocabStats.today_viewed / vocabStats.today_total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-black">
                    {Math.round((vocabStats.today_viewed / vocabStats.today_total) * 100) || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
              <p className="text-sm font-heading font-bold text-black/80 max-w-lg leading-relaxed">
                {t("Review and memorize ")} <span className="highlight-marker font-black text-black">{vocabStats.today_total}{t(" Words")}</span> {t(" curated for secondary level academic preparation today.")}
              </p>

              <div className="flex gap-3 sm:mt-0 flex-wrap">
                <Link 
                  to="/parent/vocabulary"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#C0392B] text-white border-4 border-[#181B20] font-heading font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#181B20] hover:bg-[#C0392B]/95 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 cursor-pointer select-none"
                >
                  {t("View Vocabulary Cards")}
                  <ArrowRight className="w-3.5 h-3.5 text-white stroke-[3px]" />
                </Link>
                <Link 
                  to="/parent/vocabulary"
                  state={{ tab: 'practice' }}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#E5A93B] text-black border-4 border-[#181B20] font-heading font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#181B20] hover:bg-[#E5A93B]/95 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-100 cursor-pointer select-none"
                >
                  {t("Practice Test")}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
