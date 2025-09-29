import { z } from 'zod';

export const transportationSchema = z.object({
  type: z
    .enum(['CAR', 'TRAIN', 'BUS', 'PLANE', 'SHIP', 'OTHER'])
    .default('OTHER'),
  details: z.string().nullable(),
});

export type TransportationType = 'CAR' | 'TRAIN' | 'BUS' | 'PLANE' | 'SHIP' | 'OTHER';
