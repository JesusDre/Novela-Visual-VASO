import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';

export default function UserDashboard({ usuario, onLogout }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore
    }
    onLogout();
    navigate('/login');
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <nav className="navbar navbar-dark bg-primary px-3">
        <span className="navbar-brand fw-bold">Novela Visual</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white-50 small">{usuario.nombre}</span>
          <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </nav>

      <main className="container py-4" style={{ maxWidth: 720 }}>
        <h1 className="h4 fw-bold text-dark mb-4">Bienvenido, {usuario.nombre}</h1>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h2 className="card-title h6 text-uppercase text-muted fw-semibold mb-3">Tu perfil</h2>
            <div className="row g-2">
              <div className="col-4 text-muted small">Nombre</div>
              <div className="col-8 small">{usuario.nombre}</div>
              <div className="col-4 text-muted small">Correo</div>
              <div className="col-8 small">{usuario.correo}</div>
              <div className="col-4 text-muted small">Rol</div>
              <div className="col-8 small">{usuario.rol}</div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary">Mis Historias</button>
          <button className="btn btn-outline-secondary">Explorar</button>
        </div>
      </main>
    </div>
  );
}
