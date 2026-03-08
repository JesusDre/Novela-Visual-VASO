import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historia, setHistoria] = useState(null);
  const [vista, setVista] = useState('info'); // info, nodos, personajes
  
  // Formulario para nuevo nodo
  const [nuevoNodo, setNuevoNodo] = useState({
    titulo_nodo: '',
    texto: '',
    es_final: false,
    imagenFile: null,
    imagenPreview: null,
    audioFile: null,
    audioPreview: null
  });
  
  // Formulario para nueva opción
  const [nuevaOpcion, setNuevaOpcion] = useState({
    texto_opcion: '',
    nodo_origen_id: '',
    nodo_destino_id: ''
  });
  
  // Formulario para nuevo personaje
  const [nuevoPersonaje, setNuevoPersonaje] = useState({
    nombre: '',
    imagenFile: null,
    imagenPreview: null
  });

  useEffect(() => {
    cargarHistoria();
  }, [id]);

  async function cargarHistoria() {
    try {
      const res = await fetch(`${API_BASE}/historias/${id}/`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Error al cargar historia');
      }
      
      const data = await res.json();
      setHistoria(data.historia);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearNodo(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Subir imagen si hay
      let imagenId = null;
      if (nuevoNodo.imagenFile) {
        const reader = new FileReader();
        reader.readAsDataURL(nuevoNodo.imagenFile);
        await new Promise((resolve) => {
          reader.onload = async () => {
            const res = await fetch(`${API_BASE}/imagenes/subir/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                imagen: reader.result,
                tipo: 'escenario',
                descripcion: nuevoNodo.titulo_nodo
              })
            });
            
            if (!res.ok) throw new Error('Error al subir imagen');
            const data = await res.json();
            imagenId = data.imagen.id;
            resolve();
          };
        });
      }
      
      // 2. Subir audio si hay
      let audioId = null;
      if (nuevoNodo.audioFile) {
        const reader = new FileReader();
        reader.readAsDataURL(nuevoNodo.audioFile);
        await new Promise((resolve) => {
          reader.onload = async () => {
            const res = await fetch(`${API_BASE}/audio/subir/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                audio: reader.result,
                descripcion: `Audio de fondo - ${nuevoNodo.titulo_nodo}`
              })
            });
            
            if (!res.ok) throw new Error('Error al subir audio');
            const data = await res.json();
            audioId = data.audio.id;
            resolve();
          };
        });
      }
      
      // 3. Crear nodo
      const res = await fetch(`${API_BASE}/nodos/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historia_id: id,
          titulo_nodo: nuevoNodo.titulo_nodo,
          texto: nuevoNodo.texto,
          es_final: nuevoNodo.es_final,
          imagen_escenario_id: imagenId,
          audio_fondo_id: audioId
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear escena');
      }
      
      // Recargar historia
      await cargarHistoria();
      setNuevoNodo({
        titulo_nodo: '',
        texto: '',
        es_final: false,
        imagenFile: null,
        imagenPreview: null,
        audioFile: null,
        audioPreview: null
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearOpcion(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/opciones/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nuevaOpcion)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear opción');
      }
      
      // Recargar historia
      await cargarHistoria();
      setNuevaOpcion({
        texto_opcion: '',
        nodo_origen_id: '',
        nodo_destino_id: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublicar() {
    if (!confirm('¿Deseas publicar esta historia? Los usuarios podrán verla en el catálogo.')) {
      return;
    }
    
    try {
      // Este endpoint lo crearemos en el backend
      const res = await fetch(`${API_BASE}/historias/${id}/publicar/`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Error al publicar');
      
      await cargarHistoria();
      alert('¡Historia publicada exitosamente!');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleImagenNodo(e) {
    const file = e.target.files[0];
    if (file) {
      setNuevoNodo({
        ...nuevoNodo,
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file)
      });
    }
  }

  function handleAudioNodo(e) {
    const file = e.target.files[0];
    if (file) {
      setNuevoNodo({
        ...nuevoNodo,
        audioFile: file,
        audioPreview: URL.createObjectURL(file)
      });
    }
  }

  async function handleCrearPersonaje(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Subir imagen del personaje
      if (!nuevoPersonaje.imagenFile) {
        throw new Error('Debes seleccionar una imagen para el personaje');
      }
      
      let imagenId = null;
      const reader = new FileReader();
      reader.readAsDataURL(nuevoPersonaje.imagenFile);
      await new Promise((resolve) => {
        reader.onload = async () => {
          const res = await fetch(`${API_BASE}/imagenes/subir/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              imagen: reader.result,
              tipo: 'personaje',
              descripcion: nuevoPersonaje.nombre
            })
          });
          
          if (!res.ok) throw new Error('Error al subir imagen');
          const data = await res.json();
          imagenId = data.imagen.id;
          resolve();
        };
      });
      
      // 2. Crear personaje
      const res = await fetch(`${API_BASE}/personajes/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historia_id: historia.id,
          nombre: nuevoPersonaje.nombre,
          imagen_id: imagenId
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear personaje');
      }
      
      // Recargar historia para ver el nuevo personaje
      await cargarHistoria();
      setNuevoPersonaje({ nombre: '', imagenFile: null, imagenPreview: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAsignarPersonajeNodo(nodoId, personajeId, posicion = 'centro') {
    try {
      const res = await fetch(`${API_BASE}/nodos/personajes/asignar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nodo_id: nodoId,
          personaje_id: personajeId,
          posicion: posicion
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al asignar personaje');
      }
      
      await cargarHistoria();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoverPersonajeNodo(nodoId, personajeId) {
    try {
      const res = await fetch(`${API_BASE}/nodos/${nodoId}/personajes/${personajeId}/remover/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al remover personaje');
      }
      
      await cargarHistoria();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleImagenPersonaje(e) {
    const file = e.target.files[0];
    if (file) {
      setNuevoPersonaje({
        ...nuevoPersonaje,
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file)
      });
    }
  }

  if (loading && !historia) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!historia) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h5>Historia no encontrada</h5>
          <Link to="/mis-historias" className="btn btn-primary mt-3">Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-3">
        <Link to="/mis-historias" className="navbar-brand fw-bold">← Mis Historias</Link>
        <div className="d-flex gap-2">
          <Link 
            to={`/historias/${id}/jugar`} 
            className="btn btn-sm btn-light"
          >
            ▶ Ver Historia
          </Link>
          <button 
            className={`btn btn-sm ${historia.publicada ? 'btn-warning' : 'btn-success'}`}
            onClick={handlePublicar}
          >
            {historia.publicada ? '✓ Publicada' : 'Publicar'}
          </button>
        </div>
      </nav>

      <main className="container py-4" style={{ maxWidth: 1000 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 fw-bold mb-1">{historia.titulo}</h1>
            <p className="text-muted small mb-0">{historia.descripcion}</p>
          </div>
          <span className={`badge ${historia.publicada ? 'bg-success' : 'bg-secondary'}`}>
            {historia.publicada ? 'Publicada' : 'Borrador'}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {/* Tabs */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link ${vista === 'info' ? 'active' : ''}`}
                  onClick={() => setVista('info')}
                >
                  Información
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${vista === 'nodos' ? 'active' : ''}`}
                  onClick={() => setVista('nodos')}
                >
                  Escenas ({historia.nodos?.length || 0})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${vista === 'personajes' ? 'active' : ''}`}
                  onClick={() => setVista('personajes')}
                >
                  Personajes ({historia.personajes?.length || 0})
                </button>
              </li>
            </ul>
          </div>
          
          <div className="card-body">
            {/* Vista: Información */}
            {vista === 'info' && (
              <div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="bg-light rounded p-3">
                      <div className="text-muted small mb-1">Escenas totales</div>
                      <div className="h4 mb-0">{historia.nodos?.length || 0}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-light rounded p-3">
                      <div className="text-muted small mb-1">Personajes</div>
                      <div className="h4 mb-0">{historia.personajes?.length || 0}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6 className="text-muted small mb-3">Mapa de Escenas</h6>
                  <div className="small">
                    {historia.nodos?.map((nodo) => (
                      <div key={nodo.id} className="mb-3 p-3 border rounded">
                        <div className="fw-bold">{nodo.titulo || 'Escena sin título'}</div>
                        <div className="text-muted small mb-2">{nodo.texto?.substring(0, 80)}...</div>
                        {nodo.opciones?.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">Opciones:</small>
                            {nodo.opciones.map((op) => (
                              <div key={op.id} className="small text-primary ms-3">
                                → {op.texto}
                              </div>
                            ))}
                          </div>
                        )}
                        {nodo.es_final && (
                          <span className="badge bg-danger">Final</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vista: Nodos */}
            {vista === 'nodos' && (
              <div>
                {/* Formulario para crear nodo */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title">Agregar Nueva Escena</h6>
                    <form onSubmit={handleCrearNodo}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small">Título de la Escena</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={nuevoNodo.titulo_nodo}
                            onChange={(e) => setNuevoNodo({ ...nuevoNodo, titulo_nodo: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small">Imagen de Fondo</label>
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            accept="image/*"
                            onChange={handleImagenNodo}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small">Texto/Narrativa</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows="3"
                            value={nuevoNodo.texto}
                            onChange={(e) => setNuevoNodo({ ...nuevoNodo, texto: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small">Audio de Fondo (opcional)</label>
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            accept="audio/*"
                            onChange={handleAudioNodo}
                          />
                          {nuevoNodo.audioPreview && (
                            <div className="mt-2">
                              <audio controls className="w-100" style={{ height: 30 }}>
                                <source src={nuevoNodo.audioPreview} />
                              </audio>
                            </div>
                          )}
                        </div>
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="esFinal"
                              checked={nuevoNodo.es_final}
                              onChange={(e) => setNuevoNodo({ ...nuevoNodo, es_final: e.target.checked })}
                            />
                            <label className="form-check-label small" htmlFor="esFinal">
                              Es una escena final (sin opciones)
                            </label>
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={loading}>
                        + Agregar Escena
                      </button>
                    </form>
                  </div>
                </div>

                {/* Formulario para crear opciones */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title">Conectar Escenas (Crear Opciones)</h6>
                    <form onSubmit={handleCrearOpcion}>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small">Desde la escena</label>
                          <select
                            className="form-select form-select-sm"
                            value={nuevaOpcion.nodo_origen_id}
                            onChange={(e) => setNuevaOpcion({ ...nuevaOpcion, nodo_origen_id: e.target.value })}
                            required
                          >
                            <option value="">Selecciona...</option>
                            {historia.nodos?.filter(n => !n.es_final).map((nodo) => (
                              <option key={nodo.id} value={nodo.id}>
                                {nodo.titulo || `Escena ${nodo.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small">Texto de la opción</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={nuevaOpcion.texto_opcion}
                            onChange={(e) => setNuevaOpcion({ ...nuevaOpcion, texto_opcion: e.target.value })}
                            placeholder="Ej: Ir al bosque"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small">Hacia la escena</label>
                          <select
                            className="form-select form-select-sm"
                            value={nuevaOpcion.nodo_destino_id}
                            onChange={(e) => setNuevaOpcion({ ...nuevaOpcion, nodo_destino_id: e.target.value })}
                            required
                          >
                            <option value="">Selecciona...</option>
                            {historia.nodos?.map((nodo) => (
                              <option key={nodo.id} value={nodo.id}>
                                {nodo.titulo || `Escena ${nodo.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-success btn-sm mt-3" disabled={loading}>
                        → Crear Conexión
                      </button>
                    </form>
                  </div>
                </div>

                {/* Lista de escenas */}
                <h6 className="text-muted small mb-3">Escenas Existentes</h6>
                <div className="row g-3">
                  {historia.nodos?.map((nodo) => (
                    <div key={nodo.id} className="col-12">
                      <div className="card border">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{nodo.titulo || 'Sin título'}</h6>
                            {nodo.es_final && <span className="badge bg-danger">Final</span>}
                          </div>
                          <p className="small text-muted mb-2">
                            {nodo.texto?.substring(0, 100)}...
                          </p>
                          
                          {/* Personajes en esta escena */}
                          {nodo.personajes && nodo.personajes.length > 0 && (
                            <div className="mb-2">
                              <small className="text-muted">Personajes en escena:</small>
                              <div className="d-flex flex-wrap gap-2 mt-1">
                                {nodo.personajes.map((p) => (
                                  <div key={p.id} className="badge bg-secondary d-flex align-items-center gap-1">
                                    {p.nombre} ({p.posicion})
                                    <button
                                      type="button"
                                      className="btn-close btn-close-white"
                                      style={{ fontSize: '0.6rem' }}
                                      onClick={() => handleRemoverPersonajeNodo(nodo.id, p.id)}
                                      aria-label="Remover"
                                    ></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Selector para agregar personajes */}
                          <div className="mt-2">
                            <small className="text-muted">Agregar personaje:</small>
                            <div className="row g-2 mt-1">
                              <div className="col-md-5">
                                <select
                                  className="form-select form-select-sm"
                                  id={`personaje-select-${nodo.id}`}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Seleccionar personaje...</option>
                                  {historia.personajes?.filter(p => 
                                    !nodo.personajes?.some(np => np.id === p.id)
                                  ).map((personaje) => (
                                    <option key={personaje.id} value={personaje.id}>
                                      {personaje.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <select
                                  className="form-select form-select-sm"
                                  id={`posicion-select-${nodo.id}`}
                                  defaultValue="centro"
                                >
                                  <option value="izquierda">Izquierda</option>
                                  <option value="centro">Centro</option>
                                  <option value="derecha">Derecha</option>
                                </select>
                              </div>
                              <div className="col-md-4">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary w-100"
                                  onClick={() => {
                                    const personajeId = document.getElementById(`personaje-select-${nodo.id}`).value;
                                    const posicion = document.getElementById(`posicion-select-${nodo.id}`).value;
                                    if (personajeId) {
                                      handleAsignarPersonajeNodo(nodo.id, parseInt(personajeId), posicion);
                                    }
                                  }}
                                >
                                  + Agregar
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {nodo.opciones?.length > 0 && (
                            <div className="small mt-2 pt-2 border-top">
                              <strong>Opciones:</strong>
                              {nodo.opciones.map((op) => (
                                <div key={op.id} className="text-primary">• {op.texto}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista: Personajes */}
            {vista === 'personajes' && (
              <div>
                <div className="mb-4">
                  <h5 className="mb-3">Personajes Existentes</h5>
                  <div className="row g-3">
                    {historia.personajes?.map((personaje) => (
                      <div key={personaje.id} className="col-md-4">
                        <div className="card border text-center">
                          <div className="card-body">
                            {personaje.imagen_url && (
                              <img 
                                src={personaje.imagen_url} 
                                alt={personaje.nombre}
                                className="rounded mb-2"
                                style={{ width: 100, height: 100, objectFit: 'cover' }}
                              />
                            )}
                            <h6 className="mb-0">{personaje.nombre}</h6>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Formulario para agregar nuevo personaje */}
                <div className="border-top pt-4">
                  <h5 className="mb-3">Agregar Nuevo Personaje</h5>
                  <form onSubmit={handleCrearPersonaje}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Nombre del Personaje *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={nuevoPersonaje.nombre}
                          onChange={(e) => setNuevoPersonaje({ ...nuevoPersonaje, nombre: e.target.value })}
                          required
                          placeholder="Ej: Luna"
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label">Imagen del Personaje *</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleImagenPersonaje}
                          required
                        />
                      </div>
                      
                      {nuevoPersonaje.imagenPreview && (
                        <div className="col-12">
                          <img 
                            src={nuevoPersonaje.imagenPreview} 
                            alt="Preview" 
                            className="rounded"
                            style={{ maxWidth: 150, maxHeight: 150, objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      
                      <div className="col-12">
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={loading}
                        >
                          {loading ? 'Agregando...' : '+ Agregar Personaje'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
