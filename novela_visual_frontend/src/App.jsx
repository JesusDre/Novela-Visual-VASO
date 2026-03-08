import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyStories from './pages/MyStories';
import CreateStory from './pages/CreateStory';
import EditStory from './pages/EditStory';
import StoryPlayer from './pages/StoryPlayer';
import ProtectedRoute from './components/ProtectedRoute';
import { getMe, logout as logoutApi } from './services/authService';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((data) => setUsuario(data.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setChecking(false));
  }, []);

  async function handleLogout() {
    try { await logoutApi(); } catch { /* ignore */ }
    setUsuario(null);
    navigate('/');
  }

  if (checking) return null;

  return (
    <Routes>
      {/* Catálogo público — página principal */}
      <Route path="/" element={<Catalog usuario={usuario} onLogout={handleLogout} />} />

      <Route
        path="/login"
        element={
          usuario ? (
            <Navigate to={usuario.rol === 'Administrador' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login onLogin={setUsuario} />
          )
        }
      />
      <Route path="/registro" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute usuario={usuario}>
            <UserDashboard usuario={usuario} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-historias"
        element={
          <ProtectedRoute usuario={usuario}>
            <MyStories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historias/crear"
        element={
          <ProtectedRoute usuario={usuario}>
            <CreateStory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historias/:id/editar"
        element={
          <ProtectedRoute usuario={usuario}>
            <EditStory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historias/:id/jugar"
        element={
          <ProtectedRoute usuario={usuario}>
            <StoryPlayer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute usuario={usuario} requiredRole="Administrador">
            <AdminDashboard usuario={usuario} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
