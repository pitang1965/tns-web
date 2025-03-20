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
import { DayPlanForm } from '@/components/forms/DayPlanForm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TransportationType } from '@/components/TransportationBadge';
import { FixedActionButtons } from '@/components/layout/FixedActionButtons';
import { DayPagination } from '@/components/itinerary/DayPagination'; // 既存のDayPaginationコンポーネントをインポート

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
    register,
    handleSubmit,
  } = methods;

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
  const handleBack = () => {
    if (formModified) {
      if (confirm('入力内容は破棄されます。よろしいですか？')) {
        router.push(
          isCreating ? '/itineraries' : `/itineraries/${itineraryId}`
        );
      }
    } else {
      // 変更がない場合は確認なしで戻る
      router.push(isCreating ? '/itineraries' : `/itineraries/${itineraryId}`);
    }
  };

  // 日付の監視と dayPlans の自動生成
  useEffect(() => {
    const startDate = watch('startDate');
    const numberOfDays = watch('numberOfDays');

    trigger(['startDate', 'numberOfDays']);

    const dayCount = numberOfDays || 0;

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

    setValue('dayPlans', newDayPlans);
  }, [
    watch('startDate'),
    watch('numberOfDays'),
    setValue,
    initialData,
    trigger,
  ]);

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

  const handleSave = () => {
    return handleSubmit((data) => {
      console.log('更新ボタンがクリックされました。データ:', data);
      setFormModified(false);
      return handleFormSubmit(data);
    })();
  };

  const handleCreate = () => {
    return handleSubmit((data) => {
      setFormModified(false);
      console.log('作成ボタンがクリックされました。データ:', data);
      return handleFormSubmit(data);
    })();
  };

  // DayPlanFormをレンダリングする関数
  const renderDayPlanForm = (day: any, index: number) => {
    return (
      <DayPlanForm
        key={index}
        day={day}
        dayIndex={index}
        addActivity={addActivity}
        removeActivity={removeActivity}
      />
    );
  };

  // ページネーションの上部に日数表示を追加
  const renderPaginationHeader = (currentIndex: number) => {
    const numberOfDays = watch('numberOfDays') || 0;
    return (
      <div className='flex justify-between items-center mb-2'>
        <h3 className='text-lg font-medium'>日程詳細</h3>
        <span className='text-sm text-gray-500'>
          {currentIndex + 1} / {numberOfDays}日目
        </span>
      </div>
    );
  };

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form
            onChange={handleInputChange}
            onSubmit={(e) => {
              handleSubmit((data) => {
                console.log(
                  'Form handleSubmit callback triggered with data:',
                  data
                );
                handleFormSubmit(data);
              })(e);
            }}
            className='space-y-4'
          >
            {' '}
            <div className='space-y-2'>
              <Label
                htmlFor='title'
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                旅程タイトル
              </Label>
              <Input
                id='title'
                {...register('title')}
                placeholder='旅全体を簡潔に説明。例：東北グランドツーリング'
              />
              {errors.title && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>説明</Label>
              <Textarea
                id='description'
                {...register('description')}
                placeholder='説明'
              />
              {errors.description && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>開始日</Label>
              <Input id='startDate' type='date' {...register('startDate')} />
              {errors.startDate && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='numberOfDays'
                className="after:content-['*'] after:ml-0.5 after:text-red-500"
              >
                日数
              </Label>
              <Input
                id='numberOfDays'
                type='number'
                min={1}
                {...register('numberOfDays', {
                  valueAsNumber: true, // 文字列ではなく数値として扱う
                })}
              />
              {errors.numberOfDays && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.numberOfDays.message}
                </p>
              )}
            </div>
            <div className='space-y-4'>
              {/* 日程詳細のヘッダーとDayPaginationコンポーネント */}
              {watch('dayPlans')?.length > 0 && (
                <>
                  {/* DayPaginationコンポーネントの使用 */}
                  <DayPagination
                    dayPlans={watch('dayPlans')}
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
                  <p>フォームにエラーがあります:</p>
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
              disabled={isSubmitting}
            />
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
