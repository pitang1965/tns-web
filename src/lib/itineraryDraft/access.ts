import type { User } from '@auth0/nextjs-auth0/types';
import { isItineraryDraftAllowed } from '@/lib/userUtils';

export type DraftAccessResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * 旅程ドラフト生成のアクセス判定＋レート制限の「口」。
 *
 * ADR-0009: 初版は管理者/ホワイトリスト限定。従量課金の露出を避けるため、
 * ここが唯一のアクセス制御ポイント。サブスク導入時は、この関数の条件を
 * 「管理者限定 → 有料会員＋クォータ」へ差し替えるだけで公開できるようにしてある。
 *
 * クォータ（1ユーザー/日N回など）は将来ここに追加する。初版は上限を設けない
 * （管理者のみ・1回約2円のため）が、判定を1箇所に集約しておくことが目的。
 */
export function checkDraftAccess(
  user: User | null | undefined,
): DraftAccessResult {
  if (!user) {
    return { allowed: false, reason: '認証されていません' };
  }

  if (!isItineraryDraftAllowed(user)) {
    // ADR-0009: 初版は限定者のみ（ITINERARY_DRAFT_ALLOWED_EMAILS）。
    // サブスク導入時にここを会員判定へ差し替える。
    return {
      allowed: false,
      reason: 'この機能は現在、限定者のみが利用できます',
    };
  }

  // TODO(サブスク): ここで 1ユーザー/日N回 等のクォータを確認する。
  return { allowed: true };
}
