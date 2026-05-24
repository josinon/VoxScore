import { useState } from 'react';
import { Check, ChevronLeft, Minus, Plus, Star } from 'lucide-react';
import { formatVoteScore } from '../../lib/vote-score-format';
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
const SLIDER_MIN = 0;

function clampScore(value: number): number {
  const steps = Math.round(value / SCORE_STEP);
  const clamped = Math.min(
    SCORE_MAX,
    Math.max(SCORE_MIN, steps * SCORE_STEP),
  );
  return Math.round(clamped * 10) / 10;
}

function lightHaptic(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8);
  }
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
  const sliderValue = value ?? SLIDER_MIN;
  const rated = value !== undefined;

  const setScore = (next: number, haptic = false) => {
    const wasUnrated = value === undefined;
    onChange(clampScore(next));
    if (haptic && wasUnrated) {
      lightHaptic();
    }
  };

  const adjust = (delta: number) => {
    if (value === undefined) {
      setScore(SCORE_MIN, true);
      return;
    }
    setScore(value + delta);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center">
        <span
          key={rated ? formatVoteScore(value) : 'empty'}
          className={`inline-block text-5xl font-bold tabular-nums leading-none transition-transform duration-200 ${
            rated
              ? 'scale-100 text-purple-600'
              : 'scale-95 text-gray-300'
          }`}
        >
          {rated ? formatVoteScore(value) : '—'}
        </span>
        <span className="mt-1 text-sm text-gray-500">de 10</span>
        {!rated ? (
          <p className="mt-2 text-center text-xs text-gray-500">
            Deslize para dar sua nota
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 px-0.5">
        <button
          type="button"
          aria-label="Diminuir nota em 0,5"
          data-testid={`score-decrease-${criterionId}`}
          disabled={!rated || value <= SCORE_MIN}
          onClick={() => adjust(-SCORE_STEP)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-700 shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <Slider
            data-testid={`score-slider-${criterionId}`}
            min={SLIDER_MIN}
            max={SCORE_MAX}
            step={SCORE_STEP}
            value={[sliderValue]}
            onValueChange={(vals) => {
              const raw = vals[0] ?? SLIDER_MIN;
              if (raw < SCORE_MIN) {
                return;
              }
              setScore(raw, true);
            }}
            className="[&_[data-slot=slider-track]]:h-4 [&_[data-slot=slider-track]]:bg-purple-100 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-600 [&_[data-slot=slider-range]]:to-pink-600 [&_[data-slot=slider-thumb]]:size-8 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-purple-600 [&_[data-slot=slider-thumb]]:shadow-md"
            aria-label={`Nota para ${criterionId}`}
            aria-valuetext={
              rated
                ? `${formatVoteScore(value)} de 10`
                : 'Sem nota'
            }
          />
          <div className="mt-2 flex justify-between text-xs font-medium text-gray-400">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Aumentar nota em 0,5"
          data-testid={`score-increase-${criterionId}`}
          disabled={rated && value >= SCORE_MAX}
          onClick={() => adjust(SCORE_STEP)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-700 shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="sr-only pointer-events-none" aria-hidden>
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

  const ratedCount = criteria.filter((c) => scores[c.id] !== undefined).length;
  const allCriteriaRated = ratedCount === criteria.length;

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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white shadow-lg">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <img
              src={artist.image}
              alt={artist.name}
              className="h-16 w-16 rounded-full border-2 border-white/30 object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">{artist.name}</h1>
              <p className="text-sm text-white/90">{artist.song}</p>
              <p className="mt-1 text-xs text-white/70">
                {voterRole === 'JUDGE'
                  ? 'Avaliação de Jurado'
                  : 'Avaliação do Público'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Avalie os critérios
          </h2>
          <p className="text-sm text-gray-600">
            Deslize a barra em cada critério (notas de 1 a 10, em passos de 0,5).
            Os botões + e − servem para ajustes finos.
          </p>
        </div>

        <div className="mb-6 space-y-4">
          {criteria.map((criterion) => {
            const currentScore = scores[criterion.id];
            const isRated = currentScore !== undefined;

            return (
              <div
                key={criterion.id}
                data-testid={`criterion-row-${criterion.id}`}
                className={`rounded-xl bg-white p-6 shadow-sm transition-shadow ${
                  isRated
                    ? 'ring-2 ring-purple-200 ring-offset-1'
                    : 'ring-1 ring-gray-100'
                }`}
              >
                <div className="mb-5 flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isRated
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    aria-hidden
                  >
                    {isRated ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">?</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 font-bold text-gray-900">
                      {criterion.name}
                    </h3>
                    <p className="line-clamp-3 text-sm text-gray-600">
                      {criterion.description}
                    </p>
                  </div>
                </div>

                <CriterionScorePicker
                  criterionId={criterion.id}
                  value={currentScore}
                  onChange={(score) => handleScoreChange(criterion.id, score)}
                />
              </div>
            );
          })}
        </div>

        {allCriteriaRated ? (
          <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-purple-900">
              Resumo da sua avaliação
            </h3>
            <ul className="space-y-2 text-sm text-purple-900">
              {criteria.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="shrink-0 font-bold tabular-nums">
                    {formatVoteScore(scores[c.id]!)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Progresso</h3>
            <span className="text-sm text-gray-600">
              {ratedCount} de {criteria.length} critérios
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-[width] duration-300"
              style={{
                width: `${(ratedCount / criteria.length) * 100}%`,
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
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all ${
            allCriteriaRated && !submitting
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
        >
          <Star className="h-5 w-5" />
          {submitting
            ? 'Enviando…'
            : allCriteriaRated
              ? 'Confirmar Avaliação'
              : 'Complete todos os critérios'}
        </button>
      </main>
    </div>
  );
}
