import { useState, useMemo } from 'react';
import { Login } from './components/Login';
import { UserTypeSelection } from './components/UserTypeSelection';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { VotingHeader } from './components/VotingHeader';
import { ArtistCard } from './components/ArtistCard';
import { ArtistDetails } from './components/ArtistDetails';
import { CriteriaVoting } from './components/CriteriaVoting';
import { VoteConfirmation } from './components/VoteConfirmation';
import { Ranking } from './components/Ranking';
import { Artist, Criterion, Vote, ArtistScore } from './types';

interface User {
  name: string;
  email: string;
  photo: string;
}

const JUDGE_CRITERIA: Criterion[] = [
  {
    id: 'technique',
    name: 'Técnica Vocal',
    description: 'Afinação, controle de respiração, projeção e domínio vocal'
  },
  {
    id: 'interpretation',
    name: 'Interpretação',
    description: 'Expressividade, emoção e conexão com a música'
  },
  {
    id: 'stage',
    name: 'Presença de Palco',
    description: 'Carisma, performance e interação com o público'
  },
  {
    id: 'originality',
    name: 'Originalidade',
    description: 'Criatividade e diferenciação na apresentação'
  },
  {
    id: 'composition',
    name: 'Composição',
    description: 'Qualidade da letra, melodia e arranjo musical'
  }
];

const PUBLIC_CRITERIA: Criterion[] = [
  {
    id: 'entertainment',
    name: 'Entretenimento',
    description: 'Quanto você se divertiu com a apresentação'
  },
  {
    id: 'emotion',
    name: 'Emoção',
    description: 'Capacidade de te emocionar e tocar o coração'
  },
  {
    id: 'music',
    name: 'Gostei da Música',
    description: 'Quanto você gostou da música apresentada'
  },
  {
    id: 'replay',
    name: 'Ouviria Novamente',
    description: 'Vontade de ouvir a música novamente'
  }
];

