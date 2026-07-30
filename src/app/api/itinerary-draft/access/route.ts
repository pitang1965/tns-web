import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { checkDraftAccess } from '@/lib/itineraryDraft/access';

export const dynamic = 'force-dynamic';

/**
 * AI旅程ドラフト生成のアクセス状態（無制限枠か／残高アズキ）をクライアントに返す（ADR-0010）。
 * 残高は消費で変動するため /api/auth/me とは分け、必要な画面でのみ叩く。
 */
export async function GET() {
  const session = await auth0.getSession();
  const access = await checkDraftAccess(session?.user);
  return NextResponse.json({
    allowed: access.allowed,
    unlimited: access.unlimited ?? false,
    balance: access.balance ?? null,
    reason: access.reason ?? null,
  });
}
