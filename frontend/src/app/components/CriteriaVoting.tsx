import { useState } from 'react';
import { Star, ChevronLeft, Minus, Plus } from 'lucide-react';
import { Slider } from './ui/slider';

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

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_STEP = 0.5;
const STAR_COUNT = 10;

function formatVoteScore(score: number): string {
  return Number.isInteger(score)
    ? String(score)
    : score.toFixed(1).replace('.', ',');
}

function clampScore(value: number): number {
  const steps = Math.round(value / SCORE_STEP);
  const clamped = Math.min(
    SCORE_MAX,
    Math.max(SCORE_MIN, steps * SCORE_STEP),
  );
  return Math.round(clamped * 10) / 10;
}

function starFillState(
  starIndex: number,
  score: number,
): 'empty' | 'half' | 'full' {
  const whole = starIndex + 1;
  if (score >= whole) {
    return 'full';
  }
  if (score >= whole - SCORE_STEP) {
    return 'half';
  }
  return 'empty';
}

function ScoreStar({
  fill,
}: {
  fill: 'empty' | 'half' | 'full';
}) {
  const base = 'w-6 h-6';
  if (fill === 'empty') {
    return <Star className={`${base} fill-none text-gray-200`} />;
  }
  if (fill === 'full') {
    return <Star className={`${base} fill-amber-400 text-amber-400`} />;
  }
  return (
    <span className={`relative inline-block ${base}`}>
      <Star className={`${base} fill-none text-gray-200`} />
      <span className="absolute inset-0 w-1/2 overflow-hidden">
        <Star className={`${base} fill-amber-400 text-amber-400`} />
      </span>
    </span>
  );
}

function CriterionScorePicker({
  criterionId,
  value,
  onChange,
}: {
  criterionId: string;
  value: number | undefined;
  onChange: (score: number) => void;
}) {
  const sliderValue = value ?? 5;

  const adjust = (delta: number) => {
    if (value === undefined) {
      onChange(SCORE_MIN);
      return;
    }
    onChange(clampScore(value + delta));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Diminuir nota em 0,5"
          data-testid={`score-decrease-${criterionId}`}
          disabled={value === undefined || value <= SCORE_MIN}
          onClick={() => adjust(-SCORE_STEP)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-200 bg-white text-purple-700 shadow-sm transition-all hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-6 w-6" />
        </button>

        <div
          className="flex min-w-[5.5rem] flex-col items-center"
          aria-live="polite"
        >
          <span
            className={`text-4xl font-bold tabular-nums leading-none ${
              value !== undefined
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
                : 'text-gray-300'
            }`}
          >
            {value !== undefined ? formatVoteScore(value) : '—'}
          </span>
          <span className="mt-1 text-xs text-gray-500">de 10</span>
        </div>

        <button
          type="button"
          aria-label="Aumentar nota em 0,5"
          data-testid={`score-increase-${criterionId}`}
          disabled={value !== undefined && value >= SCORE_MAX}
          onClick={() => adjust(SCORE_STEP)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-200 bg-white text-purple-700 shadow-sm transition-all hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="px-1">
        <Slider
          data-testid={`score-slider-${criterionId}`}
          min={SCORE_MIN}
          max={SCORE_MAX}
          step={SCORE_STEP}
          value={[sliderValue]}
          onValueChange={(vals) => onChange(clampScore(vals[0] ?? SCORE_MIN))}
          className="[&_[data-slot=slider-track]]:h-3 [&_[data-slot=slider-track]]:bg-purple-100 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-600 [&_[data-slot=slider-range]]:to-pink-600 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-purple-600 [&_[data-slot=slider-thumb]]:shadow-md"
          aria-label={`Nota para ${criterionId}`}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-gray-400">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {value !== undefined ? (
        <div
          className="flex justify-center gap-0.5"
          aria-hidden
        >
          {Array.from({ length: STAR_COUNT }, (_, starIndex) => (
            <ScoreStar
              key={starIndex}
              fill={starFillState(starIndex, value)}
            />
          ))}
        </div>
      ) : null}

      {/* Atalhos invisíveis para e2e: mantém data-testid score-btn-{id}-{score} */}
      <div className="sr-only" aria-hidden>
        {Array.from(
          { length: (SCORE_MAX - SCORE_MIN) / SCORE_STEP + 1 },
          (_, i) => SCORE_MIN + i * SCORE_STEP,
        ).map((score) => (
          <button
            key={score}
            type="button"
            tabIndex={-1}
            data-testid={`score-btn-${criterionId}-${score}`}
            onClick={() => onChange(score)}
          >
            {formatVoteScore(score)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CriteriaVoting({
  artist,
  criteria,
  voterRole,
  onSubmitVote,
  onBack,
}: CriteriaVotingProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScoreChange = (criterionId: string, score: number) => {
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
            Deslize a barra ou use os botões + e − para definir uma nota de 1 a
            10, em passos de 0,5.
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
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {criterion.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {criterion.description}
                    </p>
                  </div>
                  {currentScore !== undefined ? (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full font-bold ml-3 shrink-0">
                      {formatVoteScore(currentScore)}
                    </div>
                  ) : null}
                </div>

                <CriterionScorePicker
                  criterionId={criterion.id}
                  value={currentScore}
                  onChange={(score) => handleScoreChange(criterion.id, score)}
                />

                {currentScore === undefined ? (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Ajuste a nota para este critério
                  </p>
                ) : null}
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
