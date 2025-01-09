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
        (val) => val !== undefined && val >= -90 && val <= 90,
        '緯度は-90から90の間である必要があります'
      ),
    longitude: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      })
      .refine(
        (val) => val !== undefined && val >= -180 && val <= 180,
        '経度は-180から180の間である必要があります'
      ),
  })
  .refine(
    (data) => data.latitude !== undefined && data.longitude !== undefined,
    {
      message: '緯度と経度の両方を入力してください',
      path: ['latitude', 'longitude'], // エラーメッセージを両方に適用
    }
  )
  .transform((data) => ({
    latitude: data.latitude,
    longitude: data.longitude,
  }));
