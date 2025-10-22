import { z } from 'zod';

export const locationSchema = z
  .object({
    latitude: z.union([z.string(), z.number()]).optional(),
    longitude: z.union([z.string(), z.number()]).optional(),
  })
  .transform((data) => {
    // NaNや無効な値を空値に変換
    const cleanLat =
      data.latitude !== undefined &&
      data.latitude !== null &&
      data.latitude !== '' &&
      !isNaN(Number(data.latitude))
        ? data.latitude
        : undefined;

    const cleanLon =
      data.longitude !== undefined &&
      data.longitude !== null &&
      data.longitude !== '' &&
      !isNaN(Number(data.longitude))
        ? data.longitude
        : undefined;

    return {
      latitude: cleanLat,
      longitude: cleanLon,
    };
  })
  .superRefine((data, ctx) => {
    if (!data.latitude && !data.longitude) return;

    if (
      (!data.latitude && data.longitude) ||
      (data.latitude && !data.longitude)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '緯度と経度は両方入力するか、両方とも空欄にしてください',
        path: ['latitude'], // 片方のフィールドにのみエラーを表示
      });
      return;
    }

    const lat = Number(data.latitude);
    const lon = Number(data.longitude);

    if (isNaN(lat) || isNaN(lon)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '有効な数値を入力してください。',
        path: ['latitude'],
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '緯度は-90から90の間である必要があります。',
        path: ['latitude'],
      });
    }

    if (lon < -180 || lon > 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '経度は-180から180の間である必要があります。',
        path: ['longitude'],
      });
    }
  })
  .transform((data) => ({
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
  }));
