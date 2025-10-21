'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRecentUrls } from '@/hooks/useRecentUrls';

export default function ItineraryUrlTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addUrl } = useRecentUrls();

  useEffect(() => {
    // 旅程関連のページのみ履歴に記録
    const itineraryViewPattern = /^\/itineraries\/[^\/]+$/; // /itineraries/xxx
    const itineraryEditPattern = /^\/itineraries\/[^\/]+\/edit$/; // /itineraries/xxx/edit

    if (
      itineraryViewPattern.test(pathname) ||
      itineraryEditPattern.test(pathname)
    ) {
      // クエリパラメータを含む完全なURLを構築
      const queryString = searchParams.toString();
      const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // 重複実行を防ぐためのフラグ
      let hasAdded = false;

      // ページのタイトルを取得してから履歴に追加
      const getItineraryTitle = async () => {
        try {
          // 既に追加済みの場合はスキップ
          if (hasAdded) return;

          // ページのtitleタグから情報を取得（サーバーサイドで設定される）
          const pageTitle = document.title;

          // タイトルが設定されている場合はそれを使用、そうでなければデフォルト
          let title: string;
          const isEditPage = pathname.endsWith('/edit');
          const dayParam = searchParams.get('day');

          if (pageTitle && pageTitle !== '車旅のしおり') {
            // ページタイトルから「| 車旅のしおり」を除去
            let itineraryTitle = pageTitle.replace(' | 車旅のしおり', '');

            if (isEditPage) {
              // 編集ページの場合
              if (dayParam) {
                title = `旅程を編集：${itineraryTitle} ${dayParam}日目`;
              } else {
                title = `旅程を編集：${itineraryTitle}`;
              }
            } else {
              // 表示ページの場合
              // itineraryTitleに既に日付情報が含まれている場合があるので、そのまま使用
              title = itineraryTitle;
            }
          } else {
            // ページタイトルが取得できない場合のフォールバック
            if (isEditPage) {
              title = dayParam ? `旅程を編集 (${dayParam}日目)` : `旅程を編集`;
            } else {
              title = dayParam ? `旅程を表示 (${dayParam}日目)` : `旅程を表示`;
            }
          }

          addUrl(fullUrl, title);
          hasAdded = true; // 追加完了フラグを設定
        } catch (error) {
          console.error('Failed to get itinerary title:', error);
          const isEditPage = pathname.endsWith('/edit');
          const dayParam = searchParams.get('day');

          // エラーの場合のフォールバック表示
          let title: string;
          if (isEditPage) {
            title = dayParam ? `旅程を編集 (${dayParam}日目)` : `旅程を編集`;
          } else {
            title = dayParam ? `旅程を表示 (${dayParam}日目)` : `旅程を表示`;
          }

          addUrl(fullUrl, title);
          hasAdded = true; // 追加完了フラグを設定
        }
      };

      // 複数回のタイミングでタイトルを取得を試行
      const timeouts: NodeJS.Timeout[] = [];
      const isEditPage = pathname.endsWith('/edit');

      // 即座に1回実行
      getItineraryTitle();

      // 編集ページの場合は追加で数回リトライ
      if (isEditPage) {
        [500, 1000, 2000].forEach((delay) => {
          const timeoutId = setTimeout(() => {
            getItineraryTitle();
          }, delay);
          timeouts.push(timeoutId);
        });
      }

      return () => {
        timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      };
    }
  }, [pathname, searchParams, addUrl]);

  return null; // このコンポーネントは何もレンダリングしない
}
