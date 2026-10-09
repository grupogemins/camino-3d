import type { Achievement } from '@/lib/domain/types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', code: 'first_step', title: 'Primeiro passo', description: 'Planejou a primeira viagem.', icon: 'footprints' },
  { id: 'a2', code: 'first_stage', title: 'Primeira etapa', description: 'Concluiu a primeira etapa.', icon: 'flag' },
  { id: 'a3', code: 'km_50', title: '50 km', description: 'Caminhou 50 km.', icon: 'route' },
  { id: 'a4', code: 'km_100', title: 'Compostela à vista', description: 'Caminhou 100 km: distância mínima para a Compostela oficial.', icon: 'award' },
  { id: 'a5', code: 'border', title: 'Fronteira', description: 'Atravessou de Portugal para a Espanha.', icon: 'globe' },
  { id: 'a6', code: 'polyglot', title: 'Poliglota', description: 'Usou o tradutor 5 vezes.', icon: 'languages' },
  { id: 'a7', code: 'journal_3', title: 'Cronista', description: 'Escreveu 3 notas no diário.', icon: 'notebook-pen' },
  { id: 'a8', code: 'santiago', title: 'Santiago!', description: 'Chegou a Santiago de Compostela.', icon: 'sparkles' },
];
