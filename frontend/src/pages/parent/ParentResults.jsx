import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../api/client';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

function GradeTag({ grade }) {
  const color = GRADE_COLORS[grade] || '#8b92a8';
  return (
    <span style={{
      fontWeight: 700,
      color,
      background: color + '22',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: 'var(--font-size-sm)',
    }}>
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
      <div>
        <div className="page-header"><h1 className="page-title">Results</h1></div>
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-subtitle">Exam scores and grades for {data?.student_name}</p>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">📈 Performance Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, 'Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-brand)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--color-brand)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Results Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Results</h2>
          <span className="badge badge-default">{results.length} exams</span>
        </div>

        {results.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No results yet</div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.exam_name}</td>
                    <td>{r.subject}</td>
                    <td className="text-muted">{r.exam_date}</td>
                    <td>{r.score} / {r.total_marks}</td>
                    <td>
                      <span style={{ color: r.percentage >= 80 ? 'var(--color-success)' : r.percentage >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td><GradeTag grade={r.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
