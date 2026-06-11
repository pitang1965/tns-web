import type { User } from '@auth0/nextjs-auth0/types';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

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
 */
export function isAdmin(
  user: User | null | undefined,
  isAdminHint?: boolean,
): boolean {
  if (isAdminHint !== undefined) return isAdminHint;
  const adminEmails = getAdminEmails();
  return !!(
    user?.email &&
    adminEmails
      ?.split(',')
      .map((email) => email.trim())
      .includes(user.email)
  );
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
  itineraries: ClientItineraryDocument[],
  isAdminHint?: boolean,
) {
  const currentCount = itineraries.length;
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
