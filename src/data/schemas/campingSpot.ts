import { z } from 'zod';

// Security features schema
export const CampingSpotSecuritySchema = z.object({
  hasGate: z.boolean().default(false),
  hasLighting: z.boolean().default(false),
  hasStaff: z.boolean().default(false),
});

// Night noise factors schema
export const CampingSpotNightNoiseSchema = z.object({
  hasNoiseIssues: z.boolean().default(false),
  nearBusyRoad: z.boolean().default(false),
  isQuietArea: z.boolean().default(false),
});

export const CampingSpotTypeSchema = z.enum([
  'roadside_station',
  'sa_pa',
  'rv_park',
  'auto_campground',
  'onsen_facility',
  'convenience_store',
  'parking_lot',
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
  url: z.string().url('有効なURLを入力してください').trim().optional(),
  type: CampingSpotTypeSchema,
  distanceToToilet: z.number().min(0, 'トイレまでの距離は0以上で入力してください').optional(),
  distanceToBath: z.number().min(0).optional(),
  distanceToConvenience: z.number().min(0).optional(),
  nearbyToiletCoordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ]).optional(),
  nearbyConvenienceCoordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ]).optional(),
  nearbyBathCoordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90)    // latitude
  ]).optional(),
  elevation: z.number().min(-10, '標高は-10以上で入力してください').max(3776, '標高は3776以下で入力してください'),
  security: CampingSpotSecuritySchema.default({}),
  nightNoise: CampingSpotNightNoiseSchema.default({}),
  hasRoof: z.boolean().default(false),
  hasPowerOutlet: z.boolean().default(false),
  pricing: CampingSpotPricingSchema,
  capacity: z.number().int().min(1, '収容台数は1以上で入力してください').optional(),
  capacityLarge: z.number().int().min(1, '大型車収容台数は1以上で入力してください').optional(),
  restrictions: z.array(z.string().trim()).default([]),
  amenities: z.array(z.string().trim()).default([]),
  notes: z.string().trim().optional(),
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

// CSV import schema with string coordinates that will be converted (English headers)
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
  url: z.string().refine((val) => {
    if (val === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "有効なURLを入力してください",
  }).optional().default(''),
  type: z.string().refine((val) => CampingSpotTypeSchema.safeParse(val).success, {
    message: "有効な種別を選択してください",
  }),
  distanceToToilet: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "トイレまでの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  distanceToBath: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "入浴施設までの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  distanceToConvenience: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "コンビニまでの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  nearbyToiletLat: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "トイレの緯度は空欄または数値で入力してください",
  }).optional().default(''),
  nearbyToiletLng: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "トイレの経度は空欄または数値で入力してください",
  }).optional().default(''),
  nearbyConvenienceLat: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "コンビニの緯度は空欄または数値で入力してください",
  }).optional().default(''),
  nearbyConvenienceLng: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "コンビニの経度は空欄または数値で入力してください",
  }).optional().default(''),
  nearbyBathLat: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "入浴施設の緯度は空欄または数値で入力してください",
  }).optional().default(''),
  nearbyBathLng: z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "入浴施設の経度は空欄または数値で入力してください",
  }).optional().default(''),
  elevation: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= -10 && Number(val) <= 3776), {
    message: "標高は空欄または-10〜3776の数値で入力してください",
  }).optional().default(''),
  securityHasGate: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "セキュリティ-ゲート有無はtrue/falseで入力してください",
  }),
  securityHasLighting: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "セキュリティ-照明有無はtrue/falseで入力してください",
  }),
  securityHasStaff: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "セキュリティ-管理人・職員有無はtrue/falseで入力してください",
  }),
  nightNoiseHasNoiseIssues: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "夜間騒音-騒音問題はtrue/falseで入力してください",
  }),
  nightNoiseNearBusyRoad: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "夜間騒音-交通量多い道路近くはtrue/falseで入力してください",
  }),
  nightNoiseIsQuietArea: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "夜間騒音-静かなエリアはtrue/falseで入力してください",
  }),
  hasRoof: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "屋根付きはtrue/falseで入力してください",
  }),
  hasPowerOutlet: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "電源はtrue/falseで入力してください",
  }),
  hasGate: z.string().refine((val) => val === 'true' || val === 'false', {
    message: "ゲート付きはtrue/falseで入力してください",
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
    return val === '' || (!isNaN(num) && Number.isInteger(num) && num >= 1);
  }, {
    message: "収容台数は空欄または1以上の整数で入力してください",
  }).optional().default(''),
  capacityLarge: z.string().refine((val) => {
    const num = Number(val);
    return val === '' || (!isNaN(num) && Number.isInteger(num) && num >= 1);
  }, {
    message: "大型車収容台数は空欄または1以上の整数で入力してください",
  }).optional().default(''),
  restrictions: z.string().trim().optional().default(''),
  amenities: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

