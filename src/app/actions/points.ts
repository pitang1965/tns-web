'use server';

import { ensureDbConnection } from '@/lib/database';
import { grantPoints, getBalance, normalizeEmail } from '@/lib/points/points';
import PointTransaction from '@/lib/models/PointTransaction';
import { logger } from '@/lib/logger';
import { checkAdminAuth } from './campingSpots/auth';

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
  // 付与は管理者UIからのみ（ADR-0010）。try の外で呼ぶ：未ログイン時の redirect を catch に握り潰させない
  const { email: actor } = await checkAdminAuth();
  try {
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
  await checkAdminAuth();
  try {
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
