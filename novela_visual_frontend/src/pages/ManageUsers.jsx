import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsuarios, toggleUsuario } from '../services/adminService';

export default function ManageUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getUsuarios()
      .then((data) => setUsuarios(data.usuarios))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id) {
    try {
      await toggleUsuario(id);
      load();
    } catch {
      // ignore
    }
  }

  const activos = usuarios.filter((u) => u.activo);
  const inactivos = usuarios.filter((u) => !u.activo);

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <Link to="/admin" className="btn btn-sm btn-outline-secondary me-3">&larr; Volver</Link>
        <h1 className="h4 fw-bold text-dark mb-0">Gestionar Usuarios</h1>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <>
          {/* Usuarios activos */}
          <h2 className="h6 text-uppercase text-muted fw-semibold mb-2">Activos ({activos.length})</h2>
          <div className="card border-0 shadow-sm mb-4">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">ID</th>
                    <th className="small">Nombre</th>
                    <th className="small">Correo</th>
                    <th className="small">Rol</th>
                    <th className="small">Registro</th>
                    <th className="small text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {activos.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted small py-3">Sin usuarios activos</td></tr>
                  ) : activos.map((u) => (
                    <tr key={u.id}>
                      <td className="small">{u.id}</td>
                      <td className="small">{u.nombre}</td>
                      <td className="small">{u.correo}</td>
                      <td className="small">{u.rol}</td>
                      <td className="small">{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleToggle(u.id)}>
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usuarios inactivos */}
          <h2 className="h6 text-uppercase text-muted fw-semibold mb-2">Deshabilitados ({inactivos.length})</h2>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="small">ID</th>
                    <th className="small">Nombre</th>
                    <th className="small">Correo</th>
                    <th className="small">Rol</th>
                    <th className="small">Registro</th>
                    <th className="small text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inactivos.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted small py-3">Sin usuarios deshabilitados</td></tr>
                  ) : inactivos.map((u) => (
                    <tr key={u.id}>
                      <td className="small">{u.id}</td>
                      <td className="small">{u.nombre}</td>
                      <td className="small">{u.correo}</td>
                      <td className="small">{u.rol}</td>
                      <td className="small">{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-success" onClick={() => handleToggle(u.id)}>
                          Activar
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
