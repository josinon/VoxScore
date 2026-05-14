import { useState } from 'react';
import { toast } from 'sonner';
import { Shield, Users as UsersIcon, Award, Ban, CheckCircle, Search } from 'lucide-react';
import type { MeResponse, UserRole } from '../../../lib/api';
import { ApiError } from '../../../lib/api';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface ManageUsersProps {
  users: MeResponse[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPatchUser: (
    id: string,
    body: { role?: UserRole; disabled?: boolean },
  ) => Promise<void>;
}

type PendingPatch =
  | { kind: 'role'; userId: string; nextRole: UserRole; displayName: string }
  | { kind: 'disabled'; userId: string; nextDisabled: boolean; displayName: string };

export function ManageUsers({
  users,
  loading,
  error,
  onRetry,
  onPatchUser,
}: ManageUsersProps) {
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [filterDisabled, setFilterDisabled] = useState<'ALL' | 'active' | 'disabled'>(
    'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [pending, setPending] = useState<PendingPatch | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchDis =
      filterDisabled === 'ALL' ||
      (filterDisabled === 'active' && !u.disabled) ||
      (filterDisabled === 'disabled' && u.disabled);
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchRole && matchDis && matchSearch;
  });

  const runPending = async () => {
    if (!pending) {
      return;
    }
    setSubmitting(true);
    try {
      if (pending.kind === 'role') {
        await onPatchUser(pending.userId, { role: pending.nextRole });
      } else {
        await onPatchUser(pending.userId, { disabled: pending.nextDisabled });
      }
      setPending(null);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : 'Não foi possível aplicar a alteração.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestRole = (u: MeResponse, next: UserRole) => {
    if (u.role === next) {
      return;
    }
    setPending({
      kind: 'role',
      userId: u.id,
      nextRole: next,
      displayName: u.displayName,
    });
  };

  const requestToggleDisabled = (u: MeResponse) => {
    setPending({
      kind: 'disabled',
      userId: u.id,
      nextDisabled: !u.disabled,
      displayName: u.displayName,
    });
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'role' ? (
                <>
                  Alterar o papel de <strong>{pending.displayName}</strong> para{' '}
                  <strong>{pending.nextRole}</strong>?
                </>
              ) : pending ? (
                <>
                  {pending.nextDisabled
                    ? 'Desativar esta conta? O utilizador deixa de poder iniciar sessão.'
                    : 'Reativar esta conta?'}
                  <span className="block mt-2">Utilizador: {pending.displayName}</span>
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => void runPending()}
            >
              {submitting ? 'A guardar…' : 'Confirmar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h2>
        <p className="text-gray-600">Total: {users.length} utilizador(es) — dados do servidor</p>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <p className="mb-2">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold text-red-900 underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          A carregar utilizadores…
        </div>
      ) : null}

      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-semibold text-gray-700 mb-3">Buscar e Filtrar</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nome ou email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome ou email…"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Papel</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="ADMIN">Administradores</option>
                <option value="JUDGE">Jurados</option>
                <option value="PUBLIC">Público</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filterDisabled}
                onChange={(e) =>
                  setFilterDisabled(e.target.value as typeof filterDisabled)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">Todos</option>
                <option value="active">Ativos</option>
                <option value="disabled">Desativados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!loading && filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-2">Nenhum utilizador encontrado.</p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Limpar busca
              </button>
            ) : null}
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              className={`bg-white rounded-xl p-4 shadow-md ${u.disabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    u.photoUrl ??
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
                  }
                  alt={u.displayName}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900 truncate">{u.displayName}</h3>
                    {u.disabled ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        <Ban className="w-3 h-3" />
                        Desativado
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(u.role)}`}
                    >
                      {getRoleIcon(u.role)}
                      {u.role}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm truncate mb-2">{u.email}</p>
                  <p className="text-gray-500 text-xs">
                    Criado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => requestRole(u, 'PUBLIC')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        u.role === 'PUBLIC'
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <UsersIcon className="w-3 h-3" />
                      Público
                    </button>
                    <button
                      type="button"
                      onClick={() => requestRole(u, 'JUDGE')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        u.role === 'JUDGE'
                          ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      Jurado
                    </button>
                    <button
                      type="button"
                      onClick={() => requestRole(u, 'ADMIN')}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-1 ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => requestToggleDisabled(u)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      u.disabled
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {u.disabled ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Reativar
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        Desativar
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
