import { logger } from '@/lib/logger';

/**
 * サーバー側で計測する名付きイベント。
 *
 * クライアント側の {@link import('./analytics').AnalyticsEvent} と役割は同じだが、
 * こちらはサーバーアクション内で「確実に」結果を記録したい操作に使う。
 * 例: AI旅程ドラフト生成は成否がサーバーでしか分からず、広告ブロッカーの影響も
 * 受けないためサーバー側で計測する（ADR-0005 / ADR-0008）。
 */
export type ServerAnalyticsEvent =
  | 'draft_generate_succeeded' // AI旅程ドラフトの生成成功
  | 'draft_generate_failed'; // AI旅程ドラフトの生成失敗（reason を伴う）

/**
 * サーバー側から PostHog に名付きイベントを送る（ベストエフォート）。
 *
 * distinct_id は Auth0 sub を渡す。クライアントの identify も sub のため、
 * 同一 person に紐づく（PostHogProvider を参照）。PII（email・氏名・自由入力の
 * 地名など）は properties に含めないこと（ADR-0005）。
 *
 * 送信は Capture API（{@link https://posthog.com/docs/api/capture}）への fetch で行い、
 * posthog-node は導入しない（サーバーレスでの flush/shutdown を避けるため）。
 * 本番のみ送信し、dev/preview では本番データを汚さない（クライアント init と同じ方針）。
 * 失敗してもアプリ動作やサーバーアクションの結果には影響させない。
 */
export async function captureServerEvent(
  event: ServerAnalyticsEvent,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  // クライアントと同じ書き込みキー・ホストを使う（ingest の /capture/ 口）。
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!apiKey) return;

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'server-fetch' },
      }),
    });
  } catch {
    // 計測の失敗はアプリ動作に影響させない
    logger.warn('[analytics] サーバーイベント送信に失敗', { event });
  }
}

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
