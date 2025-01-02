import { z } from 'zod';

export const locationSchema = z
  .object({
    latitude: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      })
      .optional(),
    longitude: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      })
      .optional(),
  })
  .optional()
  .transform((data) => {
    if (!data || (!data.latitude && !data.longitude)) return undefined;
    if (data.latitude && data.longitude) return data;
    return undefined;
  });
