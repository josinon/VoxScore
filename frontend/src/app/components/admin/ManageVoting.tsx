import { useEffect, useState } from 'react';
import { Lock, Unlock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import type { VotingMode } from '../../../lib/api';
import { Artist } from '../../types';

interface ManageVotingProps {
  artists: Artist[];
  openArtistIds: string[];
  onToggleArtist: (artistId: string) => void | Promise<void>;
  listLoading?: boolean;
  resultsPublished: boolean;
  publishLoading?: boolean;
  onSetResultsPublished: (published: boolean) => void | Promise<void>;
  votingMode: VotingMode;
  votingModeLoading?: boolean;
  onSetVotingMode: (mode: VotingMode) => void | Promise<void>;
  judgeWeightPercent: number;
  scoreWeightsLoading?: boolean;
  onSetScoreWeights: (judgeWeightPercent: number) => void | Promise<void>;
}

const MODE_OPTIONS: {
  value: VotingMode;
  title: string;
  description: string;
}[] = [
  {
    value: 'JUDGES_AND_PUBLIC',
    title: 'Jurados + público',
    description:
      'Ambos votam. A nota final usa os percentuais que definir abaixo.',
  },
  {
    value: 'PUBLIC_ONLY',
    title: 'Apenas público',
    description:
      'Só o público vota. A nota final é a média do público (100%).',
  },
  {
    value: 'JUDGES_ONLY',
    title: 'Apenas jurados',
    description:
      'Só os jurados votam. A nota final é a média dos jurados (100%).',
  },
];

export function ManageVoting({
  artists,
  openArtistIds,
  onToggleArtist,
  listLoading = false,
  resultsPublished,
  publishLoading = false,
  onSetResultsPublished,
  votingMode,
  votingModeLoading = false,
  onSetVotingMode,
  judgeWeightPercent,
  scoreWeightsLoading = false,
  onSetScoreWeights,
}: ManageVotingProps) {
  const [draftJudgePercent, setDraftJudgePercent] = useState(judgeWeightPercent);

  useEffect(() => {
    setDraftJudgePercent(judgeWeightPercent);
  }, [judgeWeightPercent]);

  const publicPercent = 100 - draftJudgePercent;
  const weightsDirty = draftJudgePercent !== judgeWeightPercent;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Controle de Votação</h2>
        <p className="text-gray-600">
          Libere a votação após cada apresentação. O estado reflete o campo
          votingOpen no servidor.
        </p>
      </div>

      {listLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
          Carregando candidatos…
        </div>
      ) : null}

      <div
        className="rounded-xl border-2 border-purple-200 bg-white p-6"
        data-testid="voting-mode-panel"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">Modo de votação</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define quem pode votar neste evento e como a nota final é calculada no
          ranking. Votos do grupo excluído deixam de contar (não são apagados).
        </p>
        <div className="grid gap-3">
          {MODE_OPTIONS.map((opt) => {
            const selected = votingMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`voting-mode-${opt.value}`}
                disabled={votingModeLoading}
                onClick={() => void onSetVotingMode(opt.value)}
                className={`text-left rounded-xl border-2 p-4 transition-all disabled:opacity-60 ${
                  selected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <p className="font-semibold text-gray-900">{opt.title}</p>
                <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {votingMode === 'JUDGES_AND_PUBLIC' ? (
          <div
            className="mt-5 rounded-xl border border-purple-100 bg-purple-50/60 p-4"
            data-testid="score-weights-panel"
          >
            <h4 className="font-semibold text-gray-900 mb-1">
              Pesos da nota final
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Defina o percentual dos jurados; o público recebe o restante
              (soma sempre 100%).
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Jurados (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  data-testid="judge-weight-input"
                  value={draftJudgePercent}
                  disabled={scoreWeightsLoading}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isFinite(n)) {
                      return;
                    }
                    setDraftJudgePercent(Math.max(0, Math.min(100, Math.round(n))));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Público (%)
                </span>
                <div
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                  data-testid="public-weight-display"
                >
                  {publicPercent}
                </div>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={draftJudgePercent}
              disabled={scoreWeightsLoading}
              onChange={(e) => setDraftJudgePercent(Number(e.target.value))}
              className="w-full accent-purple-600"
              aria-label="Percentual dos jurados"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="score-weights-save"
                disabled={scoreWeightsLoading || !weightsDirty}
                onClick={() => void onSetScoreWeights(draftJudgePercent)}
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
              >
                {scoreWeightsLoading ? 'A guardar…' : 'Guardar pesos'}
              </button>
              <p className="text-sm text-gray-600">
                Nota = {draftJudgePercent}% jurados + {publicPercent}% público
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`rounded-xl border-2 p-6 mb-6 ${
          resultsPublished
            ? 'border-green-400 bg-green-50'
            : 'border-amber-300 bg-amber-50'
        }`}
        data-testid="ranking-publish-panel"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Resultados do ranking
            </h3>
            <p className="text-sm text-gray-600">
              {resultsPublished ? (
                <>
                  <span className="font-medium text-green-800">Resultados publicados agora.</span>{' '}
                  No app do público, o ranking mostra notas, médias por critério e a
                  colocação final (1º, 2º, 3º…).
                </>
              ) : (
                <>
                  <span className="font-medium text-amber-800">Resultados ainda não publicados.</span>{' '}
                  No app do público, cada candidato aparece só com a quantidade de
                  avaliações recebidas — sem notas e sem ordem de classificação.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            data-testid="ranking-publish-toggle"
            disabled={publishLoading}
            onClick={() => void onSetResultsPublished(!resultsPublished)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shrink-0 ${
              resultsPublished
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
            } disabled:opacity-60`}
          >
            {resultsPublished ? (
              <>
                <EyeOff className="w-5 h-5" />
                Ocultar resultados
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Publicar resultados
              </>
            )}
          </button>
        </div>
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
                  type="button"
                  onClick={() => void onToggleArtist(artist.id)}
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
            <span>Escolha o modo de votação do evento (jurados, público ou ambos)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>
              No modo combinado, ajuste os percentuais jurados/público e guarde
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Aguarde a conclusão de cada apresentação musical</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Clique em &quot;Abrir Votação&quot; para liberar a avaliação</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>
              Quando terminar, use &quot;Publicar resultados&quot; para revelar notas e
              vencedores
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
