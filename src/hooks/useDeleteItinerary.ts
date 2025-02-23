import { deleteItinerary } from '@/actions/deleteItinerary';

export function useDeleteItinerary() {
  const handleDelete = async (itineraryId: string) => {
    try {
      const result = await deleteItinerary(itineraryId);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      return {
        success: false,
        message: '旅程の削除中にエラーが発生しました。#1',
      };
    }
  };

  return handleDelete;
}
