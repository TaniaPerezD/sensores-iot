import { useEffect, useState } from "react";
import { getMyReports } from "../../api/reportsApi";
import { useSocket } from "../../api/socket";
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

const STATUS_CONFIG = {
  pendiente:   { label: "Pendiente",   icon: Clock,         cls: "cz-status--pending"  },
  en_revision: { label: "En revisión", icon: AlertTriangle,  cls: "cz-status--review"   },
  atendido:    { label: "Atendido",    icon: CheckCircle,    cls: "cz-status--done"     },
  descartado:  { label: "Descartado",  icon: XCircle,        cls: "cz-status--discard"  },
};

const URGENCY_CONFIG = {
  baja:    { label: "Baja",    cls: "cz-urgency--low"      },
  media:   { label: "Media",   cls: "cz-urgency--med"      },
  alta:    { label: "Alta",    cls: "cz-urgency--high"     },
  critica: { label: "Crítica", cls: "cz-urgency--critical" },
};

const INCIDENT_LABELS = {
  grieta_suelo:    "Grieta en el suelo",
  grieta_vivienda: "Grieta en vivienda",
  hundimiento:     "Hundimiento",
  filtracion_agua: "Filtración de agua",
  deslizamiento:   "Deslizamiento",
  caida_muro:      "Caída de muro",
  derrumbe:        "Derrumbe",
  otro:            "Otro",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MisReportes() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const socket = useSocket();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getMyReports();
      setReports(res?.data || []);
    } catch (err) {
      setError(err?.message || "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Tiempo real: actualizar estado si el admin lo cambia
  useEffect(() => {
    if (!socket) return;

    socket.on("report_status_updated", (updatedReport) => {
      setReports((prev) =>
        prev.map((r) => (r.id === updatedReport.id ? { ...r, status: updatedReport.status } : r))
      );
      // Si el reporte seleccionado es el que se actualizó, actualizarlo también
      setSelected((prev) =>
        prev?.id === updatedReport.id ? { ...prev, status: updatedReport.status } : prev
      );
    });

    return () => socket.off("report_status_updated");
  }, [socket]);

  if (loading) {
    return (
      <div className="cz-page">
        <div className="cz-loading">Cargando tus reportes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cz-page">
        <div className="cz-empty">
          <p>{error}</p>
          <button className="cz-btn-outline" onClick={fetchReports}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cz-page cz-page--wide">
      <div className="cz-page-header">
        <span className="cz-page-eyebrow">Historial</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 className="cz-page-title">Mis reportes</h1>
          <button className="cz-btn-outline" onClick={fetchReports}>
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
        <p className="cz-page-sub">
          {reports.length === 0
            ? "Aún no enviaste ningún reporte."
            : `${reports.length} reporte${reports.length > 1 ? "s" : ""} registrado${reports.length > 1 ? "s" : ""}.`}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="cz-empty">
          <FileText size={40} />
          <p>No tenés reportes todavía.</p>
        </div>
      ) : (
        <div className="cz-reports-grid">
          {reports.map((report) => {
            const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendiente;
            const urgency = URGENCY_CONFIG[report.urgency_level] || URGENCY_CONFIG.media;
            const StatusIcon = status.icon;

            return (
              <div
                key={report.id}
                className="cz-report-card"
                onClick={() => setSelected(report)}
              >
                <div className="cz-report-card__top">
                  <span className="cz-report-card__id">#{report.id}</span>
                  <span className={`cz-urgency-badge ${urgency.cls}`}>
                    {urgency.label}
                  </span>
                </div>

                <div className="cz-report-card__type">
                  {INCIDENT_LABELS[report.incident_type] || report.incident_type}
                </div>

                <p className="cz-report-card__desc">{report.description}</p>

                <div className="cz-report-card__meta">
                  <span className="cz-report-card__location">📍 {report.location_name}</span>
                  <span className="cz-report-card__date">{formatDate(report.reported_at)}</span>
                </div>

                <div className={`cz-status-badge ${status.cls}`}>
                  <StatusIcon size={13} />
                  {status.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="cz-modal-overlay" onClick={() => setSelected(null)}>
          <div className="cz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cz-modal__header">
              <span>Reporte #{selected.id}</span>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            {selected.photo_url && (
              <img src={selected.photo_url} alt="Foto del reporte" className="cz-modal__photo" />
            )}

            <div className="cz-modal__body">
              <div className="cz-modal__row">
                <span>Tipo</span>
                <strong>{INCIDENT_LABELS[selected.incident_type]}</strong>
              </div>
              <div className="cz-modal__row">
                <span>Urgencia</span>
                <span className={`cz-urgency-badge ${URGENCY_CONFIG[selected.urgency_level]?.cls}`}>
                  {URGENCY_CONFIG[selected.urgency_level]?.label}
                </span>
              </div>
              <div className="cz-modal__row">
                <span>Estado</span>
                <span className={`cz-status-badge ${STATUS_CONFIG[selected.status]?.cls}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>
              <div className="cz-modal__row">
                <span>Ubicación</span>
                <strong>{selected.location_name}</strong>
              </div>
              {selected.latitude && (
                <div className="cz-modal__row">
                  <span>GPS</span>
                  <strong>{selected.latitude}, {selected.longitude}</strong>
                </div>
              )}
              <div className="cz-modal__row">
                <span>Fecha</span>
                <strong>{formatDate(selected.reported_at)}</strong>
              </div>
              <div className="cz-modal__desc">
                <span>Descripción</span>
                <p>{selected.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}