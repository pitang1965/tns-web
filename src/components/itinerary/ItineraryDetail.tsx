'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { ItineraryToc } from '@/components/layout/ItineraryToc';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { H2, LargeText } from '@/components/common/Typography';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { DayPagination } from '@/components/layout/DayPagination';
import { ItineraryAccessGate } from '@/components/itinerary/ItineraryAccessGate';
import { useDayParam } from '@/hooks/useDayParam';
import { useGetItinerary } from '@/hooks/useGetItinerary';
import { useGetItineraryDay } from '@/hooks/useGetItineraryDay';
import { useItineraryAccess } from '@/hooks/useItineraryAccess';
import { useItineraryActions } from '@/hooks/useItineraryActions';
import { DayPlan } from '@/data/schemas/itinerarySchema';

type ItineraryDetailProps = {
  id: string;
};

const ItineraryDetail: React.FC<ItineraryDetailProps> = ({ id }) => {
  const { user } = useUser();
  // 最初は基本メタデータだけを取得（日程の総数を知るため）
  const { itinerary: metadataOnly, loading: metadataLoading } =
    useGetItinerary(id);

  // 日付パラメータの管理
  const dayParamHook = useDayParam(
    id,
    (metadataOnly?.dayPlans?.length || 1) - 1
  );

  const currentDayIndex = dayParamHook.selectedDay;

  // 選択された日のデータのみを取得
  const {
    metadata,
    dayPlan: currentDayPlan,
    loading: dayLoading,
    error: dayError,
  } = useGetItineraryDay(id, currentDayIndex);

  // アクセス制御
  const access = useItineraryAccess({ user, metadata });

  // アクション
  const actions = useItineraryActions({ id });

  // 読み込み状態を合成
  const loading = metadataLoading || dayLoading;
  const error = dayError;

  const renderDayPlan = (dayPlan: DayPlan, index: number) => {
    return <DayPlanView key={index} day={dayPlan} dayIndex={index} />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className='container mx-auto p-4'>
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6'>
          <h2 className='text-xl font-semibold text-red-800 dark:text-red-200 mb-3'>
            エラーが発生しました
          </h2>
          <div className='text-red-700 dark:text-red-300 whitespace-pre-line mb-4'>
            {error}
          </div>
          <div className='flex gap-3'>
            <Button variant='outline' onClick={actions.handleBack}>
              旅程一覧に戻る
            </Button>
            {access.isOwner && (
              <Button onClick={actions.handleEdit}>旅程を編集</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!metadata || !currentDayPlan) {
    return <LargeText>旅程が見つかりません。</LargeText>;
  }

  // アクセス制御チェック
  if (!access.hasAccess) {
    return (
      <ItineraryAccessGate
        needsLogin={access.needsLogin}
        hasAccess={access.hasAccess}
        onLogin={actions.handleLogin}
        onBack={actions.handleBack}
      />
    );
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
          <ItineraryToc initialItinerary={metadata} />
        </div>
        <div className='flex-1'>
          <ItineraryHeader itinerary={metadata} />

          {!user && access.isPublic && (
            <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md'>
              <LargeText>
                この旅程を編集するには
                <Button
                  variant='link'
                  className='p-0 mx-1 h-auto'
                  onClick={actions.handleLogin}
                >
                  ログイン
                </Button>
                してください。
              </LargeText>
            </div>
          )}

          <H2>旅程詳細</H2>

          {metadata.totalDays > 0 ? (
            <DayPagination
              totalDays={metadata.totalDays}
              currentDayPlan={currentDayPlan}
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
            onBack={actions.handleBack}
            onEdit={access.isOwner ? actions.handleEdit : undefined}
            onDelete={access.isOwner ? actions.handleDeleteConfirm : undefined}
            shareItineraryData={{
              title: metadata.title,
              dayIndex: dayParamHook.selectedDay + 1,
              date: currentDayPlan.date || undefined,
              id: metadata.id,
              isPublic: metadata.isPublic,
            }}
          />

          <ConfirmationDialog
            isOpen={actions.isConfirmOpen}
            onOpenChange={actions.setIsConfirmOpen}
            title='旅程の削除'
            description='この旅程を削除してもよろしいですか？この操作は取り消せません。'
            confirmLabel='削除'
            onConfirm={actions.handleDelete}
            variant='destructive'
          />
        </div>
      </div>
    </main>
  );
};

export default ItineraryDetail;
