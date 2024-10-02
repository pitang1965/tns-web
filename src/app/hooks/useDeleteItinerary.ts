import { useRouter } from 'next/navigation';
import { deleteItinerary } from '@/actions/deleteItinerary';

export function useDeleteItinerary() {
  const router = useRouter();

  const handleDelete = async (itineraryId: string) => {
    if (confirm('本当にこの旅程を削除しますか？')) {
      try {
        const result = await deleteItinerary(itineraryId);

        if (result.success) {
          alert('旅程が正常に削除されました。');
          router.refresh(); // ページを更新して変更を反映
          return true;
        } else {
          alert(result.message || '旅程の削除中にエラーが発生しました。');
        }
      } catch (error) {
        console.error('Error deleting itinerary:', error);
        alert('旅程の削除中にエラーが発生しました。');
      }
    }
    return false;
  };

  return handleDelete;
}
