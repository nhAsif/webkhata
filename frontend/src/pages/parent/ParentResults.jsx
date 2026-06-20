import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { useTranslation } from '../../contexts/LanguageContext';
import { TrendingUp, BarChart2 } from 'lucide-react';

const GRADE_COLORS = {
  'A+': 'var(--success)', // #C4B5FD
  'A': 'var(--success)',
  'A-': 'var(--success)',
  'B': 'var(--warning)', // #FFD93D
  'C': 'var(--warning)',
  'D': 'var(--danger)', // #FF6B6B
  'F': 'var(--danger)',
};

function GradeTag({ grade }) {
  const bg = GRADE_COLORS[grade] || 'var(--neutral-primary-medium)';
  return (
    <span 
      className="inline-flex px-2 py-0.5 border-2 border-black font-mono font-bold text-xs shadow-[1.5px_1.5px_0px_var(--neo-shadow)] text-black"
      style={{
        backgroundColor: bg
      }}
    >
      {grade}
    </span>
  );
}

export default function ParentResults() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/results').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const results = data?.results || [];
  const chartData = [...results]
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .map((r) => ({
      name: `${r.exam_name.slice(0, 12)} (${r.subject.slice(0, 4)})`,
      score: r.percentage,
      grade: r.grade,
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">{t("Results")}</h1>
        </div>
        <div className="h-[300px] bg-white border-4 border-black shadow-[6px_6px_0px_var(--neo-shadow)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">{t("Results")}</h1>
          <p className="text-stardust text-sm mt-1">{t("Exam scores and grades for")} {data?.student_name}</p>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-black stroke-[3px]" />
              {t("Performance Trend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#181B20', fontWeight: 'bold' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#181B20', fontWeight: 'bold' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '4px solid #181B20', borderRadius: '0px', boxShadow: '4px 4px 0px 0px var(--neo-shadow)', fontSize: 12, color: '#181B20', fontFamily: 'Space Grotesk' }}
                  itemStyle={{ color: '#FF6B6B', fontWeight: 'bold' }}
                  formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, t('Score')]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#F7931A"
                  strokeWidth={2.5}
                  dot={{ fill: '#F7931A', r: 5 }}
                  activeDot={{ r: 7, fill: '#FFD600' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Results")}</CardTitle>
          <span className="border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-xs font-mono font-bold shadow-[2px_2px_0px_var(--neo-shadow)]">{results.length} {t("exams")}</span>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border-4 border-black shadow-[6px_6px_0px_var(--neo-shadow)] m-6">
              <div className="text-black mb-4">
                <BarChart2 className="w-12 h-12 stroke-[3px]" />
              </div>
              <div className="text-lg font-heading font-black text-black uppercase">{t("No results yet")}</div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-4 border-black text-black text-sm uppercase tracking-wider font-heading font-black">
                    <th className="p-4 font-medium">{t("Exam")}</th>
                    <th className="p-4 font-medium">{t("Subject")}</th>
                    <th className="p-4 font-medium">{t("Date")}</th>
                    <th className="p-4 font-medium">{t("Score")}</th>
                    <th className="p-4 font-medium">%</th>
                    <th className="p-4 font-medium">{t("Grade")}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {results.map((r) => (
                    <tr key={r.id} className="border-b-2 border-black hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-bold text-black">{r.exam_name}</td>
                      <td className="p-4 text-black/70 font-semibold">{r.subject}</td>
                      <td className="p-4 text-black/70 font-mono font-semibold">{r.exam_date}</td>
                      <td className="p-4 font-mono font-bold text-black">{r.score} / {r.total_marks}</td>
                      <td className="p-4 font-mono font-bold text-black">
                        {r.percentage}%
                      </td>
                      <td className="p-4"><GradeTag grade={r.grade} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
