import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Ranking } from './components/Ranking';
import { initialArtists } from './mock-artists';
import { Artist, Vote, RankingRow } from './types';

const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

function nextMockArtistId(artists: Artist[]): string {
  const nums = artists
    .map((a) => parseInt(a.id, 10))
    .filter((n) => !Number.isNaN(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}

export function AdminAppShell() {
  const { user, logout } = useAuth();
  const [artists, setArtists] = useState<Artist[]>(() =>
    initialArtists.map((a) => ({ ...a })),
  );
  const [openArtistIds, setOpenArtistIds] = useState<string[]>(['1', '2', '3']);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [showRanking, setShowRanking] = useState(false);

  const menuUser = {
    name: user?.displayName ?? 'Admin',
    email: user?.email ?? '',
    photo: user?.photoUrl ?? PLACEHOLDER_PHOTO,
  };

  const handleLogout = () => {
    setShowRanking(false);
    logout();
  };

  const handleToggleArtist = (artistId: string) => {
    setOpenArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId],
    );
  };

  const handleAddArtist = (artistData: Omit<Artist, 'id'>) => {
    const newArtist: Artist = {
      ...artistData,
      id: nextMockArtistId(artists),
    };
    setArtists((prev) => [...prev, newArtist]);
  };

  const handleUpdateArtist = (id: string, artistData: Omit<Artist, 'id'>) => {
    setArtists((prev) =>
      prev.map((artist) => (artist.id === id ? { ...artistData, id } : artist)),
    );
  };

  const handleDeleteArtist = (id: string) => {
    setArtists((prev) => prev.filter((artist) => artist.id !== id));
    setOpenArtistIds((prev) => prev.filter((artistId) => artistId !== id));
    setVotes((prev) => prev.filter((vote) => vote.artistId !== id));
  };

  const rankings: RankingRow[] = useMemo(() => {
    const artistScores = artists.map((artist) => {
      const judgeVotesForArtist = votes.filter(
        (v) => v.artistId === artist.id && v.voterRole === 'JUDGE',
      );
      const publicVotesForArtist = votes.filter(
        (v) => v.artistId === artist.id && v.voterRole === 'PUBLIC',
      );

      const judgeScore =
        judgeVotesForArtist.length > 0
          ? judgeVotesForArtist.reduce((sum, vote) => {
              const vals = Object.values(vote.scores);
              const voteAvg =
                vals.reduce((a, b) => a + b, 0) / vals.length;
              return sum + voteAvg;
            }, 0) / judgeVotesForArtist.length
          : 0;

      const publicScore =
        publicVotesForArtist.length > 0
          ? publicVotesForArtist.reduce((sum, vote) => {
              const vals = Object.values(vote.scores);
              const voteAvg =
                vals.reduce((a, b) => a + b, 0) / vals.length;
              return sum + voteAvg;
            }, 0) / publicVotesForArtist.length
          : 0;

      const totalScore = judgeScore * 0.6 + publicScore * 0.4;

      return {
        rank: 0,
        artistId: artist.id,
        name: artist.name,
        song: artist.song,
        image: artist.image,
        judgeScore,
        publicScore,
        totalScore,
        judgeVotes: judgeVotesForArtist.length,
        publicVotes: publicVotesForArtist.length,
      };
    });

    const sorted = [...artistScores].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [votes, artists]);

  if (showRanking) {
    return (
      <Ranking
        rankings={rankings}
        onClose={() => setShowRanking(false)}
      />
    );
  }

  return (
    <AdminDashboard
      artists={artists}
      openArtistIds={openArtistIds}
      onToggleArtist={handleToggleArtist}
      onAddArtist={handleAddArtist}
      onUpdateArtist={handleUpdateArtist}
      onDeleteArtist={handleDeleteArtist}
      onShowRanking={() => setShowRanking(true)}
      user={menuUser}
      onLogout={handleLogout}
    />
  );
}
