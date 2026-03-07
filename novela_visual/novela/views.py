from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.sessions.models import Session
from django.utils import timezone
from .models import Usuario
import hashlib

# Create your views here.

def login_view(request):
    """Vista para el login de usuarios"""
    if request.method == 'POST':
        correo = request.POST.get('correo')
        contrasena = request.POST.get('contrasena')
        
        try:
            # Buscar usuario por correo
            usuario = Usuario.objects.get(correo=correo, activo=True)
            
            # Verificar contraseña (asumiendo que se guarda con hash)
            # Si guardas la contraseña en texto plano, solo compara: usuario.contrasena == contrasena
            contrasena_hash = hashlib.sha256(contrasena.encode()).hexdigest()
            
            if usuario.contrasena == contrasena_hash or usuario.contrasena == contrasena:
                # Guardar información del usuario en la sesión
                request.session['usuario_id'] = usuario.id_usuario
                request.session['usuario_nombre'] = usuario.nombre
                request.session['usuario_correo'] = usuario.correo
                request.session['usuario_rol'] = usuario.rol.nombre_rol
                
                messages.success(request, f'¡Bienvenido {usuario.nombre}!')
                return redirect('home')
            else:
                messages.error(request, 'Correo o contraseña incorrectos')
        except Usuario.DoesNotExist:
            messages.error(request, 'Correo o contraseña incorrectos')
    
    return render(request, 'login.html')

def logout_view(request):
    """Vista para cerrar sesión"""
    request.session.flush()
    messages.success(request, 'Has cerrado sesión exitosamente')
    return redirect('login')

def home_view(request):
    """Vista principal - requiere estar autenticado"""
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión para acceder')
        return redirect('login')
    
    context = {
        'usuario_nombre': request.session.get('usuario_nombre'),
        'usuario_correo': request.session.get('usuario_correo'),
        'usuario_rol': request.session.get('usuario_rol'),
    }
    return render(request, 'home.html', context)

def registro_view(request):
    """Vista para registro de nuevos usuarios"""
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        apellido_paterno = request.POST.get('apellido_paterno')
        apellido_materno = request.POST.get('apellido_materno')
        correo = request.POST.get('correo')
        contrasena = request.POST.get('contrasena')
        
        # Verificar si el correo ya existe
        if Usuario.objects.filter(correo=correo).exists():
            messages.error(request, 'El correo ya está registrado')
            return render(request, 'registro.html')
        
        # Crear hash de la contraseña
        contrasena_hash = hashlib.sha256(contrasena.encode()).hexdigest()
        
        # Obtener o crear rol por defecto (usuario normal)
        from .models import Rol
        rol_usuario, created = Rol.objects.get_or_create(
            nombre_rol='Usuario',
            defaults={'nombre_rol': 'Usuario'}
        )
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario.objects.create(
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            correo=correo,
            contrasena=contrasena_hash,
            fecha_registro=timezone.now(),
            activo=True,
            rol=rol_usuario
        )
        
        messages.success(request, 'Cuenta creada exitosamente. Ya puedes iniciar sesión')
        return redirect('login')
    
    return render(request, 'registro.html')
