import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

export default function StoryPlayer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historia, setHistoria] = useState(null);
  const [nodoActual, setNodoActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    cargarHistoria();
  }, [id]);

  // Reproducir audio cuando cambia el nodo
  useEffect(() => {
    if (audioRef.current && nodoActual?.audio_fondo_url) {
      audioRef.current.src = nodoActual.audio_fondo_url;
      audioRef.current.play().catch(err => {
        console.log('No se pudo reproducir el audio:', err);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [nodoActual]);

  async function cargarHistoria() {
    try {
      const res = await fetch(`${API_BASE}/historias/${id}/`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Error al cargar historia');
      }
      
      const data = await res.json();
      setHistoria(data.historia);
      
      // Buscar el nodo de inicio
      const nodoInicio = data.historia.nodos.find(
        n => n.id === data.historia.nodo_inicio_id
      ) || data.historia.nodos[0];
      
      if (nodoInicio) {
        setNodoActual(nodoInicio);
        setHistorial([nodoInicio.id]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSeleccionarOpcion(nodoDestinoId) {
    const nodoDestino = historia.nodos.find(n => n.id === nodoDestinoId);
    if (nodoDestino) {
      setNodoActual(nodoDestino);
      setHistorial([...historial, nodoDestino.id]);
    }
  }

  function handleReiniciar() {
    const nodoInicio = historia.nodos.find(
      n => n.id === historia.nodo_inicio_id
    ) || historia.nodos[0];
    
    if (nodoInicio) {
      setNodoActual(nodoInicio);
      setHistorial([nodoInicio.id]);
    }
  }

  function handleRetroceder() {
    if (historial.length > 1) {
      const nuevoHistorial = historial.slice(0, -1);
      const nodoAnteriorId = nuevoHistorial[nuevoHistorial.length - 1];
      const nodoAnterior = historia.nodos.find(n => n.id === nodoAnteriorId);
      
      if (nodoAnterior) {
        setNodoActual(nodoAnterior);
        setHistorial(nuevoHistorial);
      }
    }
  }

  const personajesPorPosicion = (nodoActual?.personajes || []).reduce(
    (acc, personaje) => {
      const posicion = (personaje.posicion || 'centro').toLowerCase().trim();
      if (posicion === 'izquierda') {
        acc.izquierda.push(personaje);
      } else if (posicion === 'derecha') {
        acc.derecha.push(personaje);
      } else {
        acc.centro.push(personaje);
      }
      return acc;
    },
    { izquierda: [], centro: [], derecha: [] }
  );

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error || !historia || !nodoActual) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <h5>{error || 'No se pudo cargar la historia'}</h5>
          <Link to="/" className="btn btn-light mt-3">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-vh-100 d-flex flex-column position-relative"
      style={{
        backgroundImage: nodoActual.imagen_escenario_url 
          ? `url(${nodoActual.imagen_escenario_url})` 
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Audio de fondo (oculto) */}
      <audio ref={audioRef} loop />
      
      {/* Overlay oscuro para legibilidad */}
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark" style={{ opacity: 0.4, zIndex: 0 }}></div>
      
      {/* Header */}
      <nav className="navbar navbar-dark position-relative" style={{ zIndex: 2, backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">← Volver al catálogo</Link>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-light"
              onClick={handleRetroceder}
              disabled={historial.length <= 1}
            >
              ← Atrás
            </button>
            <button 
              className="btn btn-sm btn-outline-light"
              onClick={handleReiniciar}
            >
              ↻ Reiniciar
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="flex-grow-1 d-flex align-items-end position-relative" style={{ zIndex: 1 }}>
        <div className="container pb-5">
          {/* Personajes en escena */}
          {nodoActual.personajes && nodoActual.personajes.length > 0 && (
            <div 
              className="d-flex align-items-end mb-4"
              style={{ height: 300 }}
            >
              <div className="text-center" style={{ flex: 1 }}>
                {personajesPorPosicion.izquierda.map((personaje) => (
                  <img
                    key={personaje.id}
                    src={personaje.imagen_url}
                    alt={personaje.nombre}
                    className="mx-1"
                    style={{
                      maxHeight: 280,
                      maxWidth: '45%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                    }}
                  />
                ))}
              </div>

              <div className="text-center" style={{ flex: 1 }}>
                {personajesPorPosicion.centro.map((personaje) => (
                  <img
                    key={personaje.id}
                    src={personaje.imagen_url}
                    alt={personaje.nombre}
                    className="mx-1"
                    style={{
                      maxHeight: 280,
                      maxWidth: '45%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                    }}
                  />
                ))}
              </div>

              <div className="text-center" style={{ flex: 1 }}>
                {personajesPorPosicion.derecha.map((personaje) => (
                  <img
                    key={personaje.id}
                    src={personaje.imagen_url}
                    alt={personaje.nombre}
                    className="mx-1"
                    style={{
                      maxHeight: 280,
                      maxWidth: '45%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Caja de texto/diálogo */}
          <div 
            className="card border-0 shadow-lg"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              maxWidth: 800,
              margin: '0 auto'
            }}
          >
            <div className="card-body p-4">
              {/* Título de la escena */}
              {nodoActual.titulo && (
                <h5 className="card-title text-primary mb-3">
                  {nodoActual.titulo}
                </h5>
              )}
              
              {/* Texto narrativo */}
              <p className="card-text mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                {nodoActual.texto}
              </p>

              {/* Opciones */}
              {nodoActual.es_final ? (
                <div className="text-center">
                  <div className="alert alert-success mb-3">
                    <strong>🎭 FIN</strong>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={handleReiniciar}
                  >
                    Volver al Inicio
                  </button>
                </div>
              ) : nodoActual.opciones?.length > 0 ? (
                <div className="d-grid gap-2">
                  {nodoActual.opciones.map((opcion) => (
                    <button
                      key={opcion.id}
                      className="btn btn-outline-primary btn-lg text-start"
                      onClick={() => handleSeleccionarOpcion(opcion.nodo_destino_id)}
                    >
                      → {opcion.texto}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="alert alert-warning">
                  <small>
                    Esta escena no tiene opciones configuradas. 
                    <Link to={`/historias/${id}/editar`} className="alert-link ms-2">
                      Editar historia
                    </Link>
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de progreso */}
          <div className="text-center mt-3">
            <small className="text-white bg-dark px-3 py-1 rounded" style={{ opacity: 0.8 }}>
              Escena {historial.length} · {historia.titulo}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
