import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

function GradeTag({ grade }) {
  const color = GRADE_COLORS[grade] || '#8b92a8';
  return (
    <span 
      className="rounded-full px-2.5 py-0.5 text-xs font-mono border font-bold"
      style={{
        color,
        backgroundColor: color + '22',
        borderColor: color + '50'
      }}
    >
      {grade}
    </span>
  );
}

export default function ParentResults() {
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
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Results</h1>
        </div>
        <div className="h-[300px] bg-white/5 animate-pulse rounded-2xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-pure">Results</h1>
          <p className="text-stardust text-sm mt-1">Exam scores and grades for {data?.student_name}</p>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>📈 Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8b92a8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8b92a8' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0F1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                  itemStyle={{ color: '#F7931A' }}
                  formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, 'Score']}
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
          <CardTitle>All Results</CardTitle>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-mono border bg-white/10 text-pure border-white/20">{results.length} exams</span>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-2xl border border-white/10 m-6">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-lg font-heading text-pure">No results yet</div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-stardust text-sm uppercase tracking-wider font-heading">
                    <th className="p-4 font-medium">Exam</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">%</th>
                    <th className="p-4 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body">
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-pure">{r.exam_name}</td>
                      <td className="p-4 text-stardust">{r.subject}</td>
                      <td className="p-4 text-stardust">{r.exam_date}</td>
                      <td className="p-4 font-mono text-pure">{r.score} / {r.total_marks}</td>
                      <td className="p-4 font-mono">
                        <span className={r.percentage >= 80 ? 'text-green-400' : r.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                          {r.percentage}%
                        </span>
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
