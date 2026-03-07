import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.correo.trim()) {
      errs.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      errs.correo = 'Ingresa un correo válido';
    }
    if (!form.contrasena) {
      errs.contrasena = 'La contraseña es requerida';
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
      const data = await login(form.correo, form.contrasena);
      onLogin(data.usuario);
      if (data.usuario.rol === 'Administrador') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.error || 'Error al iniciar sesión');
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
      <div className="card border-0 shadow" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 fw-bold text-primary mb-1">Iniciar Sesión</h1>
          <p className="text-muted small mb-4">Novela Visual</p>

          {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="correo" className="form-label small fw-medium">Correo electrónico</label>
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

            <div className="mb-4">
              <label htmlFor="contrasena" className="form-label small fw-medium">Contraseña</label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                className={`form-control ${errors.contrasena ? 'is-invalid' : ''}`}
                value={form.contrasena}
                onChange={handleChange}
                placeholder="••••••"
                autoComplete="current-password"
              />
              {errors.contrasena && <div className="invalid-feedback">{errors.contrasena}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            ¿No tienes cuenta? <Link to="/registro" className="text-accent fw-medium">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
