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
      .refine(
        (val) => val === undefined || (val >= -90 && val <= 90),
        '緯度は-90から90の間である必要があります'
      )
      .optional(),
    longitude: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      })
      .refine(
        (val) => val === undefined || (val >= -180 && val <= 180),
        '経度は-180から180の間である必要があります'
      )
      .optional(),
  })
  .optional()
  .transform((data) => {
    if (!data || (!data.latitude && !data.longitude)) return undefined;
    if (data.latitude && data.longitude) return data;
    return undefined;
  });
