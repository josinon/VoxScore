import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { setAccessToken } from '../lib/auth-storage';

/** Consome `#access_token=` devolvido pelo callback Google (backend + OAUTH_FRONTEND_REDIRECT_URL). */
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        try {
          await refreshMe();
        } catch {
          setAccessToken(null);
        }
      }
      if (cancelled) {
        return;
      }
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
      navigate(token ? '/' : '/login', { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshMe]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      A concluir login…
    </div>
  );
}
