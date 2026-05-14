import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiError,
  fetchCandidates,
  fetchRanking,
  submitVote,
  type RankingEntryDto,
} from '../lib/api';
import { mapCandidateToArtist } from '../lib/candidate-mapper';
import { isRealtimeEnabled } from '../lib/env';
import { connectVoterRealtime } from '../lib/realtime-client';
import {
  addVotedCandidateId,
  readVotedCandidateIds,
} from '../lib/voted-candidates-storage';
import { VotingHeader } from './components/VotingHeader';
import { ArtistCard } from './components/ArtistCard';
import { ArtistDetails } from './components/ArtistDetails';
import { CriteriaVoting } from './components/CriteriaVoting';
import { VoteConfirmation } from './components/VoteConfirmation';
import { Ranking } from './components/Ranking';
import { Artist, Criterion, RankingRow } from './types';

const JUDGE_CRITERIA: Criterion[] = [
  {
    id: 'vocalTechnique',
    name: 'Técnica Vocal',
    description:
      'Afinação, controle de respiração, projeção e domínio vocal',
  },
  {
    id: 'interpretation',
    name: 'Interpretação',
    description: 'Expressividade, emoção e conexão com a música',
  },
  {
    id: 'stagePresence',
    name: 'Presença de Palco',
    description: 'Carisma, performance e interação com o público',
  },
  {
    id: 'originality',
    name: 'Originalidade',
    description: 'Criatividade e diferenciação na apresentação',
  },
  {
    id: 'composition',
    name: 'Composição',
    description: 'Qualidade da letra, melodia e arranjo musical',
  },
];

const PUBLIC_CRITERIA: Criterion[] = [
  {
    id: 'entertainment',
    name: 'Entretenimento',
    description: 'Quanto você se divertiu com a apresentação',
  },
  {
    id: 'emotion',
    name: 'Emoção',
    description: 'Capacidade de te emocionar e tocar o coração',
  },
  {
    id: 'likedTheMusic',
    name: 'Gostei da Música',
    description: 'Quanto você gostou da música apresentada',
  },
  {
    id: 'wouldListenAgain',
    name: 'Ouviria Novamente',
    description: 'Vontade de ouvir a música novamente',
  },
];

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

function roleLabel(role: string): string {
  switch (role) {
    case 'JUDGE':
      return 'Perfil: jurado';
    case 'PUBLIC':
      return 'Perfil: público';
    default:
      return `Perfil: ${role}`;
  }
}

function mapRankingEntries(
  entries: RankingEntryDto[],
  candidates: Artist[],
): RankingRow[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return entries.map((e) => {
    const c = byId.get(e.candidateId);
    return {
      rank: e.rank,
      artistId: e.candidateId,
      name: e.candidateName,
      song: c?.song ?? '—',
      image: c?.image ?? PLACEHOLDER_PHOTO,
      judgeScore: e.judgeCompositeAverage ?? 0,
      publicScore: e.publicCompositeAverage ?? 0,
      totalScore: e.finalScore,
    };
  });
}

