import { Lock, Unlock, CheckCircle, XCircle } from 'lucide-react';
import { Artist } from '../../types';

interface ManageVotingProps {
  artists: Artist[];
  openArtistIds: string[];
  onToggleArtist: (artistId: string) => void;
}

export function ManageVoting({ artists, openArtistIds, onToggleArtist }: ManageVotingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Controle de Votação</h2>
        <p className="text-gray-600">
          Libere a votação após cada apresentação. Apenas apresentações liberadas recebem votos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Votações Abertas</p>
          <p className="text-3xl font-bold text-green-600">{openArtistIds.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Votações Fechadas</p>
          <p className="text-3xl font-bold text-red-600">{artists.length - openArtistIds.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Total de Candidatos</p>
          <p className="text-3xl font-bold text-purple-600">{artists.length}</p>
        </div>
      </div>

      <div className="grid gap-4">
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
                      <span className="hidden sm:inline">Fechar Votação</span>
                      <span className="sm:hidden">Fechar</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      <span className="hidden sm:inline">Abrir Votação</span>
                      <span className="sm:hidden">Abrir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Instruções de Operação</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Aguarde a conclusão de cada apresentação musical</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Clique em "Abrir Votação" para liberar a avaliação</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Jurados e público só podem votar em apresentações abertas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Você pode fechar a votação a qualquer momento</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
