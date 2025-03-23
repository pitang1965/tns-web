'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { ItineraryToc } from '@/components/itinerary/ItineraryToc';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { useGetItinerary } from '@/hooks/useGetItinerary';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';
import { DayPlan } from '@/data/schemas/itinerarySchema';
import { DayPagination } from '@/components/itinerary/DayPagination';
import { Button } from '@/components/ui/button';

type ItineraryDetailProps = {
  id: string;
};

const ItineraryDetail: React.FC<ItineraryDetailProps> = ({ id }) => {
  const { itinerary, loading, error } = useGetItinerary(id);
  const deleteItinerary = useDeleteItinerary();
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { user, isLoading: userLoading } = useUser();

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

  const handleLogin = () => {
    router.push(`/api/auth/login?returnTo=/itineraries/${id}`);
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

  // アクセス制御ロジック
  const isPublic = itinerary.isPublic;
  const isOwner = user && itinerary.owner && user.sub === itinerary.owner.id;
  const isSharedWithUser =
    user &&
    itinerary.sharedWith &&
    itinerary.sharedWith.some((sharedUser) => sharedUser.id === user.sub);

  // 非公開かつ所有者でもなく共有されてもいない場合はアクセス不可
  if (!isPublic && !isOwner && !isSharedWithUser) {
    if (!user) {
      // ログインしていない場合はログインを促す
      return (
        <div className='container mx-auto p-8 text-center'>
          <h2 className='text-2xl font-bold mb-4'>
            このコンテンツを閲覧するにはログインが必要です
          </h2>
          <p className='mb-6'>
            この旅程は非公開に設定されています。閲覧するには認証が必要です。
          </p>
          <Button onClick={handleLogin}>ログイン</Button>
        </div>
      );
    } else {
      // ログイン済みだがアクセス権がない場合
      return (
        <div className='container mx-auto p-8 text-center'>
          <h2 className='text-2xl font-bold mb-4'>アクセス権限がありません</h2>
          <p className='mb-6'>この旅程を閲覧する権限がありません。</p>
          <Button onClick={handleBack} variant='secondary'>
            戻る
          </Button>
        </div>
      );
    }
  }

  return (
    <main className='container mx-auto p-4'>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='hidden md:block'>
          <ItineraryToc itinerary={itinerary} />
        </div>
        <div className='flex-1'>
          <ItineraryHeader itinerary={itinerary} />

          {!user && isPublic && (
            <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md'>
              <p className='text-sm'>
                この旅程をマイリストに追加したり、編集したりするには
                <Button
                  variant='link'
                  className='p-0 mx-1 h-auto'
                  onClick={handleLogin}
                >
                  ログイン
                </Button>
                してください。
              </p>
            </div>
          )}

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

export default ItineraryDetail;
