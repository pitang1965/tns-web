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
