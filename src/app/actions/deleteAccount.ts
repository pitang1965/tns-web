'use server';

import { auth0 } from '@/lib/auth0';
import { auth0Management } from '@/lib/auth0Management';
import { deleteAllItinerariesForUser } from '@/lib/itineraries';
import { deleteAllFieldReportDataForUser } from '@/lib/fieldReports';
import { deleteAllPointDataForUser } from '@/lib/points/points';
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
 *   1. MongoDBのアプリデータ（所有旅程・共有相手参照・現地報告・アズキ）を削除
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
      deletedItineraryCount = await deleteAllItinerariesForUser(user);
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

    // 現地報告（本人の投稿と、他人の報告に付けた通報）も削除する。
    // プライバシーポリシー§8・利用規約第7条の「退会に伴い削除」の対象。
    //
    // 同じ人が Google / LINE / メールで別々の Auth0 アカウントを持つため、認証済みメールから
    // sub の一覧を解決してから消す。旅程やアズキはメールで名寄せできるが、現地報告は
    // ADR-0011 によりメールを保存しない設計なので、sub でしか名寄せできない。
    //
    // Management API の呼び出しが失敗しても退会自体は続行する。少なくとも現在のアカウント分は
    // 確実に消えるため、ここで退会を止めるほうがユーザーの不利益が大きい。
    let subsToPurge = [userId];
    if (user.email && user.email_verified) {
      try {
        const relatedSubs = await auth0Management.listVerifiedUserIdsByEmail(
          user.email,
        );
        subsToPurge = Array.from(new Set([userId, ...relatedSubs]));
      } catch {
        logger.warn(
          '[退会] 同一メールのAuth0ユーザー一覧を取得できず、現在のアカウント分のみ削除する',
          { userId },
        );
      }
    }

    try {
      await deleteAllFieldReportDataForUser(subsToPurge);
    } catch (error) {
      logger.error(
        error instanceof Error
          ? error
          : new Error('Error deleting user field reports during withdrawal'),
        { userId },
      );
      return {
        success: false,
        error:
          '現地報告の削除に失敗しました。時間をおいて再度お試しください。',
      };
    }

    // アズキ（ポイント残高・取引履歴）も削除する。どちらもメールアドレスを保持しており、
    // プライバシーポリシー§8「退会に伴い直ちに完全に削除」の対象にあたる。
    // メールが一次キーのため、なりすましによる他人の残高消去を防ぐ目的で email_verified を必須とする。
    // 未認証の場合はそもそもアズキを利用できない（checkDraftAccess のゲート）ため、スキップしても
    // 利用者の不利益にはならない。
    if (user.email && user.email_verified) {
      try {
        await deleteAllPointDataForUser(user.email);
      } catch (error) {
        logger.error(
          error instanceof Error
            ? error
            : new Error('Error deleting user points during withdrawal'),
          { userId },
        );
        return {
          success: false,
          error:
            'アズキデータの削除に失敗しました。時間をおいて再度お試しください。',
        };
      }
    } else {
      logger.warn('[退会] メール未認証のためアズキデータの削除をスキップ', {
        userId,
      });
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
