import { useState } from 'react';
import { Music, Users, Settings, TrendingUp, LayoutDashboard } from 'lucide-react';
import { UserMenu } from '../UserMenu';
import { ManageCandidates } from './ManageCandidates';
import { ManageUsers } from './ManageUsers';
import { ManageVoting } from './ManageVoting';
import { Artist } from '../../types';

interface AdminDashboardProps {
  artists: Artist[];
  openArtistIds: number[];
  onToggleArtist: (artistId: number) => void;
  onAddArtist: (artist: Omit<Artist, 'id'>) => void;
  onUpdateArtist: (id: number, artist: Omit<Artist, 'id'>) => void;
  onDeleteArtist: (id: number) => void;
  onShowRanking: () => void;
  user: {
    name: string;
    email: string;
    photo: string;
  };
  onLogout: () => void;
}

type TabType = 'overview' | 'candidates' | 'users' | 'voting';

export function AdminDashboard({
  artists,
  openArtistIds,
  onToggleArtist,
  onAddArtist,
  onUpdateArtist,
  onDeleteArtist,
  onShowRanking,
  user,
  onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'candidates' as TabType, label: 'Candidatos', icon: Music },
    { id: 'users' as TabType, label: 'Usuários', icon: Users },
    { id: 'voting' as TabType, label: 'Votação', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-white/90">Megadance 2026</p>
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

          <div className="flex gap-1 overflow-x-auto pb-2 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-600">Total de Candidatos</h3>
                  <Music className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{artists.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-600">Votações Abertas</h3>
                  <Settings className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{openArtistIds.length}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-600">Votações Fechadas</h3>
                  <Settings className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{artists.length - openArtistIds.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Rápido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('candidates')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-left"
                >
                  <Music className="w-6 h-6 mb-2" />
                  <h3 className="font-bold mb-1">Gerenciar Candidatos</h3>
                  <p className="text-sm text-white/90">Adicionar, editar ou remover candidatos</p>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-left"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <h3 className="font-bold mb-1">Gerenciar Usuários</h3>
                  <p className="text-sm text-white/90">Controlar roles e acessos</p>
                </button>

                <button
                  onClick={() => setActiveTab('voting')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-left"
                >
                  <Settings className="w-6 h-6 mb-2" />
                  <h3 className="font-bold mb-1">Controlar Votação</h3>
                  <p className="text-sm text-white/90">Abrir e fechar votações</p>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Instruções de Operação</h3>
              <div className="space-y-2 text-sm">
                <p>✓ <strong>Candidatos:</strong> Gerencie a lista completa de artistas participantes</p>
                <p>✓ <strong>Usuários:</strong> Controle permissões de jurados, público e outros administradores</p>
                <p>✓ <strong>Votação:</strong> Abra votações após cada apresentação e feche quando necessário</p>
                <p>✓ <strong>Ranking:</strong> Acompanhe resultados em tempo real</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <ManageCandidates
            artists={artists}
            onAddArtist={onAddArtist}
            onUpdateArtist={onUpdateArtist}
            onDeleteArtist={onDeleteArtist}
          />
        )}

        {activeTab === 'users' && <ManageUsers />}

        {activeTab === 'voting' && (
          <ManageVoting
            artists={artists}
            openArtistIds={openArtistIds}
            onToggleArtist={onToggleArtist}
          />
        )}
      </main>
    </div>
  );
}
