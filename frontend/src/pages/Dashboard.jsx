import { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { AlertTriangle, DollarSign, Calendar, Users, Award, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/alerts'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setAlerts(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const ALERT_STYLES = {
    overdue_fee: {
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      icon: <DollarSign className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
    },
    low_attendance: {
      bg: 'bg-bitcoin/10 border-bitcoin/20 text-bitcoin',
      icon: <AlertTriangle className="w-5 h-5 text-bitcoin flex-shrink-0 mt-0.5" />
    },
    homework_due: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: <ShieldAlert className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 font-body">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-pure tracking-tight">
          Welcome to <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">Dashboard</span>
        </h1>
        <p className="text-sm text-stardust mt-1 font-body">
          Overview of your tutor activity and metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-matter border border-white/10 rounded-2xl animate-pulse p-5 space-y-3">
              <div className="h-3.5 bg-white/5 rounded w-2/3" />
              <div className="h-8 bg-white/5 rounded w-1/2" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Active Students"
              value={stats.total_active_students}
              icon={<Users className="w-5 h-5 text-bitcoin" />}
              color="#F7931A"
            />
            <StatCard
              label="Total Students"
              value={stats.total_students ?? stats.total_active_students}
              icon={<Users className="w-5 h-5 text-gold" />}
              color="#FFD600"
            />
            <StatCard
              label="Today's Sessions"
              value={stats.todays_sessions}
              icon={<Calendar className="w-5 h-5 text-gold" />}
              color="#FFD600"
            />
            <StatCard
              label="Attendance Rate"
              value={`${stats.attendance_rate}%`}
              icon={<ShieldAlert className="w-5 h-5 text-gold" />}
              color={stats.attendance_rate >= 75 ? '#10b981' : '#F7931A'}
            />
            <StatCard
              label="Monthly Expected"
              value={`৳${(stats.total_monthly_expected ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<Wallet className="w-5 h-5 text-bitcoin" />}
              color="#F7931A"
            />
            <StatCard
              label="Total Due"
              value={`৳${(stats.total_due ?? 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#ef4444"
            />
            <StatCard
              label="Total Paid"
              value={`৳${(stats.total_paid ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<TrendingDown className="w-5 h-5 text-green-400" />}
              color="#10b981"
            />
            <StatCard
              label="Outstanding"
              value={`৳${(stats.outstanding_balance ?? 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color={(stats.outstanding_balance ?? 0) > 0 ? '#ef4444' : '#10b981'}
            />
          </>
        ) : null}
      </div>

      {/* Alerts */}
      {!loading && alerts.length > 0 && (
        <Card hover={false}>
          <CardHeader className="flex-row items-center justify-between border-b border-white/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-heading font-semibold text-pure">
              <span>🔔</span> Active Alerts
            </CardTitle>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {alerts.length} urgent
            </span>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {alerts.map((alert, i) => {
              const style = ALERT_STYLES[alert.type] || {
                bg: 'bg-white/5 border-white/10 text-pure',
                icon: <AlertTriangle className="w-5 h-5 text-stardust flex-shrink-0" />
              };
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border ${style.bg} transition-all duration-300 hover:scale-[1.005]`}
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-pure leading-relaxed">{alert.message}</div>
                    {alert.student_id && (
                      <a
                        href={`/students/${alert.student_id}`}
                        className="text-xs font-semibold text-bitcoin hover:underline hover:text-gold transition-colors mt-1.5 inline-flex items-center gap-1 font-mono"
                      >
                        View student details ➔
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
        <Card hover={false}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-lg font-heading font-semibold text-pure">All clear!</div>
            <div className="text-sm text-stardust mt-1">No alerts at the moment. Keep up the great work!</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
