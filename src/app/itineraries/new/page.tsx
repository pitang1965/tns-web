'use client';

import React from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  clientItinerarySchema,
  ClientItineraryInput,
} from '@/data/schemas/itinerarySchema';
import { createItineraryAction } from '@/actions/createItinerary';
import { DayPlanForm } from '@/components/forms/DayPlanForm';
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
  date: string;
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
}

const DEFAULT_ITINERARY = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  isPublic: false,
  dayPlans: [],
  transportation: {},
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientItineraryInput>({
    resolver: zodResolver(clientItinerarySchema),
    defaultValues: {
      ...DEFAULT_ITINERARY,
      owner: {
        id: user?.sub ?? DEFAULT_OWNER.id,
        name: user?.name ?? DEFAULT_OWNER.name,
        email: user?.email ?? DEFAULT_OWNER.email,
      },
    },
  });
  console.error('errors: ', errors);

  // 日付の監視と dayPlans の自動生成
  React.useEffect(() => {
    const startDate = watch('startDate');
    const endDate = watch('endDate');

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      const newDayPlans = Array.from({ length: dayCount }, (_, index) => {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + index);
        return {
          date: currentDate.toISOString().split('T')[0],
          activities: [],
        };
      });

      setValue('dayPlans', newDayPlans);
    }
  }, [watch('startDate'), watch('endDate'), setValue]);

  // アクティビティの追加・削除関数
  const addActivity = (dayIndex: number) => {
    const currentActivities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(`dayPlans.${dayIndex}.activities`, [
      ...currentActivities,
      {
        id: crypto.randomUUID(),
        title: '',
        place: {
          type: 'ATTRACTION' as const,
          name: '',
          address: {
            prefecture: '',
            city: '', // 追加
            town: '', // 追加
            block: '', // 追加
            country: 'Japan', // 追加
          },
          location: {
            // 必要に応じて追加
            latitude: 0,
            longitude: 0,
          },
        },
        description: '',
        startTime: '',
        endTime: '',
        cost: 0,
      },
    ]);
  };

  const onSubmit = async (values: ClientItineraryInput) => {
    // TODO: valuesで指定可能にしたい
    console.log('Form values:', values);
    try {
      const result = await createItineraryAction(
        values.title,
        values.description,
        values.startDate,
        values.endDate
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

  return (
    <main className='container mx-auto p-4'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>新しい旅程の作成</CardTitle>
          <CardDescription>
            新しい旅程の詳細を入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>旅程タイトル</Label>
              <Input
                id='title'
                {...register('title')}
                placeholder='旅全体を簡潔に説明。例：東北グランドツーリング'
                required
              />
              {errors.title && <p>{errors.title.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>説明</Label>
              <Textarea
                id='description'
                {...register('description')}
                placeholder='説明（任意）'
              />
              {errors.description && <p>{errors.description.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>開始日</Label>
              <Input
                id='startDate'
                type='date'
                {...register('startDate')}
                required
              />
              {errors.startDate && <p>{errors.startDate.message}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate'>終了日</Label>
              <Input
                id='endDate'
                type='date'
                {...register('endDate')}
                required
              />
              {errors.endDate && <p>{errors.endDate.message}</p>}
            </div>
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>日程詳細</h3>
              {watch('dayPlans')?.map((day, dayIndex) => (
                <DayPlanForm
                  key={day.date}
                  day={day}
                  dayIndex={dayIndex}
                  register={register}
                  addActivity={addActivity}
                  removeActivity={removeActivity}
                  errors={errors}
                />
              ))}
            </div>
            {errors.title && (
              <p className='text-red-500'>{errors.title.message}</p>
            )}
            <Button type='submit' className='w-full'>
              保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
});
