import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import {
  ApiError,
  createCandidate,
  deleteCandidate,
  fetchCandidates,
  fetchRanking,
  fetchUsers,
  patchUser,
  setCandidateVotingOpen,
  updateCandidate,
  type CreateCandidateBody,
  type MeResponse,
  type UserRole,
} from '../lib/api';
import { mapCandidateToArtist } from '../lib/candidate-mapper';
import { mapRankingEntriesToRows } from '../lib/ranking-map';
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
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [showRanking, setShowRanking] = useState(false);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);

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

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const rows = await fetchUsers();
      setUsers(rows);
      setUsersError(null);
    } catch (e) {
      setUsersError(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível carregar os utilizadores.',
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const loadRanking = useCallback(async () => {
    setRankingLoading(true);
    try {
      const res = await fetchRanking();
      setRankingRows(mapRankingEntriesToRows(res.entries, candidates));
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
      toast.success('Candidato eliminado.');
      await loadCandidates();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao eliminar candidato.',
      );
    }
  };

  const handlePatchUser = async (
    id: string,
    body: { role?: UserRole; disabled?: boolean },
  ) => {
    try {
      await patchUser(id, body);
      toast.success('Utilizador atualizado.');
      await loadUsers();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Erro ao atualizar utilizador.',
      );
    }
  };

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
      onAddArtist={handleAddArtist}
      onUpdateArtist={handleUpdateArtist}
      onDeleteArtist={handleDeleteArtist}
      onShowRanking={() => setShowRanking(true)}
      user={menuUser}
      onLogout={handleLogout}
      users={users}
      usersLoading={usersLoading}
      usersError={usersError}
      onLoadUsers={() => void loadUsers()}
      onPatchUser={handlePatchUser}
    />
  );
}
