import { z } from 'zod';
import { objectIdSchema } from './commonSchemas';
import { userReferenceSchema } from './userSchema';
import { activitySchema } from './activitySchema';

// Day plan schema
const dayPlanSchema = z.object({
  date: z.string().nullable(),
  activities: z.array(activitySchema),
  notes: z.string().optional(),
});

// 基本スキーマ
const baseSchema = z.object({
  title: z.string().min(1, '旅程タイトルを入力してください'),
  description: z.string().default(''),
  numberOfDays: z.number().min(1, '日数を入力してください'),
  startDate: z.string().optional(),
  dayPlans: z.array(dayPlanSchema),
  owner: userReferenceSchema,
  isPublic: z.boolean().default(false),
  sharedWith: z.array(userReferenceSchema).default([]),
});

// MongoDB用のドキュメント型
export const serverItinerarySchema = baseSchema.merge(
  z.object({
    _id: objectIdSchema.optional(), // ObjectId型として定義
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

// クライアントサイド用
export const clientItinerarySchema = baseSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
);

// 型定義
export type DayPlan = z.infer<typeof dayPlanSchema>;

export type ServerItineraryDocument = z.infer<typeof serverItinerarySchema>;

export type ServerItineraryInsertDocument = Omit<
  ServerItineraryDocument,
  '_id'
>;

export type ClientItineraryDocument = z.infer<typeof clientItinerarySchema>;

export type ClientItineraryInput = Omit<
  ClientItineraryDocument,
  'id' | 'createdAt' | 'updatedAt'
>;

// Helper function - サーバー側でのみ使用
export function toClientItinerary(
  doc: ServerItineraryDocument
): ClientItineraryDocument {
  const { _id, ...rest } = doc;

  // createdAtとupdatedAtが文字列かDateオブジェクトかを確認し、適切に処理
  const createdAtStr =
    typeof doc.createdAt === 'string'
      ? doc.createdAt
      : doc.createdAt.toISOString();

  const updatedAtStr =
    typeof doc.updatedAt === 'string'
      ? doc.updatedAt
      : doc.updatedAt.toISOString();

  // ObjectIdの処理（サーバーサイドの場合）
  let idStr = '';
  if (typeof window === 'undefined') {
    try {
      const mongodb = require('mongodb');
      const mongoObjectId = mongodb.ObjectId;

      idStr =
        typeof _id === 'string'
          ? _id
          : mongoObjectId && _id instanceof mongoObjectId
          ? _id.toString()
          : String(_id);
    } catch {
      // mongodbが利用できない場合
      idStr = String(_id);
    }
  } else {
    // クライアントサイドの場合
    idStr = String(_id);
  }

  return {
    id: idStr,
    ...rest,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  };
}

// 日付計算用のヘルパー
export class ItineraryDateHelper {
  // 終了日を計算（開始日がある場合のみ）
  static calculateEndDate(
    startDate: string | undefined,
    numberOfDays: number
  ): string | undefined {
    if (!startDate) return undefined;

    const end = new Date(startDate);
    end.setDate(end.getDate() + numberOfDays - 1);
    return end.toISOString().split('T')[0];
  }

  // 特定の日のインデックスから日付を計算
  static calculateDateForDay(
    startDate: string | undefined,
    dayIndex: number
  ): string | undefined {
    if (!startDate) return undefined;

    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  }

  // 日付文字列からフォーマットされた表示用文字列を生成
  static formatDateDisplay(date: string | undefined): string {
    if (!date) return '日付未定';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }
}

// 旅程管理クラス
export class ItineraryManager {
  // 新規旅程の作成
  static createNew(params: {
    title: string;
    numberOfDays: number;
    startDate?: string;
  }): Omit<z.infer<typeof baseSchema>, 'owner'> {
    const dayPlans = Array.from({ length: params.numberOfDays }, (_, i) => {
      const currentDate = params.startDate
        ? new Date(
            new Date(params.startDate).setDate(
              new Date(params.startDate).getDate() + i
            )
          )
        : new Date(new Date().setDate(new Date().getDate() + i));

      return {
        dayIndex: i,
        date: currentDate.toISOString().split('T')[0], // 必須の date プロパティを追加
        activities: [],
      };
    });

    return {
      title: params.title,
      description: '',
      numberOfDays: params.numberOfDays,
      startDate: params.startDate,
      dayPlans,
      isPublic: false,
      sharedWith: [],
    };
  }

  // 日数の変更
  static updateDuration(
    itinerary: z.infer<typeof baseSchema>,
    newNumberOfDays: number
  ): z.infer<typeof baseSchema> {
    const currentDays = itinerary.numberOfDays;

    if (newNumberOfDays < currentDays) {
      // 日数を減らす場合
      return {
        ...itinerary,
        numberOfDays: newNumberOfDays,
        dayPlans: itinerary.dayPlans.slice(0, newNumberOfDays),
      };
    } else if (newNumberOfDays > currentDays) {
      // 追加する日程を生成
      const additionalDays = Array.from(
        { length: newNumberOfDays - currentDays },
        (_, i) => {
          const currentDate = itinerary.startDate
            ? new Date(
                new Date(itinerary.startDate).setDate(
                  new Date(itinerary.startDate).getDate() + currentDays + i
                )
              )
            : new Date(
                new Date().setDate(new Date().getDate() + currentDays + i)
              );

          return {
            date: currentDate.toISOString().split('T')[0],
            dayIndex: currentDays + i,
            activities: [],
            notes: '', // notesフィールドを明示的に初期化
          };
        }
      );

      return {
        ...itinerary,
        numberOfDays: newNumberOfDays,
        dayPlans: [...itinerary.dayPlans, ...additionalDays],
      };
    }

    return itinerary;
  }

  // 開始日の設定/変更
  static updateStartDate(
    itinerary: z.infer<typeof baseSchema>,
    newStartDate: string | undefined
  ): z.infer<typeof baseSchema> {
    return {
      ...itinerary,
      startDate: newStartDate,
    };
  }

  // 表示用の日付情報を生成
  static getDateDisplay(itinerary: z.infer<typeof baseSchema>): {
    duration: string;
    dateRange: string;
  } {
    const endDate = ItineraryDateHelper.calculateEndDate(
      itinerary.startDate,
      itinerary.numberOfDays
    );

    return {
      duration: `${itinerary.numberOfDays}日間`,
      dateRange: itinerary.startDate
        ? `${ItineraryDateHelper.formatDateDisplay(
            itinerary.startDate
          )} 〜 ${ItineraryDateHelper.formatDateDisplay(endDate)}`
        : '日程未定',
    };
  }
}
