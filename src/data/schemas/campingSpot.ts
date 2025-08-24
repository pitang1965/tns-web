import { z } from 'zod';

export const CampingSpotTypeSchema = z.enum([
  'roadside_station',
  'paid_parking',
  'sa_pa',
  'park',
  'shrine_temple',
  'beach',
  'mountain',
  'other'
]);

export const CampingSpotPricingSchema = z.object({
  isFree: z.boolean(),
  pricePerNight: z.number().min(0).optional(),
  priceNote: z.string().optional(),
});

export const CampingSpotSchema = z.object({
  name: z.string().min(1, '名称を入力してください').trim(),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ], {
    required_error: '座標を指定してください',
  }),
  prefecture: z.string().min(1, '都道府県を選択してください').trim(),
  address: z.string().trim().optional(),
  type: CampingSpotTypeSchema,
  distanceToToilet: z.number().min(0, 'トイレまでの距離は0以上で入力してください'),
  distanceToBath: z.number().min(0).optional(),
  quietnessLevel: z.number().int().min(1).max(5),
  securityLevel: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  hasRoof: z.boolean().default(false),
  hasPowerOutlet: z.boolean().default(false),
  isGatedPaid: z.boolean().default(false),
  pricing: CampingSpotPricingSchema,
  capacity: z.number().int().min(1, '収容台数は1以上で入力してください').default(1),
  restrictions: z.array(z.string().trim()).default([]),
  amenities: z.array(z.string().trim()).default([]),
  notes: z.string().min(1, '備考を入力してください').trim(),
  isVerified: z.boolean().default(false),
  submittedBy: z.string().trim().optional(),
  lastVerified: z.date().optional(),
});

// For client-side forms (without MongoDB _id)
export const CampingSpotCreateSchema = CampingSpotSchema;

// For server-side operations (with MongoDB _id)
export const CampingSpotWithIdSchema = CampingSpotSchema.extend({
  _id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// CSV import schema with string coordinates that will be converted
export const CampingSpotCSVSchema = z.object({
  name: z.string().min(1).trim(),
  lat: z.string().refine((val) => !isNaN(Number(val)), {
    message: "緯度は数値で入力してください",
  }),
  lng: z.string().refine((val) => !isNaN(Number(val)), {
    message: "経度は数値で入力してください",
  }),
  prefecture: z.string().min(1).trim(),
  address: z.string().trim().optional().default(''),
  type: z.string().refine((val) => CampingSpotTypeSchema.safeParse(val).success, {
    message: "有効な種別を選択してください",
  }),
  distanceToToilet: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "トイレまでの距離は0以上の数値で入力してください",
  }),
  distanceToBath: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "入浴施設までの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  quietnessLevel: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 5;
  }, {
    message: "静けさレベルは1-5の整数で入力してください",
  }),
  securityLevel: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 5;
  }, {
    message: "治安レベルは1-5の整数で入力してください",
  }),
  overallRating: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 5;
  }, {
    message: "総合評価は1-5の整数で入力してください",
  }),
  hasRoof: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "屋根付きはtrue/falseで入力してください",
  }),
  hasPowerOutlet: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "電源はtrue/falseで入力してください",
  }),
  isGatedPaid: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "ゲート付き有料はtrue/falseで入力してください",
  }),
  isFree: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "無料はtrue/falseで入力してください",
  }),
  pricePerNight: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "一泊料金は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  priceNote: z.string().trim().optional().default(''),
  capacity: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 1;
  }, {
    message: "収容台数は1以上の整数で入力してください",
  }),
  restrictions: z.string().trim().optional().default(''),
  amenities: z.string().trim().optional().default(''),
  notes: z.string().min(1).trim(),
});

// Filter schema for search functionality
export const CampingSpotFilterSchema = z.object({
  prefecture: z.string().optional(),
  type: z.array(CampingSpotTypeSchema).optional(),
  maxDistanceToToilet: z.number().min(0).optional(),
  maxDistanceToBath: z.number().min(0).optional(),
  minQuietnessLevel: z.number().int().min(1).max(5).optional(),
  minSecurityLevel: z.number().int().min(1).max(5).optional(),
  minOverallRating: z.number().int().min(1).max(5).optional(),
  hasRoof: z.boolean().optional(),
  hasPowerOutlet: z.boolean().optional(),
  isGatedPaid: z.boolean().optional(),
  isFreeOnly: z.boolean().optional(),
  maxPricePerNight: z.number().min(0).optional(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
});

// Type exports
export type CampingSpot = z.infer<typeof CampingSpotSchema>;
export type CampingSpotWithId = z.infer<typeof CampingSpotWithIdSchema>;
export type CampingSpotCSV = z.infer<typeof CampingSpotCSVSchema>;
export type CampingSpotFilter = z.infer<typeof CampingSpotFilterSchema>;
export type CampingSpotType = z.infer<typeof CampingSpotTypeSchema>;

// Helper function to convert CSV row to CampingSpot
export function csvRowToCampingSpot(csvRow: CampingSpotCSV): CampingSpot {
  return {
    name: csvRow.name,
    coordinates: [Number(csvRow.lng), Number(csvRow.lat)],
    prefecture: csvRow.prefecture,
    address: csvRow.address || undefined,
    type: csvRow.type as CampingSpotType,
    distanceToToilet: Number(csvRow.distanceToToilet),
    distanceToBath: csvRow.distanceToBath ? Number(csvRow.distanceToBath) : undefined,
    quietnessLevel: Number(csvRow.quietnessLevel) as 1 | 2 | 3 | 4 | 5,
    securityLevel: Number(csvRow.securityLevel) as 1 | 2 | 3 | 4 | 5,
    overallRating: Number(csvRow.overallRating) as 1 | 2 | 3 | 4 | 5,
    hasRoof: csvRow.hasRoof === 'true',
    hasPowerOutlet: csvRow.hasPowerOutlet === 'true',
    isGatedPaid: csvRow.isGatedPaid === 'true',
    pricing: {
      isFree: csvRow.isFree === 'true',
      pricePerNight: csvRow.pricePerNight ? Number(csvRow.pricePerNight) : undefined,
      priceNote: csvRow.priceNote || undefined,
    },
    capacity: Number(csvRow.capacity),
    restrictions: csvRow.restrictions ? csvRow.restrictions.split(',').map(r => r.trim()).filter(r => r) : [],
    amenities: csvRow.amenities ? csvRow.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
    notes: csvRow.notes,
    isVerified: false,
  };
}

// Type labels for UI
export const CampingSpotTypeLabels: Record<CampingSpotType, string> = {
  roadside_station: '道の駅',
  paid_parking: '有料駐車場',
  sa_pa: 'SA/PA',
  park: '公園',
  shrine_temple: '神社・寺',
  beach: '海岸・浜辺',
  mountain: '山間部',
  other: 'その他',
};

export const PrefectureOptions = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];