import { z } from 'zod';

// ペルソナ（車中泊スタイル）の定義
export const PersonaTypeSchema = z.enum([
  'machiyoru', // 街なか晩酌派
  'onsen', // 温泉満喫派
  'outdoor', // アウトドア派
  'easy', // お手軽派
  'comfort', // 快適装備派
  'pet', // ペット優先派
  'cospa', // コスパ重視派
  'quiet', // 静寂派
]);

export type PersonaType = z.infer<typeof PersonaTypeSchema>;

// ペルソナの詳細情報
export type PersonaInfo = {
  id: PersonaType;
  name: string;
  emoji: string;
  description: string;
  spotTypes: string[];
  badges: string[];
};

// 質問の回答値の型
export const DiagnosisAnswerSchema = z.object({
  carHeight: z.enum(['under_2_1m', 'over_2_1m', 'unknown']),
  carLength: z.enum(['under_5m', 'over_5m', 'unknown']),
  withPet: z.enum(['yes', 'no']),
  needPower: z.enum(['required', 'nice_to_have', 'not_needed']),
  toiletFrequency: z.enum(['rarely', 'sometimes', 'often']),
  drinkingPreference: z.enum(['izakaya', 'car_drinking', 'no_drink']),
  environmentPreference: z.enum(['crowded', 'quiet', 'isolated']),
  mealStyle: z.enum(['local_gourmet', 'convenience', 'self_cooking']),
  bathPreference: z.enum(['onsen', 'shower', 'next_day']),
  budgetPreference: z.enum(['free', 'around_1000', 'comfort_first']),
});

export type DiagnosisAnswer = z.infer<typeof DiagnosisAnswerSchema>;

// 部分的な回答（診断中）
export type PartialDiagnosisAnswer = Partial<DiagnosisAnswer>;

// スポット推奨結果
export type SpotRecommendation = {
  type: string;
  label: string;
  rank: number; // 1, 2, 3...
  badges: string[];
  excluded: boolean; // 車高・全長で除外されたか
};

// 診断結果
export type DiagnosisResult = {
  persona: PersonaInfo;
  recommendations: SpotRecommendation[];
  excludedSpots: string[]; // 除外されたスポットタイプ
};

// 質問の選択肢
export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
};

// 質問定義
export type QuestionDefinition = {
  id: keyof DiagnosisAnswer;
  question: string;
  description?: string;
  options: QuestionOption[];
};
