'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createItineraryAction } from '@/actions/createItinerary';

export default function NewItineraryPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

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
      // エラー処理（ユーザーへの通知など）
    }
  };

  return (
    <main className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <section>
        <h1 className='text-3xl font-bold mb-6'>新しい旅程の作成</h1>
        <div className='flex flex-col gap-2'>
          <form onSubmit={handleSubmit}>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='旅程タイトル'
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='説明（任意）'
            />
            <input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className='p-2 border rounded'
            />
            <input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className='p-2 border rounded'
            />
            <Button type='submit'>保存</Button>
          </form>
        </div>
      </section>
    </main>
  );
}
