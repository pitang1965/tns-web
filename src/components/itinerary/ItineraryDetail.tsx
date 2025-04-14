'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ItineraryToc } from '@/components/layout/ItineraryToc';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { H2, LargeText } from '@/components/common/Typography';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { DayPagination } from '@/components/layout/DayPagination';
import { useDayParam } from '@/hooks/useDayParam';
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
  const { user } = useUser();

  // 日付パラメータの管理をカスタムフックに委譲
  const dayParamHook = useDayParam(id, (itinerary?.dayPlans?.length || 1)-1);

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
    return <DayPlanView key={index} day={day} dayIndex={index} />;
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
          <H2>このコンテンツを閲覧するにはログインが必要です</H2>
          <LargeText>
            この旅程は非公開に設定されています。閲覧するには認証が必要です。
          </LargeText>
          <Button onClick={handleLogin}>ログイン</Button>
        </div>
      );
    } else {
      // ログイン済みだがアクセス権がない場合
      return (
        <div className='container mx-auto p-8 text-center'>
          <H2>アクセス権限がありません</H2>
          <LargeText>この旅程を閲覧する権限がありません。</LargeText>
          <Button onClick={handleBack} variant='secondary'>
            戻る
          </Button>
        </div>
      );
    }
  }

  // day パラメータが有効範囲外の場合の処理
  if (dayParamHook.isDayOutOfRange) {
    dayParamHook.redirectToFirstDay();
  }

  return (
    <main className='container mx-auto p-4'>
      {/* FixedActionButtonsのための余白を確保 */}
      <div className='pt-8 md:pt-12'></div>
      <div className='flex flex-col md:flex-row gap-6'>
        <div className='hidden md:block'>
          <ItineraryToc initialItinerary={itinerary} />
        </div>
        <div className='flex-1'>
          <ItineraryHeader itinerary={itinerary} />

          {!user && isPublic && (
            <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md'>
              <LargeText>
                この旅程を編集するには
                <Button
                  variant='link'
                  className='p-0 mx-1 h-auto'
                  onClick={handleLogin}
                >
                  ログイン
                </Button>
                してください。
              </LargeText>
            </div>
          )}

          <H2>旅程詳細</H2>

          {itinerary.dayPlans?.length > 0 ? (
            <DayPagination
              dayPlans={itinerary.dayPlans}
              renderDayPlan={renderDayPlan}
              initialSelectedDay={dayParamHook.selectedDay + 1}
              onDayChange={dayParamHook.handleDayChange}
            />
          ) : (
            <LargeText>
              まだ旅程の詳細が登録されていません。「編集」ボタンから旅程を追加してください。
            </LargeText>
          )}

          <FixedActionButtons
            mode='detail'
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            shareData={{
              title: itinerary.title,
              dayIndex: dayParamHook.selectedDay + 1,
              date:
                itinerary.dayPlans[dayParamHook.selectedDay]?.date ||
                itinerary.startDate,
              id: itinerary.id,
            }}
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
