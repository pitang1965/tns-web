'use server';

import { auth0 } from '@/lib/auth0';
import { ensureDbConnection } from '@/lib/database';
import { grantPoints, getBalance, normalizeEmail } from '@/lib/points/points';
import PointTransaction from '@/lib/models/PointTransaction';
import { logger } from '@/lib/logger';

/**
 * 管理者ポイント操作（ADR-0010）。付与は管理者UIからのみ。
 * 管理者判定はアクセス機能の判定ではなく「付与できる運営者か」の判定であり、
 * 既存の submissions と同じ ADMIN_EMAILS を使う。
 */
async function requireAdminEmail(): Promise<string> {
  const session = await auth0.getSession();
  const email = session?.user?.email;
  if (!email) {
    throw new Error('認証されていません');
  }
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? [];
  if (!adminEmails.includes(email)) {
    throw new Error('管理者権限が必要です');
  }
  return email;
}

export type GrantPointsResult =
  | { success: true; email: string; balance: number }
  | { success: false; error: string };

/**
 * 指定メールにポイントを付与（$incで加算）する。取引ログに grant を記帳する。
 */
export async function grantPointsAction(input: {
  email: string;
  amount: number;
  reason?: string;
}): Promise<GrantPointsResult> {
  try {
    const actor = await requireAdminEmail();

    const email = (input.email ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: '有効なメールアドレスを入力してください' };
    }
    const amount = Number(input.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return {
        success: false,
        error: '付与ポイントは1以上の整数で指定してください',
      };
    }

    const { balance } = await grantPoints({
      email,
      amount,
      reason: input.reason?.trim() || undefined,
      actor,
    });

    return { success: true, email: normalizeEmail(email), balance };
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('ポイント付与に失敗'),
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ポイント付与に失敗しました',
    };
  }
}

export type PointAccountRow = {
  email: string;
  balance: number;
  recentGranted: number;
  recentConsumed: number;
};

/**
 * 指定メールの現在残高と直近の付与/消費件数を返す（付与UIの確認用）。
 */
export async function lookupPointAccountAction(
  rawEmail: string,
): Promise<{ success: true; row: PointAccountRow | null } | { success: false; error: string }> {
  try {
    await requireAdminEmail();
    const email = normalizeEmail(rawEmail ?? '');
    if (!email) {
      return { success: false, error: 'メールアドレスを入力してください' };
    }
    await ensureDbConnection();

    const balance = await getBalance(email);
    if (balance === null) {
      return { success: true, row: null };
    }

    const [granted, consumed] = await Promise.all([
      PointTransaction.countDocuments({ email, type: 'grant' }),
      PointTransaction.countDocuments({ email, type: 'consume' }),
    ]);

    return {
      success: true,
      row: {
        email,
        balance,
        recentGranted: granted,
        recentConsumed: consumed,
      },
    };
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('ポイント照会に失敗'),
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ポイント照会に失敗しました',
    };
  }
}
