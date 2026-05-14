import { X, Heart, Play, Music } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  song: string;
  genre: string;
  image: string;
  bio: string;
  votingOpen: boolean;
  socialMedia: {
    instagram?: string;
    youtube?: string;
  };
}

interface ArtistDetailsProps {
  artist: Artist;
  hasVoted: boolean;
  onClose: () => void;
  onVote: (id: string) => void;
}

export function ArtistDetails({
  artist,
  hasVoted,
  onClose,
  onVote,
}: ArtistDetailsProps) {
  const canVote = artist.votingOpen && !hasVoted;

  return (
    <div
      data-testid="artist-details-modal"
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="relative">
          <img
            src={artist.image}
            alt={artist.name}
            className="w-full h-64 object-cover"
          />
          <button
            type="button"
            data-testid="close-artist-details"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-1">{artist.name}</h2>
            <p className="text-white/90 flex items-center gap-2">
              <Music className="w-4 h-4" />
              {artist.song}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
              {artist.genre}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre o Artista</h3>
            <p className="text-gray-700 leading-relaxed">{artist.bio}</p>
          </div>

          {(artist.socialMedia.instagram || artist.socialMedia.youtube) && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Redes Sociais</h3>
              <div className="flex gap-3">
                {artist.socialMedia.instagram && (
                  <a
                    href={artist.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {artist.socialMedia.youtube && (
                  <a
                    href={artist.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onVote(artist.id);
              onClose();
            }}
            disabled={!canVote}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-lg transition-colors ${
              !canVote
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
            {hasVoted
              ? 'Você já votou!'
              : !artist.votingOpen
                ? 'Votação fechada'
                : 'Votar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
