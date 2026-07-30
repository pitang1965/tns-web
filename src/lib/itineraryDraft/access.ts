import type { User } from '@auth0/nextjs-auth0/types';
import { isItineraryDraftAllowed } from '@/lib/userUtils';
import { getBalance } from '@/lib/points/points';

export type DraftAccessResult = {
  allowed: boolean;
  reason?: string;
  /** whitelist（ITINERARY_DRAFT_ALLOWED_EMAILS）= 無制限枠。消費しない。 */
  unlimited?: boolean;
  /** 残高（アズキ）。null = 一度も付与されていない（＝機能未開放）。無制限枠では undefined。 */
  balance?: number | null;
};

/**
 * 旅程ドラフト生成のアクセス判定の「口」（ADR-0009 / ADR-0010）。
 * ここが唯一のアクセス制御ポイント。管理者判定は使わない（管理者であることはアクセスと無関係）。
 *
 * 判定順（ADR-0010）:
 *   未ログイン              → 拒否
 *   email_verified = false  → 拒否（メール認証を促す）
 *   whitelist に一致         → 無制限で許可（消費しない）
 *   それ以外 かつ 残高≥1     → 許可（成功時に1消費。消費は generateItineraryDraftAction が予約方式で行う）
 *   残高0（付与済みで枯渇）   → 「アズキ不足」で拒否
 *   残高null（未付与）        → 「限定公開」で拒否（＝機能未開放）
 *
 * サブスク導入時は、この関数の条件を「残高制 → 会員判定＋クォータ」へ拡張する（ADR-0009）。
 */
export async function checkDraftAccess(
  user: User | null | undefined,
): Promise<DraftAccessResult> {
  if (!user) {
    return { allowed: false, reason: '認証されていません' };
  }
  if (!user.email) {
    return { allowed: false, reason: 'メールアドレスが取得できません' };
  }
  if (!user.email_verified) {
    return {
      allowed: false,
      reason: 'メールアドレスの認証を完了してください',
    };
  }

  // 無制限枠（ADR-0010: whitelist を「限定者」から「無制限枠」へ意味変更）
  if (isItineraryDraftAllowed(user)) {
    return { allowed: true, unlimited: true };
  }

  // それ以外はポイント残高で判定
  const balance = await getBalance(user.email);
  if (balance === null) {
    return {
      allowed: false,
      reason: 'この機能は現在、限定公開中です',
      balance: null,
    };
  }
  if (balance >= 1) {
    return { allowed: true, unlimited: false, balance };
  }
  return {
    allowed: false,
    reason: 'アズキが不足しています',
    balance: 0,
  };
}
