import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ usuario, children, requiredRole }) {
  if (!usuario) return <Navigate to="/login" replace />;
  if (requiredRole && usuario.rol !== requiredRole) return <Navigate to="/login" replace />;
  return children;
}
