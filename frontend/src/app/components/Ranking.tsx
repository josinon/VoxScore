import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import type { RankingRow } from '../types';

interface RankingProps {
  rankings: RankingRow[];
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function Ranking({
  rankings,
  onClose,
  loading = false,
  error = null,
  onRetry,
}: RankingProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankBgColor = (podiumSlot: number) => {
    switch (podiumSlot) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ranking Geral</h1>
                <p className="text-sm text-white/90">Megadance 2026</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading && rankings.length === 0 ? (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
            A carregar ranking…
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p className="mb-2">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold text-red-900 underline"
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Como funciona a pontuação?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
              <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Jurados (60%)</p>
                <p className="text-gray-600">
                  Avaliação técnica por critérios profissionais
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Público (40%)</p>
                <p className="text-gray-600">
                  Votação popular considerando preferências
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rankings.map((artist, index) => {
            const podiumSlot = index < 3 ? index + 1 : 0;

            return (
              <div
                key={artist.artistId}
                data-testid={`ranking-row-${artist.artistId}`}
                className={`rounded-xl p-6 border-2 shadow-md ${getRankBgColor(podiumSlot)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0">
                    {getRankIcon(artist.rank)}
                  </div>

                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                      {artist.name}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">{artist.song}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {artist.totalScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-lg p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-600">
                        Jurados
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-900">
                        {artist.judgeScore.toFixed(1)}
                      </span>
                      {artist.judgeVotes !== undefined && artist.judgeVotes > 0 ? (
                        <span className="text-xs text-gray-500">
                          ({artist.judgeVotes}{' '}
                          {artist.judgeVotes === 1 ? 'voto' : 'votos'})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">média</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-lg p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-600">
                        Público
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-900">
                        {artist.publicScore.toFixed(1)}
                      </span>
                      {artist.publicVotes !== undefined &&
                      artist.publicVotes > 0 ? (
                        <span className="text-xs text-gray-500">
                          ({artist.publicVotes}{' '}
                          {artist.publicVotes === 1 ? 'voto' : 'votos'})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">média</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && rankings.length === 0 && !error ? (
          <p className="text-center text-gray-500 py-8">Sem dados de ranking.</p>
        ) : null}
      </main>
    </div>
  );
}
