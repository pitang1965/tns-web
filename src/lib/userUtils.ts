import { UserProfile } from '@auth0/nextjs-auth0/client';

/**
 * ユーザーが管理者かどうかを判定する
 */
export function isAdmin(user: UserProfile | undefined): boolean {
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
export function isPremiumMember(user: UserProfile | undefined): boolean {
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
export function getPremiumMemberType(user: UserProfile | undefined): 'admin' | 'premium' | null {
  if (isAdmin(user)) return 'admin';

  // 将来的には以下のロジックが有効になる：
  // if (isPremiumMember(user)) return 'premium';

  return null;
}

/**
 * プレミアム会員のラベルを取得する
 */
export function getPremiumMemberLabel(user: UserProfile | undefined): string | null {
  const type = getPremiumMemberType(user);
  switch (type) {
    case 'admin':
      return '管理者';
    case 'premium':
      return 'プレミアム会員';
    default:
      return null;
  }
}