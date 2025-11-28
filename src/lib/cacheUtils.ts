/**
 * PWAキャッシュをクリアするユーティリティ関数
 */

/**
 * 車中泊スポット関連のキャッシュをクリア
 */
export async function clearShachuHakuCache(): Promise<void> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.includes('shachu-haku-list') ||
              name.includes('shachu-haku-detail') ||
              name.includes('shachu-haku-api')
          )
          .map((name) => caches.delete(name))
      );
      console.log('車中泊スポットキャッシュをクリアしました');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
    }
  }
}

/**
 * 旅程関連のキャッシュをクリア
 */
export async function clearItineraryCache(): Promise<void> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.includes('itinerary-list') ||
              name.includes('itinerary-detail') ||
              name.includes('itinerary-api')
          )
          .map((name) => caches.delete(name))
      );
      console.log('旅程キャッシュをクリアしました');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
    }
  }
}
