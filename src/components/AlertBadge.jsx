export default function AlertBadge({ title, description, type = "info" }) {
  return (
    <div className={`alert-badge ${type}`}>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}