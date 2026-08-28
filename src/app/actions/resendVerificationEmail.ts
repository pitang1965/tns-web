'use server';

import { auth0 } from '@/lib/auth0';
import { auth0Management } from '@/lib/auth0Management';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * 認証メールを再送する。
 *
 * 現地報告の投稿もアズキの利用も email_verified を必須にしているため、
 * 最初の認証メールを見落とした利用者は、これがないと自力で復帰できない。
 */

const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;

export type ResendVerificationResult =
  | { success: true }
  | { success: false; error: string };

export async function resendVerificationEmail(): Promise<ResendVerificationResult> {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user?.sub) {
    return { success: false, error: 'ログインしてください' };
  }

  if (user.email_verified) {
    return { success: false, error: 'メールアドレスは既に認証されています' };
  }

  // 認証メールの連打（自分のアドレスへの爆撃・Auth0のレート制限への抵触）を防ぐ
  const rateLimitResult = checkRateLimit({
    key: `resend-verification:${user.sub}`,
    limit: RESEND_LIMIT,
    windowMs: RESEND_WINDOW_MS,
  });

  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error:
        '認証メールの再送が続いています。しばらく時間をおいてからお試しください',
    };
  }

  try {
    await auth0Management.sendVerificationEmail(user.sub);
    return { success: true };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('認証メールの再送に失敗しました'),
    );
    return {
      success: false,
      error: '認証メールを送れませんでした。時間をおいてお試しください',
    };
  }
}
