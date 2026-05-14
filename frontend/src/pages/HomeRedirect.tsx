import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';

export function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        A carregar…
      </div>
    );
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/votacao" replace />;
}
