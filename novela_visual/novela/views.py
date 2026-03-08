from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Usuario, Rol, Historia, Nodo, Personaje, Imagen, Audio, Opcion, NodoPersonaje
import hashlib
import json
import os
import base64
import uuid


def _require_admin(request):
    """Verifica que el usuario en sesión sea Administrador. Retorna None si ok, o JsonResponse de error."""
    if 'usuario_id' not in request.session:
        return JsonResponse({'error': 'No autenticado'}, status=401)
    if request.session.get('usuario_rol') != 'Administrador':
        return JsonResponse({'error': 'Permisos insuficientes'}, status=403)
    return None


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """API endpoint para login de usuarios"""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    correo = data.get('correo', '').strip()
    contrasena = data.get('contrasena', '')

    if not correo or not contrasena:
        return JsonResponse({'error': 'Correo y contraseña son requeridos'}, status=400)

    try:
        usuario = Usuario.objects.get(correo=correo, activo=True)
        contrasena_hash = hashlib.sha256(contrasena.encode()).hexdigest()

        if usuario.contrasena == contrasena_hash or usuario.contrasena == contrasena:
            request.session['usuario_id'] = usuario.id_usuario
            request.session['usuario_nombre'] = usuario.nombre
            request.session['usuario_correo'] = usuario.correo
            request.session['usuario_rol'] = usuario.rol.nombre_rol

            return JsonResponse({
                'mensaje': f'¡Bienvenido {usuario.nombre}!',
                'usuario': {
                    'id': usuario.id_usuario,
                    'nombre': usuario.nombre,
                    'correo': usuario.correo,
                    'rol': usuario.rol.nombre_rol,
                }
            })
        else:
            return JsonResponse({'error': 'Correo o contraseña incorrectos'}, status=401)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Correo o contraseña incorrectos'}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """API endpoint para cerrar sesión"""
    request.session.flush()
    return JsonResponse({'mensaje': 'Sesión cerrada exitosamente'})


