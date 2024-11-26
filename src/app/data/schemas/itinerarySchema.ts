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

// ベースとなるItineraryスキーマ
export const baseItinerarySchema = z.object({
  title: z.string().min(1, '旅程名は必須です'),
  description: z.string().default(''),
  startDate: z.string().min(1, '開始日は必須です'),
  endDate: z.string().min(1, '終了日は必須です'),
  dayPlans: z.array(dayPlanSchema),
  transportation: transportationSchema.default({}),
  owner: userReferenceSchema,
  isPublic: z.boolean().default(false),
  sharedWith: z.array(userReferenceSchema).default([]),
});

// MongoDB用のドキュメント型
// _idをオプショナルに変更
export const serverItinerarySchema = baseItinerarySchema.extend({
  _id: objectIdSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Itinerary schema（クライアントサイド用）
export const clientItinerarySchema = baseItinerarySchema.extend({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// 型定義
export type DayPlan = z.infer<typeof dayPlanSchema>;

export type ServerItineraryDocument = z.infer<typeof serverItinerarySchema>;

export type ServerItineraryInsertDocument = Omit<ServerItineraryDocument, '_id'>;

export type ClientItineraryDocument = z.infer<typeof clientItinerarySchema>;
// 【参考】optionalの使用により問題が生じた場合は、次のように解消できる
// type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;
// export type ClientItineraryDocument = RequiredExcept<ClientItineraryInput, 'description' | 'transportation'>;

export type ClientItineraryInput = Omit<
  ClientItineraryDocument,
  'id' | 'createdAt' | 'updatedAt'
>;

// Helper function
export function toClientItinerary(
  doc: ServerItineraryDocument
): ClientItineraryDocument {
  const { _id, ...rest } = doc;
  return {
    id: _id, // すでに文字列なのでそのまま使用
    ...rest,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
