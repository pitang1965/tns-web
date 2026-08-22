import { z } from 'zod';

/**
 * 現地報告（Field Report）のスキーマ。
 *
 * 用語の定義は CONTEXT.md、表示に関する privacy 判断は
 * docs/adr/0011-field-report-privacy-boundaries.md を参照。
 */

/** 本文の最大文字数 */
export const FIELD_REPORT_BODY_MAX = 300;

/** 地図・一覧に出す抜粋の最大文字数（第2段階で使用） */
export const FIELD_REPORT_EXCERPT_MAX = 80;

/** これより古い訪問年月の報告は、地図・一覧の「最新1件」に出さない（月数） */
export const FIELD_REPORT_STALE_MONTHS = 12;

/** 1ユーザーが24時間に投稿できる件数 */
export const FIELD_REPORT_DAILY_LIMIT = 5;

/** 訪問年月として受け付ける下限（これ以前は入力ミスとみなす） */
export const FIELD_REPORT_MIN_YEAR = 2000;

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// 本文にURLを書かせない（ADR外の判断: 宣伝スパムの動機を消すため）。
// スキーム付きURL・www.始まり・裸のドメインの3系統を弾く。
const URL_PATTERNS = [
  /https?:\/\//i,
  /\bwww\.\w/i,
  /\b[\w-]+\.(com|net|org|jp|co|io|me|info|biz|xyz|shop|site|online|link|tokyo)\b/i,
];

export function containsUrl(value: string): boolean {
  return URL_PATTERNS.some((pattern) => pattern.test(value));
}

/** 'YYYY-MM' 形式の現在の年月を返す */
export function currentYearMonth(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** 'YYYY-MM' を「2026年8月」のような表示用文字列にする */
export function formatYearMonth(yearMonth: string): string {
  const match = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!match) return yearMonth;
  const [year, month] = yearMonth.split('-');
  return `${year}年${Number(month)}月`;
}

/**
 * 訪問年月が「古い」かどうか。地図・一覧の最新1件の足切りに使う。
 * 基準は FIELD_REPORT_STALE_MONTHS ヶ月。
 */
export function isStaleYearMonth(
  yearMonth: string,
  now: Date = new Date(),
): boolean {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) return true;
  const [year, month] = yearMonth.split('-').map(Number);
  const monthsElapsed =
    (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return monthsElapsed > FIELD_REPORT_STALE_MONTHS;
}

/** 本文から抜粋を作る（第2段階の非正規化キャッシュ用） */
export function buildExcerpt(body: string): string {
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length <= FIELD_REPORT_EXCERPT_MAX
    ? normalized
    : `${normalized.slice(0, FIELD_REPORT_EXCERPT_MAX)}…`;
}

export const visitedYearMonthSchema = z
  .string()
  .regex(YEAR_MONTH_PATTERN, '訪問年月の形式が正しくありません')
  .refine((value) => Number(value.slice(0, 4)) >= FIELD_REPORT_MIN_YEAR, {
    message: `訪問年月は${FIELD_REPORT_MIN_YEAR}年以降を指定してください`,
  })
  .refine((value) => value <= currentYearMonth(), {
    message: '訪問年月に未来は指定できません',
  });

export const fieldReportBodySchema = z
  .string()
  .trim()
  .min(1, '報告の内容を入力してください')
  .max(
    FIELD_REPORT_BODY_MAX,
    `報告は${FIELD_REPORT_BODY_MAX}文字以内で入力してください`,
  )
  .refine((value) => !containsUrl(value), {
    message: 'URLは投稿できません。URLを除いてご記入ください',
  });

export const fieldReportInputSchema = z.object({
  spotId: z.string().min(1, 'スポットが指定されていません'),
  visitedYearMonth: visitedYearMonthSchema,
  body: fieldReportBodySchema,
});

export type FieldReportInput = z.infer<typeof fieldReportInputSchema>;

/** 通報の理由（任意入力） */
export const FIELD_REPORT_FLAG_REASON_MAX = 200;

export const fieldReportFlagSchema = z.object({
  reportId: z.string().min(1),
  reason: z.string().trim().max(FIELD_REPORT_FLAG_REASON_MAX).optional(),
});

/**
 * クライアントへ渡す現地報告。
 *
 * ADR-0011:
 *   - 投稿日時（createdAt）を含めない
 *   - 投稿者の識別子（Auth0 sub）を含めない。サーバー側で handle に変換済み
 */
export type PublicFieldReport = {
  id: string;
  visitedYearMonth: string;
  body: string;
  handle: string;
  /** 閲覧者本人の投稿か（削除ボタンの表示判定に使う） */
  isOwn: boolean;
  /** 閲覧者が既に通報済みか（重複通報の抑止に使う） */
  isFlagged: boolean;
  /** 管理者にのみ true になりうる。一般ユーザーには非表示の報告自体が届かない */
  isHidden?: boolean;
  /** 管理者にのみ渡す通報件数 */
  flagCount?: number;
};

/**
 * 管理画面専用の現地報告。
 *
 * ADR-0011 の例外として `createdAt`（投稿日時）を含む。
 * スパム・荒らしの判断には連投の検知が必要なため。
 * この型を公開画面で使ってはならない（公開側は PublicFieldReport）。
 * 投稿者の識別子（Auth0 sub）は管理画面にも渡さない。
 */
export type AdminFieldReport = {
  id: string;
  spotId: string;
  /** スポット横断の一覧でのみ埋める */
  spotName?: string;
  visitedYearMonth: string;
  body: string;
  handle: string;
  isHidden: boolean;
  flagCount: number;
  flagReasons: string[];
  /** ISO文字列。管理画面に限り表示してよい（ADR-0011 決定2の例外） */
  createdAt: string;
};

/** 管理画面の一覧タブ */
export type AdminFieldReportFilter = 'flagged' | 'hidden' | 'all';

export type FieldReportActionResult =
  | { success: true }
  | { success: false; error: string };
