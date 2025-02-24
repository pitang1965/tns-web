import { deleteItinerary } from '@/actions/deleteItinerary';

export function useDeleteItinerary() {
  const handleDelete = async (itineraryId: string) => {
    try {
      const result = await deleteItinerary(itineraryId);
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      throw new Error('旅程の削除中にエラーが発生しました。');
    }
  };

  return handleDelete;
}
