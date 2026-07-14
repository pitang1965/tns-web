'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import {
  ClientItineraryInput,
  ClientItineraryDocument,
} from '@/data/schemas/itinerarySchema';
import { DayPlanForm } from '@/components/itinerary/forms/DayPlanForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LargeText } from '@/components/common/Typography';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { BasicInfoSection } from '@/components/itinerary/forms/BasicInfoSection';
import { DayPagination } from '@/components/layout/DayPagination';
import { useDayParam } from '@/hooks/useDayParam';
import { useItineraryForm } from '@/hooks/useItineraryForm';
import { useActivityOperations } from '@/hooks/useActivityOperations';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import { getErrorsForDisplay, renderPaginationHeader } from '@/lib/formHelpers';

type ItineraryFormProps = {
  initialData?: ClientItineraryDocument & { _id?: string };
  onSubmit: (
    data: ClientItineraryInput,
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
};

export function ItineraryForm({
  initialData,
  onSubmit,
  title,
  description,
  submitLabel,
  isSubmitting = false,
}: ItineraryFormProps) {
  const itineraryId = initialData?._id;

  // カスタムフックを使用
  const {
    methods,
    errors,
    watch,
    setValue,
    isSaving,
    formModified,
    setFormModified,
    isCreating,
    handleSave,
    handleCreate,
    handleInputChange,
    isSubmitting: formIsSubmitting,
  } = useItineraryForm({
    initialData,
    onSubmit,
    submitLabel,
    isSubmitting,
  });

  const numberOfDays = useWatch({
    control: methods.control,
    name: 'numberOfDays',
  });
  const dayPlans = useWatch({ control: methods.control, name: 'dayPlans' });

  // useDayParamフックを使用して日付パラメータを管理
  const dayParamHook = useDayParam((numberOfDays || 1) - 1);

  // 旅程全体に関する情報の折りたたみ
  // selectedDay が変わったときにレンダリング中に state を更新する (React 推奨パターン)
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(
    dayParamHook.selectedDay === 0,
  );
  const [prevSelectedDay, setPrevSelectedDay] = useState(
    dayParamHook.selectedDay,
  );
  if (prevSelectedDay !== dayParamHook.selectedDay) {
    setPrevSelectedDay(dayParamHook.selectedDay);
    setIsBasicInfoOpen(dayParamHook.selectedDay === 0);
  }

  // アクティビティ操作フック
  const {
    addActivity,
    insertActivity,
    removeActivity,
    moveToPreviousDay,
    moveToNextDay,
  } = useActivityOperations({
    watch,
    setValue,
    setFormModified,
  });

  // ナビゲーションフック
  const {
    isBackConfirmOpen,
    setIsBackConfirmOpen,
    handleBack,
    handleConfirmedBack,
  } = useFormNavigation({
    isCreating,
    itineraryId,
    formModified,
  });

  // 日切り替え後に目次のアクティビティクリックでハッシュ指定された要素へスクロール
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [dayParamHook.selectedDay]);

  // DayPlanFormをレンダリングする関数
  const renderDayPlanForm = (
    day: ClientItineraryInput['dayPlans'][number],
    index: number,
  ) => {
    return (
      <DayPlanForm
        key={index}
        day={day}
        dayIndex={index}
        daysCount={numberOfDays || 0}
        addActivity={addActivity}
        insertActivity={insertActivity}
        removeActivity={removeActivity}
        moveToPreviousDay={moveToPreviousDay}
        moveToNextDay={moveToNextDay}
      />
    );
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form
              onChange={handleInputChange}
              // フォーム送信ハンドラーもマウスイベントを処理するように修正
              onSubmit={(e) => {
                // デフォルトのフォーム送信イベントを抑制
                e.preventDefault();
                console.log('Form onSubmit triggered.');
                // 明示的にボタンクリックで処理する
              }}
              className="space-y-4"
            >
              {/* BasicInfoSectionコンポーネントを使用 */}
              <BasicInfoSection
                isOpen={isBasicInfoOpen}
                onOpenChange={setIsBasicInfoOpen}
              />

              <div className="space-y-4 my-4">
                {/* 日程詳細のヘッダーとDayPaginationコンポーネント */}
                {/* dayPlansが存在しない場合でもDayPaginationを表示 */}
                <DayPagination
                  dayPlans={dayPlans}
                  onDayChange={dayParamHook.handleDayChange}
                  currentPage={dayParamHook.selectedDay + 1}
                  renderDayPlan={(dayPlan, index) => (
                    <>
                      {/* 各ページの上部に現在の日数表示を追加 */}
                      {renderPaginationHeader(index, numberOfDays || 0)}
                      {renderDayPlanForm(dayPlan, index)}
                    </>
                  )}
                />
              </div>
              {process.env.NODE_ENV === 'development' &&
                Object.keys(errors).length > 0 && (
                  <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200">
                    <LargeText>フォームにエラーがあります:</LargeText>
                    <pre>
                      {JSON.stringify(getErrorsForDisplay(errors), null, 2)}
                    </pre>
                  </div>
                )}
              <FixedActionButtons
                mode={isCreating ? 'create' : 'edit'}
                onBack={handleBack}
                onSave={isCreating ? undefined : handleSave}
                onCreate={isCreating ? handleCreate : undefined}
                disabled={formIsSubmitting}
              />
            </form>
            {isSaving && <LoadingSpinner />}
          </FormProvider>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={isBackConfirmOpen}
        onOpenChange={setIsBackConfirmOpen}
        title="入力内容の破棄"
        description="入力内容は破棄されます。よろしいですか？"
        confirmLabel="入力を破棄"
        onConfirm={handleConfirmedBack}
        variant="destructive"
      />
    </>
  );
}
