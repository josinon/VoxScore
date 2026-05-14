import { useState } from 'react';
import { Shield, Users as UsersIcon, Award, Ban, CheckCircle, Search } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  photo: string;
  role: 'PUBLIC' | 'JUDGE' | 'ADMIN';
  status: 'active' | 'blocked';
  joinedAt: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Usuário Demo',
    email: 'usuario@exemplo.com',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    role: 'ADMIN',
    status: 'active',
    joinedAt: '2026-05-01'
  },
  {
    id: 2,
    name: 'Maria Silva',
    email: 'maria.silva@exemplo.com',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    role: 'JUDGE',
    status: 'active',
    joinedAt: '2026-05-05'
  },
  {
    id: 3,
    name: 'João Santos',
    email: 'joao.santos@exemplo.com',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    role: 'PUBLIC',
    status: 'active',
    joinedAt: '2026-05-10'
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@exemplo.com',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    role: 'JUDGE',
    status: 'active',
    joinedAt: '2026-05-12'
  },
  {
    id: 5,
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@exemplo.com',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    role: 'PUBLIC',
    status: 'blocked',
    joinedAt: '2026-05-08'
  }
];

export function ManageUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filterRole, setFilterRole] = useState<'ALL' | 'PUBLIC' | 'JUDGE' | 'ADMIN'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'blocked'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangeRole = (userId: number, newRole: 'PUBLIC' | 'JUDGE' | 'ADMIN') => {
    setUsers(prev =>
      prev.map(user => (user.id === userId ? { ...user, role: newRole } : user))
    );
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, status: user.status === 'active' ? 'blocked' : 'active' }
          : user
      )
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'JUDGE':
        return <Award className="w-4 h-4" />;
      default:
        return <UsersIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'JUDGE':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchRole = filterRole === 'ALL' || user.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || user.status === filterStatus;
    const matchSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h2>
        <p className="text-gray-600">Total: {users.length} usuário(s)</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-semibold text-gray-700 mb-3">Buscar e Filtrar</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por Nome ou Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o nome ou email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="ADMIN">Administradores</option>
                <option value="JUDGE">Jurados</option>
                <option value="PUBLIC">Público</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="active">Ativos</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-2">Nenhum usuário encontrado.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-xl p-4 shadow-md ${
                user.status === 'blocked' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{user.name}</h3>
                    {user.status === 'blocked' && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        <Ban className="w-3 h-3" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm truncate mb-2">{user.email}</p>
                  <p className="text-gray-500 text-xs">
                    Entrou em {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChangeRole(user.id, 'PUBLIC')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        user.role === 'PUBLIC'
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                      title="Definir como Público"
                    >
                      <UsersIcon className="w-3 h-3" />
                      Público
                    </button>
                    <button
                      onClick={() => handleChangeRole(user.id, 'JUDGE')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        user.role === 'JUDGE'
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300'
                      }`}
                      title="Definir como Jurado"
                    >
                      <Award className="w-3 h-3" />
                      Jurado
                    </button>
                    <button
                      onClick={() => handleChangeRole(user.id, 'ADMIN')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}
                      title="Definir como Admin"
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(user.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      user.status === 'blocked'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {user.status === 'blocked' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Bloquear
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
