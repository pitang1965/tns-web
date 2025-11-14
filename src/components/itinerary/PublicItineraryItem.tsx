'use client';

import React from 'react';
import Link from 'next/link';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { formatDateWithWeekday } from '@/lib/date';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const PublicItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const displayCreator = (owner: { name?: string; email?: string }): string => {
    // メールアドレスかどうかを判定する関数
    const isEmail = (text: string): boolean => {
      // 簡易的なメールアドレス判定（@を含む）
      return text.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    };

    // メールアドレスをマスクする関数
    const maskEmail = (email: string): string => {
      const username = email.split('@')[0];
      return (
        username.substring(0, 2) +
        '*'.repeat(Math.max(username.length - 2, 3)) +
        '@***'
      );
    };

    // 名前があり、メールアドレスでない場合はそのまま表示
    if (owner.name && !isEmail(owner.name)) {
      return owner.name;
    }

    // 名前がメールアドレス形式の場合はマスク
    if (owner.name && isEmail(owner.name)) {
      return maskEmail(owner.name);
    }

    // 名前がなく、メールアドレスがある場合はメールアドレスをマスク
    if (owner.email) {
      return maskEmail(owner.email);
    }

    return '名無しさん';
  };

  return (
    <Card className='flex flex-col h-full interactive-card'>
      <CardHeader>
        <CardTitle className='line-clamp-2'>{itinerary.title}</CardTitle>
        {itinerary.owner && (
          <span className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            作成者: {displayCreator(itinerary.owner)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <CardDescription className='mb-2'>
          {itinerary.startDate && formatDateWithWeekday(itinerary.startDate)}{' '}
          から {itinerary.numberOfDays}日間
        </CardDescription>
        <CardDescription className='line-clamp-3'>
          {itinerary.description}
        </CardDescription>
      </CardContent>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Link href={`/itineraries/${itinerary.id}`} className='flex-1'>
            <Button
              size='sm'
              variant='secondary'
              className='flex-1 cursor-pointer'
            >
              見る
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
