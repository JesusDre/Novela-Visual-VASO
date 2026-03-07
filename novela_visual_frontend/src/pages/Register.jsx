import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registro } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    contrasena: '',
    confirmar: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (!form.correo.trim()) {
      errs.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      errs.correo = 'Ingresa un correo válido';
    }
    if (!form.contrasena) {
      errs.contrasena = 'La contraseña es requerida';
    } else if (form.contrasena.length < 6) {
      errs.contrasena = 'Mínimo 6 caracteres';
    } else if (!/[A-Z]/.test(form.contrasena)) {
      errs.contrasena = 'Debe incluir al menos una mayúscula';
    } else if (!/[0-9]/.test(form.contrasena)) {
      errs.contrasena = 'Debe incluir al menos un número';
    }
    if (!form.confirmar) {
      errs.confirmar = 'Confirma tu contraseña';
    } else if (form.contrasena !== form.confirmar) {
      errs.confirmar = 'Las contraseñas no coinciden';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { confirmar, ...datos } = form;
      await registro(datos);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setApiError(err.error || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow" style={{ maxWidth: 480, width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 fw-bold text-primary mb-1">Crear Cuenta</h1>
          <p className="text-muted small mb-4">Novela Visual</p>

          {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label small fw-medium">Nombre *</label>
              <input
                id="nombre"
                name="nombre"
                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>

            <div className="row mb-3">
              <div className="col">
                <label htmlFor="apellido_paterno" className="form-label small fw-medium">Apellido paterno</label>
                <input
                  id="apellido_paterno"
                  name="apellido_paterno"
                  className="form-control"
                  value={form.apellido_paterno}
                  onChange={handleChange}
                />
              </div>
              <div className="col">
                <label htmlFor="apellido_materno" className="form-label small fw-medium">Apellido materno</label>
                <input
                  id="apellido_materno"
                  name="apellido_materno"
                  className="form-control"
                  value={form.apellido_materno}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="correo" className="form-label small fw-medium">Correo electrónico *</label>
              <input
                id="correo"
                name="correo"
                type="email"
                className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                value={form.correo}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
              {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="contrasena" className="form-label small fw-medium">Contraseña *</label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                className={`form-control ${errors.contrasena ? 'is-invalid' : ''}`}
                value={form.contrasena}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres, 1 mayúscula, 1 número"
                autoComplete="new-password"
              />
              {errors.contrasena && <div className="invalid-feedback">{errors.contrasena}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmar" className="form-label small fw-medium">Confirmar contraseña *</label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                className={`form-control ${errors.confirmar ? 'is-invalid' : ''}`}
                value={form.confirmar}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              {errors.confirmar && <div className="invalid-feedback">{errors.confirmar}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            ¿Ya tienes cuenta? <Link to="/login" className="text-accent fw-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
