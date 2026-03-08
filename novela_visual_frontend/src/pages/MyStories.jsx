import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export default function MyStories() {
  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarHistorias();
  }, []);

  async function cargarHistorias() {
    try {
      const res = await fetch(`${API_BASE}/mis-historias/`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Error al cargar historias');
      }
      
      const data = await res.json();
      setHistorias(data.historias || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-3">
        <Link to="/dashboard" className="navbar-brand fw-bold">← Volver</Link>
      </nav>

      <main className="container py-4" style={{ maxWidth: 900 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 fw-bold mb-0">Mis Historias</h1>
          <Link to="/historias/crear" className="btn btn-primary">
            + Crear Nueva Historia
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {historias.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5">
            <div className="card-body">
              <h5 className="text-muted mb-3">No tienes historias aún</h5>
              <p className="text-muted small mb-4">
                Crea tu primera historia y empieza a escribir tu novela visual
              </p>
              <Link to="/historias/crear" className="btn btn-primary">
                Crear Mi Primera Historia
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {historias.map((historia) => (
              <div key={historia.id} className="col-12 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{historia.titulo}</h5>
                      {historia.publicada ? (
                        <span className="badge bg-success">Publicada</span>
                      ) : (
                        <span className="badge bg-secondary">Borrador</span>
                      )}
                    </div>
                    
                    <p className="card-text text-muted small mb-3">
                      {historia.descripcion || 'Sin descripción'}
                    </p>
                    
                    <div className="row g-2 text-center mb-3">
                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <div className="fw-bold">{historia.nodos_count}</div>
                          <div className="small text-muted">Escenas</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-light rounded p-2">
                          <div className="fw-bold">
                            {historia.tiene_nodo_inicio ? '✓' : '✗'}
                          </div>
                          <div className="small text-muted">Inicio</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Link 
                        to={`/historias/${historia.id}/editar`} 
                        className="btn btn-sm btn-primary flex-grow-1"
                      >
                        Editar
                      </Link>
                      <Link
                        to={`/historias/${historia.id}/jugar`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-transparent border-0 pt-0">
                    <small className="text-muted">
                      Creada: {new Date(historia.fecha_creacion).toLocaleDateString()}
                    </small>
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
