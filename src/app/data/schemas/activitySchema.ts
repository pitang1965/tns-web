import { z } from 'zod';
import { placeSchema } from './placeSchema';

export const activitySchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "タイトルを入力してください"), // 例: 出発、休憩、散策、昼食、宿泊地到着、入浴
  place: placeSchema,
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.number().optional(),
});
