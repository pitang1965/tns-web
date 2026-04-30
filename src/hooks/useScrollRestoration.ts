import { useEffect, RefObject } from 'react';

/**
 * スクロール位置をsessionStorageに保存・復元するフック
 * ページ遷移時にスクロール位置を維持したい場合に使用
 *
 * @param containerRef - スクロールコンテナへのref
 * @param storageKey - sessionStorageのキー名
 * @param dependencies - 復元タイミングを制御する依存配列（通常はデータのID等）
 * @returns {Object} - saveScrollPosition: スクロール位置を保存する関数
 *
 * @example
 * ```tsx
 * function EditForm({ spot }) {
 *   const cardRef = useRef<HTMLDivElement>(null);
 *   const { saveScrollPosition } = useScrollRestoration(
 *     cardRef,
 *     'admin-spot-scroll',
 *     [spot?.name, spot?.prefecture]
 *   );
 *
 *   const handleNavigate = (id: string) => {
 *     saveScrollPosition();
 *     router.push(`/admin/spots/${id}`);
 *   };
 *
 *   return <div ref={cardRef}>...</div>;
 * }
 * ```
 */
export function useScrollRestoration(
  containerRef: RefObject<HTMLElement | null>,
  storageKey: string,
  dependencies: any[] = [],
) {
  // スクロール位置の復元
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(storageKey);
    const scrollPos = savedScroll ? parseInt(savedScroll, 10) : 0;

    // 保存されたスクロール位置があり、コンテナが存在する場合のみ復元
    if (containerRef.current && scrollPos > 0) {
      console.log('🔄 Restoring scroll to:', scrollPos);

      // DOMの更新を待ってからスクロール位置を復元
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = scrollPos;
            console.log('✅ Scroll restored');
            // 復元後は保存済みの位置情報をクリア
            sessionStorage.removeItem(storageKey);
          }
        }, 100);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  /**
   * 現在のスクロール位置をsessionStorageに保存
   */
  const saveScrollPosition = () => {
    if (containerRef.current) {
      const scrollPos = containerRef.current.scrollTop;
      sessionStorage.setItem(storageKey, scrollPos.toString());
      console.log('📍 Saved scroll:', scrollPos);
    }
  };

  return { saveScrollPosition };
}
