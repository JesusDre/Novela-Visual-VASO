# Sistema de Creación de Historias - Novela Visual

## 🎯 Características Implementadas

### Backend (Django)
- ✅ Endpoint para obtener historias del usuario (`GET /api/mis-historias/`)
- ✅ Endpoint para crear historia (`POST /api/historias/crear/`)
- ✅ Endpoint para subir imágenes (`POST /api/imagenes/subir/`)
- ✅ Endpoint para crear nodos/escenas (`POST /api/nodos/crear/`)
- ✅ Endpoint para crear personajes (`POST /api/personajes/crear/`)
- ✅ Endpoint para crear opciones (`POST /api/opciones/crear/`)
- ✅ Endpoint para obtener detalle de historia (`GET /api/historias/:id/`)
- ✅ Manejo de archivos multimedia (imágenes)

### Frontend (React)
- ✅ Página "Mis Historias" para listar las historias del usuario
- ✅ Wizard de creación de historia en 3 pasos:
  1. **Información básica**: Título y descripción
  2. **Primera escena**: Título, texto e imagen de fondo
  3. **Personajes**: Agregar personajes con sus imágenes
- ✅ Previsualización de imágenes antes de subir
- ✅ Indicador de progreso visual
- ✅ Navegación entre pasos

## 🚀 Cómo Usar

### 1. Iniciar el Backend

```bash
cd novela_visual
python manage.py runserver
```

### 2. Iniciar el Frontend

En otra terminal:
```bash
cd novela_visual_frontend
npm run dev
```

### 3. Crear una Historia

1. Inicia sesión en http://localhost:5173/login
2. Ve al Dashboard y haz clic en "Mis Historias"
3. Haz clic en "+ Crear Nueva Historia"
4. Sigue el wizard de 3 pasos:

   **Paso 1: Información Básica**
   - Ingresa el título de tu historia
   - Agrega una descripción (opcional)
   - Haz clic en "Siguiente"

   **Paso 2: Primera Escena**
   - Dale un título a tu escena inicial
   - Escribe el texto narrativo
   - Sube una imagen de fondo (opcional)
   - Haz clic en "Siguiente"

   **Paso 3: Personajes**
   - Agrega personajes uno por uno
   - Cada personaje necesita un nombre y una imagen
   - Puedes agregar varios personajes
   - Cuando termines, haz clic en "Finalizar"

## 📁 Estructura de Archivos Creados

### Backend
```
novela_visual/
├── novela/
│   ├── views.py          # Nuevos endpoints agregados
│   └── urls.py           # Rutas actualizadas
├── novela_visual/
│   ├── settings.py       # Config de MEDIA_ROOT y MEDIA_URL
│   └── urls.py           # Config para servir archivos media
└── media/                # Carpeta para archivos subidos
    └── imagenes/         # Imágenes subidas
```

### Frontend
```
novela_visual_frontend/src/
├── pages/
│   ├── MyStories.jsx     # Lista de historias del usuario
│   ├── CreateStory.jsx   # Wizard de creación
│   └── UserDashboard.jsx # Actualizado con link a Mis Historias
└── App.jsx               # Rutas agregadas
```

## 🔧 Endpoints API

### Historias del Usuario
```http
GET /api/mis-historias/
```
Retorna todas las historias creadas por el usuario autenticado.

### Crear Historia
```http
POST /api/historias/crear/
Content-Type: application/json

{
  "titulo": "Mi Historia",
  "descripcion": "Una historia increíble"
}
```

### Subir Imagen
```http
POST /api/imagenes/subir/
Content-Type: application/json

{
  "imagen": "data:image/png;base64,...",
  "tipo": "escenario",
  "descripcion": "Descripción opcional"
}
```

### Crear Nodo (Escena)
```http
POST /api/nodos/crear/
Content-Type: application/json

{
  "historia_id": 1,
  "titulo_nodo": "Inicio",
  "texto": "La historia comienza...",
  "es_final": false,
  "imagen_escenario_id": 1
}
```

### Crear Personaje
```http
POST /api/personajes/crear/
Content-Type: application/json

{
  "historia_id": 1,
  "nombre": "Luna",
  "imagen_id": 2
}
```

### Crear Opción
```http
POST /api/opciones/crear/
Content-Type: application/json

{
  "texto_opcion": "Ir al bosque",
  "nodo_origen_id": 1,
  "nodo_destino_id": 2
}
```

### Detalle de Historia
```http
GET /api/historias/{id}/
```
Retorna información completa de la historia incluyendo nodos, personajes y opciones.

## 🎨 Flujo de Trabajo

1. **Usuario crea historia** → Se guarda info básica
2. **Usuario crea primera escena** → Se crea el nodo inicial y se establece como `nodo_inicio`
3. **Usuario agrega personajes** → Se crean personajes asociados a la historia
4. **Usuario puede continuar editando** → Agregar más nodos, opciones, etc.

## 📝 Notas Importantes

### Imágenes
- Las imágenes se suben en formato **base64**
- Se almacenan en `media/imagenes/` con nombres únicos (UUID)
- Formatos soportados: PNG, JPG, GIF, WebP

### Sesiones
- Se requiere estar autenticado para crear historias
- Las historias solo son visibles y editables por su creador
- Los administradores pueden ver todas las historias

### Primer Nodo
- El primer nodo creado automáticamente se establece como `nodo_inicio`
- Este es el punto de entrada de la historia

## 🔄 Próximas Mejoras

- [ ] Editor visual de historias con drag & drop
- [ ] Crear opciones que conecten nodos
- [ ] Posicionar personajes en escenas
- [ ] Vista previa de la historia
- [ ] Publicar/despublicar historias
- [ ] Eliminar y editar nodos existentes
- [ ] Soporte para audio de fondo
- [ ] Validación de historia completa antes de publicar

## 🐛 Solución de Problemas

**Error al subir imágenes:**
- Verifica que la carpeta `media/` tenga permisos de escritura
- Asegúrate de que `MEDIA_ROOT` esté configurado en settings.py

**Las imágenes no se muestran:**
- Verifica que el servidor esté sirviendo archivos media en desarrollo
- Comprueba que `DEBUG = True` en settings.py

**Error 401 al crear historia:**
- Verifica que estés autenticado
- Comprueba que las cookies estén habilitadas
- Asegúrate de que `CORS_ALLOW_CREDENTIALS = True`

## 📞 Soporte

Si encuentras algún problema, revisa:
1. La consola del navegador (F12)
2. Los logs del servidor Django
3. Los errores de la terminal de Vite
