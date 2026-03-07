import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistorias, toggleHistoria } from '../services/adminService';

export default function ManageStories() {
  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getHistorias()
      .then((data) => setHistorias(data.historias))
      .catch(() => setHistorias([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id) {
    try {
      await toggleHistoria(id);
      load();
    } catch {
      // ignore
    }
  }

  const publicadas = historias.filter((h) => h.publicada);
  const nopublicadas = historias.filter((h) => !h.publicada);

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <Link to="/admin" className="btn btn-sm btn-outline-secondary me-3">&larr; Volver</Link>
        <h1 className="h4 fw-bold text-dark mb-0">Gestionar Historias</h1>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Publicadas */}
          <h2 className="h6 text-uppercase text-muted fw-semibold mb-2">Publicadas ({publicadas.length})</h2>
          <div className="card border-0 shadow-sm mb-4">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">ID</th>
                    <th className="small">Título</th>
                    <th className="small">Creador</th>
                    <th className="small">Fecha</th>
                    <th className="small text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {publicadas.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted small py-3">Sin historias publicadas</td></tr>
                  ) : publicadas.map((h) => (
                    <tr key={h.id}>
                      <td className="small">{h.id}</td>
                      <td className="small">{h.titulo}</td>
                      <td className="small">{h.creador}</td>
                      <td className="small">{h.fecha_creacion ? new Date(h.fecha_creacion).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleToggle(h.id)}>
                          Despublicar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* No publicadas */}
          <h2 className="h6 text-uppercase text-muted fw-semibold mb-2">No publicadas ({nopublicadas.length})</h2>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">ID</th>
                    <th className="small">Título</th>
                    <th className="small">Creador</th>
                    <th className="small">Fecha</th>
                    <th className="small text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {nopublicadas.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted small py-3">Sin historias no publicadas</td></tr>
                  ) : nopublicadas.map((h) => (
                    <tr key={h.id}>
                      <td className="small">{h.id}</td>
                      <td className="small">{h.titulo}</td>
                      <td className="small">{h.creador}</td>
                      <td className="small">{h.fecha_creacion ? new Date(h.fecha_creacion).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-success" onClick={() => handleToggle(h.id)}>
                          Publicar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
