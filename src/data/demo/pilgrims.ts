/** PEREGRINOS FICTÍCIOS para demonstrar a comunidade. Nenhuma pessoa real. */
import type { AvatarConfiguration, PublicPilgrim } from '@/lib/domain/types';
import { publishableLocation } from '@/lib/privacy/location';
import { DEFAULT_AVATAR } from './avatarDefaults';
import { getStop } from './stops';

type Input = [id: string, name: string, country: string, langs: string[], stopId: string, pace: PublicPilgrim['pace'], chat: boolean, granularity: 'city' | 'approximate' | 'precise_temporary', interests: PublicPilgrim['interests'], avatar: Partial<AvatarConfiguration>];

const INPUT: Input[] = [
  ['p1', 'Marie (demo)', 'FR', ['fr', 'en'], 'pontedelima', 'medium', true, 'approximate', ['churches', 'history'], { outfitColor: '#b5532f', backpackColor: '#d1a43a', hairStyle: 'long', hairColor: '#7a4a24', presentation: 'feminine' }],
  ['p2', 'Jonas (demo)', 'DE', ['de', 'en'], 'pontedelima', 'fast', true, 'city', ['nature'], { outfitColor: '#2f7d74', hat: 'cap', staff: 'poles', skinTone: '#f4d3b5' }],
  ['p3', 'Beatriz (demo)', 'BR', ['pt', 'es'], 'rubiaes', 'slow', true, 'approximate', ['gastronomy', 'festivals'], { hairStyle: 'curly', hairColor: '#1f1a17', skinTone: '#7a4a2c', backpackColor: '#b5532f' }],
  ['p4', 'Sean (demo)', 'IE', ['en'], 'tui', 'medium', false, 'city', ['history'], { hairColor: '#b5452f', outfit: 'tshirt_shorts', hat: 'none' }],
  ['p5', 'Yuki (demo)', 'JP', ['ja', 'en'], 'barcelos', 'medium', true, 'city', ['museums', 'churches'], { hairStyle: 'bun', skinTone: '#e8b98f', outfitColor: '#6d4c7d' }],
  ['p6', 'Carmen (demo)', 'ES', ['es', 'gl'], 'pontevedra', 'slow', true, 'precise_temporary', ['markets', 'gastronomy'], { hairStyle: 'long', presentation: 'feminine', outfitColor: '#d1a43a' }],
  ['p7', 'Luca (demo)', 'IT', ['it', 'es'], 'redondela', 'fast', true, 'approximate', ['nature', 'history'], { hat: 'beanie', staff: 'poles', backpack: 'medium' }],
  ['p8', 'Grace (demo)', 'US', ['en'], 'caldas', 'medium', true, 'city', ['churches'], { skinTone: '#4b2e1e', hairStyle: 'curly', outfitColor: '#24405e' }],
  ['p9', 'Tomás (demo)', 'PT', ['pt', 'en'], 'vilarinho', 'fast', false, 'approximate', ['nature'], { hairStyle: 'bald', staff: 'none', backpack: 'small' }],
  ['p10', 'Anneke (demo)', 'NL', ['nl', 'en', 'de'], 'viana', 'medium', true, 'city', ['nature', 'gastronomy'], { hairColor: '#d9c08a', outfitColor: '#2f7d74' }],
];

const NOW_FOR_DEMO = new Date('2026-10-01T09:00:00Z');

export const demoPilgrims: PublicPilgrim[] = INPUT.map(([id, displayName, countryCode, languages, stopId, pace, availableToChat, granularity, interests, avatar], i) => {
  const stop = getStop(stopId)!;
  const realish: [number, number] = [stop.coord[0] + ((i % 3) - 1) * 0.011, stop.coord[1] + ((i % 2) - 0.5) * 0.013];
  return {
    id,
    displayName,
    countryCode,
    languages,
    routeId: ['viana'].includes(stopId) ? 'costa' : 'central',
    pace,
    interests,
    availableToChat,
    avatar: { ...DEFAULT_AVATAR, ...avatar },
    location: publishableLocation({
      userId: id,
      coord: realish,
      cityName: stop.name,
      granularity,
      now: NOW_FOR_DEMO,
      // demonstração: compartilhamento preciso ainda válido
      preciseExpiresAt: granularity === 'precise_temporary' ? '2099-01-01T00:00:00Z' : undefined,
    }),
    isDemo: true,
  };
});

export const demoGroups = [
  { id: 'g-pontedelima-rubiaes', title: 'Etapa Ponte de Lima → Rubiães', stopId: 'pontedelima', members: 14 },
  { id: 'g-tui', title: 'Peregrinos em Tui esta semana', stopId: 'tui', members: 22 },
  { id: 'g-pontevedra-caldas', title: 'Etapa Pontevedra → Caldas de Reis', stopId: 'pontevedra', members: 9 },
  { id: 'g-lusofonos', title: 'Lusófonos no Caminho', stopId: 'porto', members: 31 },
];

/** Respostas automáticas do chat de demonstração (claramente simuladas). */
export const DEMO_REPLIES = [
  'Bom Caminho! Estou chegando à próxima vila em mais ou menos 1 hora.',
  'Vamos combinar no café da praça principal? Local público é melhor.',
  'Ótimo! Também vou dormir em um albergue por lá.',
  'Obrigado pela dica da fonte de água!',
];
