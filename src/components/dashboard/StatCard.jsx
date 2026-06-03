export default function StatCard({ label, value, unit, status, trend, accentType }) {
  return (
    <div className={`sw-kpi sw-kpi--${accentType}`}>
      <div className={`sw-kpi-accent sw-kpi-accent--${accentType}`} />
      <div className="sw-kpi-label">{label}</div>
      <div className="sw-kpi-val-row">
        <span className="sw-kpi-val">{value}</span>
        {unit && <span className="sw-kpi-unit">{unit}</span>}
      </div>
      <div className="sw-kpi-bottom">
        <span className={`sw-kpi-status sw-kpi-status--${status.type}`}>{status.label}</span>
        <span className={`sw-kpi-trend sw-kpi-trend--${trend.cls}`}>{trend.txt}</span>
      </div>
    </div>
  );
}