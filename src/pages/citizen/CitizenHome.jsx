import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyReports, createReport } from "../../api/reportsApi";
import { useSocket } from "../../api/socket";
import {
  PlusCircle, FileText, Clock, CheckCircle,
  AlertTriangle, XCircle, MapPin, Upload, X
} from "lucide-react";
import Swal from "sweetalert2";

const swalTheme = {
  background: "#fffaf6",
  color: "#2d211d",
  confirmButtonColor: "#a8572f",
  customClass: {
    popup: "swal-auth-popup",
    confirmButton: "swal-auth-confirm",
    title: "swal-auth-title",
  },
};

const INCIDENT_TYPES = [
  { value: "", label: "Selecciona el tipo de incidente" },
  { value: "grieta_suelo", label: "Grieta en el suelo" },
  { value: "grieta_vivienda", label: "Grieta en vivienda" },
  { value: "hundimiento", label: "Hundimiento" },
  { value: "filtracion_agua", label: "Filtración de agua" },
  { value: "deslizamiento", label: "Deslizamiento pequeño" },
  { value: "caida_muro", label: "Caída de muro" },
  { value: "derrumbe", label: "Derrumbe" },
  { value: "otro", label: "Otro" },
];

const URGENCY_LEVELS = [
  { value: "baja",    label: "🟢 Baja",    desc: "Sin riesgo inmediato" },
  { value: "media",   label: "🟡 Media",   desc: "Requiere atención pronto" },
  { value: "alta",    label: "🟠 Alta",    desc: "Situación preocupante" },
  { value: "critica", label: "🔴 Crítica", desc: "Peligro inmediato" },
];

const STATUS_CONFIG = {
  pendiente:   { label: "Pendiente",   icon: Clock,          cls: "cz-status--pending" },
  en_revision: { label: "En revisión", icon: AlertTriangle,   cls: "cz-status--review"  },
  atendido:    { label: "Atendido",    icon: CheckCircle,     cls: "cz-status--done"    },
  descartado:  { label: "Descartado",  icon: XCircle,         cls: "cz-status--discard" },
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
  });
}