// CSV import schema with Japanese headers
export const CampingSpotCSVJapaneseSchema = z.object({
  '名称': z.string().min(1).trim(),
  '緯度': z.string().refine((val) => !isNaN(Number(val)), {
    message: "緯度は数値で入力してください",
  }),
  '経度': z.string().refine((val) => !isNaN(Number(val)), {
    message: "経度は数値で入力してください",
  }),
  '都道府県': z.string().min(1).trim(),
  '住所': z.string().trim().optional().default(''),
  'URL': z.string().refine((val) => {
    if (val === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "有効なURLを入力してください",
  }).optional().default(''),
  'タイプ': z.string().refine((val) => CampingSpotTypeSchema.safeParse(val).success, {
    message: "有効な種別を選択してください",
  }),
  'トイレまでの距離(m)': z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "トイレまでの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  'お風呂までの距離(m)': z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "入浴施設までの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  'コンビニまでの距離(m)': z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "コンビニまでの距離は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  'トイレ緯度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "トイレの緯度は空欄または数値で入力してください",
  }).optional().default(''),
  'トイレ経度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "トイレの経度は空欄または数値で入力してください",
  }).optional().default(''),
  'コンビニ緯度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "コンビニの緯度は空欄または数値で入力してください",
  }).optional().default(''),
  'コンビニ経度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "コンビニの経度は空欄または数値で入力してください",
  }).optional().default(''),
  'お風呂緯度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "入浴施設の緯度は空欄または数値で入力してください",
  }).optional().default(''),
  'お風呂経度': z.string().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "入浴施設の経度は空欄または数値で入力してください",
  }).optional().default(''),
  '標高(m)': z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= -10 && Number(val) <= 3776), {
    message: "標高は空欄または-10〜3776の数値で入力してください",
  }).optional().default(''),
  'セキュリティ-ゲート有無(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "ゲート有無はtrue/false/空欄で入力してください",
  }).optional().default(''),
  'セキュリティ-照明十分(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "照明有無はtrue/false/空欄で入力してください",
  }).optional().default(''),
  'セキュリティ-管理人職員有無(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "管理人・職員有無はtrue/false/空欄で入力してください",
  }).optional().default(''),
  '夜間騒音-騒音問題有無(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "夜間騒音問題はtrue/false/空欄で入力してください",
  }).optional().default(''),
  '夜間騒音-交通量多い道路近く(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "交通量多い道路近くはtrue/false/空欄で入力してください",
  }).optional().default(''),
  '夜間騒音-静かなエリア(true/false)': z.string().refine((val) => val === 'true' || val === 'false' || val === '', {
    message: "静かなエリアはtrue/false/空欄で入力してください",
  }).optional().default(''),
  '屋根あり(true/false)': z.string().refine((val) => val === 'true' || val === 'false', {
    message: "屋根付きはtrue/falseで入力してください",
  }),
  '電源あり(true/false)': z.string().refine((val) => val === 'true' || val === 'false', {
    message: "電源はtrue/falseで入力してください",
  }),
  'ゲート付き(true/false)': z.string().refine((val) => val === 'true' || val === 'false', {
    message: "ゲート付きはtrue/falseで入力してください",
  }),
  '無料(true/false)': z.string().refine((val) => val === 'true' || val === 'false', {
    message: "無料はtrue/falseで入力してください",
  }),
  '1泊料金': z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "一泊料金は空欄または0以上の数値で入力してください",
  }).optional().default(''),
  '料金備考': z.string().trim().optional().default(''),
  '収容台数': z.string().refine((val) => {
    const num = Number(val);
    return val === '' || (!isNaN(num) && Number.isInteger(num) && num >= 1);
  }, {
    message: "収容台数は空欄または1以上の整数で入力してください",
  }).optional().default(''),
  '大型車収容台数': z.string().refine((val) => {
    const num = Number(val);
    return val === '' || (!isNaN(num) && Number.isInteger(num) && num >= 1);
  }, {
    message: "大型車収容台数は空欄または1以上の整数で入力してください",
  }).optional().default(''),
  '制限事項': z.string().trim().optional().default(''),
  '設備': z.string().trim().optional().default(''),
  '備考': z.string().trim().optional().default(''),
});

