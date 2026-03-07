import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { getMe } from './services/authService';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    getMe()
      .then((data) => setUsuario(data.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  const registered = location.state?.registered;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          usuario ? (
            <Navigate to={usuario.rol === 'Administrador' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login onLogin={setUsuario} registered={registered} />
          )
        }
      />
      <Route path="/registro" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute usuario={usuario}>
            <UserDashboard usuario={usuario} onLogout={() => setUsuario(null)} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute usuario={usuario} requiredRole="Administrador">
            <AdminDashboard usuario={usuario} onLogout={() => setUsuario(null)} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
