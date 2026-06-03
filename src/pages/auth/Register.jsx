import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import "../../styles/auth.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const upperRegex = /[A-Z]/;
const lowerRegex = /[a-z]/;
const numberRegex = /\d/;
const specialRegex = /[^A-Za-z0-9]/;

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

function getPasswordChecks(password) {
  return {
    minLength: password.length >= 8,
    upper: upperRegex.test(password),
    lower: lowerRegex.test(password),
    number: numberRegex.test(password),
    special: specialRegex.test(password),
  };
}

function getPasswordStrength(password) {
  const checks = Object.values(getPasswordChecks(password)).filter(Boolean).length;

  if (!password) return { score: 0, label: "Sin evaluar", className: "" };
  if (checks <= 2) return { score: 1, label: "Débil", className: "weak" };
  if (checks <= 4) return { score: 2, label: "Media", className: "medium" };
  return { score: 3, label: "Fuerte", className: "strong" };
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const emailIsValid = useMemo(() => emailRegex.test(form.email.trim()), [form.email]);

  const passwordIsValid =
    checks.minLength &&
    checks.upper &&
    checks.lower &&
    checks.number &&
    checks.special;

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Ingresa tu nombre completo.";
    } else if (form.name.trim().length < 3) {
      nextErrors.name = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Ingresa tu correo electrónico.";
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    if (!form.password) {
      nextErrors.password = "Ingresa una contraseña.";
    } else if (!passwordIsValid) {
      nextErrors.password = "La contraseña no cumple los requisitos de seguridad.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirma tu contraseña.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
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
        text: "Completa correctamente todos los campos antes de continuar.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      await Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "Cuenta creada",
        text: `Bienvenido, ${response?.data?.user?.full_name || form.name}.`,
        timer: 1600,
        showConfirmButton: false,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error?.message || "No se pudo crear la cuenta.";

      setErrors((prev) => ({
        ...prev,
        form: message,
      }));

      await Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "No se pudo crear la cuenta",
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
            <span className="auth-refined__eyebrow">Nuevo acceso</span>
            <h1>Crea tu acceso a la plataforma.</h1>
            <p>
              Regístrate para ingresar al sistema y continuar con el monitoreo,
              visualización y seguimiento de datos del terreno.
            </p>
          </div>

          <div className="auth-refined__aside-note">
            <strong>Plataforma organizada</strong>
            <p>
              Mantén una entrada clara al sistema con una interfaz coherente con
              el dashboard principal.
            </p>
          </div>
        </section>

        <section className="auth-refined__panel">
          <div className="auth-refined__panel-header">
            <span className="auth-refined__badge">Crear cuenta</span>
            <h2>Registrar acceso</h2>
            <p>Completa tus datos para entrar a la plataforma.</p>
          </div>

          <form className="auth-refined__form" onSubmit={handleSubmit} noValidate>
            <label className="auth-refined__field">
              <span>Nombre</span>
              <input
                type="text"
                name="name"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "is-invalid" : ""}
              />
              <small className="auth-refined__helper">
                Usa tu nombre como quieres verlo en la plataforma.
              </small>
              {errors.name ? (
                <div className="auth-refined__field-error">{errors.name}</div>
              ) : null}
            </label>

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
                  : "Será tu correo de acceso al sistema."}
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
                  placeholder="Crea una contraseña segura"
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
                Debe tener 8 caracteres o más, mayúscula, minúscula, número y símbolo.
              </small>

              <div className="auth-refined__password-strength">
                <div className="auth-refined__password-bar">
                  <span className={strength.score >= 1 ? strength.className : ""} />
                  <span className={strength.score >= 2 ? strength.className : ""} />
                  <span className={strength.score >= 3 ? strength.className : ""} />
                </div>
                <strong className={`auth-refined__strength-label ${strength.className}`}>
                  {strength.label}
                </strong>
              </div>

              <ul className="auth-refined__password-rules">
                <li className={checks.minLength ? "ok" : ""}>Mínimo 8 caracteres</li>
                <li className={checks.upper ? "ok" : ""}>Al menos una mayúscula</li>
                <li className={checks.lower ? "ok" : ""}>Al menos una minúscula</li>
                <li className={checks.number ? "ok" : ""}>Al menos un número</li>
                <li className={checks.special ? "ok" : ""}>Al menos un símbolo</li>
              </ul>

              {errors.password ? (
                <div className="auth-refined__field-error">{errors.password}</div>
              ) : null}
            </label>

            <label className="auth-refined__field">
              <span>Confirmar contraseña</span>

              <div className="auth-refined__password-input-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "is-invalid" : ""}
                />

                <button
                  type="button"
                  className="auth-refined__toggle-password"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar confirmación de contraseña"
                      : "Mostrar confirmación de contraseña"
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <small className="auth-refined__helper">
                Debe coincidir exactamente con la contraseña anterior.
              </small>

              {errors.confirmPassword ? (
                <div className="auth-refined__field-error">
                  {errors.confirmPassword}
                </div>
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
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="auth-refined__links">
            <p>
              ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
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