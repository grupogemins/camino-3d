import type { AvatarConfiguration } from '@/lib/domain/types';

export const DEFAULT_AVATAR: AvatarConfiguration = {
  bodyType: 'average',
  presentation: 'neutral',
  skinTone: '#c68863',
  hairStyle: 'short',
  hairColor: '#3b2a20',
  outfit: 'jacket_pants',
  outfitColor: '#5b6b3a',
  backpack: 'large',
  backpackColor: '#24405e',
  hat: 'sun_hat',
  shoes: 'boots',
  staff: 'wooden',
  accessories: ['shell'],
};

export const SKIN_TONES = ['#f4d3b5', '#e8b98f', '#c68863', '#a0663f', '#7a4a2c', '#4b2e1e'];
export const HAIR_COLORS = ['#1f1a17', '#3b2a20', '#7a4a24', '#b8823f', '#d9c08a', '#9a9a9a', '#b5452f'];
export const CLOTH_COLORS = ['#5b6b3a', '#24405e', '#b5532f', '#2f7d74', '#d1a43a', '#6d4c7d', '#8a8f96', '#e8e2d4'];
