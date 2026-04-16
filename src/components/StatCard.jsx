export default function StatCard({ title, value, subtitle, type = "info" }) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-subtitle">{subtitle}</div>
    </div>
  );
}