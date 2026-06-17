import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/client';

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#34d399', 'A-': '#6ee7b7',
  'B': '#3b82f6', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [batches, setBatches] = useState([]);
  const [fees, setFees] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/fees/student/${id}`),
      api.get(`/results/student/${id}`),
    ]).then(([s, f, r]) => {
      setStudent(s.data);
      setFees(f.data);
      setResults(r.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: '200px', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Student not found</div>
        <button className="btn btn-secondary" onClick={() => navigate('/students')}>← Back to Students</button>
      </div>
    );
  }

  const chartData = [...results]
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .map((r) => ({
      name: `${r.exam_name.slice(0, 8)} (${r.subject.slice(0, 4)})`,
      score: Math.round((r.score / r.total_marks) * 100),
      grade: r.grade,
    }));

  const totalFeesDue = fees.reduce((s, f) => s + f.amount_due, 0);
  const totalFeesPaid = fees.reduce((s, f) => s + f.amount_paid, 0);
  const unpaidFees = fees.filter((f) => f.status !== 'paid').length;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/students')}>← Back</button>
          <div>
            <h1 className="page-title">{student.name}</h1>
            <p className="page-subtitle">{student.class_level} · {student.status}</p>
          </div>
        </div>
      </div>

      {/* Student info card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title">👤 Personal Information</h2>
          <code style={{ fontSize: 'var(--font-size-xs)', background: 'var(--bg-surface-3)', padding: '3px 8px', borderRadius: 4 }}>
            Parent Code: {student.parent_code}
          </code>
        </div>
        <div className="form-grid">
          <div>
            <div className="text-xs text-muted">Guardian Name</div>
            <div style={{ fontWeight: 500 }}>{student.guardian_name}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Phone</div>
            <div style={{ fontWeight: 500 }}>{student.guardian_phone}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Parent Username</div>
            <div style={{ fontWeight: 500 }}>{student.parent_username || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Address</div>
            <div>{student.address || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Enrolled Since</div>
            <div>{student.enrollment_date}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Subjects</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
              {(Array.isArray(student.subjects) ? student.subjects : []).map((s) => (
                <span key={s} className="badge badge-info">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fee summary */}
      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
          <div className="stat-label">Unpaid Months</div>
          <div className="stat-value" style={{ color: unpaidFees > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{unpaidFees}</div>
          <div className="stat-icon">💰</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
          <div className="stat-label">Total Paid</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>৳{totalFeesPaid.toLocaleString()}</div>
          <div className="stat-icon">✅</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
          <div className="stat-label">Total Results</div>
          <div className="stat-value">{results.length}</div>
          <div className="stat-icon">📊</div>
        </div>
      </div>

      {/* Results chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <h2 className="card-title">📈 Academic Progress</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(val, name, props) => [`${val}% (${props.payload.grade})`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="var(--color-brand)" strokeWidth={2} dot={{ fill: 'var(--color-brand)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fee history */}
      {fees.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">💰 Fee History</h2>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Month</th><th>Due</th><th>Paid</th><th>Status</th><th>Method</th></tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td>{f.month}</td>
                    <td>৳{f.amount_due.toLocaleString()}</td>
                    <td style={{ color: f.amount_paid > 0 ? 'var(--color-success)' : 'inherit' }}>৳{f.amount_paid.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>{f.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
