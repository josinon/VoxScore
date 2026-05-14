import { useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { VotingHeader } from './components/VotingHeader';
import { ArtistCard } from './components/ArtistCard';
import { ArtistDetails } from './components/ArtistDetails';
import { CriteriaVoting } from './components/CriteriaVoting';
import { VoteConfirmation } from './components/VoteConfirmation';
import { Ranking } from './components/Ranking';
import { initialArtists } from './mock-artists';
import { Artist, Criterion, Vote, ArtistScore } from './types';

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

/** Área do eleitor; lista de candidatos ainda local (integração API por concluir). */
export function MegadanceVoterApp() {
  const { user, logout } = useAuth();

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

  const artists = initialArtists;
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [votingArtist, setVotingArtist] = useState<Artist | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedArtistName, setConfirmedArtistName] = useState('');
  const [showRanking, setShowRanking] = useState(false);
  const [openArtistIds, setOpenArtistIds] = useState<number[]>([1, 2, 3]);

  const votedArtistIds = votes
    .filter((v) => v.voterRole === voterRole)
    .map((v) => v.artistId);

  const handleLogout = () => {
    setSelectedArtist(null);
    setVotingArtist(null);
    setShowConfirmation(false);
    setShowRanking(false);
    logout();
  };

  const handleVote = (artistId: number) => {
    if (votedArtistIds.includes(artistId)) return;
    if (!openArtistIds.includes(artistId)) return;

    const artist = artists.find((a) => a.id === artistId);
    if (artist) {
      setVotingArtist(artist);
    }
  };

  const handleSubmitVote = (
    artistId: number,
    scores: Record<string, number>,
  ) => {
    const newVote: Vote = {
      artistId,
      scores,
      voterRole,
      timestamp: Date.now(),
    };

    setVotes((prev) => [...prev, newVote]);

    const artist = artists.find((a) => a.id === artistId);
    if (artist) {
      setConfirmedArtistName(artist.name);
      setShowConfirmation(true);
    }

    setVotingArtist(null);
  };

  const handleViewDetails = (artistId: number) => {
    const artist = artists.find((a) => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const rankings: ArtistScore[] = useMemo(() => {
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

    return artistScores.sort((a, b) => b.totalScore - a.totalScore);
  }, [votes, artists]);

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
        rankings={rankings}
        onClose={() => setShowRanking(false)}
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
            {votedArtistIds.length > 0
              ? `Você avaliou ${votedArtistIds.length} artista(s)`
              : 'Escolha um artista com votação liberada para avaliar'}
          </p>
          {openArtistIds.length === 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                ⏳ Aguardando administrador liberar votações. Nenhuma apresentação
                disponível no momento.
              </p>
            </div>
          )}
        </div>

        {artists.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center mb-8">
            <p className="text-gray-500">
              Nenhum candidato cadastrado. Aguarde o administrador adicionar
              candidatos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 mb-8">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                {...artist}
                hasVoted={votedArtistIds.includes(artist.id)}
                isOpen={openArtistIds.includes(artist.id)}
                onVote={handleVote}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

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
              <span>Clique em &quot;Avaliar&quot; para dar notas de 1 a 10 por critérios</span>
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
          hasVoted={votedArtistIds.includes(selectedArtist.id)}
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
