import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthReady } from '../../hooks/useAuthReady';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function RequireAuth() {
  const { initialized, isAuthenticated } = useAuthReady();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
