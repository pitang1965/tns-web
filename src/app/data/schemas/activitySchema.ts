import { z } from 'zod';
import { placeSchema } from './placeSchema';

export const activitySchema = z.object({
  id: z.string(),
  title: z.string(), // 例: 昼食、観光、休憩、宿泊地到着、美術館見学、温泉入浴、◯◯さんに会う
  place: placeSchema,
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.number().optional(),
});