export function MegadanceVoterApp() {
  const { user, logout } = useAuth();

  const [candidates, setCandidates] = useState<Artist[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set());

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [votingArtist, setVotingArtist] = useState<Artist | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedArtistName, setConfirmedArtistName] = useState('');
  const [showRanking, setShowRanking] = useState(false);

  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

  const showRankingRef = useRef(false);
  showRankingRef.current = showRanking;

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    setVotedIds(readVotedCandidateIds(user.id));
  }, [user?.id]);

  const loadCandidates = useCallback(async () => {
    try {
      const rows = await fetchCandidates();
      setCandidates(rows.map(mapCandidateToArtist));
      setListError(null);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar os candidatos.';
      setListError(msg);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const loadRanking = useCallback(async () => {
    setRankingLoading(true);
    try {
      const res = await fetchRanking();
      setRankingRows(mapRankingEntries(res.entries, candidates));
      setRankingError(null);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar o ranking.';
      setRankingError(msg);
    } finally {
      setRankingLoading(false);
    }
  }, [candidates]);

  useEffect(() => {
    if (!showRanking) {
      return;
    }
    void loadRanking();
  }, [showRanking, loadRanking]);

  useEffect(() => {
    if (!user || (user.role !== 'PUBLIC' && user.role !== 'JUDGE')) {
      return;
    }
    return connectVoterRealtime({
      onCandidatesChanged: () => void loadCandidates(),
      onRankingChanged: () => {
        if (showRankingRef.current) {
          void loadRanking();
        }
      },
    });
  }, [user, loadCandidates, loadRanking]);

  if (!user || (user.role !== 'PUBLIC' && user.role !== 'JUDGE')) {
    return <Navigate to="/admin" replace />;
  }

  const voterRole = user.role;
  const criteria = voterRole === 'JUDGE' ? JUDGE_CRITERIA : PUBLIC_CRITERIA;

  const menuUser = {
    name: user.displayName,
    email: user.email,
    photo: user.photoUrl ?? PLACEHOLDER_PHOTO,
  };

  const handleLogout = () => {
    setSelectedArtist(null);
    setVotingArtist(null);
    setShowConfirmation(false);
    setShowRanking(false);
    logout();
  };

  const handleVote = (artistId: string) => {
    if (votedIds.has(artistId)) {
      return;
    }
    const artist = candidates.find((a) => a.id === artistId);
    if (!artist?.votingOpen) {
      return;
    }
    setVotingArtist(artist);
  };

  const handleSubmitVote = async (
    artistId: string,
    scores: Record<string, number>,
  ) => {
    try {
      await submitVote(artistId, scores);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        addVotedCandidateId(user.id, artistId);
        setVotedIds((prev) => new Set(prev).add(artistId));
        throw new Error(
          'Já existe um voto teu para este candidato. Não é possível votar novamente.',
        );
      }
      if (e instanceof ApiError && e.status === 403) {
        throw new Error(
          'Votação fechada para este candidato ou não tens permissão para votar.',
        );
      }
      if (e instanceof ApiError) {
        throw new Error(e.message);
      }
      throw e;
    }

    addVotedCandidateId(user.id, artistId);
    setVotedIds((prev) => new Set(prev).add(artistId));

    const artist = candidates.find((a) => a.id === artistId);
    if (artist) {
      setConfirmedArtistName(artist.name);
      setShowConfirmation(true);
    }
    setVotingArtist(null);
    toast.success('Voto registado com sucesso.');
    void loadCandidates();
    if (showRanking) {
      void loadRanking();
    }
  };

  const handleViewDetails = (artistId: string) => {
    const artist = candidates.find((a) => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  if (votingArtist) {
    return (
      <CriteriaVoting
        artist={votingArtist}
        criteria={criteria}
        voterRole={voterRole}
        onSubmitVote={handleSubmitVote}
        onBack={() => setVotingArtist(null)}
      />
    );
  }

  if (showRanking) {
    return (
      <Ranking
        rankings={rankingRows}
        onClose={() => setShowRanking(false)}
        loading={rankingLoading}
        error={rankingError}
        onRetry={() => void loadRanking()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VotingHeader
        voterRole={voterRole}
        user={menuUser}
        roleLabel={roleLabel(user.role)}
        onShowRanking={() => setShowRanking(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidatos</h2>
          <p className="text-gray-600">
            {votedIds.size > 0
              ? `Você avaliou ${votedIds.size} artista(s)`
              : 'Escolha um artista com votação liberada para avaliar'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isRealtimeEnabled()
              ? 'Atualizações em tempo real via WebSocket (candidatos e ranking).'
              : 'Tempo real desativado: recarregue a página para ver alterações.'}
          </p>
        </div>

        {listLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            A carregar candidatos…
          </div>
        ) : null}

        {listError ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p className="mb-2">{listError}</p>
            <button
              type="button"
              onClick={() => {
                setListLoading(true);
                void loadCandidates();
              }}
              className="font-semibold text-red-900 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {!listLoading && candidates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center mb-8">
            <p className="text-gray-500">
              Nenhum candidato ativo. Aguarde o administrador ou volte mais
              tarde.
            </p>
          </div>
        ) : null}

        {!listLoading && candidates.length > 0 ? (
          <div className="grid gap-4 mb-8">
            {candidates.map((artist) => (
              <ArtistCard
                key={artist.id}
                {...artist}
                hasVoted={votedIds.has(artist.id)}
                isOpen={artist.votingOpen}
                onVote={handleVote}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : null}

        {!listLoading &&
        candidates.length > 0 &&
        !candidates.some((a) => a.votingOpen) ? (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              Nenhuma votação aberta de momento. A lista atualiza em tempo real
              quando o administrador abrir uma votação
              {isRealtimeEnabled() ? ' (WebSocket).' : '.'}
            </p>
          </div>
        ) : null}

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-2">Como Funciona?</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Navegue pelos artistas e conheça cada candidato</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Aguarde o administrador liberar a votação após cada apresentação
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Clique em &quot;Avaliar&quot; para dar notas de 1 a 10 por critérios
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Você pode avaliar todos os artistas com votação liberada!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>Veja o ranking clicando no botão no topo da página</span>
            </li>
          </ul>
        </div>
      </main>

      {selectedArtist && (
        <ArtistDetails
          artist={selectedArtist}
          hasVoted={votedIds.has(selectedArtist.id)}
          onClose={() => setSelectedArtist(null)}
          onVote={handleVote}
        />
      )}

      {showConfirmation && (
        <VoteConfirmation
          artistName={confirmedArtistName}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
}
