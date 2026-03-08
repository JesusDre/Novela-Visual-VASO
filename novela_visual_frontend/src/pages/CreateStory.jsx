import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export default function CreateStory() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos de la historia
  const [historia, setHistoria] = useState({ titulo: '', descripcion: '' });
  const [historiaId, setHistoriaId] = useState(null);
  
  // Datos del primer nodo
  const [nodo, setNodo] = useState({ 
    titulo_nodo: '', 
    texto: '', 
    imagenFile: null,
    imagenPreview: null,
    imagen_escenario_id: null
  });
  
  // Datos de personajes
  const [personajes, setPersonajes] = useState([]);
  const [nuevoPersonaje, setNuevoPersonaje] = useState({
    nombre: '',
    imagenFile: null,
    imagenPreview: null
  });

  // Paso 1: Crear historia básica
  async function handleCrearHistoria(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/historias/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(historia)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear historia');
      }
      
      const data = await res.json();
      setHistoriaId(data.historia.id);
      setPaso(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Paso 2: Crear primera escena con imagen
  async function handleCrearPrimeraEscena(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Subir imagen si hay
      let imagenId = null;
      if (nodo.imagenFile) {
        const reader = new FileReader();
        reader.readAsDataURL(nodo.imagenFile);
        await new Promise((resolve) => {
          reader.onload = async () => {
            const res = await fetch(`${API_BASE}/imagenes/subir/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                imagen: reader.result,
                tipo: 'escenario',
                descripcion: nodo.titulo_nodo
              })
            });
            
            if (!res.ok) throw new Error('Error al subir imagen');
            const data = await res.json();
            imagenId = data.imagen.id;
            resolve();
          };
        });
      }
      
      // 2. Crear nodo
      const res = await fetch(`${API_BASE}/nodos/crear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historia_id: historiaId,
          titulo_nodo: nodo.titulo_nodo,
          texto: nodo.texto,
          es_final: false,
          imagen_escenario_id: imagenId
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear escena');
      }
      
      setPaso(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Paso 3: Agregar personajes
  async function handleAgregarPersonaje(e) {
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
          historia_id: historiaId,
          nombre: nuevoPersonaje.nombre,
          imagen_id: imagenId
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear personaje');
      }
      
      const data = await res.json();
      setPersonajes([...personajes, { ...data.personaje, imagen: nuevoPersonaje.imagenPreview }]);
      setNuevoPersonaje({ nombre: '', imagenFile: null, imagenPreview: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleImagenEscenario(e) {
    const file = e.target.files[0];
    if (file) {
      setNodo({
        ...nodo,
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file)
      });
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

  function handleFinalizar() {
    navigate('/mis-historias');
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-3">
        <Link to="/mis-historias" className="navbar-brand fw-bold">← Volver</Link>
      </nav>

      <main className="container py-4" style={{ maxWidth: 700 }}>
        <h1 className="h3 fw-bold mb-4">Crear Nueva Historia</h1>

        {/* Progress bar */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-2">
            <div className="d-flex align-items-center justify-content-between position-relative">
              <div className="position-absolute top-50 start-0 end-0 translate-middle-y" style={{ height: 2, backgroundColor: '#dee2e6', zIndex: 0 }}></div>
              
              <div className="d-flex align-items-center gap-3 w-100 position-relative" style={{ zIndex: 1 }}>
                <div className="text-center flex-grow-1">
                  <div className={`rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center ${paso >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                    1
                  </div>
                  <small className={paso >= 1 ? 'fw-semibold' : 'text-muted'}>Info Básica</small>
                </div>
                
                <div className="text-center flex-grow-1">
                  <div className={`rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center ${paso >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                    2
                  </div>
                  <small className={paso >= 2 ? 'fw-semibold' : 'text-muted'}>Primera Escena</small>
                </div>
                
                <div className="text-center flex-grow-1">
                  <div className={`rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center ${paso >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 40, height: 40 }}>
                    3
                  </div>
                  <small className={paso >= 3 ? 'fw-semibold' : 'text-muted'}>Personajes</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {/* Paso 1: Información básica */}
        {paso === 1 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Información Básica</h5>
              <form onSubmit={handleCrearHistoria}>
                <div className="mb-3">
                  <label className="form-label">Título de la Historia *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={historia.titulo}
                    onChange={(e) => setHistoria({ ...historia, titulo: e.target.value })}
                    required
                    placeholder="Ej: La Aventura del Héroe"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={historia.descripcion}
                    onChange={(e) => setHistoria({ ...historia, descripcion: e.target.value })}
                    placeholder="Describe de qué trata tu historia..."
                  />
                </div>
                
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Creando...' : 'Siguiente →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Paso 2: Primera escena */}
        {paso === 2 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Primera Escena</h5>
              <p className="text-muted small mb-3">
                Crea la escena inicial de tu historia. Esta será el punto de partida para los lectores.
              </p>
              
              <form onSubmit={handleCrearPrimeraEscena}>
                <div className="mb-3">
                  <label className="form-label">Título de la Escena *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nodo.titulo_nodo}
                    onChange={(e) => setNodo({ ...nodo, titulo_nodo: e.target.value })}
                    required
                    placeholder="Ej: El Despertar"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Texto de la Escena *</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={nodo.texto}
                    onChange={(e) => setNodo({ ...nodo, texto: e.target.value })}
                    required
                    placeholder="Describe lo que sucede en esta escena..."
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Imagen de Fondo (Escenario)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImagenEscenario}
                  />
                  {nodo.imagenPreview && (
                    <img 
                      src={nodo.imagenPreview} 
                      alt="Preview" 
                      className="mt-2 rounded"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }}
                    />
                  )}
                </div>
                
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setPaso(1)}
                  >
                    ← Anterior
                  </button>
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                    {loading ? 'Creando...' : 'Siguiente →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Paso 3: Personajes */}
        {paso === 3 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Personajes</h5>
              <p className="text-muted small mb-3">
                Agrega los personajes que aparecerán en tu historia. Puedes agregar más personajes después.
              </p>
              
              {/* Lista de personajes agregados */}
              {personajes.length > 0 && (
                <div className="mb-4">
                  <h6 className="small text-muted mb-2">Personajes agregados:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {personajes.map((p, idx) => (
                      <div key={idx} className="border rounded p-2 d-flex align-items-center gap-2">
                        {p.imagen && (
                          <img 
                            src={p.imagen} 
                            alt={p.nombre}
                            className="rounded"
                            style={{ width: 40, height: 40, objectFit: 'cover' }}
                          />
                        )}
                        <span className="small">{p.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Formulario para agregar personaje */}
              <form onSubmit={handleAgregarPersonaje}>
                <div className="mb-3">
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
                
                <div className="mb-3">
                  <label className="form-label">Imagen del Personaje *</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImagenPersonaje}
                    required
                  />
                  {nuevoPersonaje.imagenPreview && (
                    <img 
                      src={nuevoPersonaje.imagenPreview} 
                      alt="Preview" 
                      className="mt-2 rounded"
                      style={{ maxWidth: 150, maxHeight: 150, objectFit: 'cover' }}
                    />
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-outline-primary w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? 'Agregando...' : '+ Agregar Personaje'}
                </button>
              </form>
              
              <div className="border-top pt-3 mt-3">
                <div className="d-flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setPaso(2)}
                  >
                    ← Anterior
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success flex-grow-1"
                    onClick={handleFinalizar}
                  >
                    ✓ Finalizar
                  </button>
                </div>
                <small className="text-muted d-block mt-2">
                  Puedes agregar más escenas y opciones desde el editor
                </small>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
