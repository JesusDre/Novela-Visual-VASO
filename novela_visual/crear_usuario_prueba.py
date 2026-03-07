# Script para crear usuario de prueba en Django shell
# Ejecutar: python manage.py shell < crear_usuario_prueba.py

from novela.models import Usuario, Rol
from django.utils import timezone
import hashlib

# Crear o obtener rol de Usuario
rol_usuario, created = Rol.objects.get_or_create(
    nombre_rol='Usuario',
    defaults={'nombre_rol': 'Usuario'}
)

# Crear usuario de prueba
contrasena = "123456"
contrasena_hash = hashlib.sha256(contrasena.encode()).hexdigest()

usuario, created = Usuario.objects.get_or_create(
    correo='test@example.com',
    defaults={
        'nombre': 'Usuario Prueba',
        'apellido_paterno': 'Test',
        'apellido_materno': 'Demo',
        'contrasena': contrasena_hash,
        'fecha_registro': timezone.now(),
        'activo': True,
        'rol': rol_usuario
    }
)

if created:
    print(f"✓ Usuario creado exitosamente")
    print(f"  Correo: test@example.com")
    print(f"  Contraseña: 123456")
else:
    print(f"✓ El usuario ya existe")
    print(f"  Correo: test@example.com")
