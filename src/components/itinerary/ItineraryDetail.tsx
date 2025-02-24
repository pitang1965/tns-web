'use client';

import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { useGetItinerary } from '@/hooks/useGetItinerary';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';
import { DayPlan } from '@/data/schemas/itinerarySchema';

type ItineraryDetailProps = {
  id: string;
};

const ItineraryDetail: React.FC<ItineraryDetailProps> = ({ id }) => {
  const { itinerary, loading, error } = useGetItinerary(id);
  const deleteItinerary = useDeleteItinerary();
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    await deleteItinerary(id);
    router.push('/itineraries');
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラーが発生しました: {error}</div>;
  }

  if (!itinerary || typeof itinerary !== 'object') {
    return <div>旅程が見つかりませんよ。</div>;
  }

  return (
    <div className='flex flex-col gap-4 items-center w-full max-w-4xl mx-auto'>
      <div className='flex gap-2'>
        <Button size='sm' onClick={() => {}}>
          編集
        </Button>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => setIsConfirmOpen(true)}
        >
          削除
        </Button>
      </div>
      <ItineraryHeader itinerary={itinerary} />

      <div className='w-full'>
        <h2 className='text-2xl font-semibold mb-4'>旅程詳細</h2>
        {itinerary.dayPlans?.length > 0 ? (
          itinerary.dayPlans.map((day: DayPlan, index: number) => (
            <DayPlanView key={index} day={day} />
          ))
        ) : (
          <p className='text-center text-gray-600 dark:text-gray-400'>
            まだ旅程の詳細が登録されていません。「編集」ボタンから旅程を追加してください。
          </p>
        )}
      </div>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title='旅程の削除'
        description='この旅程を削除してもよろしいですか？この操作は取り消せません。'
        confirmLabel='削除'
        onConfirm={handleDelete}
        variant='destructive'
      />
    </div>
  );
};

export default withPageAuthRequired(function AuthProtectedItineraryDetail(
  props: ItineraryDetailProps
) {
  return <ItineraryDetail {...props} />;
});
