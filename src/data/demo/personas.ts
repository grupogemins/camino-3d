/** Personas fictícias usadas em testes e demonstrações (ver docs/02-personas-e-jornadas.md). */
export const personas = [
  { id: 'ana', name: 'Ana, a iniciante', days: 12, dailyKm: 20, fitness: 'beginner', budget: 50, origin: 'porto', mode: 'easiest' },
  { id: 'klaus', name: 'Klaus, o experiente', days: 9, dailyKm: 28, fitness: 'advanced', budget: 70, origin: 'porto', mode: 'quietest' },
  { id: 'lucia', name: 'Lucía, a econômica', days: 11, dailyKm: 24, fitness: 'intermediate', budget: 35, origin: 'porto', mode: 'cheapest' },
  { id: 'tom', name: 'Tom, o social', days: 6, dailyKm: 22, fitness: 'intermediate', budget: 55, origin: 'tui', mode: 'social' },
  { id: 'marta', name: 'Marta, com mobilidade reduzida', days: 10, dailyKm: 12, fitness: 'beginner', budget: 80, origin: 'tui', mode: 'accessible' },
  { id: 'kenji', name: 'Kenji, o internacional', days: 12, dailyKm: 21, fitness: 'intermediate', budget: 60, origin: 'porto', mode: 'scenic' },
] as const;
