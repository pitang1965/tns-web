import { z } from 'zod';

// TODO: MongoDBは後で追加する
// import { ObjectId } from 'mongodb';

// ObjectId validation helper
// const objectIdSchema = z
//   .string()
//   .refine((id) => ObjectId.isValid(id), { message: '無効なObjectIdです' });

// Address schema
const addressSchema = z.object({
  postalCode: z.string().regex(/^\d{3}-\d{4}$/).optional(), // 郵便番号 (例: 123-4567)
  prefecture: z.string(), // 都道府県 (例: 東京都)
  city: z.string(), // 市区町村、区 (例: 渋谷区)
  town: z.string(), // 町名 (例: 恵比寿南)
  block: z.string(), // 丁目、番地、号 (例: 1-2-3)
  building: z.string().optional(), // 建物名 (例: 恵比寿ガーデンプレイス)
  country: z.literal('Japan'), // 国名は「Japan」と固定
});

// Location schema
const locationSchema = z.object({
  latitude: z.number(), // 緯度
  longitude: z.number(), // 経度
});

// Place schema
const placeSchema = z.object({
  name: z.string(),
  type: z.enum([
    'HOME', // 自宅
    'ATTRACTION', // 観光地
    'RESTAURANT', // レストラン
    'HOTEL', // ホテル
    'PARKING_PAID_RV_PARK', // 駐車場 -- 有料 -- RVパーク
    'PARKING_PAID_OTHER', // 駐車場 -- 有料 -- その他
    'PARKING_FREE_SERVICE_AREA', // 駐車場 -- 無料 -- サービスエリア・パーキングエリア
    'PARKING_FREE_MICHINOEKI', // 駐車場 -- 無料 -- 道の駅
    'PARKING_FREE_OTHER', // 駐車場 -- 無料 -- その他
    'GAS_STATION', // ガソリンスタンド
    'CONVENIENCE_SUPERMARKET', // コンビニ・スーパーマーケット
    'BATHING_FACILITY', // 入浴施設
    'COIN_LAUNDRY', // コインランドリ
    'OTHER', // その他
  ]),
  address: addressSchema.optional(),
  location: locationSchema.optional(),
});

// Activity schema
const activitySchema = z.object({
  id: z.string(),
  title: z.string(), // 例: 昼食、観光、休憩、宿泊地到着、美術館見学、温泉入浴、◯◯さんに会う
  place: placeSchema,
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.number().optional(),
});

// Day plan schema
const dayPlanSchema = z.object({
  date: z.string(),
  activities: z.array(activitySchema),
});

// Transportation schema
const transportationSchema = z.object({
  type: z.enum(['CAR', 'TRAIN', 'BUS', 'PLANE', 'SHIP', 'OTHER']),
  details: z.string().optional(),
});

// Budget schema
const Schema = z.object({
  total: z.number(),
  spent: z.number().default(0),
  categories: z.record(z.string(), z.number()),
});

// Itinerary schema
export const itinerarySchema = z.object({
  // TODO: MongoDBは後で追加する
  // _id: objectIdSchema.optional(),
  id: z.string(),
  title: z.string().min(1, '旅程名は必須です'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  dayPlans: z.array(dayPlanSchema),
  transportation: transportationSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ItinerarySchema = z.infer<typeof itinerarySchema>;
