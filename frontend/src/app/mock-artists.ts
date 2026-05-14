import type { Artist } from './types';

/** Candidatos de demonstração para desenvolvimento sem API. */
export const initialArtists: Artist[] = [
  {
    id: 1,
    name: 'Luna Santos',
    song: 'Caminhos do Céu',
    genre: 'Pop',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Luna Santos é uma cantora e compositora emergente que mistura pop contemporâneo com elementos da MPB. Sua voz única e letras profundas conquistaram milhares de fãs.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
  },
  {
    id: 2,
    name: 'Banda Horizonte',
    song: 'Noite Infinita',
    genre: 'Rock',
    image:
      'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop',
    bio: 'Banda Horizonte traz o melhor do rock brasileiro com energia contagiante. Formada há 5 anos, a banda já percorreu todo o país levando sua música autoral.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
  },
  {
    id: 3,
    name: 'DJ Beats',
    song: 'Electric Dreams',
    genre: 'Eletrônica',
    image:
      'https://images.unsplash.com/photo-1571609072366-79542423fc3b?w=400&h=400&fit=crop',
    bio: 'DJ Beats revolucionou a cena eletrônica brasileira com suas mixagens inovadoras e shows visuais impressionantes. Suas apresentações são uma experiência única.',
    socialMedia: {
      instagram: 'https://instagram.com',
    },
  },
  {
    id: 4,
    name: 'Maria Violeira',
    song: 'Raízes',
    genre: 'Sertanejo',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    bio: 'Maria Violeira representa a nova geração do sertanejo autêntico, com raízes na música caipira e um toque contemporâneo que encanta todas as gerações.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
  },
  {
    id: 5,
    name: 'Groove Collective',
    song: 'Balanço Soul',
    genre: 'R&B/Soul',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    bio: 'Groove Collective traz a essência do soul e R&B com influências do jazz e funk. O grupo é conhecido por suas harmonias vocais impecáveis e grooves irresistíveis.',
    socialMedia: {
      youtube: 'https://youtube.com',
    },
  },
  {
    id: 6,
    name: 'Rap Consciência',
    song: 'Voz da Quebrada',
    genre: 'Hip Hop',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Rap Consciência usa o hip hop como ferramenta de transformação social. Suas letras abordam questões importantes e inspiram jovens de toda periferia.',
    socialMedia: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
    },
  },
];
