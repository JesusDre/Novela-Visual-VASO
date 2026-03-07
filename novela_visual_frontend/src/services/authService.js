import request from './api';

export async function login(correo, contrasena) {
  return request('/login/', {
    method: 'POST',
    body: JSON.stringify({ correo, contrasena }),
  });
}

export async function registro(datos) {
  return request('/registro/', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export async function logout() {
  return request('/logout/', { method: 'POST' });
}

export async function getMe() {
  return request('/me/');
}