// Filter schema for search functionality
export const CampingSpotFilterSchema = z.object({
  prefecture: z.string().optional(),
  type: z.array(CampingSpotTypeSchema).optional(),
  maxDistanceToToilet: z.number().min(0).optional(),
  maxDistanceToBath: z.number().min(0).optional(),
  minQuietnessLevel: z.number().int().min(1).max(5).optional(),
  minSecurityLevel: z.number().int().min(1).max(5).optional(),
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

// Public submission schema (simplified for non-admin users)
export const CampingSpotSubmissionSchema = z.object({
  name: z.string().min(1, '名称を入力してください').trim(),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90),   // latitude
    ])
    .optional(),
  prefecture: z.string().min(1, '都道府県を選択してください').trim(),
  address: z.string().trim().optional(),
  url: z.string().url('有効なURLを入力してください').trim().optional(),
  type: CampingSpotTypeSchema.default('other'),
  hasRoof: z.boolean().default(false),
  hasPowerOutlet: z.boolean().default(false),
  isFree: z.boolean().default(true),
  pricePerNight: z.number().min(0).optional(),
  priceNote: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  submitterEmail: z.string().email('有効なメールアドレスを入力してください').optional(),
  submitterName: z.string().trim().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  submittedAt: z.date().default(() => new Date()),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
});