const initialArtists: Artist[] = [
  {
    id: 1,
    name: 'Luna Santos',
    song: 'Caminhos do Céu',
    genre: 'Pop',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Luna Santos é uma cantora e compositora emergente que mistura pop contemporâneo com elementos da MPB. Sua voz única e letras profundas conquistaram milhares de fãs.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 2,
    name: 'Banda Horizonte',
    song: 'Noite Infinita',
    genre: 'Rock',
    image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop',
    bio: 'Banda Horizonte traz o melhor do rock brasileiro com energia contagiante. Formada há 5 anos, a banda já percorreu todo o país levando sua música autoral.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 3,
    name: 'DJ Beats',
    song: 'Electric Dreams',
    genre: 'Eletrônica',
    image: 'https://images.unsplash.com/photo-1571609072366-79542423fc3b?w=400&h=400&fit=crop',
    bio: 'DJ Beats revolucionou a cena eletrônica brasileira com suas mixagens inovadoras e shows visuais impressionantes. Suas apresentações são uma experiência única.',
    socialMedia: {
      instagram: 'https://instagram.com'
    }
  },
  {
    id: 4,
    name: 'Maria Violeira',
    song: 'Raízes',
    genre: 'Sertanejo',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    bio: 'Maria Violeira representa a nova geração do sertanejo autêntico, com raízes na música caipira e um toque contemporâneo que encanta todas as gerações.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 5,
    name: 'Groove Collective',
    song: 'Balanço Soul',
    genre: 'R&B/Soul',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    bio: 'Groove Collective traz a essência do soul e R&B com influências do jazz e funk. O grupo é conhecido por suas harmonias vocais impecáveis e grooves irresistíveis.',
    socialMedia: {
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 6,
    name: 'Rap Consciência',
    song: 'Voz da Quebrada',
    genre: 'Hip Hop',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Rap Consciência usa o hip hop como ferramenta de transformação social. Suas letras abordam questões importantes e inspiram jovens de toda periferia.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'judge' | 'public' | 'admin' | null>(null);
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [votingArtist, setVotingArtist] = useState<Artist | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedArtistName, setConfirmedArtistName] = useState('');
  const [showRanking, setShowRanking] = useState(false);
  const [openArtistIds, setOpenArtistIds] = useState<number[]>([1, 2, 3]);

  const criteria = userType === 'judge' ? JUDGE_CRITERIA : PUBLIC_CRITERIA;

  const votedArtistIds = votes
    .filter(v => v.userType === userType)
    .map(v => v.artistId);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setUserType(null);
    setVotes([]);
    setSelectedArtist(null);
    setVotingArtist(null);
    setShowConfirmation(false);
    setShowRanking(false);
  };

  const handleSelectUserType = (type: 'judge' | 'public' | 'admin') => {
    setUserType(type);
  };

  const handleToggleArtist = (artistId: number) => {
    setOpenArtistIds(prev =>
      prev.includes(artistId)
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const handleAddArtist = (artistData: Omit<Artist, 'id'>) => {
    const newId = Math.max(...artists.map(a => a.id), 0) + 1;
    const newArtist: Artist = { ...artistData, id: newId };
    setArtists(prev => [...prev, newArtist]);
  };

  const handleUpdateArtist = (id: number, artistData: Omit<Artist, 'id'>) => {
    setArtists(prev =>
      prev.map(artist => (artist.id === id ? { ...artistData, id } : artist))
    );
  };

  const handleDeleteArtist = (id: number) => {
    setArtists(prev => prev.filter(artist => artist.id !== id));
    setOpenArtistIds(prev => prev.filter(artistId => artistId !== id));
    setVotes(prev => prev.filter(vote => vote.artistId !== id));
  };

  const handleVote = (artistId: number) => {
    if (votedArtistIds.includes(artistId)) return;
    if (!openArtistIds.includes(artistId)) return;

    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      setVotingArtist(artist);
    }
  };

  const handleSubmitVote = (artistId: number, scores: Record<string, number>) => {
    if (!userType) return;

    const newVote: Vote = {
      artistId,
      scores,
      userType,
      timestamp: Date.now()
    };

    setVotes(prev => [...prev, newVote]);

    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      setConfirmedArtistName(artist.name);
      setShowConfirmation(true);
    }

    setVotingArtist(null);
  };

  const handleViewDetails = (artistId: number) => {
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const rankings: ArtistScore[] = useMemo(() => {
    const artistScores = artists.map(artist => {
      const judgeVotesForArtist = votes.filter(
        v => v.artistId === artist.id && v.userType === 'judge'
      );
      const publicVotesForArtist = votes.filter(
        v => v.artistId === artist.id && v.userType === 'public'
      );

      const judgeScore = judgeVotesForArtist.length > 0
        ? judgeVotesForArtist.reduce((sum, vote) => {
            const voteAvg = Object.values(vote.scores).reduce((a, b) => a + b, 0) / Object.values(vote.scores).length;
            return sum + voteAvg;
          }, 0) / judgeVotesForArtist.length
        : 0;

      const publicScore = publicVotesForArtist.length > 0
        ? publicVotesForArtist.reduce((sum, vote) => {
            const voteAvg = Object.values(vote.scores).reduce((a, b) => a + b, 0) / Object.values(vote.scores).length;
            return sum + voteAvg;
          }, 0) / publicVotesForArtist.length
        : 0;

      const totalScore = (judgeScore * 0.6) + (publicScore * 0.4);

      return {
        artistId: artist.id,
        name: artist.name,
        song: artist.song,
        image: artist.image,
        judgeScore,
        publicScore,
        totalScore,
        judgeVotes: judgeVotesForArtist.length,
        publicVotes: publicVotesForArtist.length
      };
    });

    return artistScores.sort((a, b) => b.totalScore - a.totalScore);
  }, [votes, artists]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!userType) {
    return (
      <UserTypeSelection
        user={user}
        onSelectType={handleSelectUserType}
        onLogout={handleLogout}
      />
    );
  }

  if (userType === 'admin') {
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
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (votingArtist) {
    return (
      <CriteriaVoting
        artist={votingArtist}
        criteria={criteria}
        userType={userType}
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
        userType={userType}
        user={user}
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
                ⏳ Aguardando administrador liberar votações. Nenhuma apresentação disponível no momento.
              </p>
            </div>
          )}
        </div>

        {artists.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center mb-8">
            <p className="text-gray-500">Nenhum candidato cadastrado. Aguarde o administrador adicionar candidatos.</p>
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
              <span>Aguarde o administrador liberar a votação após cada apresentação</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Clique em "Avaliar" para dar notas de 1 a 10 por critérios</span>
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