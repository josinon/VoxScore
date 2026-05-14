import { useState } from 'react';
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { Artist } from '../../types';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';

interface ManageCandidatesProps {
  artists: Artist[];
  onAddArtist: (artist: Omit<Artist, 'id'>) => void | Promise<void>;
  onUpdateArtist: (id: string, artist: Omit<Artist, 'id'>) => void | Promise<void>;
  onDeleteArtist: (id: string) => void | Promise<void>;
}

export function ManageCandidates({
  artists,
  onAddArtist,
  onUpdateArtist,
  onDeleteArtist,
}: ManageCandidatesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    song: '',
    genre: '',
    image: '',
    bio: '',
    instagram: '',
    youtube: '',
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing =
      editingId !== null ? artists.find((a) => a.id === editingId) : undefined;
    const artistData: Omit<Artist, 'id'> = {
      name: formData.name,
      song: formData.song,
      genre: formData.genre,
      image:
        formData.image ||
        'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop',
      bio: formData.bio,
      votingOpen: existing?.votingOpen ?? false,
      active: formData.active,
      displayOrder: existing?.displayOrder ?? 0,
      socialMedia: {
        instagram: formData.instagram || undefined,
        youtube: formData.youtube || undefined,
      },
    };

    setSubmitting(true);
    try {
      if (editingId !== null) {
        await onUpdateArtist(editingId, artistData);
      } else {
        await onAddArtist(artistData);
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingId(artist.id);
    setFormData({
      name: artist.name,
      song: artist.song,
      genre: artist.genre,
      image: artist.image,
      bio: artist.bio,
      instagram: artist.socialMedia.instagram || '',
      youtube: artist.socialMedia.youtube || '',
      active: artist.active,
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }
    setSubmitting(true);
    try {
      await onDeleteArtist(deleteId);
      setDeleteId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      song: '',
      genre: '',
      image: '',
      bio: '',
      instagram: '',
      youtube: '',
      active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o candidato no servidor. Votos associados deixam de contar no
              ranking conforme a regra da API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={() => void confirmDelete()}
            >
              {submitting ? 'A eliminar…' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Candidatos</h2>
          <p className="text-gray-600">Total: {artists.length} candidato(s)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Candidato
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId !== null ? 'Editar Candidato' : 'Novo Candidato'}
            </h3>
            <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome do Artista *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Luna Santos"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  required
                  value={formData.song}
                  onChange={(e) => setFormData({ ...formData, song: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Caminhos do Céu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Gênero Musical *
                </label>
                <input
                  type="text"
                  required
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Pop, Rock, Sertanejo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  URL da Foto
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Biografia *</label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Conte sobre o artista..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Instagram (opcional)
                </label>
                <input
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://instagram.com/artista"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  YouTube (opcional)
                </label>
                <input
                  type="url"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://youtube.com/@artista"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300"
              />
              Candidato ativo (visível na lista pública de votação)
            </label>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-5 h-5" />
                {submitting
                  ? 'A guardar…'
                  : editingId !== null
                    ? 'Salvar Alterações'
                    : 'Adicionar Candidato'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {artists.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhum candidato cadastrado.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Candidato
            </button>
          </div>
        ) : (
          artists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4 p-4">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{artist.name}</h3>
                    {!artist.active ? (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Inativo
                      </span>
                    ) : null}
                    {artist.votingOpen ? (
                      <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Votação aberta
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Votação fechada
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm truncate mb-1">{artist.song}</p>
                  <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                    {artist.genre}
                  </span>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(artist)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(artist.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
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
