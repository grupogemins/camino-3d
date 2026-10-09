import { z } from 'zod';

export const PlaceQuerySchema = z.object({
  stopIds: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean).slice(0, 30) : undefined)),
  maxDistanceKm: z.coerce.number().min(0).max(20).optional(),
});
