import { Music2, TrendingUp, Award, Users } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface VotingHeaderProps {
  userType: 'judge' | 'public';
  user: {
    name: string;
    email: string;
    photo: string;
  };
  onShowRanking: () => void;
  onLogout: () => void;
}

export function VotingHeader({ userType, user, onShowRanking, onLogout }: VotingHeaderProps) {
  return (
    <header className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg z-10">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Megadance 2026</h1>
            <p className="text-sm text-white/90 flex items-center gap-2">
              {userType === 'judge' ? (
                <>
                  <Award className="w-4 h-4" />
                  Painel de Jurado
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Votação Popular
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowRanking}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden sm:inline">Ranking</span>
          </button>
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
