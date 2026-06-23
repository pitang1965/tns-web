import { logger } from '@/lib/logger';

/**
 * PostHog の person を distinct_id（Auth0 sub）で削除する。
 *
 * 退会時にプライバシーポリシー§7「直ちに完全に削除」を守るための処理。
 * PostHog の Personal API Key と Project ID が必要で、未設定なら安全にスキップする。
 * 計測では PII（email・氏名）を保存しておらず distinct_id は sub のみのため、
 * 失敗しても退会処理自体は妨げない（ベストエフォート）。
 *
 * 必要な環境変数:
 *   - POSTHOG_PERSONAL_API_KEY: Personal API Key（person 削除権限が必要）
 *   - POSTHOG_PROJECT_ID: 対象 Project の ID
 *   - POSTHOG_API_HOST: APIホスト（既定 https://us.posthog.com。EUは https://eu.posthog.com）
 */
export async function deletePostHogPerson(distinctId: string): Promise<void> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.POSTHOG_API_HOST || 'https://us.posthog.com';

  if (!apiKey || !projectId) {
    logger.warn('[退会] PostHog person削除をスキップ（API設定なし）', {
      distinctId,
    });
    return;
  }

  const authHeaders = { Authorization: `Bearer ${apiKey}` };

  try {
    // 1. distinct_id から person を検索（内部 person id を得る）
    const findRes = await fetch(
      `${host}/api/projects/${projectId}/persons/?distinct_id=${encodeURIComponent(distinctId)}`,
      { headers: authHeaders },
    );

    if (!findRes.ok) {
      logger.error(
        new Error(`[退会] PostHog person検索失敗: ${findRes.status}`),
        { distinctId },
      );
      return;
    }

    const data = (await findRes.json()) as { results?: Array<{ id?: number }> };
    const personId = data.results?.[0]?.id;

    // 該当 person が無い（未ログイン計測のみ等）場合は削除対象なし
    if (!personId) {
      return;
    }

    // 2. person と関連イベントを削除
    const delRes = await fetch(
      `${host}/api/projects/${projectId}/persons/${personId}/?delete_events=true`,
      { method: 'DELETE', headers: authHeaders },
    );

    if (!delRes.ok) {
      logger.error(
        new Error(`[退会] PostHog person削除失敗: ${delRes.status}`),
        { distinctId },
      );
    }
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error deleting PostHog person during withdrawal'),
      { distinctId },
    );
  }
}
