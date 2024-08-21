'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NewItineraryPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) throw new Error('Failed to create itinerary');
      const data = await response.json();
      console.log('data: ', data);
      router.push(`/itineraries/${data.id}`);
    } catch (error) {
      console.error('Error creating itinerary:', error);
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
            <Button type='submit'>保存</Button>
          </form>
        </div>
      </section>
    </main>
  );
}
