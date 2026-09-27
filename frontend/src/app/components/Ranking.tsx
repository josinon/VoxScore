import { Trophy, Medal, Award, TrendingUp, Users, Eye, MinusCircle } from 'lucide-react';
import type { VotingMode } from '../../lib/api';
import type { RankingRow } from '../types';

interface RankingProps {
  rankings: RankingRow[];
  resultsPublished: boolean;
  votingMode?: VotingMode;
  judgeWeightPercent?: number;
  publicWeightPercent?: number;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** ADMIN: indica se o evento está publicado para o público (pode ver notas antes). */
  adminPreview?: boolean;
}

const MODE_SUBTITLE: Record<VotingMode, string> = {
  JUDGES_AND_PUBLIC: 'Modo: jurados + público',
  PUBLIC_ONLY: 'Modo: apenas público',
  JUDGES_ONLY: 'Modo: apenas jurados',
};

export function Ranking({
  rankings,
  resultsPublished,
  votingMode = 'JUDGES_AND_PUBLIC',
  judgeWeightPercent = 80,
  publicWeightPercent = 20,
  onClose,
  loading = false,
  error = null,
  onRetry,
  adminPreview = false,
}: RankingProps) {
  const showScores = resultsPublished || adminPreview;
  const showJudges = votingMode !== 'PUBLIC_ONLY';
  const showPublic = votingMode !== 'JUDGES_ONLY';

  const hasPenalties = showScores && rankings.some((r) => r.showScores && r.scorePenalty > 0);

  const getRankIcon = (rank: number) => {
    if (!showScores || rank < 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Users className="w-4 h-4 text-purple-600" />
        </div>
      );
    }
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
    if (!showScores) {
      return 'bg-white border-gray-200';
    }
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

  const sortedForDisplay = showScores
    ? rankings
    : [...rankings].sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return a.name.localeCompare(b.name);
      });

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
                <h1 className="text-2xl font-bold">
                  {showScores ? 'Ranking Geral' : 'Avaliações em andamento'}
                </h1>
                <p className="text-sm text-white/90">
                  Mega Voz 2026 · {MODE_SUBTITLE[votingMode]}
                </p>
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
            Carregando…
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

        {!showScores ? (
          <div
            className="mb-6 rounded-xl border border-purple-200 bg-purple-50 px-4 py-4 text-sm text-purple-900"
            data-testid="ranking-awaiting-results"
          >
            <p className="font-semibold mb-1">
              Quem vai pro topo? Já já a gente descobre!
            </p>
            <p className="text-purple-800">
              Aqui é só acompanhar o movimento: quanta gente já votou em cada
              um. Nota e ranking de verdade entram na hora que publicarem — não
              sai da tela!
            </p>
          </div>
        ) : null}

        {adminPreview && !resultsPublished ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
            <Eye className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Pré-visualização de administrador: você vê as notas reais, mas o público
              ainda só vê as contagens até você publicar os resultados.
            </p>
          </div>
        ) : null}

        {showScores ? (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Como funciona a pontuação?
            </h2>
            <div
              className={`grid gap-4 text-sm ${
                showJudges && showPublic ? 'md:grid-cols-2' : 'md:grid-cols-1'
              }`}
            >
              {votingMode === 'JUDGES_AND_PUBLIC' ? (
                <>
                  <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
                    <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Jurados ({judgeWeightPercent}%)
                      </p>
                      <p className="text-gray-600">
                        Avaliação técnica por critérios profissionais
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Público ({publicWeightPercent}%)
                      </p>
                      <p className="text-gray-600">
                        Votação popular considerando preferências
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
              {votingMode === 'PUBLIC_ONLY' ? (
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Votação do público (100%)
                    </p>
                    <p className="text-gray-600">
                      A nota final é a média das avaliações do público
                    </p>
                  </div>
                </div>
              ) : null}
              {votingMode === 'JUDGES_ONLY' ? (
                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
                  <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Avaliação dos jurados (100%)
                    </p>
                    <p className="text-gray-600">
                      A nota final é a média das avaliações dos jurados
                    </p>
                  </div>
                </div>
              ) : null}
              {hasPenalties ? (
                <div
                  className={`flex items-start gap-3 bg-red-50 p-4 rounded-lg ${
                    showJudges && showPublic ? 'md:col-span-2' : ''
                  }`}
                >
                  <MinusCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Penalidades</p>
                    <p className="text-gray-600">
                      Quando aplicável, a nota final é a nota obtida menos a penalidade
                      administrativa — ambas ficam visíveis no ranking.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {sortedForDisplay.map((artist) => {
            const podiumSlot =
              showScores && artist.rank >= 1 && artist.rank <= 3
                ? artist.rank
                : 0;

            return (
              <div
                key={artist.artistId}
                data-testid={`ranking-row-${artist.artistId}`}
                className={`rounded-xl p-6 border-2 shadow-md ${getRankBgColor(podiumSlot)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0">
                    {getRankIcon(showScores ? artist.rank : 0)}
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
                    {showScores && artist.showScores ? (
                      artist.scorePenalty > 0 ? (
                        <div className="space-y-1" data-testid={`ranking-scores-${artist.artistId}`}>
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tabular-nums">
                            {artist.totalScore.toFixed(1)}
                          </div>
                          <p className="text-xs font-semibold text-gray-700">nota final</p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            obtida {artist.computedScore.toFixed(1)}
                            <span className="text-red-600">
                              {' '}
                              − {artist.scorePenalty.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {artist.totalScore.toFixed(1)}
                          </div>
                          <p className="text-xs text-gray-500">pontos</p>
                        </>
                      )
                    ) : (
                      <>
                        <div
                          className="text-3xl font-bold text-purple-700 tabular-nums"
                          data-testid={`ranking-vote-count-${artist.artistId}`}
                        >
                          {artist.voteCount}
                        </div>
                        <p className="text-xs text-gray-500">
                          {artist.voteCount === 1
                            ? 'avaliação'
                            : 'avaliações'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {showScores && artist.showScores ? (
                  <>
                    {votingMode === 'JUDGES_AND_PUBLIC' ? (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                        <div className="bg-white/50 rounded-lg p-3 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-600">
                              Jurados
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-900">
                            {artist.judgeScore.toFixed(1)}
                          </span>
                        </div>

                        <div className="bg-white/50 rounded-lg p-3 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-600">
                              Público
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-900">
                            {artist.publicScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {artist.scorePenalty > 0 ? (
                      <div
                        className="mt-4 rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm"
                        data-testid={`ranking-penalty-${artist.artistId}`}
                      >
                        <p className="font-semibold text-red-900 mb-2">Detalhe da nota</p>
                        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
                          <dt className="text-gray-700">Nota obtida (votos)</dt>
                          <dd className="text-right font-semibold text-gray-900">
                            {artist.computedScore.toFixed(1)}
                          </dd>
                          <dt className="text-gray-700">Penalidade</dt>
                          <dd className="text-right font-semibold text-red-700">
                            −{artist.scorePenalty.toFixed(1)}
                          </dd>
                          <dt className="text-gray-900 font-semibold border-t border-red-200 pt-2 mt-1">
                            Nota final
                          </dt>
                          <dd className="text-right font-bold text-gray-900 border-t border-red-200 pt-2 mt-1">
                            {artist.totalScore.toFixed(1)}
                          </dd>
                        </dl>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-center text-xs text-gray-500">
                    {artist.voteCount === 0
                      ? 'Ainda sem avaliações'
                      : 'Notas ocultas até publicação dos resultados'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!loading && rankings.length === 0 && !error ? (
          <p className="text-center text-gray-500 py-8">Sem candidatos ativos.</p>
        ) : null}
      </main>
    </div>
  );
}
