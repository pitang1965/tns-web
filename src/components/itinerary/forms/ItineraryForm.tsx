'use client';

import React, { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';
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
    data: ClientItineraryInput
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
  // 旅程全体に関する情報の折りたたみ
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);

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

  // useDayParamフックを使用して日付パラメータを管理
  const dayParamHook = useDayParam(
    itineraryId || 'new',
    (watch('numberOfDays') || 1) - 1
  );

  // アクティビティ操作フック
  const { addActivity, insertActivity, removeActivity, moveToPreviousDay, moveToNextDay } =
    useActivityOperations({
      watch,
      setValue,
      setFormModified,
    });

  // ナビゲーションフック
  const { isBackConfirmOpen, setIsBackConfirmOpen, handleBack, handleConfirmedBack } =
    useFormNavigation({
      isCreating,
      itineraryId,
      formModified,
    });

  // 日数の変更に応じて選択中の日を調整する
  useEffect(() => {
    const numberOfDays = watch('numberOfDays') || 0;
    const maxDayIndex = numberOfDays - 1;

    if (dayParamHook.selectedDay > maxDayIndex && maxDayIndex >= 0) {
      if (maxDayIndex !== dayParamHook.selectedDay) {
        dayParamHook.handleDayChange(maxDayIndex);
      }
    }
  }, [watch('numberOfDays')]);

  useEffect(() => {
    // 1日目表示時は基本情報を展開、それ以外では折りたたむ
    setIsBasicInfoOpen(dayParamHook.selectedDay === 0);
  }, [dayParamHook.selectedDay]);

  // DayPlanFormをレンダリングする関数
  const renderDayPlanForm = (day: any, index: number) => {
    const numberOfDays = watch('numberOfDays') || 0;
    return (
      <DayPlanForm
        key={index}
        day={day}
        dayIndex={index}
        daysCount={numberOfDays}
        addActivity={addActivity}
        insertActivity={insertActivity}
        removeActivity={removeActivity}
        moveToPreviousDay={moveToPreviousDay}
        moveToNextDay={moveToNextDay}
      />
    );
  };

  // day パラメータが有効範囲外の場合の処理
  if (dayParamHook.isDayOutOfRange) {
    dayParamHook.redirectToFirstDay();
  }

  return (
    <>
      <Card className='max-w-2xl mx-auto'>
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
              className='space-y-4'
            >
              {/* BasicInfoSectionコンポーネントを使用 */}
              <BasicInfoSection
                isOpen={isBasicInfoOpen}
                onOpenChange={setIsBasicInfoOpen}
              />

              <div className='space-y-4 my-4'>
                {/* 日程詳細のヘッダーとDayPaginationコンポーネント */}
                {/* dayPlansが存在しない場合でもDayPaginationを表示 */}
                <DayPagination
                  dayPlans={watch('dayPlans')}
                  onDayChange={dayParamHook.handleDayChange}
                  initialSelectedDay={dayParamHook.selectedDay + 1}
                  renderDayPlan={(dayPlan, index) => (
                    <>
                      {/* 各ページの上部に現在の日数表示を追加 */}
                      {renderPaginationHeader(index, watch)}
                      {renderDayPlanForm(dayPlan, index)}
                    </>
                  )}
                />
              </div>
              {process.env.NODE_ENV === 'development' &&
                Object.keys(errors).length > 0 && (
                  <div className='mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-200'>
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
        title='入力内容の破棄'
        description='入力内容は破棄されます。よろしいですか？'
        confirmLabel='入力を破棄'
        onConfirm={handleConfirmedBack}
        variant='destructive'
      />
    </>
  );
}
