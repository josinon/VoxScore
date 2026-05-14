import { useState } from 'react';
import { Star, ChevronLeft } from 'lucide-react';

interface Criterion {
  id: string;
  name: string;
  description: string;
}

interface Artist {
  id: string;
  name: string;
  song: string;
  image: string;
}

interface CriteriaVotingProps {
  artist: Artist;
  criteria: Criterion[];
  voterRole: 'JUDGE' | 'PUBLIC';
  onSubmitVote: (
    artistId: string,
    scores: Record<string, number>,
  ) => Promise<void>;
  onBack: () => void;
}

export function CriteriaVoting({
  artist,
  criteria,
  voterRole,
  onSubmitVote,
  onBack,
}: CriteriaVotingProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [hoveredScore, setHoveredScore] = useState<{
    criterionId: string;
    score: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreClick = (criterionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: score }));
    setError(null);
  };

  const allCriteriaRated = criteria.every((c) => scores[c.id] !== undefined);

  const handleSubmit = async () => {
    if (!allCriteriaRated || submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmitVote(artist.id, scores);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Não foi possível enviar a avaliação.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg z-10">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-3"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <img
              src={artist.image}
              alt={artist.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
            />
            <div>
              <h1 className="text-xl font-bold">{artist.name}</h1>
              <p className="text-sm text-white/90">{artist.song}</p>
              <p className="text-xs text-white/70 mt-1">
                {voterRole === 'JUDGE'
                  ? 'Avaliação de Jurado'
                  : 'Avaliação do Público'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Avalie os Critérios
          </h2>
          <p className="text-gray-600 text-sm">
            Dê uma nota de 1 a 10 para cada critério. Todas as avaliações são
            obrigatórias.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {criteria.map((criterion) => {
            const currentScore = scores[criterion.id];

            return (
              <div
                key={criterion.id}
                data-testid={`criterion-row-${criterion.id}`}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {criterion.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {criterion.description}
                    </p>
                  </div>
                  {currentScore !== undefined ? (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full font-bold ml-3">
                      {currentScore}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="flex gap-1 justify-center flex-wrap max-w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected =
                        currentScore !== undefined && score <= currentScore;
                      const isHovered =
                        hoveredScore?.criterionId === criterion.id &&
                        score <= hoveredScore.score;

                      return (
                        <button
                          type="button"
                          key={score}
                          onClick={() => handleScoreClick(criterion.id, score)}
                          onMouseEnter={() =>
                            setHoveredScore({
                              criterionId: criterion.id,
                              score,
                            })
                          }
                          onMouseLeave={() => setHoveredScore(null)}
                          className="transition-all hover:scale-125"
                        >
                          <Star
                            className={`w-8 h-8 transition-all ${
                              isSelected || isHovered
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-none text-gray-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {currentScore !== undefined ? (
                      <span className="font-semibold text-purple-600">
                        {currentScore}{' '}
                        {currentScore === 1 ? 'estrela' : 'estrelas'}
                      </span>
                    ) : (
                      <span>Clique para avaliar</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Progresso</h3>
            <span className="text-sm text-gray-600">
              {Object.keys(scores).length} de {criteria.length} critérios
              avaliados
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300 rounded-full"
              style={{
                width: `${(Object.keys(scores).length / criteria.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {error ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!allCriteriaRated || submitting}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
            ${
              allCriteriaRated && !submitting
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Star className="w-5 h-5" />
          {submitting
            ? 'A enviar…'
            : allCriteriaRated
              ? 'Confirmar Avaliação'
              : 'Complete Todos os Critérios'}
        </button>
      </main>
    </div>
  );
}
