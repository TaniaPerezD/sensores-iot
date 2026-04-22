import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailIsValid = useMemo(
    () => emailRegex.test(form.email.trim()),
    [form.email]
  );

  const validateForm = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Ingresa tu correo electrónico.";
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Ingresa tu contraseña.";
    } else if (form.password.trim().length < 6) {
      nextErrors.password = "La contraseña parece demasiado corta.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      form: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      await Swal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Revisa el formulario",
        text: "Completa correctamente los campos antes de continuar.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      await Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "Sesión iniciada",
        text: `Bienvenido, ${response?.data?.user?.full_name || "usuario"}.`,
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo iniciar sesión.";

      setErrors((prev) => ({
        ...prev,
        form: message,
      }));

      await Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-refined">
      <div className="auth-refined__shell">
        <section className="auth-refined__aside">
          <Link to="/" className="auth-refined__brand">
            <div className="auth-refined__brand-mark">SW</div>
            <div>
              <strong>SlideWatch</strong>
              <span>Sistema de alerta temprana</span>
            </div>
          </Link>

          <div className="auth-refined__aside-copy">
            <span className="auth-refined__eyebrow">Acceso seguro</span>
            <h1>Accede al monitoreo del terreno.</h1>
            <p>
              Consulta estados, métricas, sensores y alertas desde una
              experiencia limpia, sobria y alineada con la plataforma.
            </p>
          </div>

          <div className="auth-refined__aside-note">
            <strong>Seguimiento continuo</strong>
            <p>
              Mantén acceso al resumen general, sensores activos e histórico del
              sistema desde un solo entorno.
            </p>
          </div>
        </section>

        <section className="auth-refined__panel">
          <div className="auth-refined__panel-header">
            <span className="auth-refined__badge">Iniciar sesión</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para continuar al dashboard.</p>
          </div>

          <form className="auth-refined__form" onSubmit={handleSubmit} noValidate>
            <label className="auth-refined__field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                placeholder="tu_correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "is-invalid" : ""}
              />
              <small className="auth-refined__helper">
                {form.email
                  ? emailIsValid
                    ? "Correo válido."
                    : "Verifica el formato del correo."
                  : "Usa el correo con el que te registraste."}
              </small>
              {errors.email ? (
                <div className="auth-refined__field-error">{errors.email}</div>
              ) : null}
            </label>

            <label className="auth-refined__field">
              <span>Contraseña</span>

              <div className="auth-refined__password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={errors.password ? "is-invalid" : ""}
                />

                <button
                  type="button"
                  className="auth-refined__toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <small className="auth-refined__helper">
                Ingresa la contraseña asociada a tu cuenta.
              </small>

              {errors.password ? (
                <div className="auth-refined__field-error">{errors.password}</div>
              ) : null}
            </label>

            {errors.form ? (
              <div className="auth-refined__error">{errors.form}</div>
            ) : null}

            <button
              type="submit"
              className="auth-refined__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Entrar al sistema"}
            </button>
          </form>

          <div className="auth-refined__links">
            <p>
              ¿No tienes una cuenta? <Link to="/register">Crear cuenta</Link>
            </p>
            <p>
              <Link to="/">Volver al inicio</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}