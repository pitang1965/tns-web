import { z } from 'zod';

export const addressSchema = z.object({
  postalCode: z
    .string()
    .regex(/^\d{3}-\d{4}$/)
    .optional()
    .or(z.literal('')), // 郵便番号 (例: 123-4567)
  prefecture: z.string().optional(), // 都道府県 (例: 東京都)
  city: z.string().optional(), // 市区町村、区 (例: 渋谷区)
  town: z.string().optional(), // 町名 (例: 恵比寿南)
  block: z.string().optional(), // 丁目、番地、号 (例: 1-2-3)
  building: z.string().optional(), // 建物名 (例: 恵比寿ガーデンプレイス)
  country: z.literal('Japan'), // 国名は「Japan」と固定
});
