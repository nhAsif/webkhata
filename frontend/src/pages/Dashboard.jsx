import { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { useTranslation } from '../contexts/LanguageContext';
import { AlertTriangle, DollarSign, Calendar, Users, Award, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Wallet, Bell, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/alerts'),
      api.get('/dashboard/quote').catch(err => ({ data: { quote: null } }))
    ]).then(([s, a, q]) => {
      setStats(s.data);
      setAlerts(a.data);
      if (q && q.data) setQuote(q.data.quote);
    }).finally(() => setLoading(false));
  }, []);

  const ALERT_STYLES = {
    overdue_fee: {
      bg: 'bg-[#FF6B6B] border-4 border-black text-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] rounded-none',
      icon: <DollarSign className="w-5 h-5 text-black stroke-[3px] flex-shrink-0 mt-0.5" />
    },
    low_attendance: {
      bg: 'bg-[#FFD93D] border-4 border-black text-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] rounded-none',
      icon: <AlertTriangle className="w-5 h-5 text-black stroke-[3px] flex-shrink-0 mt-0.5" />
    },
    homework_due: {
      bg: 'bg-[#C4B5FD] border-4 border-black text-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] rounded-none',
      icon: <ShieldAlert className="w-5 h-5 text-black stroke-[3px] flex-shrink-0 mt-0.5" />
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 font-body">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-black tracking-tighter uppercase">
          {t("Welcome to")} <span className="bg-[#FFD93D] px-3 py-1 border-4 border-black inline-block -rotate-1 shadow-[3px_3px_0px_0px_var(--neo-shadow)]">WebKhata</span>
        </h1>
        <p className="text-sm text-black font-body font-bold mt-4">
          {t("Overview of your tutor activity and metrics")}
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white border-4 border-black rounded-none animate-pulse p-5 space-y-3 shadow-[8px_8px_0px_0px_var(--neo-shadow)]">
              <div className="h-4 bg-[#C4B5FD]/20 border border-black rounded-none w-2/3" />
              <div className="h-8 bg-[#FFD93D]/20 border border-black rounded-none w-1/2" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              label={t("Active Students")}
              value={stats.total_active_students}
              icon={<Users className="w-5 h-5" />}
              color="#FF6B6B"
            />
            <StatCard
              label={t("Total Students")}
              value={stats.total_students ?? stats.total_active_students}
              icon={<Users className="w-5 h-5" />}
              color="#FFD93D"
            />
            <StatCard
              label={t("Today's Sessions")}
              value={stats.todays_sessions}
              icon={<Calendar className="w-5 h-5" />}
              color="#FFD93D"
            />
            <StatCard
              label={t("Attendance Rate")}
              value={`${stats.attendance_rate}%`}
              icon={<ShieldAlert className="w-5 h-5" />}
              color={stats.attendance_rate >= 75 ? '#C4B5FD' : '#FFD93D'}
            />
            <StatCard
              label={t("Monthly Expected")}
              value={`৳${(stats.total_monthly_expected ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<Wallet className="w-5 h-5" />}
              color="#C4B5FD"
            />
            <StatCard
              label={t("Total Billed")}
              value={`৳${(stats.total_due ?? 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#FF6B6B"
            />
            <StatCard
              label={t("Total Paid")}
              value={`৳${(stats.total_paid ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="#C4B5FD"
            />
            <StatCard
              label={t("Outstanding")}
              value={`৳${(stats.outstanding_balance ?? 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color={(stats.outstanding_balance ?? 0) > 0 ? '#FF6B6B' : '#C4B5FD'}
            />
          </>
        ) : null}
      </div>

      {/* Alerts */}
      {!loading && alerts.length > 0 && (
        <Card hover={false} className="notebook-spirals bg-white">
          <CardHeader className="flex-row items-center justify-between border-b-4 border-black pb-4 bg-[#FFD93D]/10">
            <CardTitle className="flex items-center gap-2 text-xl font-heading font-black text-black">
              <Bell className="w-5 h-5 text-black stroke-[3px]" /> {t("Active Alerts")}
            </CardTitle>
            <span className="px-3 py-1 text-xs font-black uppercase rounded-none bg-[#FF6B6B] text-black border-4 border-black flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
              </span>
              {alerts.length} {t("urgent")}
            </span>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {alerts.map((alert, i) => {
              const style = ALERT_STYLES[alert.type] || {
                bg: 'bg-white border-4 border-black text-black shadow-[4px_4px_0px_0px_var(--neo-shadow)] rounded-none',
                icon: <AlertTriangle className="w-5 h-5 text-black stroke-[3px] flex-shrink-0" />
              };
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3.5 p-4 border-4 ${style.bg} transition-all duration-100 hover:scale-[1.005]`}
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-black leading-relaxed">{alert.message}</div>
                    {alert.student_id && (
                      <a
                        href={`/students/${alert.student_id}`}
                        className="text-xs font-black text-black underline hover:text-black/75 transition-colors mt-2 inline-flex items-center gap-1 font-heading uppercase tracking-wider"
                      >
                        {t("View student details")} <ArrowRight className="w-4 h-4 text-black stroke-[3px]" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loading && alerts.length === 0 && (
        <div className="max-w-md mx-auto">
          <div className="sticker-note p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-none bg-[#C4B5FD] border-4 border-black flex items-center justify-center text-black mb-4 shadow-[3px_3px_0px_0px_var(--neo-shadow)]">
              <Sparkles className="w-5 h-5 stroke-[3px]" />
            </div>
            <div className="text-xl font-heading font-black text-black uppercase tracking-tight">{t("All clear!")}</div>
            <div className="text-sm text-black/75 font-bold mt-1.5">{t("No alerts at the moment. Keep up the great work!")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
