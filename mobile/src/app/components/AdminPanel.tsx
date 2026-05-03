import { Lock, Unlock, TrendingUp, CheckCircle, XCircle, Music } from 'lucide-react';
import { Artist } from '../types';
import { UserMenu } from './UserMenu';

interface AdminPanelProps {
  artists: Artist[];
  openArtistIds: number[];
  onToggleArtist: (artistId: number) => void;
  onShowRanking: () => void;
  user: {
    name: string;
    email: string;
    photo: string;
  };
  onLogout: () => void;
}

export function AdminPanel({ artists, openArtistIds, onToggleArtist, onShowRanking, user, onLogout }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-white/90">Megadance 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowRanking}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="hidden sm:inline">Ranking</span>
              </button>
              <UserMenu user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Controle de Votação</h2>
          <p className="text-gray-600 text-sm">
            Libere a votação para cada apresentação após sua conclusão. Apenas apresentações liberadas podem receber votos.
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          {artists.map((artist) => {
            const isOpen = openArtistIds.includes(artist.id);

            return (
              <div
                key={artist.id}
                className={`bg-white rounded-xl overflow-hidden shadow-md border-2 transition-all ${
                  isOpen ? 'border-green-400' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                      {artist.name}
                    </h3>
                    <p className="text-gray-600 text-sm truncate mb-2">{artist.song}</p>
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Votação Aberta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Votação Fechada
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleArtist(artist.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                      isOpen
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    }`}
                  >
                    {isOpen ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span className="hidden sm:inline">Fechar</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5" />
                        <span className="hidden sm:inline">Abrir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Instruções</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Aguarde a conclusão de cada apresentação musical</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Clique em "Abrir" para liberar a votação daquela apresentação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Jurados e público só poderão votar em apresentações com votação aberta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Você pode fechar a votação a qualquer momento clicando em "Fechar"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Acompanhe o ranking em tempo real clicando no botão no topo</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
