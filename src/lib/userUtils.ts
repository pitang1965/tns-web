import type { User } from '@auth0/nextjs-auth0/types';
// points.ts の normalizeEmail は DB モデルを引き込み、クライアントからも読まれるこのファイルでは使えない
import { normalizeOwnerEmail } from '@/lib/itineraryOwnership';

// 非公開環境変数 ADMIN_EMAILS を使用するため、この関数はサーバーサイドでのみ正しい値を返す。
// クライアントコンポーネントでの管理者判定には useAdminStatus() フックを使うこと。
function getAdminEmails(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ADMIN_EMAILS;
  }
  return undefined;
}

/**
 * ユーザーが管理者かどうかを判定する（サーバーサイド用）
 * クライアントコンポーネントでは isAdminHint に useAdminStatus().isAdmin を渡すこと
 *
 * email_verified を必須にしている理由:
 * メール+パスワード接続は確認メール未クリックでもログインできるため、
 * このゲートが無いと管理者のメールアドレスで新規登録するだけで管理者になれてしまう。
 * 旅程の所有者判定（itineraryOwnership.ts）やアズキと同じゲート。
 *
 * Server Actions の管理者チェックもすべてこの関数を通すこと。
 * ファイルごとに判定を書くと、このゲートの付け忘れが起きる。
 */
export function isAdmin(
  user: User | null | undefined,
  isAdminHint?: boolean,
): boolean {
  if (isAdminHint !== undefined) return isAdminHint;
  if (user?.email_verified !== true) return false;
  return emailInList(getAdminEmails(), user.email);
}

/** カンマ区切りのメール一覧に email が含まれるか。両辺を正規化して比べる。 */
function emailInList(
  list: string | undefined,
  email: string | null | undefined,
): boolean {
  const normalized = normalizeOwnerEmail(email);
  // 空白だけのメールが、末尾カンマなどでできた空の項目に一致しないようにする
  if (!normalized || !list) return false;
  return list.split(',').map(normalizeOwnerEmail).includes(normalized);
}

// 非公開環境変数 ITINERARY_DRAFT_ALLOWED_EMAILS を使用するため、サーバーサイド専用。
// クライアントでは useDraftAccess() フックで判定すること。
function getDraftAllowedEmails(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ITINERARY_DRAFT_ALLOWED_EMAILS;
  }
  return undefined;
}

/**
 * AI旅程ドラフト生成を利用できる「限定者」かどうかを判定する（サーバーサイド用）。
 * 管理者判定(ADMIN_EMAILS)とは別枠の環境変数 ITINERARY_DRAFT_ALLOWED_EMAILS で指定する。
 * ADR-0009: 初版は限定者のみ。サブスク導入時はここを会員判定へ差し替える。
 */
export function isItineraryDraftAllowed(
  user: User | null | undefined,
  hint?: boolean,
): boolean {
  if (hint !== undefined) return hint;
  return emailInList(getDraftAllowedEmails(), user?.email);
}

/**
 * ユーザーがプレミアム会員かどうかを判定する
 * 管理者もプレミアム会員特典を持つ
 */
export function isPremiumMember(
  user: User | null | undefined,
  isAdminHint?: boolean,
): boolean {
  if (isAdmin(user, isAdminHint)) return true;
  return false;
}

/**
 * プレミアム会員のタイプを取得する
 */
export function getPremiumMemberType(
  user: User | null | undefined,
  isAdminHint?: boolean,
): 'admin' | 'premium' | null {
  if (isAdmin(user, isAdminHint)) return 'admin';
  return null;
}

/**
 * プレミアム会員のラベルを取得する
 */
export function getPremiumMemberLabel(
  user: User | null | undefined,
  isAdminHint?: boolean,
): string | null {
  const type = getPremiumMemberType(user, isAdminHint);
  switch (type) {
    case 'admin':
      return '管理者';
    case 'premium':
      return 'プレミアム会員';
    default:
      return '一般会員';
  }
}

export const ITINERARY_LIMITS = {
  FREE_USER_LIMIT: 10,
  PREMIUM_UNLIMITED: -1,
} as const;

/**
 * ユーザーの旅程作成制限数を取得する
 */
export function getItineraryLimit(
  user: User | null | undefined,
  isAdminHint?: boolean,
): number {
  if (isPremiumMember(user, isAdminHint)) {
    return ITINERARY_LIMITS.PREMIUM_UNLIMITED;
  }
  return ITINERARY_LIMITS.FREE_USER_LIMIT;
}

/**
 * ユーザーが新しい旅程を作成できるかチェックする
 */
export function canCreateItinerary(
  user: User | null | undefined,
  currentItineraryCount: number,
  isAdminHint?: boolean,
): boolean {
  const limit = getItineraryLimit(user, isAdminHint);
  if (limit === ITINERARY_LIMITS.PREMIUM_UNLIMITED) {
    return true;
  }
  return currentItineraryCount < limit;
}

/**
 * 旅程作成制限の状況を取得する
 */
export function getItineraryLimitStatus(
  user: User | null | undefined,
  currentCount: number,
  isAdminHint?: boolean,
) {
  const limit = getItineraryLimit(user, isAdminHint);
  const canCreate = canCreateItinerary(user, currentCount, isAdminHint);

  return {
    currentCount,
    limit,
    canCreate,
    isPremium: isPremiumMember(user, isAdminHint),
    remaining:
      limit === ITINERARY_LIMITS.PREMIUM_UNLIMITED
        ? -1
        : Math.max(0, limit - currentCount),
  };
}
