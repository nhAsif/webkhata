export default function StatCard({ label, value, icon, color = '#6366f1', change }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {change !== undefined && (
        <div className="stat-change">{change}</div>
      )}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}
