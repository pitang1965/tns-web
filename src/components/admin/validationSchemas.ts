// バリデーションスキーマとタイプ定義

import { z } from 'zod';

// 新規作成用（標高必須）
export const ShachuHakuFormCreateSchema = z.object({
  name: z.string().min(1, '名称を入力してください'),
  lat: z.string().min(1, '緯度を入力してください').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90,
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  lng: z.string().min(1, '経度を入力してください').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180,
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  address: z.string().optional(),
  url: z.string().optional().refine(
    (val) => !val || /^https?:\/\/.+/.test(val),
    { message: '有効なURLを入力してください' }
  ),
  type: z.enum(['roadside_station', 'sa_pa', 'rv_park', 'auto_campground', 'onsen_facility', 'convenience_store', 'parking_lot', 'other'] as const).optional().refine((val) => val !== undefined, {
    message: '種別を選択してください',
  }),
  distanceToToilet: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  distanceToBath: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  distanceToConvenience: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  nearbyToiletLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyToiletLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  nearbyConvenienceLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyConvenienceLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  nearbyBathLat: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90),
    { message: '有効な緯度を入力してください（-90〜90）' }
  ),
  nearbyBathLng: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180),
    { message: '有効な経度を入力してください（-180〜180）' }
  ),
  elevation: z.string().min(1, '標高を入力してください').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= -10 && Number(val) <= 3776,
    { message: '有効な数値を入力してください（-10〜3776）' }
  ),
  // 新評価システム（客観的データ） - フラット構造
  securityHasGate: z.boolean().default(false),
  securityHasLighting: z.boolean().default(false),
  securityHasStaff: z.boolean().default(false),
  nightNoiseHasNoiseIssues: z.boolean().default(false),
  nightNoiseNearBusyRoad: z.boolean().default(false),
  nightNoiseIsQuietArea: z.boolean().default(false),
  // 旧評価システム（段階的廃止予定）
  quietnessLevel: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  securityLevel: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  overallRating: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
    { message: '1〜5の数値を入力してください' }
  ),
  hasRoof: z.boolean(),
  hasPowerOutlet: z.boolean(),
  isFree: z.boolean().optional().refine((val) => val !== undefined, {
    message: '費用を選択してください',
  }),
  pricePerNight: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
  priceNote: z.string().optional(),
  capacity: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1),
    { message: '有効な数値を入力してください（1以上）' }
  ),
  capacityLarge: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 1),
    { message: '有効な数値を入力してください（1以上）' }
  ),
  restrictions: z.string(),
  amenities: z.string(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // 座標の重複チェック用のヘルパー関数
  const areCoordinatesEqual = (
    lat1?: string,
    lng1?: string,
    lat2?: string,
    lng2?: string
  ): boolean => {
    // 両方の座標が入力されている場合のみチェック
    if (!lat1 || !lng1 || !lat2 || !lng2 || lat1 === '' || lng1 === '' || lat2 === '' || lng2 === '') {
      return false;
    }

    const num1Lat = Number(lat1);
    const num1Lng = Number(lng1);
    const num2Lat = Number(lat2);
    const num2Lng = Number(lng2);

    // 数値変換に失敗した場合はfalse
    if (isNaN(num1Lat) || isNaN(num1Lng) || isNaN(num2Lat) || isNaN(num2Lng)) {
      return false;
    }

    // 緯度と経度が両方一致する場合はtrue
    return num1Lat === num2Lat && num1Lng === num2Lng;
  };

  // 車中泊場所とトイレの座標重複チェック
  if (areCoordinatesEqual(data.lat, data.lng, data.nearbyToiletLat, data.nearbyToiletLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '車中泊場所とトイレの座標が同じです。異なる座標を入力してください',
      path: ['nearbyToiletLat'],
    });
  }

  // 車中泊場所と入浴施設の座標重複チェック
  if (areCoordinatesEqual(data.lat, data.lng, data.nearbyBathLat, data.nearbyBathLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '車中泊場所と入浴施設の座標が同じです。異なる座標を入力してください',
      path: ['nearbyBathLat'],
    });
  }

  // 車中泊場所とコンビニの座標重複チェック
  if (areCoordinatesEqual(data.lat, data.lng, data.nearbyConvenienceLat, data.nearbyConvenienceLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '車中泊場所とコンビニの座標が同じです。異なる座標を入力してください',
      path: ['nearbyConvenienceLat'],
    });
  }

  // トイレと入浴施設の座標重複チェック
  if (areCoordinatesEqual(data.nearbyToiletLat, data.nearbyToiletLng, data.nearbyBathLat, data.nearbyBathLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'トイレと入浴施設の座標が同じです。異なる座標を入力してください',
      path: ['nearbyBathLat'],
    });
  }

  // トイレとコンビニの座標重複チェック
  if (areCoordinatesEqual(data.nearbyToiletLat, data.nearbyToiletLng, data.nearbyConvenienceLat, data.nearbyConvenienceLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'トイレとコンビニの座標が同じです。異なる座標を入力してください',
      path: ['nearbyConvenienceLat'],
    });
  }

  // 入浴施設とコンビニの座標重複チェック
  if (areCoordinatesEqual(data.nearbyBathLat, data.nearbyBathLng, data.nearbyConvenienceLat, data.nearbyConvenienceLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '入浴施設とコンビニの座標が同じです。異なる座標を入力してください',
      path: ['nearbyConvenienceLat'],
    });
  }
});

// 編集用も作成用と同じスキーマ（標高は必須）
export const ShachuHakuFormEditSchema = ShachuHakuFormCreateSchema;

export const ShachuHakuFormSchema = ShachuHakuFormCreateSchema;

// フォームデータの型
export type ShachuHakuFormData = z.infer<typeof ShachuHakuFormCreateSchema>;