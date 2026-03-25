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
  const [portadaFile, setPortadaFile] = useState(null);
  const [portadaPreview, setPortadaPreview] = useState(null);
  const [asignacionPorNodo, setAsignacionPorNodo] = useState({});
  const [nodoEditandoId, setNodoEditandoId] = useState(null);
  const [edicionNodo, setEdicionNodo] = useState({
    titulo_nodo: '',
    texto: '',
    es_final: false,
    imagenFile: null,
    imagenPreview: null,
    audioFile: null,
    audioPreview: null,
  });
  const [nuevaOpcionEdicion, setNuevaOpcionEdicion] = useState({ texto: '', nodo_destino_id: '' });
  const [opcionesEditando, setOpcionesEditando] = useState({});
  
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

  useEffect(() => {
    if (!nodoEditandoId || !historia?.nodos) {
      return;
    }

    const nodoActual = historia.nodos.find((n) => n.id === nodoEditandoId);
    if (!nodoActual) {
      return;
    }

    const opcionesIniciales = {};
    (nodoActual.opciones || []).forEach((op) => {
      opcionesIniciales[op.id] = {
        texto: op.texto || '',
        nodo_destino_id: String(op.nodo_destino_id || ''),
      };
    });
    setOpcionesEditando(opcionesIniciales);
  }, [historia, nodoEditandoId]);

  useEffect(() => {
    if (!historia?.nodos?.length) {
      return;
    }

    setAsignacionPorNodo((prev) => {
      const next = { ...prev };
      let changed = false;

      historia.nodos.forEach((nodo) => {
        const seleccionActual = next[nodo.id]?.personajeId || '';
        if (!seleccionActual) {
          return;
        }

        const yaAsignado = (nodo.personajes || []).some(
          (p) => String(p.id) === String(seleccionActual)
        );

        if (yaAsignado) {
          next[nodo.id] = {
            personajeId: '',
            posicion: next[nodo.id]?.posicion || 'centro',
          };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [historia]);

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

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  async function subirImagen(file, tipo, descripcion) {
    const imagenBase64 = await readAsDataURL(file);
    const res = await fetch(`${API_BASE}/imagenes/subir/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        imagen: imagenBase64,
        tipo,
        descripcion,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al subir imagen');
    }

    const data = await res.json();
    return data.imagen.id;
  }

  async function handleGuardarInfoBasica(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        titulo: historia.titulo,
        descripcion: historia.descripcion || '',
      };

      if (portadaFile) {
        const portadaId = await subirImagen(portadaFile, 'portada', historia.titulo || 'Portada de historia');
        payload.portada_id = portadaId;
      }

      const res = await fetch(`${API_BASE}/historias/${id}/actualizar/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar información básica');
      }

      await cargarHistoria();
      setPortadaFile(null);
      setPortadaPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function subirAudio(file, descripcion) {
    const audioBase64 = await readAsDataURL(file);
    const res = await fetch(`${API_BASE}/audio/subir/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        audio: audioBase64,
        descripcion,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error al subir audio');
    }

    const data = await res.json();
    return data.audio.id;
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
      setAsignacionPorNodo((prev) => ({
        ...prev,
        [nodoId]: {
          personajeId: '',
          posicion: prev[nodoId]?.posicion || 'centro',
        },
      }));
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

  function handlePortadaHistoria(e) {
    const file = e.target.files[0];
    if (file) {
      setPortadaFile(file);
      setPortadaPreview(URL.createObjectURL(file));
    }
  }

  function actualizarAsignacionNodo(nodoId, cambios) {
    setAsignacionPorNodo((prev) => ({
      ...prev,
      [nodoId]: {
        personajeId: prev[nodoId]?.personajeId || '',
        posicion: prev[nodoId]?.posicion || 'centro',
        ...cambios,
      },
    }));
  }

  function iniciarEdicionNodo(nodo) {
    setError('');
    setNodoEditandoId(nodo.id);
    setEdicionNodo({
      titulo_nodo: nodo.titulo || '',
      texto: nodo.texto || '',
      es_final: !!nodo.es_final,
      imagenFile: null,
      imagenPreview: null,
      audioFile: null,
      audioPreview: null,
    });
    setNuevaOpcionEdicion({ texto: '', nodo_destino_id: '' });

    const opcionesIniciales = {};
    (nodo.opciones || []).forEach((op) => {
      opcionesIniciales[op.id] = {
        texto: op.texto || '',
        nodo_destino_id: String(op.nodo_destino_id || ''),
      };
    });
    setOpcionesEditando(opcionesIniciales);
  }

  function cancelarEdicionNodo() {
    setNodoEditandoId(null);
    setEdicionNodo({
      titulo_nodo: '',
      texto: '',
      es_final: false,
      imagenFile: null,
      imagenPreview: null,
      audioFile: null,
      audioPreview: null,
    });
    setNuevaOpcionEdicion({ texto: '', nodo_destino_id: '' });
    setOpcionesEditando({});
  }

  function handleImagenEdicionNodo(e) {
    const file = e.target.files[0];
    if (file) {
      setEdicionNodo((prev) => ({
        ...prev,
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file),
      }));
    }
  }

  function handleAudioEdicionNodo(e) {
    const file = e.target.files[0];
    if (file) {
      setEdicionNodo((prev) => ({
        ...prev,
        audioFile: file,
        audioPreview: URL.createObjectURL(file),
      }));
    }
  }

  async function handleGuardarEdicionNodo(nodoId) {
    setLoading(true);
    setError('');

    try {
      const payload = {
        titulo_nodo: edicionNodo.titulo_nodo,
        texto: edicionNodo.texto,
        es_final: edicionNodo.es_final,
      };

      if (edicionNodo.imagenFile) {
        const imagenId = await subirImagen(edicionNodo.imagenFile, 'escenario', edicionNodo.titulo_nodo || 'Escena');
        payload.imagen_escenario_id = imagenId;
      }

      if (edicionNodo.audioFile) {
        const audioId = await subirAudio(edicionNodo.audioFile, `Audio de fondo - ${edicionNodo.titulo_nodo || 'Escena'}`);
        payload.audio_fondo_id = audioId;
      }

      const res = await fetch(`${API_BASE}/nodos/${nodoId}/actualizar/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al actualizar escena');
      }

      await cargarHistoria();
      cancelarEdicionNodo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarNodo(nodoId) {
    if (!confirm('¿Seguro que deseas eliminar esta escena? Se eliminarán también sus conexiones.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/nodos/${nodoId}/eliminar/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al eliminar escena');
      }

      if (nodoEditandoId === nodoId) {
        cancelarEdicionNodo();
      }
      await cargarHistoria();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarOpcion(opcionId) {
    if (!confirm('¿Seguro que deseas eliminar esta opción?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/opciones/${opcionId}/eliminar/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al eliminar opción');
      }

      await cargarHistoria();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearOpcionDesdeNodo(nodoId) {
    setLoading(true);
    setError('');

    try {
      const texto = (nuevaOpcionEdicion.texto || '').trim();
      const nodoDestinoId = nuevaOpcionEdicion.nodo_destino_id;
      if (!texto || !nodoDestinoId) {
        throw new Error('Debes completar texto y escena destino para crear la opción');
      }

      const res = await fetch(`${API_BASE}/opciones/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          texto_opcion: texto,
          nodo_origen_id: nodoId,
          nodo_destino_id: parseInt(nodoDestinoId, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al crear opción');
      }

      await cargarHistoria();
      setNuevaOpcionEdicion({ texto: '', nodo_destino_id: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardarOpcion(opcionId) {
    setLoading(true);
    setError('');

    try {
      const opcion = opcionesEditando[opcionId];
      if (!opcion) {
        throw new Error('No se encontró la opción a editar');
      }

      const texto = (opcion.texto || '').trim();
      const nodoDestinoId = opcion.nodo_destino_id;
      if (!texto || !nodoDestinoId) {
        throw new Error('Debes completar texto y destino de la opción');
      }

      const res = await fetch(`${API_BASE}/opciones/${opcionId}/actualizar/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          texto_opcion: texto,
          nodo_destino_id: parseInt(nodoDestinoId, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al actualizar opción');
      }

      await cargarHistoria();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function actualizarOpcionEditando(opcionId, cambios) {
    setOpcionesEditando((prev) => ({
      ...prev,
      [opcionId]: {
        texto: prev[opcionId]?.texto || '',
        nodo_destino_id: prev[opcionId]?.nodo_destino_id || '',
        ...cambios,
      },
    }));
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
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title">Información básica</h6>
                    <form onSubmit={handleGuardarInfoBasica}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small">Título</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={historia.titulo || ''}
                            onChange={(e) => setHistoria({ ...historia, titulo: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small">Portada</label>
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            accept="image/*"
                            onChange={handlePortadaHistoria}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small">Descripción</label>
                          <textarea
                            className="form-control form-control-sm"
                            rows="3"
                            value={historia.descripcion || ''}
                            onChange={(e) => setHistoria({ ...historia, descripcion: e.target.value })}
                          />
                        </div>
                        {(portadaPreview || historia.portada_url) && (
                          <div className="col-12">
                            <img
                              src={portadaPreview || historia.portada_url}
                              alt="Portada"
                              className="rounded"
                              style={{ width: 220, height: 140, objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={loading}>
                        Guardar cambios
                      </button>
                    </form>
                  </div>
                </div>

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
                            <div className="d-flex align-items-center gap-2">
                              {nodo.es_final && <span className="badge bg-danger">Final</span>}
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => iniciarEdicionNodo(nodo)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleEliminarNodo(nodo.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {nodoEditandoId === nodo.id ? (
                            <div className="border rounded p-3 mb-3 bg-light">
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <label className="form-label small">Título</label>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={edicionNodo.titulo_nodo}
                                    onChange={(e) => setEdicionNodo({ ...edicionNodo, titulo_nodo: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label small">Reemplazar fondo (opcional)</label>
                                  <input
                                    type="file"
                                    className="form-control form-control-sm"
                                    accept="image/*"
                                    onChange={handleImagenEdicionNodo}
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label small">Texto</label>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows="3"
                                    value={edicionNodo.texto}
                                    onChange={(e) => setEdicionNodo({ ...edicionNodo, texto: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label small">Reemplazar audio (opcional)</label>
                                  <input
                                    type="file"
                                    className="form-control form-control-sm"
                                    accept="audio/*"
                                    onChange={handleAudioEdicionNodo}
                                  />
                                </div>
                                <div className="col-md-6 d-flex align-items-end">
                                  <div className="form-check mb-2">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`editar-es-final-${nodo.id}`}
                                      checked={edicionNodo.es_final}
                                      onChange={(e) => setEdicionNodo({ ...edicionNodo, es_final: e.target.checked })}
                                    />
                                    <label className="form-check-label small" htmlFor={`editar-es-final-${nodo.id}`}>
                                      Escena final
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-2 mt-3">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleGuardarEdicionNodo(nodo.id)}
                                  disabled={loading}
                                >
                                  Guardar escena
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={cancelarEdicionNodo}
                                >
                                  Cancelar
                                </button>
                              </div>

                              <div className="border-top mt-3 pt-3">
                                <h6 className="small mb-2">Opciones de esta escena</h6>

                                <div className="border rounded p-2 mb-3 bg-white">
                                  <div className="row g-2">
                                    <div className="col-md-6">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Texto de nueva opción"
                                        value={nuevaOpcionEdicion.texto}
                                        onChange={(e) => setNuevaOpcionEdicion({ ...nuevaOpcionEdicion, texto: e.target.value })}
                                      />
                                    </div>
                                    <div className="col-md-4">
                                      <select
                                        className="form-select form-select-sm"
                                        value={nuevaOpcionEdicion.nodo_destino_id}
                                        onChange={(e) => setNuevaOpcionEdicion({ ...nuevaOpcionEdicion, nodo_destino_id: e.target.value })}
                                      >
                                        <option value="">Escena destino...</option>
                                        {historia.nodos?.map((destino) => (
                                          <option key={destino.id} value={destino.id}>
                                            {destino.titulo || `Escena ${destino.id}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-md-2">
                                      <button
                                        type="button"
                                        className="btn btn-success btn-sm w-100"
                                        onClick={() => handleCrearOpcionDesdeNodo(nodo.id)}
                                        disabled={loading}
                                      >
                                        Agregar
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {nodo.opciones?.length > 0 ? (
                                  <div className="d-flex flex-column gap-2">
                                    {nodo.opciones.map((op) => (
                                      <div key={op.id} className="border rounded p-2 bg-white">
                                        <div className="row g-2">
                                          <div className="col-md-5">
                                            <input
                                              type="text"
                                              className="form-control form-control-sm"
                                              value={opcionesEditando[op.id]?.texto || ''}
                                              onChange={(e) => actualizarOpcionEditando(op.id, { texto: e.target.value })}
                                            />
                                          </div>
                                          <div className="col-md-4">
                                            <select
                                              className="form-select form-select-sm"
                                              value={opcionesEditando[op.id]?.nodo_destino_id || ''}
                                              onChange={(e) => actualizarOpcionEditando(op.id, { nodo_destino_id: e.target.value })}
                                            >
                                              <option value="">Escena destino...</option>
                                              {historia.nodos?.map((destino) => (
                                                <option key={destino.id} value={destino.id}>
                                                  {destino.titulo || `Escena ${destino.id}`}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="col-md-3 d-flex gap-2">
                                            <button
                                              type="button"
                                              className="btn btn-primary btn-sm w-100"
                                              onClick={() => handleGuardarOpcion(op.id)}
                                              disabled={loading}
                                            >
                                              Guardar
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-outline-danger btn-sm w-100"
                                              onClick={() => handleEliminarOpcion(op.id)}
                                              disabled={loading}
                                            >
                                              Quitar
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <small className="text-muted">Esta escena aún no tiene opciones.</small>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="small text-muted mb-2">
                              {nodo.texto?.substring(0, 100) || ''}...
                            </p>
                          )}
                          
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
                                  value={asignacionPorNodo[nodo.id]?.personajeId || ''}
                                  onChange={(e) => actualizarAsignacionNodo(nodo.id, { personajeId: e.target.value })}
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
                                  value={asignacionPorNodo[nodo.id]?.posicion || 'centro'}
                                  onChange={(e) => actualizarAsignacionNodo(nodo.id, { posicion: e.target.value })}
                                >
                                  <option value="izquierda">Izquierda</option>
                                  <option value="centro">Centro</option>
                                  <option value="derecha">Derecha</option>
                                </select>
                              </div>
                              <div className="col-md-4">
                                {(() => {
                                  const personajeId = asignacionPorNodo[nodo.id]?.personajeId;
                                  const posicion = asignacionPorNodo[nodo.id]?.posicion || 'centro';
                                  const tieneSeleccion = Boolean(personajeId);
                                  return (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary w-100"
                                  disabled={!tieneSeleccion}
                                  onClick={() => {
                                    if (personajeId) {
                                      handleAsignarPersonajeNodo(nodo.id, parseInt(personajeId, 10), posicion);
                                    }
                                  }}
                                >
                                  + Agregar
                                </button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          {nodo.opciones?.length > 0 && (
                            <div className="small mt-2 pt-2 border-top">
                              <strong>Opciones:</strong>
                              {nodo.opciones.map((op) => (
                                <div key={op.id} className="d-flex justify-content-between align-items-center gap-2">
                                  <span className="text-primary">• {op.texto}</span>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleEliminarOpcion(op.id)}
                                  >
                                    Quitar
                                  </button>
                                </div>
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
