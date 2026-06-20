export default function StatCard({ icon, value, label, color = '#16a34a', bgColor = '#dcfce7', delay = 0 }) {
  return (
    <div className="stat-card animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-icon" style={{ background: bgColor }}>
        <span style={{ color, fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
