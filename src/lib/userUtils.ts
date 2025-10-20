import type { User } from '@auth0/nextjs-auth0/types';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

/**
 * ユーザーが管理者かどうかを判定する
 */
export function isAdmin(user: User | null | undefined): boolean {
  return !!(
    user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map(email => email.trim())
      .includes(user.email)
  );
}

/**
 * ユーザーがプレミアム会員かどうかを判定する
 * 管理者もプレミアム会員特典を持つ
 * 将来的にはデータベースから取得する予定
 */
export function isPremiumMember(user: User | null | undefined): boolean {
  // 管理者はプレミアム会員特典を持つ
  if (isAdmin(user)) return true;

  // 将来的には以下のような実装になる予定：
  // データベースからプレミアム会員情報を取得
  // return checkPremiumStatusFromDatabase(user?.sub);

  // 現在は管理者以外のプレミアム会員はなし
  return false;
}

/**
 * プレミアム会員のタイプを取得する
 * 管理者とプレミアム会員を区別する
 */
export function getPremiumMemberType(user: User | null | undefined): 'admin' | 'premium' | null {
  if (isAdmin(user)) return 'admin';

  // 将来的には以下のロジックが有効になる：
  // if (isPremiumMember(user)) return 'premium';

  return null;
}

/**
 * プレミアム会員のラベルを取得する
 */
export function getPremiumMemberLabel(user: User | null | undefined): string | null {
  const type = getPremiumMemberType(user);
  switch (type) {
    case 'admin':
      return '管理者';
    case 'premium':
      return 'プレミアム会員';
    default:
      return '一般会員';
  }
}

// 旅程作成制限に関する定数
export const ITINERARY_LIMITS = {
  FREE_USER_LIMIT: 10,
  PREMIUM_UNLIMITED: -1 // -1は無制限を表す
} as const;

/**
 * ユーザーの旅程作成制限数を取得する
 */
export function getItineraryLimit(user: User | null | undefined): number {
  if (isPremiumMember(user)) {
    return ITINERARY_LIMITS.PREMIUM_UNLIMITED; // 無制限
  }
  return ITINERARY_LIMITS.FREE_USER_LIMIT; // 10個まで
}

/**
 * ユーザーが新しい旅程を作成できるかチェックする
 */
export function canCreateItinerary(
  user: User | null | undefined,
  currentItineraryCount: number
): boolean {
  const limit = getItineraryLimit(user);

  // プレミアム会員は無制限
  if (limit === ITINERARY_LIMITS.PREMIUM_UNLIMITED) {
    return true;
  }

  // 一般ユーザーは制限数未満まで作成可能
  return currentItineraryCount < limit;
}

/**
 * 旅程作成制限の状況を取得する
 */
export function getItineraryLimitStatus(
  user: User | null | undefined,
  itineraries: ClientItineraryDocument[]
) {
  const currentCount = itineraries.length;
  const limit = getItineraryLimit(user);
  const canCreate = canCreateItinerary(user, currentCount);

  return {
    currentCount,
    limit,
    canCreate,
    isPremium: isPremiumMember(user),
    remaining: limit === ITINERARY_LIMITS.PREMIUM_UNLIMITED ? -1 : Math.max(0, limit - currentCount)
  };
}
