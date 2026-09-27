import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiError,
  createCandidate,
  deleteCandidate,
  addCandidatePenalty,
  removeCandidatePenalty,
  fetchCandidates,
  fetchRanking,
  fetchUsers,
  patchUser,
  setCandidateVotingOpen,
  setRankingPublished,
  setScoreWeights,
  setVotingMode,
  updateCandidate,
  type CreateCandidateBody,
  type MeResponse,
  type UserRole,
  type UsersListQuery,
  type VotingMode,
} from '../lib/api';
import { mapCandidateToArtist } from '../lib/candidate-mapper';
import { isAdminRealtimeEnabled } from '../lib/env';
import { mapRankingEntriesToRows } from '../lib/ranking-map';
import { connectAdminRealtime } from '../lib/realtime-client';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Ranking } from './components/Ranking';
import type { Artist, RankingRow } from './types';

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop';

function artistToCreateBody(a: Omit<Artist, 'id'>): CreateCandidateBody {
  return {
    name: a.name,
    musicTitle: a.song,
    genre: a.genre,
    bio: a.bio,
    photoUrl: a.image?.trim() ? a.image : DEFAULT_PHOTO,
    instagramUrl: a.socialMedia.instagram?.trim() || null,
    youtubeUrl: a.socialMedia.youtube?.trim() || null,
    votingOpen: a.votingOpen,
    active: a.active,
    displayOrder: a.displayOrder ?? 0,
  };
}

function artistToUpdateBody(a: Omit<Artist, 'id'>): Partial<CreateCandidateBody> {
  return {
    name: a.name,
    musicTitle: a.song,
    genre: a.genre,
    bio: a.bio,
    photoUrl: a.image?.trim() ? a.image : DEFAULT_PHOTO,
    instagramUrl: a.socialMedia.instagram?.trim() || null,
    youtubeUrl: a.socialMedia.youtube?.trim() || null,
    votingOpen: a.votingOpen,
    active: a.active,
    displayOrder: a.displayOrder ?? 0,
  };
}

