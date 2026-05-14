import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900 p-6 text-center text-white">
      <h1 className="text-3xl font-bold mb-2">Acesso negado</h1>
      <p className="text-white/80 max-w-md mb-8">
        Esta área é reservada a administradores. O teu perfil não tem permissão
        para ver o painel.
      </p>
      <Link
        to="/votacao"
        className="rounded-xl bg-white px-6 py-3 font-semibold text-purple-900 hover:bg-gray-100"
      >
        Voltar à votação
      </Link>
    </div>
  );
}
