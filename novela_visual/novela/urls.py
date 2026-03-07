from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('registro/', views.registro_view, name='registro'),
    # Público
    path('historias/publicadas/', views.historias_publicadas_view, name='historias_publicadas'),
    # Admin
    path('usuarios/', views.usuarios_list_view, name='usuarios_list'),
    path('usuarios/<int:id_usuario>/toggle/', views.usuario_toggle_view, name='usuario_toggle'),
    path('historias/', views.historias_list_view, name='historias_list'),
    path('historias/<int:id_historia>/toggle/', views.historia_toggle_view, name='historia_toggle'),
]
