from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import Usuario, Rol
import hashlib
import json


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
