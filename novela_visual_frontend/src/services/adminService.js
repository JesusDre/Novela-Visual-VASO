import request from './api';

export async function getHistoriasPublicadas() {
  return request('/historias/publicadas/');
}

export async function getUsuarios() {
  return request('/usuarios/');
}

export async function toggleUsuario(id) {
  return request(`/usuarios/${id}/toggle/`, { method: 'PATCH' });
}

export async function getHistorias() {
  return request('/historias/');
}

export async function toggleHistoria(id) {
  return request(`/historias/${id}/toggle/`, { method: 'PATCH' });
}
