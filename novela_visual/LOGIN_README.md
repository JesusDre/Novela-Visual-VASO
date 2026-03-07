# 🔐 Sistema de Login - Novela Visual

## ✨ Características Implementadas

- ✅ Login con correo y contraseña
- ✅ Registro de nuevos usuarios
- ✅ Logout
- ✅ Página de inicio protegida
- ✅ Mensajes de éxito/error
- ✅ Diseño moderno y responsivo
- ✅ Validación de sesiones

## 🚀 Cómo Usar

### 1. Aplicar Migraciones (si no lo has hecho)

```bash
cd novela_visual
python manage.py makemigrations
python manage.py migrate
```

### 2. Crear Usuario de Prueba

Opción A - Usar el script automático:
```bash
python manage.py shell < crear_usuario_prueba.py
```

Opción B - Manual desde Django shell:
```bash
python manage.py shell
```

Luego ejecuta en el shell:
```python
from novela.models import Usuario, Rol
from django.utils import timezone
import hashlib

# Crear rol
rol = Rol.objects.create(nombre_rol='Usuario')

# Crear usuario
contrasena_hash = hashlib.sha256('123456'.encode()).hexdigest()
usuario = Usuario.objects.create(
    nombre='Usuario Prueba',
    correo='test@example.com',
    contrasena=contrasena_hash,
    fecha_registro=timezone.now(),
    activo=True,
    rol=rol
)
print("Usuario creado exitosamente")
exit()
```

### 3. Iniciar el Servidor

```bash
python manage.py runserver
```

### 4. Acceder a la Aplicación

Abre tu navegador y ve a:
- **Página de login**: http://127.0.0.1:8000/login/
- **Registro**: http://127.0.0.1:8000/registro/
- **Inicio** (requiere login): http://127.0.0.1:8000/

### 5. Credenciales de Prueba

Si usaste el script automático:
- **Correo**: test@example.com
- **Contraseña**: 123456

## 📁 Estructura de Archivos Creados

```
novela_visual/
├── novela/
│   ├── views.py          # Vistas de login, logout, home, registro
│   └── urls.py           # URLs de la aplicación
├── novela_visual/
│   ├── settings.py       # Configuración de login añadida
│   └── urls.py           # URLs principales actualizadas
├── templates/
│   ├── base.html         # Template base con navbar y estilos
│   ├── login.html        # Formulario de login
│   ├── registro.html     # Formulario de registro
│   └── home.html         # Página de inicio (protegida)
└── crear_usuario_prueba.py  # Script para crear usuario de prueba
```

## 🔧 Funcionalidades

### Login (`/login/`)
- Autenticación con correo y contraseña
- Contraseñas hasheadas con SHA-256
- Validación de usuario activo
- Mensajes de error claros

### Registro (`/registro/`)
- Formulario para nuevos usuarios
- Validación de correo único
- Creación automática de hash de contraseña
- Asignación automática de rol "Usuario"

### Logout (`/logout/`)
- Cierre de sesión seguro
- Redirección al login
- Limpieza de datos de sesión

### Home (`/`)
- Página protegida (requiere login)
- Muestra información del usuario
- Navbar con opciones de navegación

## 🔒 Seguridad

- Contraseñas hasheadas con SHA-256
- Validación de sesiones en cada request
- Protección CSRF en formularios
- Usuarios inactivos no pueden iniciar sesión

## 📝 Notas

1. **Contraseñas**: El sistema acepta tanto contraseñas hasheadas como en texto plano (para compatibilidad). En producción, siempre usa hash.

2. **Sesiones**: La información del usuario se guarda en la sesión de Django:
   - `usuario_id`: ID del usuario
   - `usuario_nombre`: Nombre del usuario
   - `usuario_correo`: Correo del usuario
   - `usuario_rol`: Rol del usuario

3. **Roles**: El sistema crea automáticamente el rol "Usuario" si no existe.

## 🎨 Personalización

Los templates usan estilos inline CSS. Puedes:
- Mover los estilos a archivos CSS separados en `/static/css/`
- Personalizar colores y diseño
- Agregar más campos al registro
- Implementar "Olvidé mi contraseña"

## 🔄 Próximos Pasos Sugeridos

- [ ] Implementar recuperación de contraseña
- [ ] Agregar perfiles de usuario
- [ ] Implementar gestión de historias
- [ ] Agregar validación de contraseña fuerte
- [ ] Implementar "Recordar sesión"
- [ ] Agregar verificación de correo electrónico
