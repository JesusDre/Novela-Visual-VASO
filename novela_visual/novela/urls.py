from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('registro/', views.registro_view, name='registro'),
    # Público
    path('historias/publicadas/', views.historias_publicadas_view, name='historias_publicadas'),
    # Creación de historias (usuario autenticado)
    path('mis-historias/', views.mis_historias_view, name='mis_historias'),
    path('historias/crear/', views.crear_historia_view, name='crear_historia'),
    path('historias/<int:id_historia>/', views.historia_detalle_view, name='historia_detalle'),
    path('historias/<int:id_historia>/actualizar/', views.actualizar_historia_view, name='actualizar_historia'),
    path('historias/<int:id_historia>/publicar/', views.publicar_historia_view, name='publicar_historia'),
    path('imagenes/subir/', views.subir_imagen_view, name='subir_imagen'),
    path('audio/subir/', views.subir_audio_view, name='subir_audio'),
    path('nodos/crear/', views.crear_nodo_view, name='crear_nodo'),
    path('nodos/<int:nodo_id>/actualizar/', views.actualizar_nodo_view, name='actualizar_nodo'),
    path('nodos/<int:nodo_id>/eliminar/', views.eliminar_nodo_view, name='eliminar_nodo'),
    path('personajes/crear/', views.crear_personaje_view, name='crear_personaje'),
    path('opciones/crear/', views.crear_opcion_view, name='crear_opcion'),
    path('opciones/<int:opcion_id>/actualizar/', views.actualizar_opcion_view, name='actualizar_opcion'),
    path('opciones/<int:opcion_id>/eliminar/', views.eliminar_opcion_view, name='eliminar_opcion'),
    path('nodos/personajes/asignar/', views.asignar_personaje_nodo_view, name='asignar_personaje_nodo'),
    path('nodos/<int:nodo_id>/personajes/<int:personaje_id>/remover/', views.remover_personaje_nodo_view, name='remover_personaje_nodo'),
    # Admin
    path('usuarios/', views.usuarios_list_view, name='usuarios_list'),
    path('usuarios/<int:id_usuario>/toggle/', views.usuario_toggle_view, name='usuario_toggle'),
    path('historias/', views.historias_list_view, name='historias_list'),
    path('historias/<int:id_historia>/toggle/', views.historia_toggle_view, name='historia_toggle'),
]
