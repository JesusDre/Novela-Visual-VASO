from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import Usuario, Rol, Historia
import hashlib
import json


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
