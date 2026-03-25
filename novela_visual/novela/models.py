from django.db import models

# Create your models here.

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)

    class Meta:
     db_table = "roles"

    def __str__(self):
        return self.nombre_rol

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    correo = models.CharField(max_length=150, unique=True)
    contrasena = models.CharField(max_length=255)
    fecha_registro = models.DateTimeField(auto_now_add=False)
    activo = models.BooleanField(default=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column="id_rol")

    class Meta:
        db_table = "usuarios"

    def __str__(self):
        return self.nombre

class Historia(models.Model):
    id_historia = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=False)
    publicada = models.BooleanField(default=False)
    creador = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column="id_creador")
    portada = models.ForeignKey("Imagen", on_delete=models.SET_NULL, db_column="id_portada", blank=True, null=True, related_name="historias_portada")
    nodo_inicio = models.ForeignKey("Nodo", on_delete=models.SET_NULL, db_column="id_nodo_inicio" ,blank=True, null=True, related_name="es_inicio_de")

    class Meta:
        db_table = "historias"

    def __str__(self):
        return self.titulo

class Imagen(models.Model):
    id_imagen = models.AutoField(primary_key=True)
    url = models.CharField(max_length=255)
    tipo = models.CharField(max_length=50, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "imagenes"

class Audio(models.Model):
    id_audio = models.AutoField(primary_key=True)
    url = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "audio"

class Nodo(models.Model):
    id_nodo = models.AutoField(primary_key=True)
    titulo_nodo = models.CharField(max_length=150, blank=True, null=True)
    texto = models.TextField(blank=True, null=True)
    es_final = models.BooleanField(default=False)
    historia = models.ForeignKey(Historia, on_delete=models.CASCADE, db_column="id_historia", related_name="nodos")
    imagen_escenario = models.ForeignKey(Imagen, on_delete=models.CASCADE, db_column="id_imagen_escenario", blank=True, null=True)
    audio_fondo = models.ForeignKey(Audio, on_delete=models.CASCADE, db_column="id_audio_fondo", blank=True, null=True)

    class Meta:
        db_table = "nodos"

class Personaje(models.Model):
    id_personaje = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    historia = models.ForeignKey(Historia, on_delete=models.CASCADE, db_column="id_historia")
    imagen = models.ForeignKey(Imagen, on_delete=models.CASCADE, db_column="id_imagen")

    class Meta:
        db_table = "personajes"

class NodoPersonaje(models.Model):
    nodo = models.ForeignKey(Nodo, on_delete=models.CASCADE, db_column="id_nodo")
    personaje = models.ForeignKey(Personaje, on_delete=models.CASCADE, db_column="id_personaje")
    posicion = models.CharField(max_length=50)

    class Meta:
        db_table = "nodo_personaje"
        unique_together = (("nodo", "personaje"),)

class Opcion(models.Model):
    id_opcion = models.AutoField(primary_key=True)
    texto_opcion = models.CharField(max_length=255)
    nodo_origen = models.ForeignKey(Nodo, on_delete=models.CASCADE, db_column="id_nodo_origen", related_name="opciones_origen")
    nodo_destino = models.ForeignKey(Nodo, on_delete=models.CASCADE,db_column="id_nodo_destino", related_name="opciones_destino")

    class Meta:
        db_table = "opciones"

class ProgresoUsuario(models.Model):
    id_progreso = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column="id_usuario")
    historia = models.ForeignKey(Historia, on_delete=models.CASCADE, db_column="id_historia")
    nodo_actual = models.ForeignKey(Nodo, on_delete=models.CASCADE, db_column="id_nodo_actual")
    fecha_actualizacion = models.DateTimeField()

    class Meta:
        db_table = "progreso_usuario"