export default function CitizenHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    incident_type: "", description: "", urgency_level: "",
    location_name: "", latitude: "", longitude: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await getMyReports();
      setReports(res?.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("report_status_updated", (updated) => {
      setReports((prev) =>
        prev.map((r) => r.id === updated.id ? { ...r, status: updated.status } : r)
      );
    });
    return () => socket.off("report_status_updated");
  }, [socket]);

  // Stats
  const total = reports.length;
  const pendientes = reports.filter((r) => r.status === "pendiente").length;
  const atendidos = reports.filter((r) => r.status === "atendido").length;
  const criticos = reports.filter((r) => r.urgency_level === "critica").length;

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "La foto no puede superar 5MB." }));
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const removePhoto = () => { setPhoto(null); setPhotoPreview(null); };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  };

  const resetForm = () => {
    setForm({ incident_type: "", description: "", urgency_level: "", location_name: "", latitude: "", longitude: "" });
    setPhoto(null);
    setPhotoPreview(null);
    setErrors({});
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  const validate = () => {
    const nextErrors = {};
    if (!form.incident_type) nextErrors.incident_type = "Selecciona el tipo de incidente.";
    if (!form.description.trim()) nextErrors.description = "Ingresa una descripción.";
    else if (form.description.trim().length < 10) nextErrors.description = "La descripción es muy corta.";
    if (!form.urgency_level) nextErrors.urgency_level = "Selecciona el nivel de urgencia.";
    if (!form.location_name.trim()) nextErrors.location_name = "Ingresa el nombre de la ubicación.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("incident_type", form.incident_type);
      formData.append("description", form.description.trim());
      formData.append("urgency_level", form.urgency_level);
      formData.append("location_name", form.location_name.trim());
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.longitude) formData.append("longitude", form.longitude);
      if (photo) formData.append("photo", photo);

      const res = await createReport(formData);
      setReports((prev) => [res.data, ...prev]);
      closeModal();

      await Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "Reporte enviado",
        text: "Tu reporte fue registrado correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error al enviar",
        text: error?.message || "No se pudo enviar el reporte.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cz-page cz-page--wide">

      {/* Header */}
      <div className="cz-home-header">
        <div>
          <h1 className="cz-page-title">Bienvenido, {user?.full_name?.split(" ")[0]} 👋</h1>
          <p className="cz-page-sub">Desde aquí podés reportar incidentes y ver el estado de tus reportes.</p>
        </div>
        <button className="cz-btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={18} />
          Nuevo reporte
        </button>
      </div>

      {/* Stats */}
      <div className="cz-stats-grid">
        <div className="cz-stat-card">
          <span className="cz-stat-label">Total reportes</span>
          <strong className="cz-stat-value">{total}</strong>
        </div>
        <div className="cz-stat-card cz-stat-card--warning">
          <span className="cz-stat-label">Pendientes</span>
          <strong className="cz-stat-value">{pendientes}</strong>
        </div>
        <div className="cz-stat-card cz-stat-card--success">
          <span className="cz-stat-label">Atendidos</span>
          <strong className="cz-stat-value">{atendidos}</strong>
        </div>
        <div className="cz-stat-card cz-stat-card--danger">
          <span className="cz-stat-label">Críticos</span>
          <strong className="cz-stat-value">{criticos}</strong>
        </div>
      </div>

      {/* Últimos reportes */}
      <div className="cz-section">
        <div className="cz-section-header">
          <h2 className="cz-section-title">Últimos reportes</h2>
          <button className="cz-btn-outline" onClick={() => navigate("/ciudadano/mis-reportes")}>
            <FileText size={14} /> Ver todos
          </button>
        </div>

        {loading ? (
          <div className="cz-loading">Cargando...</div>
        ) : reports.length === 0 ? (
          <div className="cz-empty">
            <FileText size={36} />
            <p>No tenés reportes todavía.</p>
            <button className="cz-btn-primary" onClick={() => setShowModal(true)}>
              <PlusCircle size={16} /> Crear primer reporte
            </button>
          </div>
        ) : (
          <div className="cz-reports-grid">
            {reports.slice(0, 3).map((report) => {
              const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendiente;
              const StatusIcon = status.icon;
              return (
                <div key={report.id} className="cz-report-card">
                  <div className="cz-report-card__top">
                    <span className="cz-report-card__id">#{report.id}</span>
                    <span className={`cz-status-badge ${status.cls}`}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                  </div>
                  <div className="cz-report-card__type">
                    {INCIDENT_LABELS[report.incident_type] || report.incident_type}
                  </div>
                  <p className="cz-report-card__desc">{report.description}</p>
                  <div className="cz-report-card__meta">
                    <span>📍 {report.location_name}</span>
                    <span>{formatDate(report.reported_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nuevo reporte */}
      {showModal && (
        <div className="cz-modal-overlay" onClick={closeModal}>
          <div className="cz-modal cz-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="cz-modal__header">
              <span>Nuevo reporte</span>
              <button onClick={closeModal}>✕</button>
            </div>

            <div className="cz-modal__body">
              <form className="cz-form" onSubmit={handleSubmit} noValidate>

                <div className="cz-field">
                  <label className="cz-label">Tipo de incidente</label>
                  <select name="incident_type" value={form.incident_type} onChange={handleChange}
                    className={`cz-select ${errors.incident_type ? "is-invalid" : ""}`}>
                    {INCIDENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value} disabled={t.value === ""}>{t.label}</option>
                    ))}
                  </select>
                  {errors.incident_type && <span className="cz-error">{errors.incident_type}</span>}
                </div>

                <div className="cz-field">
                  <label className="cz-label">Nivel de urgencia</label>
                  <div className="cz-urgency-grid">
                    {URGENCY_LEVELS.map((u) => (
                      <button key={u.value} type="button"
                        className={`cz-urgency-btn ${form.urgency_level === u.value ? "cz-urgency-btn--active" : ""}`}
                        onClick={() => { setForm((prev) => ({ ...prev, urgency_level: u.value })); setErrors((prev) => ({ ...prev, urgency_level: "" })); }}>
                        <strong>{u.label}</strong>
                        <span>{u.desc}</span>
                      </button>
                    ))}
                  </div>
                  {errors.urgency_level && <span className="cz-error">{errors.urgency_level}</span>}
                </div>

                <div className="cz-field">
                  <label className="cz-label">Descripción</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Describe lo que observaste..." rows={3}
                    className={`cz-textarea ${errors.description ? "is-invalid" : ""}`} />
                  {errors.description && <span className="cz-error">{errors.description}</span>}
                </div>

                <div className="cz-field">
                  <label className="cz-label">Nombre de la ubicación</label>
                  <input type="text" name="location_name" value={form.location_name} onChange={handleChange}
                    placeholder="Ej: Ladera Norte, Calle 5 cerca de la plaza"
                    className={`cz-input ${errors.location_name ? "is-invalid" : ""}`} />
                  {errors.location_name && <span className="cz-error">{errors.location_name}</span>}
                </div>

                <div className="cz-field">
                  <label className="cz-label">GPS <span className="cz-optional">(opcional)</span></label>
                  <div className="cz-gps-row">
                    <input type="text" value={form.latitude} placeholder="Latitud" className="cz-input" readOnly />
                    <input type="text" value={form.longitude} placeholder="Longitud" className="cz-input" readOnly />
                    <button type="button" className="cz-gps-btn" onClick={getLocation} disabled={gettingLocation}>
                      <MapPin size={15} /> {gettingLocation ? "Obteniendo..." : "Mi ubicación"}
                    </button>
                  </div>
                </div>

                <div className="cz-field">
                  <label className="cz-label">Foto <span className="cz-optional">(opcional)</span></label>
                  {!photoPreview ? (
                    <label className="cz-upload-zone">
                      <Upload size={22} />
                      <span>Clic para seleccionar una foto</span>
                      <small>JPG, PNG o WEBP — máx. 5MB</small>
                      <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp"
                        onChange={handlePhoto} style={{ display: "none" }} />
                    </label>
                  ) : (
                    <div className="cz-photo-preview">
                      <img src={photoPreview} alt="Vista previa" />
                      <button type="button" className="cz-photo-remove" onClick={removePhoto}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {errors.photo && <span className="cz-error">{errors.photo}</span>}
                </div>

                <button type="submit" className="cz-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar reporte"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}