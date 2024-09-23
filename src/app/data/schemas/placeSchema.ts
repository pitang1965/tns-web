import { z } from 'zod';
import { addressSchema } from './addressSchema';
import { locationSchema } from './locationSchema';

export const placeSchema = z.object({
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
