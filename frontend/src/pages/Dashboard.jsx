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
      bg: 'bg-white border-l-8 border-[#D02020] border-y-2 border-r-2 border-black text-[#121212] shadow-[3px_3px_0px_0px_#121212] rounded-none',
      icon: <DollarSign className="w-5 h-5 text-[#D02020] flex-shrink-0 mt-0.5" />
    },
    low_attendance: {
      bg: 'bg-white border-l-8 border-[#F0C020] border-y-2 border-r-2 border-black text-[#121212] shadow-[3px_3px_0px_0px_#121212] rounded-none',
      icon: <AlertTriangle className="w-5 h-5 text-[#F0C020] flex-shrink-0 mt-0.5" />
    },
    homework_due: {
      bg: 'bg-white border-l-8 border-[#1040C0] border-y-2 border-r-2 border-black text-[#121212] shadow-[3px_3px_0px_0px_#121212] rounded-none',
      icon: <ShieldAlert className="w-5 h-5 text-[#1040C0] flex-shrink-0 mt-0.5" />
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-6 font-body">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-[#121212] uppercase tracking-tighter leading-tight">
          Welcome to <span className="bg-[#F0C020] px-4 py-1.5 inline-block border-4 border-black shadow-[4px_4px_0px_0px_#121212] -rotate-1 text-black">Dashboard</span>
        </h1>
        <p className="text-xs font-semibold text-gray-500 mt-2 font-mono uppercase tracking-wider">
          Overview of your tutor activity and metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white border-4 border-black rounded-none animate-pulse p-5 space-y-3 shadow-[6px_6px_0px_0px_#121212]">
              <div className="h-3.5 bg-gray-200 rounded w-2/3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Active Students"
              value={stats.total_active_students}
              icon={<Users className="w-5 h-5 text-white" />}
              color="#1040C0"
            />
            <StatCard
              label="Total Students"
              value={stats.total_students ?? stats.total_active_students}
              icon={<Users className="w-5 h-5 text-white" />}
              color="#D02020"
            />
            <StatCard
              label="Today's Sessions"
              value={stats.todays_sessions}
              icon={<Calendar className="w-5 h-5" />}
              color="#F0C020"
            />
            <StatCard
              label="Attendance Rate"
              value={`${stats.attendance_rate}%`}
              icon={<ShieldAlert className="w-5 h-5 text-white" />}
              color={stats.attendance_rate >= 75 ? '#1040C0' : '#D02020'}
            />
            <StatCard
              label="Monthly Expected"
              value={`৳${(stats.total_monthly_expected ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<Wallet className="w-5 h-5" />}
              color="#F0C020"
            />
            <StatCard
              label="Total Due"
              value={`৳${(stats.total_due ?? 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="#D02020"
            />
            <StatCard
              label="Total Paid"
              value={`৳${(stats.total_paid ?? stats.monthly_collection ?? 0).toLocaleString()}`}
              icon={<TrendingDown className="w-5 h-5 text-white" />}
              color="#1040C0"
            />
            <StatCard
              label="Outstanding"
              value={`৳${(stats.outstanding_balance ?? 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5 text-white" />}
              color={(stats.outstanding_balance ?? 0) > 0 ? '#D02020' : '#1040C0'}
            />
          </>
        ) : null}
      </div>
      {!loading && alerts.length > 0 && (
        <Card hover={false} decorColor="blue" decorShape="square">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-heading font-black uppercase tracking-tighter text-[#121212]">
              <span>🔔</span> Active Alerts
            </CardTitle>
            <span className="px-2.5 py-1 text-xs font-black bg-[#D02020] text-white border-2 border-black shadow-[2px_2px_0px_0px_#121212] font-mono flex items-center gap-1.5 rounded-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {alerts.length} urgent
            </span>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {alerts.map((alert, i) => {
              const style = ALERT_STYLES[alert.type] || {
                bg: 'bg-white border-2 border-black text-[#121212] shadow-[3px_3px_0px_0px_#121212] rounded-none',
                icon: <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0" />
              };
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3.5 p-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#121212] ${style.bg}`}
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#121212] leading-relaxed">{alert.message}</div>
                    {alert.student_id && (
                      <a
                        href={`/students/${alert.student_id}`}
                        className="text-xs font-black text-[#1040C0] hover:text-[#D02020] hover:underline transition-colors mt-2 inline-flex items-center gap-1 font-mono uppercase tracking-wider"
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
        <Card hover={false} decorColor="blue" decorShape="square">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-none bg-[#1040C0] border-2 border-black flex items-center justify-center text-white mb-4 shadow-[3px_3px_0px_0px_#121212]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-lg font-heading font-black uppercase tracking-tighter text-[#121212]">All clear!</div>
            <div className="text-xs font-semibold text-gray-500 font-mono uppercase tracking-wider mt-1">No alerts at the moment. Keep up the great work!</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
