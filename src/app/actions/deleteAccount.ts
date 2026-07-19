'use server';

import { auth0 } from '@/lib/auth0';
import { auth0Management } from '@/lib/auth0Management';
import { deleteAllItinerariesForUser } from '@/lib/itineraries';
import { deletePostHogPerson } from '@/lib/posthogServer';
import resend from '@/lib/resend';
import { logger } from '@/lib/logger';

type DeleteAccountResult = {
  success: boolean;
  error?: string;
};

/**
 * 退会処理（アカウント完全削除）。
 *
 * 処理順序:
 *   1. MongoDBのアプリデータ（所有旅程・共有相手参照）を削除
 *   2. Auth0アカウント本体を削除
 *   3. 管理者へ退会通知メールを送信（失敗しても退会自体は成功扱い）
 *
 * アプリデータを先に消すのは、Auth0削除が失敗した場合でも
 * ユーザーが再ログインして再試行できる状態を残すため。
 *
 * 成功後はセッション破棄のためクライアント側で `/auth/logout` へ遷移すること。
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  try {
    const session = await auth0.getSession();
    const user = session?.user;

    if (!user?.sub) {
      return { success: false, error: '認証されていません' };
    }

    const userId = user.sub;

    // 1. アプリデータを削除
    let deletedItineraryCount = 0;
    try {
      deletedItineraryCount = await deleteAllItinerariesForUser(userId);
    } catch (error) {
      logger.error(
        error instanceof Error
          ? error
          : new Error('Error deleting user itineraries during withdrawal'),
        { userId },
      );
      return {
        success: false,
        error:
          '旅程データの削除に失敗しました。時間をおいて再度お試しください。',
      };
    }

    // 2. Auth0アカウントを削除
    try {
      await auth0Management.deleteUser(userId);
    } catch (error) {
      logger.error(
        error instanceof Error
          ? error
          : new Error('Error deleting Auth0 account during withdrawal'),
        { userId },
      );
      return {
        success: false,
        error:
          'アカウントの削除に失敗しました。お手数ですがサポートまでお問い合わせください。',
      };
    }

    // 3. PostHog の person を削除（ベストエフォート / プライバシーポリシー§7）
    await deletePostHogPerson(userId);

    // 4. 管理者へ退会通知（ベストエフォート）
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        const result = await resend.sendAccountDeletionNotification({
          userId,
          userEmail: user.email ?? 'Unknown',
          userName: user.name ?? 'Unknown',
          adminEmail,
          deletedItineraryCount,
        });
        if (!result.success) {
          logger.error(
            new Error(`[退会通知] メール送信失敗: ${result.error}`),
            { userId, isConfigError: result.isConfigError },
          );
        }
      } catch (error) {
        logger.error(
          error instanceof Error
            ? error
            : new Error('Error sending account deletion notification'),
          { userId },
        );
      }
    } else {
      logger.warn('[退会通知] ADMIN_EMAIL未設定のため通知をスキップ', {
        userId,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error in deleteAccountAction'),
    );
    return {
      success: false,
      error: '退会処理に失敗しました。時間をおいて再度お試しください。',
    };
  }
}
