export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const items = [
    { key: tabs.GENERAL, label: "General" },
    { key: tabs.SOIL, label: "Humedad del suelo" },
    { key: tabs.VIBRATION, label: "Vibración" },
    { key: tabs.MPU, label: "Giroscopio / MPU6050" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>GeoMonitor</h2>
        <p>ESP32 Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebar-link ${activeTab === item.key ? "active" : ""}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}