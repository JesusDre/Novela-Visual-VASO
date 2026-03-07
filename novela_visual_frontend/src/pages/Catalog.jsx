import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistoriasPublicadas } from '../services/adminService';

export default function Catalog({ usuario, onLogout }) {
  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistoriasPublicadas()
      .then((data) => setHistorias(data.historias))
      .catch(() => setHistorias([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary px-3">
        <span className="navbar-brand fw-bold">Novela Visual</span>
        <div className="d-flex align-items-center gap-2">
          {usuario ? (
            <>
              <Link to={usuario.rol === 'Administrador' ? '/admin' : '/dashboard'} className="btn btn-sm btn-outline-light">
                Mi panel
              </Link>
              <button className="btn btn-sm btn-outline-light" onClick={onLogout}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline-light">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-sm btn-accent">Registrarse</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-primary text-white text-center py-5">
        <div className="container">
          <h1 className="display-6 fw-bold mb-2" style={{ color: '#FFFAFF' }}>Explora historias interactivas</h1>
          <p className="lead mb-0" style={{ color: 'rgba(255,250,255,0.7)' }}>
            Elige tu aventura y decide cómo termina la historia
          </p>
        </div>
      </div>

      {/* Catálogo */}
      <main className="container py-4 flex-grow-1">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : historias.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <h5>No hay historias publicadas todavía</h5>
            <p className="small">Vuelve pronto para descubrir nuevas aventuras</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {historias.map((h) => (
              <div key={h.id} className="col">
                <div className="card border-0 shadow-sm h-100 catalog-card">
                  {/* Portada placeholder */}
                  <div
                    className="card-img-top d-flex align-items-center justify-content-center"
                    style={{
                      height: 200,
                      background: `linear-gradient(135deg, #0A2463, #3E92CC)`,
                      borderRadius: '10px 10px 0 0',
                    }}
                  >
                    <span className="display-4" style={{ color: '#FFFAFF', opacity: 0.8 }}>📖</span>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold mb-1" style={{ fontSize: '1rem' }}>{h.titulo}</h5>
                    <p className="card-text text-muted small flex-grow-1">
                      {h.descripcion ? (h.descripcion.length > 100 ? h.descripcion.slice(0, 100) + '…' : h.descripcion) : 'Sin descripción'}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>por {h.creador}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
