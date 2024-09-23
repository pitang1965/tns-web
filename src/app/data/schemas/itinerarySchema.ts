import { z } from 'zod';
import { objectIdSchema } from './commonSchemas';
import { userReferenceSchema } from './userSchema';
import { activitySchema } from './activitySchema';
import { transportationSchema } from './transportationSchema';

// Day plan schema
const dayPlanSchema = z.object({
  date: z.string(),
  activities: z.array(activitySchema),
});

// Itinerary schema
export const itinerarySchema = z.object({
  _id: objectIdSchema,
  title: z.string().min(1, '旅程名は必須です'),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  dayPlans: z.array(dayPlanSchema),
  transportation: transportationSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  owner: userReferenceSchema,
  isPublic: z.boolean().default(false),
  sharedWith: z.array(userReferenceSchema).optional(),
});

export type Itinerary = z.infer<typeof itinerarySchema>;
