import { Star, Play, Lock } from 'lucide-react';

interface ArtistCardProps {
  id: string;
  name: string;
  song: string;
  genre: string;
  image: string;
  hasVoted: boolean;
  isOpen: boolean;
  onVote: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function ArtistCard({
  id,
  name,
  song,
  genre,
  image,
  hasVoted,
  isOpen,
  onVote,
  onViewDetails
}: ArtistCardProps) {
  return (
    <div
      data-testid={`artist-card-${id}`}
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow ${!isOpen ? 'opacity-60' : ''}`}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
          {genre}
        </div>
        {!isOpen && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Lock className="w-4 h-4" />
            Bloqueada
          </div>
        )}
        {hasVoted && isOpen && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" />
            Avaliado
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900">{name}</h3>
        <p className="text-gray-600 text-sm mb-4 flex items-center gap-2">
          <Play className="w-4 h-4" />
          {song}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(id)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ver Detalhes
          </button>
          <button
            onClick={() => onVote(id)}
            disabled={hasVoted || !isOpen}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
              hasVoted || !isOpen
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            {!isOpen ? (
              <>
                <Lock className="w-4 h-4" />
                Bloqueada
              </>
            ) : (
              <>
                <Star className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                {hasVoted ? 'Avaliado' : 'Avaliar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
