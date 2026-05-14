import { Navigate, Outlet } from 'react-router';
import { useAuth } from './AuthProvider';

export function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        A carregar…
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <Outlet />;
}
