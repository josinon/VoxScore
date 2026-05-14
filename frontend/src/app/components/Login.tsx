import { Music2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { name: string; email: string; photo: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const handleGoogleLogin = () => {
    // Simulação de login com Google
    // Em produção, isso seria integrado com Google OAuth
    const mockUser = {
      name: 'Usuário Demo',
      email: 'usuario@exemplo.com',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    };

    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Music2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Megadance 2026
            </h1>
            <p className="text-white/90">
              Sistema de Votação
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bem-vindo!
              </h2>
              <p className="text-gray-600">
                Faça login para participar da votação
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all rounded-xl p-4 flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-2 text-sm">
                  Por que precisamos de login?
                </h3>
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• Garantir que cada pessoa vote apenas uma vez</li>
                  <li>• Manter a integridade da votação</li>
                  <li>• Permitir que você acompanhe suas avaliações</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Ao continuar, você concorda com nossos{' '}
                <button className="text-purple-600 hover:underline">
                  Termos de Uso
                </button>
                {' '}e{' '}
                <button className="text-purple-600 hover:underline">
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            Megadance 2026 © Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
