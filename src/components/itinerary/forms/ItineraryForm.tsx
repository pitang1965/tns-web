'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  clientItinerarySchema,
  ClientItineraryInput,
  ClientItineraryDocument,
} from '@/data/schemas/itinerarySchema';
import { DayPlanForm } from '@/components/itinerary/forms/DayPlanForm';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { H3, LargeText } from '@/components/common/Typography';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { TransportationType } from '@/components/itinerary/TransportationBadge';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { BasicInfoSection } from '@/components/itinerary/forms/BasicInfoSection';
import { DayPagination } from '@/components/layout/DayPagination';
import { useDayParam } from '@/hooks/useDayParam'; // useDayParamフックをインポート

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

const DEFAULT_ITINERARY = {
  title: '',
  description: '',
  startDate: undefined,
  numberOfDays: 1,
  isPublic: false,
  dayPlans: [],
  transportation: {
    type: 'OTHER' as TransportationType,
    details: null as string | null,
  },
  sharedWith: [],
};

export function ItineraryForm({
  initialData,
  onSubmit,
  title,
  description,
  submitLabel,
  isSubmitting = false,
}: ItineraryFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // 保存中の状態を管理するためのstate
  const [isSaving, setIsSaving] = useState(false);

  // 旅程全体に関する情報の折りたたみ
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);

  // 確認ダイアログの表示/非表示
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

  // バックURLを保存する変数
  const [backUrlState, setBackUrlState] = useState('');

  // カスタムダーティフラグを追加
  const [formModified, setFormModified] = useState(false);

  const isCreating = submitLabel === '作成';
  const itineraryId = initialData?._id;

  const methods = useForm<ClientItineraryInput>({
    resolver: zodResolver(clientItinerarySchema),
    defaultValues: initialData || DEFAULT_ITINERARY,
    mode: 'onSubmit',
  });

  const {
    formState: { errors },
    watch,
    setValue,
    trigger,
    handleSubmit,
  } = methods;

  // useDayParamフックを使用して日付パラメータを管理
  const dayParamHook = useDayParam(
    itineraryId || 'new', // 新規作成時は 'new' を使用
    initialData?.dayPlans?.length || 1 // 初期値はinitialDataから取得
  );

  // フォームの初期化後にダーティフラグをリセットする
  useEffect(() => {
    // コンポーネント初期化後に少し遅延してリセット
    const timer = setTimeout(() => {
      setFormModified(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // formが変更された時にダーティフラグをセット
  const handleInputChange = () => {
    setFormModified(true);
  };

  // 戻るボタン処理
  const handleBack = (e: React.MouseEvent) => {
    // イベントの伝播を停止して、フォーム送信が発生しないようにする
    e.preventDefault();
    e.stopPropagation();

    // ルーティング先を確認する
    const backUrl = isCreating
      ? '/itineraries'
      : itineraryId
      ? `/itineraries/${itineraryId}`
      : '/itineraries';

    // バックURLを状態に保存
    setBackUrlState(backUrl);

    if (formModified) {
      // 変更がある場合は確認ダイアログを表示
      setIsBackConfirmOpen(true);
    } else {
      // 変更がない場合は確認なしで戻る
      router.push(backUrl);
    }
  };

  // 確認ダイアログで「はい」を選択した際の処理
  const handleConfirmedBack = async (): Promise<void> => {
    router.push(backUrlState);
    // Promiseを返す必要があるので、即座に解決するPromiseを返す
    return Promise.resolve();
  };

  // 日付の監視と dayPlans の自動生成
  useEffect(() => {
    const startDate = watch('startDate');
    const numberOfDays = watch('numberOfDays');
    const dayCount = numberOfDays || 0;

    // フォームのバリデーション
    trigger(['startDate', 'numberOfDays']);

    const newDayPlans = Array.from({ length: dayCount }, (_, index) => {
      const existingDayPlan = initialData?.dayPlans?.[index];
      if (startDate) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + index);
        return {
          dayIndex: index,
          date: currentDate.toISOString().split('T')[0],
          activities: existingDayPlan?.activities || [],
        };
      }
      return {
        date: null,
        dayIndex: index,
        activities: existingDayPlan?.activities || [],
      };
    });

    // dayPlansの更新
    setValue('dayPlans', newDayPlans);
  }, [
    watch('startDate'),
    watch('numberOfDays'),
    setValue,
    initialData,
    trigger,
  ]);

  // 日数の変更に応じて選択中の日を調整する
  useEffect(() => {
    const numberOfDays = watch('numberOfDays') || 0;

    // 日数が変わった場合、選択日が範囲外にならないようにする
    if (dayParamHook.selectedDay >= numberOfDays && numberOfDays > 0) {
      const newDay = numberOfDays - 1;
      // 無限ループを避けるため、値が実際に変わる場合のみ更新
      if (newDay !== dayParamHook.selectedDay) {
        dayParamHook.handleDayChange(newDay);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayParamHook.selectedDay]);

  useEffect(() => {
    // 1日目表示時は基本情報を展開、それ以外では折りたたむ
    setIsBasicInfoOpen(dayParamHook.selectedDay === 0);
  }, [dayParamHook.selectedDay]);

  const handleFormSubmit = async (values: ClientItineraryInput) => {
    try {
      const result = await onSubmit(values);
      if (result.success) {
        toast({
          title: '操作が完了しました',
          description: '正常に保存されました',
          variant: 'default',
        });

        // submitLabel が「作成」の場合のみリダイレクト
        if (isCreating && result.id) {
          router.push(`/itineraries/${result.id}`);
        }
        // 「更新」の場合はリダイレクトせず、同じ画面に留まる
      } else {
        toast({
          title: '操作に失敗しました',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: '操作に失敗しました',
        description:
          error instanceof Error ? error.message : '未知のエラーが発生しました',
        variant: 'destructive',
      });
    }
  };

  // アクティビティの追加・削除関数
  const addActivity = (dayIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      [
        ...currentActivities,
        {
          id: crypto.randomUUID(),
          title: '',
          place: {
            type: 'ATTRACTION' as const,
            name: '',
            address: {
              postalCode: null,
              prefecture: null,
              city: null,
              town: null,
              block: null,
              building: null,
              country: 'Japan',
            },
            location: {
              latitude: undefined,
              longitude: undefined,
            },
          },
          description: '',
          startTime: '',
          endTime: '',
          cost: 0,
        },
      ],
      { shouldValidate: true, shouldDirty: true }
    );
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      currentActivities.filter((_, index) => index !== activityIndex)
    );
  };

  // 日をまたいだアクティビティの移動機能
  const moveToPreviousDay = (dayIndex: number, activityIndex: number) => {
    if (dayIndex <= 0) return;

    // 現在のアクティビティを取得
    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    // 移動するアクティビティを取得し、時刻情報をクリア
    const movedActivity = { ...activities[activityIndex] };
    movedActivity.startTime = null;
    movedActivity.endTime = null;

    // 現在の日からアクティビティを削除
    const newActivities = [...activities];
    newActivities.splice(activityIndex, 1);

    // 前日のアクティビティを取得
    const prevDayActivities =
      watch(`dayPlans.${dayIndex - 1}.activities`) || [];

    // 前日の末尾にアクティビティを追加
    const newPrevDayActivities = [...prevDayActivities, movedActivity];

    // フォームの値を更新
    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });

    setValue(`dayPlans.${dayIndex - 1}.activities`, newPrevDayActivities, {
      shouldValidate: true,
    });

    // フォーム変更フラグを更新
    setFormModified(true);
  };

  const moveToNextDay = (dayIndex: number, activityIndex: number) => {
    const numberOfDays = watch('numberOfDays') || 0;
    if (dayIndex >= numberOfDays - 1) return;

    // 現在のアクティビティを取得
    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    // 移動するアクティビティを取得し、時刻情報をクリア
    const movedActivity = { ...activities[activityIndex] };
    movedActivity.startTime = null;
    movedActivity.endTime = null;

    // 現在の日からアクティビティを削除
    const newActivities = [...activities];
    newActivities.splice(activityIndex, 1);

    // 翌日のアクティビティを取得
    const nextDayActivities =
      watch(`dayPlans.${dayIndex + 1}.activities`) || [];

    // 翌日の先頭にアクティビティを追加
    const newNextDayActivities = [movedActivity, ...nextDayActivities];

    // フォームの値を更新
    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });

    setValue(`dayPlans.${dayIndex + 1}.activities`, newNextDayActivities, {
      shouldValidate: true,
    });

    // フォーム変更フラグを更新
    setFormModified(true);
  };

  const getErrorsForDisplay = (errors: any) => {
    // 単純なエラーメッセージのみを収集
    const result: Record<string, string> = {};

    // エラーオブジェクトを走査
    Object.keys(errors).forEach((key) => {
      if (errors[key]) {
        if (typeof errors[key] === 'object' && errors[key].message) {
          // メッセージプロパティがある場合はそれを使用
          result[key] = errors[key].message;
        } else if (typeof errors[key] === 'string') {
          // 文字列の場合はそのまま使用
          result[key] = errors[key];
        } else {
          // その他の場合は単に「エラー」と表示
          result[key] = 'エラーがあります';
        }
      }
    });

    return result;
  };

  // 保存ボタンのクリックハンドラー
  const handleSave = (e: React.MouseEvent) => {
    // イベントの伝播を停止
    e.preventDefault();
    e.stopPropagation();

    // 保存中の状態をtrueに設定
    setIsSaving(true);

    try {
      handleSubmit(async (data) => {
        console.log('更新ボタンがクリックされました。データ:', data);
        setFormModified(false);
        return await handleFormSubmit(data);
      })();
    } finally {
      setIsSaving(false);
    }
  };

  // 作成ボタンのクリックハンドラー
  const handleCreate = async (e: React.MouseEvent) => {
    // イベントの伝播を停止
    e.preventDefault();
    e.stopPropagation();

    // 保存中の状態をtrueに設定
    setIsSaving(true);

    try {
      await handleSubmit(async (data) => {
        setFormModified(false);
        console.log('作成ボタンがクリックされました。データ:', data);
        return await handleFormSubmit(data);
      })();
    } finally {
      // 処理が完了したら保存中の状態をfalseに戻す
      setIsSaving(false);
    }
  };

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
        removeActivity={removeActivity}
        moveToPreviousDay={moveToPreviousDay}
        moveToNextDay={moveToNextDay}
      />
    );
  };

  // ページネーションの上部に日数表示を追加
  const renderPaginationHeader = (currentIndex: number) => {
    const numberOfDays = watch('numberOfDays') || 0;
    return (
      <div className='flex justify-between items-center mb-2'>
        <H3>日程詳細</H3>
        <span className='text-sm text-gray-500'>
          {currentIndex + 1} / {numberOfDays}日目
        </span>
      </div>
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
                {watch('dayPlans')?.length > 0 && (
                  <>
                    {/* DayPaginationコンポーネントの使用 - dayParamHookを統合 */}
                    <DayPagination
                      dayPlans={watch('dayPlans')}
                      onDayChange={dayParamHook.handleDayChange}
                      initialSelectedDay={dayParamHook.selectedDay}
                      renderDayPlan={(dayPlan, index) => (
                        <>
                          {/* 各ページの上部に現在の日数表示を追加 */}
                          {renderPaginationHeader(index)}
                          {renderDayPlanForm(dayPlan, index)}
                        </>
                      )}
                    />
                  </>
                )}
              </div>
              {process.env.NODE_ENV === 'development' &&
                Object.keys(errors).length > 0 && (
                  <div className='mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800'>
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
                disabled={isSubmitting || isSaving}
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
