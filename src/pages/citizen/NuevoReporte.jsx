import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, X } from "lucide-react";
import Swal from "sweetalert2";
import { createReport } from "../../api/reportsApi";

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

export default function NuevoReporte() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    incident_type: "",
    description: "",
    urgency_level: "",
    location_name: "",
    latitude: "",
    longitude: "",
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

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

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: "Tu navegador no soporta geolocalización." }));
      return;
    }

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
      () => {
        setErrors((prev) => ({ ...prev, location: "No se pudo obtener la ubicación." }));
        setGettingLocation(false);
      }
    );
  };

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

      await createReport(formData);

      await Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "Reporte enviado",
        text: "Tu reporte fue registrado correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/ciudadano/mis-reportes");
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
    <div className="cz-page">
      <div className="cz-page-header">
        <span className="cz-page-eyebrow">Nuevo incidente</span>
        <h1 className="cz-page-title">Reportar incidente</h1>
        <p className="cz-page-sub">
          Completá el formulario con los datos del incidente que observaste.
        </p>
      </div>

      <form className="cz-form" onSubmit={handleSubmit} noValidate>

        {/* Tipo de incidente */}
        <div className="cz-field">
          <label className="cz-label">Tipo de incidente</label>
          <select
            name="incident_type"
            value={form.incident_type}
            onChange={handleChange}
            className={`cz-select ${errors.incident_type ? "is-invalid" : ""}`}
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} disabled={t.value === ""}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.incident_type && <span className="cz-error">{errors.incident_type}</span>}
        </div>

        {/* Nivel de urgencia */}
        <div className="cz-field">
          <label className="cz-label">Nivel de urgencia</label>
          <div className="cz-urgency-grid">
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u.value}
                type="button"
                className={`cz-urgency-btn ${form.urgency_level === u.value ? "cz-urgency-btn--active" : ""}`}
                onClick={() => {
                  setForm((prev) => ({ ...prev, urgency_level: u.value }));
                  setErrors((prev) => ({ ...prev, urgency_level: "" }));
                }}
              >
                <strong>{u.label}</strong>
                <span>{u.desc}</span>
              </button>
            ))}
          </div>
          {errors.urgency_level && <span className="cz-error">{errors.urgency_level}</span>}
        </div>

        {/* Descripción */}
        <div className="cz-field">
          <label className="cz-label">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe lo que observaste con el mayor detalle posible..."
            rows={4}
            className={`cz-textarea ${errors.description ? "is-invalid" : ""}`}
          />
          {errors.description && <span className="cz-error">{errors.description}</span>}
        </div>

        {/* Ubicación */}
        <div className="cz-field">
          <label className="cz-label">Nombre de la ubicación</label>
          <input
            type="text"
            name="location_name"
            value={form.location_name}
            onChange={handleChange}
            placeholder="Ej: Ladera Norte, Calle 5 cerca de la plaza"
            className={`cz-input ${errors.location_name ? "is-invalid" : ""}`}
          />
          {errors.location_name && <span className="cz-error">{errors.location_name}</span>}
        </div>

        {/* GPS */}
        <div className="cz-field">
          <label className="cz-label">Coordenadas GPS <span className="cz-optional">(opcional)</span></label>
          <div className="cz-gps-row">
            <input
              type="text"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="Latitud"
              className="cz-input"
              readOnly
            />
            <input
              type="text"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="Longitud"
              className="cz-input"
              readOnly
            />
            <button
              type="button"
              className="cz-gps-btn"
              onClick={getLocation}
              disabled={gettingLocation}
            >
              <MapPin size={16} />
              {gettingLocation ? "Obteniendo..." : "Usar mi ubicación"}
            </button>
          </div>
          {errors.location && <span className="cz-error">{errors.location}</span>}
        </div>

        {/* Foto */}
        <div className="cz-field">
          <label className="cz-label">Foto <span className="cz-optional">(opcional, máx. 5MB)</span></label>
          {!photoPreview ? (
            <label className="cz-upload-zone">
              <Upload size={24} />
              <span>Clic para seleccionar una foto</span>
              <small>JPG, PNG o WEBP</small>
              <input
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                style={{ display: "none" }}
              />
            </label>
          ) : (
            <div className="cz-photo-preview">
              <img src={photoPreview} alt="Vista previa" />
              <button type="button" className="cz-photo-remove" onClick={removePhoto}>
                <X size={16} />
              </button>
            </div>
          )}
          {errors.photo && <span className="cz-error">{errors.photo}</span>}
        </div>

        <button type="submit" className="cz-submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando reporte..." : "Enviar reporte"}
        </button>
      </form>
    </div>
  );
}