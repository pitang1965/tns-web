import { z } from 'zod';

export const transportationSchema = z.object({
  type: z.enum(['CAR', 'TRAIN', 'BUS', 'PLANE', 'SHIP', 'OTHER']),
  details: z.string().optional(),
});
