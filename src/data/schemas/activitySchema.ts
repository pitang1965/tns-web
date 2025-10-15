import { z } from 'zod';
import { placeSchema } from './placeSchema';

export const activitySchema = z
  .object({
    id: z.string(),
    title: z.string().trim().min(1, 'タイトルを入力してください'), // 例: 出発、休憩、散策、昼食、宿泊地到着、入浴
    place: placeSchema,
    description: z.string().nullable(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    cost: z.number().nullable(),
    url: z.union([z.string().url('有効なURLを入力してください'), z.literal(''), z.null()]).optional(),
  })
  .refine(
    (data) => {
      // 両方の時間が設定されている場合のみバリデーション
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: '終了時間は開始時間より後に設定してください',
      path: ['endTime'], // エラーを表示するフィールド
    }
  );
