import posthog from 'posthog-js';

/**
 * PostHog で計測する名付きドメインイベント。
 *
 * CONTEXT.md のドメイン用語に対応する。オートキャプチャ（ページビュー・クリック）
 * とは別に、ファネル/定着分析の起点となる重要操作を明示的に計測する。
 * 詳細は docs/adr/0005-posthog-replaces-google-analytics.md を参照。
 */
export type AnalyticsEvent =
  | 'itinerary_created' // 旅程の作成
  | 'itinerary_published' // 旅程の公開（非公開→公開）
  | 'full_day_route_search' // 全体ルート検索
  | 'mid_trip_route_search' // 途中からのルート検索
  | 'camping_spot_viewed' // 車中泊スポット詳細の閲覧
  | 'spot_search' // スポットのキーワード検索（query / source を伴う）
  | 'diagnosis_completed' // 診断の完了
  | 'camping_spot_submitted' // スポット投稿
  | 'pwa_banner_shown'
  | 'pwa_banner_dismissed'
  | 'pwa_banner_install_clicked'
  | 'pwa_banner_app_installed';

// posthog-js は init 前でも capture を呼べるが警告が出るため、初期化済みのみ送る
function isReady(): boolean {
  return (posthog as unknown as { __loaded?: boolean }).__loaded === true;
}

/**
 * 名付きイベントを PostHog に送信する。
 * 本番のみ PostHog が初期化されるため、開発環境やキー未設定時は何もしない。
 */
export function capture(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined' || !isReady()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // 計測の失敗はアプリ動作に影響させない
  }
}
