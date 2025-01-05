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

// 基本スキーマ
const baseSchema = z.object({
  title: z.string().min(1, '旅程タイトルを入力してください'),
  description: z.string().default(''),
  startDate: z.string().min(1, '開始日を指定してください'),
  endDate: z.string().min(1, '終了日はを指定してください'),
  dayPlans: z.array(dayPlanSchema),
  transportation: transportationSchema.default({}),
  owner: userReferenceSchema,
  isPublic: z.boolean().default(false),
  sharedWith: z.array(userReferenceSchema).default([]),
});

// 日付比較バリデーションを含む基本スキーマ
export const baseItinerarySchema = baseSchema.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: '終了日は開始日以降の日付を選択してください',
    path: ['endDate'],
  }
);

// MongoDB用のドキュメント型
export const serverItinerarySchema = baseSchema
  .merge(
    z.object({
      _id: objectIdSchema.optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  )
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: '終了日は開始日以降の日付を選択してください',
    path: ['endDate'],
  });

// クライアントサイド用
export const clientItinerarySchema = baseSchema
  .merge(
    z.object({
      id: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
  )
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: '終了日は開始日以降の日付を選択してください',
    path: ['endDate'],
  });

// 型定義
export type DayPlan = z.infer<typeof dayPlanSchema>;

export type ServerItineraryDocument = z.infer<typeof serverItinerarySchema>;

export type ServerItineraryInsertDocument = Omit<
  ServerItineraryDocument,
  '_id'
>;

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