export function AdminAppShell() {
  const { user, logout } = useAuth();

  const [candidates, setCandidates] = useState<Artist[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [users, setUsers] = useState<MeResponse[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersQuery, setUsersQuery] = useState<UsersListQuery>({
    page: 1,
    limit: 25,
  });

  const [showRanking, setShowRanking] = useState(false);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [votingMode, setVotingModeState] =
    useState<VotingMode>('JUDGES_AND_PUBLIC');
  const [votingModeLoading, setVotingModeLoading] = useState(false);
  const [judgeWeightPercent, setJudgeWeightPercent] = useState(80);
  const [publicWeightPercent, setPublicWeightPercent] = useState(20);
  const [scoreWeightsLoading, setScoreWeightsLoading] = useState(false);

  const menuUser = {
    name: user?.displayName ?? 'Admin',
    email: user?.email ?? '',
    photo: user?.photoUrl ?? PLACEHOLDER_PHOTO,
  };

  const loadCandidates = useCallback(async () => {
    try {
      const rows = await fetchCandidates();
      setCandidates(rows.map(mapCandidateToArtist));
      setListError(null);
    } catch (e) {
      setListError(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar os candidatos.',
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (query: UsersListQuery = {}) => {
    const nextQuery: UsersListQuery = {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      q: query.q,
      role: query.role,
      disabled: query.disabled,
    };
    setUsersQuery(nextQuery);
    setUsersLoading(true);
    try {
      const res = await fetchUsers(nextQuery);
      setUsers(res.items);
      setUsersTotal(res.total);
      setUsersPage(res.page);
      setUsersTotalPages(res.totalPages);
      setUsersError(null);
    } catch (e) {
      setUsersError(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar os usuários.',
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    void fetchRanking()
      .then((res) => {
        setResultsPublished(res.resultsPublished);
        setVotingModeState(res.votingMode ?? 'JUDGES_AND_PUBLIC');
        setJudgeWeightPercent(res.judgeWeightPercent ?? 80);
        setPublicWeightPercent(res.publicWeightPercent ?? 20);
      })
      .catch(() => {});
  }, []);

  const loadRanking = useCallback(async () => {
    setRankingLoading(true);
    try {
      const res = await fetchRanking();
      setResultsPublished(res.resultsPublished);
      setVotingModeState(res.votingMode ?? 'JUDGES_AND_PUBLIC');
      setJudgeWeightPercent(res.judgeWeightPercent ?? 80);
      setPublicWeightPercent(res.publicWeightPercent ?? 20);
      setRankingRows(
        mapRankingEntriesToRows(
          res.entries,
          candidates,
          res.resultsPublished,
          true,
        ),
      );
      setRankingError(null);
    } catch (e) {
      setRankingError(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar o ranking.',
      );
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
    if (!user || !showRanking) {
      return;
    }
    return connectAdminRealtime({
      onCandidatesChanged: () => void loadCandidates(),
      onRankingChanged: () => void loadRanking(),
    });
  }, [user, showRanking, loadCandidates, loadRanking]);

  useEffect(() => {
    if (!showRanking || isAdminRealtimeEnabled()) {
      return;
    }
    const id = window.setInterval(() => {
      void loadRanking();
    }, 8000);
    return () => window.clearInterval(id);
  }, [showRanking, loadRanking]);

  const handleSetResultsPublished = async (published: boolean) => {
    setPublishLoading(true);
    try {
      await setRankingPublished(published);
      toast.success(
        published
          ? 'Resultados publicados para o público.'
          : 'Resultados ocultados do público.',
      );
      await loadRanking();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar resultados.',
      );
    } finally {
      setPublishLoading(false);
    }
  };

  const handleSetVotingMode = async (mode: VotingMode) => {
    setVotingModeLoading(true);
    try {
      const res = await setVotingMode(mode);
      setVotingModeState(res.votingMode);
      toast.success('Modo de votação atualizado.');
      await loadRanking();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar o modo de votação.',
      );
    } finally {
      setVotingModeLoading(false);
    }
  };

  const handleSetScoreWeights = async (judgePercent: number) => {
    setScoreWeightsLoading(true);
    try {
      const res = await setScoreWeights(judgePercent);
      setJudgeWeightPercent(res.judgeWeightPercent);
      setPublicWeightPercent(res.publicWeightPercent);
      toast.success(
        `Pesos guardados: ${res.judgeWeightPercent}% jurados / ${res.publicWeightPercent}% público.`,
      );
      await loadRanking();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar os pesos.',
      );
    } finally {
      setScoreWeightsLoading(false);
    }
  };

  const votingOpenIds = useMemo(
    () => candidates.filter((a) => a.votingOpen).map((a) => a.id),
    [candidates],
  );

  const handleLogout = () => {
    setShowRanking(false);
    logout();
  };

  const handleToggleArtist = async (artistId: string) => {
    const a = candidates.find((x) => x.id === artistId);
    if (!a) {
      return;
    }
    const next = !a.votingOpen;
    try {
      await setCandidateVotingOpen(artistId, next);
      toast.success(next ? 'Votação aberta.' : 'Votação fechada.');
      await loadCandidates();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar a votação.',
      );
    }
  };

  const handleAddArtist = async (artistData: Omit<Artist, 'id'>) => {
    try {
      await createCandidate(artistToCreateBody(artistData));
      toast.success('Candidato criado.');
      await loadCandidates();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao criar candidato.',
      );
    }
  };

  const handleUpdateArtist = async (id: string, artistData: Omit<Artist, 'id'>) => {
    try {
      await updateCandidate(id, artistToUpdateBody(artistData));
      toast.success('Candidato atualizado.');
      await loadCandidates();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar candidato.',
      );
    }
  };

  const handleDeleteArtist = async (id: string) => {
    try {
      await deleteCandidate(id);
      toast.success('Candidato excluído.');
      await loadCandidates();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao excluir candidato.',
      );
    }
  };

  const handleAddPenalty = async (
    candidateId: string,
    body: { amount: number; reason: string },
  ) => {
    try {
      await addCandidatePenalty(candidateId, body);
      toast.success('Penalidade adicionada.');
      await loadCandidates();
      if (showRanking) {
        await loadRanking();
      }
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao adicionar penalidade.',
      );
      throw e;
    }
  };

  const handleRemovePenalty = async (
    candidateId: string,
    penaltyId: string,
  ) => {
    try {
      await removeCandidatePenalty(candidateId, penaltyId);
      toast.success('Penalidade removida.');
      await loadCandidates();
      if (showRanking) {
        await loadRanking();
      }
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao remover penalidade.',
      );
      throw e;
    }
  };

  const handlePatchUser = async (
    id: string,
    body: { role?: UserRole; disabled?: boolean },
  ) => {
    try {
      await patchUser(id, body);
      toast.success('Usuário atualizado.');
      await loadUsers(usersQuery);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar usuário.',
      );
    }
  };

  if (showRanking) {
    return (
      <Ranking
        rankings={rankingRows}
        resultsPublished={resultsPublished}
        votingMode={votingMode}
        judgeWeightPercent={judgeWeightPercent}
        publicWeightPercent={publicWeightPercent}
        adminPreview
        onClose={() => setShowRanking(false)}
        loading={rankingLoading}
        error={rankingError}
        onRetry={() => void loadRanking()}
      />
    );
  }

  return (
    <AdminDashboard
      artists={candidates}
      listLoading={listLoading}
      listError={listError}
      onRetryList={() => {
        setListLoading(true);
        void loadCandidates();
      }}
      openArtistIds={votingOpenIds}
      onToggleArtist={(id) => void handleToggleArtist(id)}
      resultsPublished={resultsPublished}
      publishLoading={publishLoading}
      onSetResultsPublished={(published) =>
        void handleSetResultsPublished(published)
      }
      votingMode={votingMode}
      votingModeLoading={votingModeLoading}
      onSetVotingMode={(mode) => void handleSetVotingMode(mode)}
      judgeWeightPercent={judgeWeightPercent}
      scoreWeightsLoading={scoreWeightsLoading}
      onSetScoreWeights={(percent) => void handleSetScoreWeights(percent)}
      onAddArtist={handleAddArtist}
      onUpdateArtist={handleUpdateArtist}
      onDeleteArtist={handleDeleteArtist}
      onAddPenalty={handleAddPenalty}
      onRemovePenalty={handleRemovePenalty}
      onShowRanking={() => setShowRanking(true)}
      user={menuUser}
      onLogout={handleLogout}
      users={users}
      usersTotal={usersTotal}
      usersPage={usersPage}
      usersTotalPages={usersTotalPages}
      usersLoading={usersLoading}
      usersError={usersError}
      onLoadUsers={loadUsers}
      onPatchUser={handlePatchUser}
    />
  );
}
