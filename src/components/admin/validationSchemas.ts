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
  type: z.enum(['roadside_station', 'sa_pa', 'rv_park', 'convenience_store', 'parking_lot', 'other'] as const),
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
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    { message: '有効な数値を入力してください（0以上）' }
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
  isFree: z.enum(['free', 'paid'] as const, {
    errorMap: () => ({ message: '無料か有料かを選択してください' })
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
  restrictions: z.string(),
  amenities: z.string(),
  notes: z.string().optional(),
});

// 編集用（標高任意）
export const ShachuHakuFormEditSchema = ShachuHakuFormCreateSchema.extend({
  elevation: z.string().optional().refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: '有効な数値を入力してください（0以上）' }
  ),
});

export const ShachuHakuFormSchema = ShachuHakuFormCreateSchema;

// 両方のスキーマに対応する共通の型（elevationをオプショナルにする）
export type ShachuHakuFormData = Omit<z.infer<typeof ShachuHakuFormCreateSchema>, 'elevation'> & {
  elevation?: string;
};