import { deleteItinerary } from '@/actions/deleteItinerary';
import { clearItineraryCache } from '@/lib/cacheUtils';

export function useDeleteItinerary() {
  const handleDelete = async (itineraryId: string) => {
    try {
      const result = await deleteItinerary(itineraryId);
      if (!result.success) {
        throw new Error(result.message);
      }
      // 旅程削除成功後にキャッシュをクリア
      await clearItineraryCache();
    } catch (error) {
      throw new Error('旅程の削除中にエラーが発生しました。');
    }
  };

  return handleDelete;
}
