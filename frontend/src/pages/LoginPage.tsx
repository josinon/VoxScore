import { useState } from 'react';
import { Navigate } from 'react-router';
import { Music2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { ApiError } from '../lib/api';
import { showDevLogin } from '../lib/env';

export function LoginPage() {
  const {
    isAuthenticated,
    loading,
    loginWithGoogle,
    loginWithMockProfile,
  } = useAuth();
  const [email, setEmail] = useState('voter@voxscore.test');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMockLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await loginWithMockProfile({
        email: email.trim(),
        displayName: email.trim().split('@')[0] || 'Utilizador',
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 404
            ? 'Mock OAuth desligado no servidor (AUTH_GOOGLE_MOCK_ENABLED).'
            : `Erro ${e.status}: ${e.message}`,
        );
      } else {
        setError('Falha ao iniciar sessão.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Music2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Megadance 2026</h1>
            <p className="text-white/90">Sistema de Votação</p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
              <p className="text-gray-600">Faça login para continuar</p>
            </div>

            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all rounded-xl p-4 flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-semibold text-gray-700 group-hover:text-gray-900">
                Continuar com Google
              </span>
            </button>

            {showDevLogin() ? (
              <div className="mt-6 rounded-xl border border-dashed border-purple-200 bg-purple-50/80 p-4">
                <p className="text-xs font-medium text-purple-900 mb-2">
                  Desenvolvimento — login via mock OAuth (POST /auth/oauth/mock)
                </p>
                <label className="block text-xs text-gray-600 mb-1" htmlFor="dev-email">
                  Email
                </label>
                <input
                  id="dev-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3"
                />
                <button
                  type="button"
                  data-testid="dev-login-submit"
                  disabled={busy || !email.trim()}
                  onClick={() => void handleMockLogin()}
                  className="w-full rounded-lg bg-purple-700 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  {busy ? 'A entrar…' : 'Entrar (desenvolvimento)'}
                </button>
                {error ? (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="mt-6 text-xs text-gray-500 leading-relaxed">
              O token JWT é guardado em <strong>sessionStorage</strong> (não httpOnly):
              qualquer script na mesma origem pode acedê-lo se houver XSS. Em produção,
              prefira cookie httpOnly quando a API o suportar.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">Megadance 2026 © Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}
