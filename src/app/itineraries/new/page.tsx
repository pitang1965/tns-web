'use client';

import React, { useEffect } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import {
  clientItinerarySchema,
  ClientItineraryInput,
} from '@/data/schemas/itinerarySchema';
import { createItineraryAction } from '@/actions/createItinerary';
import { DayPlanForm } from '@/components/forms/DayPlanForm';
import { TransportationType } from '@/components/TransportationBadge';

import { Button } from '@/components/ui/button';
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

type DayPlan = {
  date?: string;
  dayIndex: number;
  activities: Array<{
    id: string;
    title: string;
    place: {
      type: string;
      name: string;
      address: { prefecture: string };
    };
    description?: string;
    startTime?: string;
    endTime?: string;
    cost?: number;
  }>;
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

const DEFAULT_OWNER = {
  id: '',
  name: '',
  email: '',
};

export default withPageAuthRequired(function NewItineraryPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const methods = useForm<ClientItineraryInput>({
    resolver: zodResolver(clientItinerarySchema),
    defaultValues: {
      ...DEFAULT_ITINERARY,
      owner: {
        id: user?.sub ?? DEFAULT_OWNER.id,
        name: user?.name ?? DEFAULT_OWNER.name,
        email: user?.email ?? DEFAULT_OWNER.email,
      },
    },
    mode: 'onChange',
  });

  const {
    formState: { isValid, isDirty, dirtyFields, errors },
    watch,
    setValue,

    trigger,
    register,
    handleSubmit,
  } = methods;

  // 日付の監視と dayPlans の自動生成
  useEffect(() => {
    const startDate = watch('startDate');
    const numberOfDays = watch('numberOfDays');

    trigger(['startDate', 'numberOfDays']);

    const dayCount = numberOfDays || 0;

    const newDayPlans = Array.from({ length: dayCount }, (_, index) => {
      if (startDate) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + index);
        return {
          dayIndex: index,
          date: currentDate.toISOString().split('T')[0],
          activities: [],
        };
      }

      return {
        date: null,
        dayIndex: index,
        activities: [],
      };
    });

    setValue('dayPlans', newDayPlans);
  }, [watch('startDate'), watch('numberOfDays'), setValue]);

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
      {
        shouldValidate: true, // バリデーションを強制的に実行
        shouldDirty: true, // フォームを変更済み状態にする
      }
    );
  };

  const onSubmit = async (values: ClientItineraryInput) => {
    console.log('Form State:', {
      isValid,
      isDirty,
      dirtyFields,
      errors,
      title: values.title,
      description: values.description,
      startDate: values.startDate,
      numberOfDays: values.numberOfDays,
      dayPlansLength: values.dayPlans?.length,
      dayPlans: values.dayPlans,
    });
    try {
      const result = await createItineraryAction(
        values.title,
        values.description,
        values.startDate,
        values.numberOfDays,
        values.dayPlans
      );
      console.log('createItineraryAction result', result);
      if (result.success) {
        console.log('Navigation to', `/itineraries/${result.id}`);
        router.push(`/itineraries/${result.id}`);
      } else {
        console.error('Error: creating itinerary:', result.error);
        toast({
          title: '旅程の作成に失敗しました',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      console.error('Error in onSubmit:', error);
      let errorMessage = '未知のエラーが発生しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: '旅程の作成に失敗しました',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      currentActivities.filter((_, index) => index !== activityIndex)
    );
  };

  // 検証状態の監視
  React.useEffect(() => {
    console.log('Form validation state:', {
      isValid,
      isDirty,
      errors,
      dirtyFields,
      hasErrors: Object.keys(errors).length > 0,
    });
  }, [isValid, isDirty, errors]);

  // transportation の値を監視
  const transportation = watch('transportation');
  React.useEffect(() => {
    console.log('Form Transportation Value:', {
      fullTransportation: transportation,
      details: transportation?.details,
      detailsType: typeof transportation?.details,
    });
  }, [transportation]);

  // 全体の値も監視
  const values = watch();
  React.useEffect(() => {
    console.log('All form values:', values);
  }, [values]);

  return (
    <main className='container mx-auto p-4'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>新しい旅程の作成</CardTitle>
          <CardDescription>
            新しい旅程の詳細を入力してください。* の付いた項目は入力必須です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit((values) => {
                console.log('Form submit event triggered');
                onSubmit(values);
              })}
              className='space-y-4'
            >
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
                <h3 className='text-lg font-medium'>日程詳細</h3>
                {watch('dayPlans')?.map((day, dayIndex) => (
                  <DayPlanForm
                    key={dayIndex}
                    day={day}
                    dayIndex={dayIndex}
                    addActivity={addActivity}
                    removeActivity={removeActivity}
                  />
                ))}
              </div>
              <Button type='submit' className='w-full'>
                保存
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </main>
  );
});
