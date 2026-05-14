import { Users, Award, LogOut, Shield } from 'lucide-react';

interface UserTypeSelectionProps {
  user: {
    name: string;
    email: string;
    photo: string;
  };
  onSelectType: (type: 'judge' | 'public' | 'admin') => void;
  onLogout: () => void;
}

export function UserTypeSelection({ user, onSelectType, onLogout }: UserTypeSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src={user.photo}
              alt={user.name}
              className="w-16 h-16 rounded-full border-4 border-white/30"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Olá, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-2xl font-bold text-white/90 mb-2">Megadance 2026</p>
          <p className="text-white/90 text-lg mb-1">
            Selecione como você deseja votar
          </p>
          <button
            onClick={onLogout}
            className="text-white/80 hover:text-white text-sm flex items-center gap-1 mx-auto mt-3"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectType('admin')}
            className="w-full bg-white rounded-2xl p-6 hover:shadow-2xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Administrador
                </h2>
                <p className="text-gray-600">
                  Controle as votações e acompanhe resultados
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectType('judge')}
            className="w-full bg-white rounded-2xl p-6 hover:shadow-2xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Jurado
                </h2>
                <p className="text-gray-600">
                  Avaliação técnica por critérios profissionais
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectType('public')}
            className="w-full bg-white rounded-2xl p-6 hover:shadow-2xl transition-all hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Público
                </h2>
                <p className="text-gray-600">
                  Vote no seu artista favorito
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-sm">
          <p className="text-center">
            <strong>Administrador:</strong> Gerencia votações<br />
            <strong>Jurados:</strong> Avaliam critérios técnicos<br />
            <strong>Público:</strong> Avalia critérios de preferência
          </p>
        </div>
      </div>
    </div>
  );
}
