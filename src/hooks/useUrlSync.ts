import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type ParamValue = string | number | boolean | null | undefined;

type UrlSyncOptions = {
  /**
   * URLパラメータのマッピング定義
   * 値がnull/undefined/空文字の場合は除外される
   */
  params: Record<string, ParamValue>;

  /**
   * ベースパス（例: '/admin/shachu-haku', '/shachu-haku'）
   */
  basePath: string;

  /**
   * デバウンス時間（ミリ秒）
   * @default 0（デバウンスなし）
   */
  debounceMs?: number;

  /**
   * 初回マウント時のURL更新をスキップ
   * @default true
   */
  skipInitialMount?: boolean;

  /**
   * URL重複チェックを有効化（無限ループ防止）
   * マップ操作など頻繁な更新がある場合はtrue推奨
   * @default false
   */
  enableDuplicateCheck?: boolean;
};

/**
 * URL検索パラメータとステートを同期するフック
 *
 * フィルタ、タブ、マップ状態などのステートをURLに反映し、
 * ブックマークや共有時にも同じ状態を再現できるようにする
 *
 * @example
 * ```tsx
 * // シンプルな使用例（管理画面）
 * useUrlSync({
 *   params: {
 *     tab: activeTab === 'list' ? 'list' : null,
 *     q: searchTerm,
 *     type: typeFilter !== 'all' ? typeFilter : null,
 *   },
 *   basePath: '/admin/shachu-haku',
 * });
 *
 * // 詳細な使用例（公開画面、マップ操作あり）
 * useUrlSync({
 *   params: {
 *     tab: activeTab === 'list' ? 'list' : null,
 *     q: searchTerm,
 *     type: typeFilter !== 'all' ? typeFilter : null,
 *     pricing: clientFilters.pricingFilter !== 'all' ? clientFilters.pricingFilter : null,
 *     min_security: clientFilters.minSecurityLevel > 0 ? clientFilters.minSecurityLevel : null,
 *     lat: savedBounds ? ((savedBounds.north + savedBounds.south) / 2).toFixed(7) : mapCenter[1].toFixed(6),
 *     lng: savedBounds ? ((savedBounds.east + savedBounds.west) / 2).toFixed(7) : mapCenter[0].toFixed(6),
 *     zoom: !savedBounds ? mapZoom.toFixed(2) : null,
 *   },
 *   basePath: '/shachu-haku',
 *   debounceMs: 500,
 *   enableDuplicateCheck: true,
 * });
 * ```
 */
export function useUrlSync({
  params,
  basePath,
  debounceMs = 0,
  skipInitialMount = true,
  enableDuplicateCheck = false,
}: UrlSyncOptions) {
  const router = useRouter();
  const isInitialMountRef = useRef(skipInitialMount);
  const lastUrlRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 初回マウント時はスキップ（URLパラメータを保持）
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // 既存のタイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // デバウンス処理
    const updateUrl = () => {
      const urlParams = new URLSearchParams();

      // パラメータを追加（値が有効な場合のみ）
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          urlParams.set(key, String(value));
        }
      });

      // 新しいURLを構築
      const queryString = urlParams.toString();
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath;

      // 重複チェックが有効な場合は、前回と同じURLなら更新しない
      if (enableDuplicateCheck && newUrl === lastUrlRef.current) {
        return;
      }

      // URLを更新
      lastUrlRef.current = newUrl;
      router.replace(newUrl, { scroll: false });
    };

    if (debounceMs > 0) {
      timeoutRef.current = setTimeout(updateUrl, debounceMs);
    } else {
      updateUrl();
    }

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // paramsオブジェクト全体を監視（中身が変わったら再実行）
    JSON.stringify(params),
    basePath,
    debounceMs,
    enableDuplicateCheck,
  ]);
}
