import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number(), // 緯度
  longitude: z.number(), // 経度
});