@require_http_methods(["GET"])
def me_view(request):
    """API endpoint para obtener datos del usuario autenticado"""
    if 'usuario_id' not in request.session:
        return JsonResponse({'error': 'No autenticado'}, status=401)

    return JsonResponse({
        'usuario': {
            'id': request.session.get('usuario_id'),
            'nombre': request.session.get('usuario_nombre'),
            'correo': request.session.get('usuario_correo'),
            'rol': request.session.get('usuario_rol'),
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def registro_view(request):
    """API endpoint para registro de nuevos usuarios"""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    nombre = data.get('nombre', '').strip()
    apellido_paterno = data.get('apellido_paterno', '').strip()
    apellido_materno = data.get('apellido_materno', '').strip()
    correo = data.get('correo', '').strip()
    contrasena = data.get('contrasena', '')

    if not nombre or not correo or not contrasena:
        return JsonResponse({'error': 'Nombre, correo y contraseña son requeridos'}, status=400)

    if len(contrasena) < 6:
        return JsonResponse({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)

    if Usuario.objects.filter(correo=correo).exists():
        return JsonResponse({'error': 'El correo ya está registrado'}, status=409)

    contrasena_hash = hashlib.sha256(contrasena.encode()).hexdigest()

    rol_usuario, _ = Rol.objects.get_or_create(
        nombre_rol='Usuario',
        defaults={'nombre_rol': 'Usuario'}
    )

    Usuario.objects.create(
        nombre=nombre,
        apellido_paterno=apellido_paterno,
        apellido_materno=apellido_materno,
        correo=correo,
        contrasena=contrasena_hash,
        fecha_registro=timezone.now(),
        activo=True,
        rol=rol_usuario
    )

    return JsonResponse({'mensaje': 'Cuenta creada exitosamente'}, status=201)


# ── Endpoints públicos ──

@require_http_methods(["GET"])
def historias_publicadas_view(request):
    """Historias publicadas — acceso público, no requiere login."""
    historias = Historia.objects.filter(publicada=True).select_related('creador')
    data = [
        {
            'id': h.id_historia,
            'titulo': h.titulo,
            'descripcion': h.descripcion or '',
            'fecha_creacion': h.fecha_creacion.isoformat() if h.fecha_creacion else None,
            'creador': h.creador.nombre,
        }
        for h in historias
    ]
    return JsonResponse({'historias': data})


# ── Endpoints de administración ──

@require_http_methods(["GET"])
def usuarios_list_view(request):
    """Lista todos los usuarios (solo admin)."""
    err = _require_admin(request)
    if err:
        return err
    usuarios = Usuario.objects.select_related('rol').all()
    data = [
        {
            'id': u.id_usuario,
            'nombre': u.nombre,
            'correo': u.correo,
            'rol': u.rol.nombre_rol,
            'activo': u.activo,
            'fecha_registro': u.fecha_registro.isoformat() if u.fecha_registro else None,
        }
        for u in usuarios
    ]
    return JsonResponse({'usuarios': data})


@csrf_exempt
@require_http_methods(["PATCH"])
def usuario_toggle_view(request, id_usuario):
    """Activa/desactiva un usuario (solo admin)."""
    err = _require_admin(request)
    if err:
        return err
    try:
        usuario = Usuario.objects.get(id_usuario=id_usuario)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    usuario.activo = not usuario.activo
    usuario.save(update_fields=['activo'])
    return JsonResponse({
        'mensaje': f'Usuario {"activado" if usuario.activo else "desactivado"}',
        'activo': usuario.activo,
    })


@require_http_methods(["GET"])
def historias_list_view(request):
    """Lista todas las historias (solo admin)."""
    err = _require_admin(request)
    if err:
        return err
    historias = Historia.objects.select_related('creador').all()
    data = [
        {
            'id': h.id_historia,
            'titulo': h.titulo,
            'descripcion': h.descripcion or '',
            'publicada': h.publicada,
            'fecha_creacion': h.fecha_creacion.isoformat() if h.fecha_creacion else None,
            'creador': h.creador.nombre,
        }
        for h in historias
    ]
    return JsonResponse({'historias': data})


@csrf_exempt
@require_http_methods(["PATCH"])
def historia_toggle_view(request, id_historia):
    """Publica/despublica una historia (solo admin)."""
    err = _require_admin(request)
    if err:
        return err
    try:
        historia = Historia.objects.get(id_historia=id_historia)
    except Historia.DoesNotExist:
        return JsonResponse({'error': 'Historia no encontrada'}, status=404)

    historia.publicada = not historia.publicada
    historia.save(update_fields=['publicada'])
    return JsonResponse({
        'mensaje': f'Historia {"publicada" if historia.publicada else "despublicada"}',
        'publicada': historia.publicada,
    })


# ── Endpoints para creación de historias ──

def _require_auth(request):
    """Verifica que haya un usuario autenticado."""
    if 'usuario_id' not in request.session:
        return JsonResponse({'error': 'No autenticado'}, status=401)
    return None


@require_http_methods(["GET"])
def mis_historias_view(request):
    """Obtiene las historias del usuario autenticado."""
    err = _require_auth(request)
    if err:
        return err
    
    usuario_id = request.session.get('usuario_id')
    historias = Historia.objects.filter(creador_id=usuario_id).select_related('creador').prefetch_related('nodos')
    
    data = []
    for h in historias:
        nodos_count = h.nodos.count()
        data.append({
            'id': h.id_historia,
            'titulo': h.titulo,
            'descripcion': h.descripcion or '',
            'fecha_creacion': h.fecha_creacion.isoformat() if h.fecha_creacion else None,
            'publicada': h.publicada,
            'nodos_count': nodos_count,
            'tiene_nodo_inicio': h.nodo_inicio_id is not None,
        })
    return JsonResponse({'historias': data})


@csrf_exempt
@require_http_methods(["POST"])
def crear_historia_view(request):
    """Crea una nueva historia (solo información básica)."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    titulo = data.get('titulo', '').strip()
    descripcion = data.get('descripcion', '').strip()
    
    if not titulo:
        return JsonResponse({'error': 'El título es requerido'}, status=400)
    
    usuario_id = request.session.get('usuario_id')
    usuario = Usuario.objects.get(id_usuario=usuario_id)
    
    historia = Historia.objects.create(
        titulo=titulo,
        descripcion=descripcion,
        fecha_creacion=timezone.now(),
        publicada=False,
        creador=usuario
    )
    
    return JsonResponse({
        'mensaje': 'Historia creada exitosamente',
        'historia': {
            'id': historia.id_historia,
            'titulo': historia.titulo,
            'descripcion': historia.descripcion,
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def subir_imagen_view(request):
    """Sube una imagen y retorna su URL."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    imagen_base64 = data.get('imagen')
    tipo = data.get('tipo', 'escenario')  # escenario, personaje, etc.
    descripcion = data.get('descripcion', '')
    
    if not imagen_base64:
        return JsonResponse({'error': 'Imagen requerida'}, status=400)
    
    try:
        # Decodificar base64
        if ',' in imagen_base64:
            header, imagen_base64 = imagen_base64.split(',', 1)
        
        imagen_data = base64.b64decode(imagen_base64)
        
        # Determinar carpeta según tipo
        if tipo == 'personaje':
            carpeta = 'personajes'
        elif tipo == 'escenario':
            carpeta = 'escenarios'
        else:
            carpeta = 'imagenes'
        
        # Generar nombre único
        extension = 'png'  # Puedes extraer del header si lo necesitas
        filename = f"{uuid.uuid4()}.{extension}"
        filepath = os.path.join(carpeta, filename)
        
        # Guardar archivo
        path = default_storage.save(filepath, ContentFile(imagen_data))
        url = default_storage.url(path)
        
        # Construir URL absoluta para desarrollo
        if not url.startswith('http'):
            url = f"http://localhost:8000{url}"
        
        # Crear registro en BD
        imagen = Imagen.objects.create(
            url=url,
            tipo=tipo,
            descripcion=descripcion
        )
        
        return JsonResponse({
            'mensaje': 'Imagen subida exitosamente',
            'imagen': {
                'id': imagen.id_imagen,
                'url': imagen.url,
                'tipo': imagen.tipo,
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Error al subir imagen: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def subir_audio_view(request):
    """Sube un archivo de audio y retorna su URL."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    audio_base64 = data.get('audio')
    descripcion = data.get('descripcion', '')
    
    if not audio_base64:
        return JsonResponse({'error': 'Audio requerido'}, status=400)
    
    try:
        # Decodificar base64
        if ',' in audio_base64:
            header, audio_base64 = audio_base64.split(',', 1)
            # Extraer extensión del header si es posible
            if 'mp3' in header:
                extension = 'mp3'
            elif 'wav' in header:
                extension = 'wav'
            elif 'ogg' in header:
                extension = 'ogg'
            else:
                extension = 'mp3'
        else:
            extension = 'mp3'
        
        audio_data = base64.b64decode(audio_base64)
        
        # Generar nombre único
        filename = f"{uuid.uuid4()}.{extension}"
        filepath = os.path.join('audio', filename)
        
        # Guardar archivo
        path = default_storage.save(filepath, ContentFile(audio_data))
        url = default_storage.url(path)
        
        # Construir URL absoluta para desarrollo
        if not url.startswith('http'):
            url = f"http://localhost:8000{url}"
        
        # Crear registro en BD
        audio = Audio.objects.create(
            url=url,
            descripcion=descripcion
        )
        
        return JsonResponse({
            'mensaje': 'Audio subido exitosamente',
            'audio': {
                'id': audio.id_audio,
                'url': audio.url,
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Error al subir audio: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def crear_nodo_view(request):
    """Crea un nuevo nodo (escena) en una historia."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    historia_id = data.get('historia_id')
    titulo_nodo = data.get('titulo_nodo', '').strip()
    texto = data.get('texto', '').strip()
    es_final = data.get('es_final', False)
    imagen_escenario_id = data.get('imagen_escenario_id')
    audio_fondo_id = data.get('audio_fondo_id')
    
    if not historia_id:
        return JsonResponse({'error': 'ID de historia requerido'}, status=400)
    
    # Verificar que la historia pertenece al usuario
    usuario_id = request.session.get('usuario_id')
    try:
        historia = Historia.objects.get(id_historia=historia_id, creador_id=usuario_id)
    except Historia.DoesNotExist:
        return JsonResponse({'error': 'Historia no encontrada'}, status=404)
    
    # Crear nodo
    nodo = Nodo.objects.create(
        titulo_nodo=titulo_nodo,
        texto=texto,
        es_final=es_final,
        historia=historia,
        imagen_escenario_id=imagen_escenario_id if imagen_escenario_id else None,
        audio_fondo_id=audio_fondo_id if audio_fondo_id else None
    )
    
    # Si es el primer nodo, establecerlo como nodo de inicio
    if historia.nodos.count() == 1:
        historia.nodo_inicio = nodo
        historia.save(update_fields=['nodo_inicio'])
    
    return JsonResponse({
        'mensaje': 'Nodo creado exitosamente',
        'nodo': {
            'id': nodo.id_nodo,
            'titulo_nodo': nodo.titulo_nodo,
            'texto': nodo.texto,
            'es_final': nodo.es_final,
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def crear_personaje_view(request):
    """Crea un nuevo personaje en una historia."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    historia_id = data.get('historia_id')
    nombre = data.get('nombre', '').strip()
    imagen_id = data.get('imagen_id')
    
    if not all([historia_id, nombre, imagen_id]):
        return JsonResponse({'error': 'Todos los campos son requeridos'}, status=400)
    
    # Verificar que la historia pertenece al usuario
    usuario_id = request.session.get('usuario_id')
    try:
        historia = Historia.objects.get(id_historia=historia_id, creador_id=usuario_id)
    except Historia.DoesNotExist:
        return JsonResponse({'error': 'Historia no encontrada'}, status=404)
    
    # Crear personaje
    personaje = Personaje.objects.create(
        nombre=nombre,
        historia=historia,
        imagen_id=imagen_id
    )
    
    return JsonResponse({
        'mensaje': 'Personaje creado exitosamente',
        'personaje': {
            'id': personaje.id_personaje,
            'nombre': personaje.nombre,
            'imagen_id': personaje.imagen_id,
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def crear_opcion_view(request):
    """Crea una opción que conecta dos nodos."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    texto_opcion = data.get('texto_opcion', '').strip()
    nodo_origen_id = data.get('nodo_origen_id')
    nodo_destino_id = data.get('nodo_destino_id')
    
    if not all([texto_opcion, nodo_origen_id, nodo_destino_id]):
        return JsonResponse({'error': 'Todos los campos son requeridos'}, status=400)
    
    # Verificar que ambos nodos existen y pertenecen a una historia del usuario
    usuario_id = request.session.get('usuario_id')
    try:
        nodo_origen = Nodo.objects.select_related('historia').get(id_nodo=nodo_origen_id, historia__creador_id=usuario_id)
        nodo_destino = Nodo.objects.select_related('historia').get(id_nodo=nodo_destino_id, historia__creador_id=usuario_id)
    except Nodo.DoesNotExist:
        return JsonResponse({'error': 'Nodo no encontrado'}, status=404)
    
    # Crear opción
    opcion = Opcion.objects.create(
        texto_opcion=texto_opcion,
        nodo_origen=nodo_origen,
        nodo_destino=nodo_destino
    )
    
    return JsonResponse({
        'mensaje': 'Opción creada exitosamente',
        'opcion': {
            'id': opcion.id_opcion,
            'texto_opcion': opcion.texto_opcion,
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def asignar_personaje_nodo_view(request):
    """Asigna un personaje a un nodo (escena) con una posicion."""
    err = _require_auth(request)
    if err:
        return err
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    
    nodo_id = data.get('nodo_id')
    personaje_id = data.get('personaje_id')
    posicion = data.get('posicion', 'centro')  # izquierda, centro, derecha
    
    if not all([nodo_id, personaje_id]):
        return JsonResponse({'error': 'nodo_id y personaje_id son requeridos'}, status=400)
    
    # Verificar que el nodo y personaje pertenecen al usuario
    usuario_id = request.session.get('usuario_id')
    try:
        nodo = Nodo.objects.select_related('historia').get(id_nodo=nodo_id, historia__creador_id=usuario_id)
        personaje = Personaje.objects.select_related('historia').get(id_personaje=personaje_id, historia__creador_id=usuario_id)
    except (Nodo.DoesNotExist, Personaje.DoesNotExist):
        return JsonResponse({'error': 'Nodo o personaje no encontrado'}, status=404)
    
    # Verificar que el personaje pertenece a la misma historia que el nodo
    if nodo.historia_id != personaje.historia_id:
        return JsonResponse({'error': 'El personaje no pertenece a esta historia'}, status=400)
    
    # Crear o actualizar relación
    nodo_personaje, created = NodoPersonaje.objects.update_or_create(
        nodo=nodo,
        personaje=personaje,
        defaults={'posicion': posicion}
    )
    
    return JsonResponse({
        'mensaje': 'Personaje asignado al nodo exitosamente',
        'nodo_personaje': {
            'nodo_id': nodo.id_nodo,
            'personaje_id': personaje.id_personaje,
            'posicion': nodo_personaje.posicion,
        }
    }, status=201 if created else 200)


@csrf_exempt
@require_http_methods(["DELETE"])
def remover_personaje_nodo_view(request, nodo_id, personaje_id):
    """Remueve un personaje de un nodo."""
    err = _require_auth(request)
    if err:
        return err
    
    usuario_id = request.session.get('usuario_id')
    try:
        nodo_personaje = NodoPersonaje.objects.select_related('nodo__historia').get(
            nodo_id=nodo_id,
            personaje_id=personaje_id,
            nodo__historia__creador_id=usuario_id
        )
        nodo_personaje.delete()
        return JsonResponse({'mensaje': 'Personaje removido del nodo exitosamente'})
    except NodoPersonaje.DoesNotExist:
        return JsonResponse({'error': 'Relación no encontrada'}, status=404)


@require_http_methods(["GET"])
def historia_detalle_view(request, id_historia):
    """Obtiene el detalle completo de una historia para editarla."""
    err = _require_auth(request)
    if err:
        return err
    
    usuario_id = request.session.get('usuario_id')
    try:
        historia = Historia.objects.select_related('creador', 'nodo_inicio').get(
            id_historia=id_historia, 
            creador_id=usuario_id
        )
    except Historia.DoesNotExist:
        return JsonResponse({'error': 'Historia no encontrada'}, status=404)
    
    # Función auxiliar para asegurar URL absoluta
    def ensure_absolute_url(url):
        if url and not url.startswith('http'):
            return f"http://localhost:8000{url}"
        return url
    
    # Obtener nodos con sus opciones
    nodos = []
    for nodo in historia.nodos.all().select_related('imagen_escenario', 'audio_fondo'):
        opciones = []
        for opcion in nodo.opciones_origen.all().select_related('nodo_destino'):
            opciones.append({
                'id': opcion.id_opcion,
                'texto': opcion.texto_opcion,
                'nodo_destino_id': opcion.nodo_destino_id,
            })
        
        # Obtener personajes asignados a este nodo
        personajes_nodo = []
        for nodo_personaje in NodoPersonaje.objects.filter(nodo=nodo).select_related('personaje__imagen'):
            personajes_nodo.append({
                'id': nodo_personaje.personaje.id_personaje,
                'nombre': nodo_personaje.personaje.nombre,
                'imagen_url': ensure_absolute_url(nodo_personaje.personaje.imagen.url) if nodo_personaje.personaje.imagen else None,
                'posicion': nodo_personaje.posicion,
            })
        
        nodos.append({
            'id': nodo.id_nodo,
            'titulo': nodo.titulo_nodo,
            'texto': nodo.texto,
            'es_final': nodo.es_final,
            'imagen_escenario_url': ensure_absolute_url(nodo.imagen_escenario.url) if nodo.imagen_escenario else None,
            'audio_fondo_url': ensure_absolute_url(nodo.audio_fondo.url) if nodo.audio_fondo else None,
            'opciones': opciones,
            'personajes': personajes_nodo,
        })
    
    # Obtener personajes
    personajes = []
    for personaje in historia.personaje_set.all().select_related('imagen'):
        personajes.append({
            'id': personaje.id_personaje,
            'nombre': personaje.nombre,
            'imagen_url': ensure_absolute_url(personaje.imagen.url) if personaje.imagen else None,
        })
    
    return JsonResponse({
        'historia': {
            'id': historia.id_historia,
            'titulo': historia.titulo,
            'descripcion': historia.descripcion,
            'publicada': historia.publicada,
            'nodo_inicio_id': historia.nodo_inicio_id,
            'nodos': nodos,
            'personajes': personajes,
        }
    })


@csrf_exempt
@require_http_methods(["PATCH"])
def publicar_historia_view(request, id_historia):
    """Publica o despublica una historia del usuario."""
    err = _require_auth(request)
    if err:
        return err
    
    usuario_id = request.session.get('usuario_id')
    try:
        historia = Historia.objects.get(id_historia=id_historia, creador_id=usuario_id)
    except Historia.DoesNotExist:
        return JsonResponse({'error': 'Historia no encontrada'}, status=404)
    
    # Toggle publicada
    historia.publicada = not historia.publicada
    historia.save(update_fields=['publicada'])
    
    return JsonResponse({
        'mensaje': f'Historia {"publicada" if historia.publicada else "despublicada"} exitosamente',
        'publicada': historia.publicada,
    })
