'use client';

import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { ItineraryToc } from '@/components/itinerary/ItineraryToc';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { useGetItinerary } from '@/hooks/useGetItinerary';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';
import { DayPlan } from '@/data/schemas/itinerarySchema';
import { DayPagination } from '@/components/itinerary/DayPagination'; // 新しく作成したコンポーネントをインポート

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

  const handleEdit = () => {
    router.push(`/itineraries/${id}/edit`);
  };

  const handleDeleteConfirm = () => {
    setIsConfirmOpen(true);
  };

  const handleBack = () => {
    router.push('/itineraries');
  };

  // 日ごとの旅程をレンダリングする関数
  const renderDayPlan = (day: DayPlan, index: number) => {
    return <DayPlanView key={index} day={day} />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>エラーが発生しました: {error}</div>;
  }

  if (!itinerary || typeof itinerary !== 'object') {
    return <div>旅程が見つかりません。</div>;
  }

  return (
    <main className='container mx-auto p-4'>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='hidden md:block'>
          <ItineraryToc itinerary={itinerary} />
        </div>
        <div className='flex-1'>
          <ItineraryHeader itinerary={itinerary} />

          <h2 className='text-2xl font-semibold mb-4'>旅程詳細</h2>

          {itinerary.dayPlans?.length > 0 ? (
            <DayPagination
              dayPlans={itinerary.dayPlans}
              renderDayPlan={renderDayPlan}
            />
          ) : (
            <p className='text-center text-gray-600 dark:text-gray-400'>
              まだ旅程の詳細が登録されていません。「編集」ボタンから旅程を追加してください。
            </p>
          )}

          <FixedActionButtons
            mode='detail'
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
          />

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
      </div>
    </main>
  );
};

export default withPageAuthRequired(function AuthProtectedItineraryDetail(
  props: ItineraryDetailProps
) {
  return <ItineraryDetail {...props} />;
});