// For server-side operations (with MongoDB _id)
export const CampingSpotSubmissionWithIdSchema = CampingSpotSubmissionSchema.extend({
  _id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type CampingSpot = z.infer<typeof CampingSpotSchema>;
export type CampingSpotWithId = z.infer<typeof CampingSpotWithIdSchema>;
export type CampingSpotSubmission = z.infer<typeof CampingSpotSubmissionSchema>;
export type CampingSpotSubmissionWithId = z.infer<typeof CampingSpotSubmissionWithIdSchema>;
export type CampingSpotCSV = z.infer<typeof CampingSpotCSVSchema>;
export type CampingSpotCSVJapanese = z.infer<typeof CampingSpotCSVJapaneseSchema>;
export type CampingSpotFilter = z.infer<typeof CampingSpotFilterSchema>;
export type CampingSpotType = z.infer<typeof CampingSpotTypeSchema>;
export type CampingSpotSecurity = z.infer<typeof CampingSpotSecuritySchema>;
export type CampingSpotNightNoise = z.infer<typeof CampingSpotNightNoiseSchema>;

// Helper function to convert CSV row to CampingSpot (English headers)
export function csvRowToCampingSpot(csvRow: CampingSpotCSV): CampingSpot {
  return {
    name: csvRow.name,
    coordinates: [Number(csvRow.lng), Number(csvRow.lat)],
    prefecture: csvRow.prefecture,
    address: csvRow.address || undefined,
    url: csvRow.url || undefined,
    type: csvRow.type as CampingSpotType,
    distanceToToilet: csvRow.distanceToToilet ? Number(csvRow.distanceToToilet) : undefined,
    distanceToBath: csvRow.distanceToBath ? Number(csvRow.distanceToBath) : undefined,
    distanceToConvenience: csvRow.distanceToConvenience ? Number(csvRow.distanceToConvenience) : undefined,
    nearbyToiletCoordinates: (csvRow.nearbyToiletLat && csvRow.nearbyToiletLng)
      ? [Number(csvRow.nearbyToiletLng), Number(csvRow.nearbyToiletLat)] : undefined,
    nearbyConvenienceCoordinates: (csvRow.nearbyConvenienceLat && csvRow.nearbyConvenienceLng)
      ? [Number(csvRow.nearbyConvenienceLng), Number(csvRow.nearbyConvenienceLat)] : undefined,
    nearbyBathCoordinates: (csvRow.nearbyBathLat && csvRow.nearbyBathLng)
      ? [Number(csvRow.nearbyBathLng), Number(csvRow.nearbyBathLat)] : undefined,
    elevation: csvRow.elevation ? Number(csvRow.elevation) : 0,
    security: {
      hasGate: csvRow.securityHasGate === 'true',
      hasLighting: csvRow.securityHasLighting === 'true',
      hasStaff: csvRow.securityHasStaff === 'true',
    },
    nightNoise: {
      hasNoiseIssues: csvRow.nightNoiseHasNoiseIssues === 'true',
      nearBusyRoad: csvRow.nightNoiseNearBusyRoad === 'true',
      isQuietArea: csvRow.nightNoiseIsQuietArea === 'true',
    },
    hasRoof: csvRow.hasRoof === 'true',
    hasPowerOutlet: csvRow.hasPowerOutlet === 'true',
    pricing: {
      isFree: csvRow.isFree === 'true',
      pricePerNight: csvRow.pricePerNight ? Number(csvRow.pricePerNight) : undefined,
      priceNote: csvRow.priceNote || undefined,
    },
    capacity: csvRow.capacity ? Number(csvRow.capacity) : undefined,
    capacityLarge: csvRow.capacityLarge ? Number(csvRow.capacityLarge) : undefined,
    restrictions: csvRow.restrictions ? csvRow.restrictions.split(',').map(r => r.trim()).filter(r => r) : [],
    amenities: csvRow.amenities ? csvRow.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
    notes: csvRow.notes || undefined,
    isVerified: false,
  };
}

// Helper function to convert Japanese CSV row to CampingSpot
export function csvJapaneseRowToCampingSpot(csvRow: CampingSpotCSVJapanese): CampingSpot {
  return {
    name: csvRow['名称'],
    coordinates: [Number(csvRow['経度']), Number(csvRow['緯度'])],
    prefecture: csvRow['都道府県'],
    address: csvRow['住所'] || undefined,
    url: csvRow['URL'] || undefined,
    type: csvRow['タイプ'] as CampingSpotType,
    distanceToToilet: csvRow['トイレまでの距離(m)'] ? Number(csvRow['トイレまでの距離(m)']) : undefined,
    distanceToBath: csvRow['お風呂までの距離(m)'] ? Number(csvRow['お風呂までの距離(m)']) : undefined,
    distanceToConvenience: csvRow['コンビニまでの距離(m)'] ? Number(csvRow['コンビニまでの距離(m)']) : undefined,
    nearbyToiletCoordinates: (csvRow['トイレ緯度'] && csvRow['トイレ経度']) 
      ? [Number(csvRow['トイレ経度']), Number(csvRow['トイレ緯度'])] : undefined,
    nearbyConvenienceCoordinates: (csvRow['コンビニ緯度'] && csvRow['コンビニ経度']) 
      ? [Number(csvRow['コンビニ経度']), Number(csvRow['コンビニ緯度'])] : undefined,
    nearbyBathCoordinates: (csvRow['お風呂緯度'] && csvRow['お風呂経度']) 
      ? [Number(csvRow['お風呂経度']), Number(csvRow['お風呂緯度'])] : undefined,
    elevation: csvRow['標高(m)'] ? Number(csvRow['標高(m)']) : 0,
    security: {
      hasGate: csvRow['セキュリティ-ゲート有無(true/false)'] === 'true',
      hasLighting: csvRow['セキュリティ-照明十分(true/false)'] === 'true',
      hasStaff: csvRow['セキュリティ-管理人職員有無(true/false)'] === 'true',
    },
    nightNoise: {
      hasNoiseIssues: csvRow['夜間騒音-騒音問題有無(true/false)'] === 'true',
      nearBusyRoad: csvRow['夜間騒音-交通量多い道路近く(true/false)'] === 'true',
      isQuietArea: csvRow['夜間騒音-静かなエリア(true/false)'] === 'true',
    },
    hasRoof: csvRow['屋根あり(true/false)'] === 'true',
    hasPowerOutlet: csvRow['電源あり(true/false)'] === 'true',
    pricing: {
      isFree: csvRow['無料(true/false)'] === 'true',
      pricePerNight: csvRow['1泊料金'] ? Number(csvRow['1泊料金']) : undefined,
      priceNote: csvRow['料金備考'] || undefined,
    },
    capacity: csvRow['収容台数'] ? Number(csvRow['収容台数']) : undefined,
    capacityLarge: csvRow['大型車収容台数'] ? Number(csvRow['大型車収容台数']) : undefined,
    restrictions: csvRow['制限事項'] ? csvRow['制限事項'].split(',').map(r => r.trim()).filter(r => r) : [],
    amenities: csvRow['設備'] ? csvRow['設備'].split(',').map(a => a.trim()).filter(a => a) : [],
    notes: csvRow['備考'] || undefined,
    isVerified: false,
  };
}

// Type labels for UI
export const CampingSpotTypeLabels: Record<CampingSpotType, string> = {
  roadside_station: '道の駅・◯◯の駅',
  sa_pa: 'SA/PA',
  rv_park: 'RVパーク',
  auto_campground: 'オートキャンプ場',
  onsen_facility: '日帰り温泉施設',
  convenience_store: 'コンビニ',
  parking_lot: '駐車場',
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