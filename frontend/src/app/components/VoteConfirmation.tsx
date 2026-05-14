import { CheckCircle, Home } from 'lucide-react';

interface VoteConfirmationProps {
  artistName: string;
  onClose: () => void;
}

export function VoteConfirmation({ artistName, onClose }: VoteConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Voto Confirmado!</h2>
          <p className="text-gray-600">
            Seu voto para <span className="font-semibold text-purple-600">{artistName}</span> foi registrado com sucesso.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-900">
            Obrigado por participar do Megadance 2026! Acompanhe os resultados em tempo real.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
