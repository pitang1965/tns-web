'use client';

import React, { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
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

export default withPageAuthRequired(function NewItineraryPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createItineraryAction(
      title,
      description,
      startDate,
      endDate
    );
    if (result.success) {
      router.push(`/itineraries/${result.id}`);
    } else {
      console.error('Error creating itinerary:', result.error);
      toast({
        title: '旅程の作成に失敗しました',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <main className='container mx-auto p-4'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>新しい旅程の作成</CardTitle>
          <CardDescription>新しい旅程の詳細を入力してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>旅程タイトル</Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='旅全体を簡潔に説明。例：東北グランドツーリング'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>説明</Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='説明（任意）'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>開始日</Label>
              <Input
                id='startDate'
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate'>終了日</Label>
              <Input
                id='endDate'
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <Button type='submit' className='w-full'>保存</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
});