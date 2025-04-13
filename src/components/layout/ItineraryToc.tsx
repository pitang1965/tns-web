'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { H3, Text, SmallText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { useRouter, useSearchParams } from 'next/navigation';
import { itineraryAtom } from '@/data/store/itineraryAtoms';

import { DayPlan } from '@/data/schemas/itinerarySchema';
import { activitySchema } from '@/data/schemas/activitySchema';
import { z } from 'zod';

// Activity型を推論
type Activity = z.infer<typeof activitySchema>;

// Props型を定義
type ItineraryTocProps = {
  initialItinerary?: any;
};

export function ItineraryToc({ initialItinerary }: ItineraryTocProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Jotaiアトムから旅程データを取得
  const [itinerary, setItinerary] = useAtom(itineraryAtom);

  // コンポーネントがマウントされたときに初期データをロード
  useEffect(() => {
    if (initialItinerary && Object.keys(initialItinerary).length > 0) {
      setItinerary(initialItinerary);
    }
  }, [initialItinerary, setItinerary]);

  const handleDayClick = (dayNumber: number) => {
    // 現在のURLを取得
    const params = new URLSearchParams(searchParams.toString());
    // dayパラメータを設定
    params.set('day', dayNumber.toString());
    // 新しいURLに遷移
    router.push(`?${params.toString()}`);
  };

  return (
    <div className='w-64 shrink-0'>
      <div className='fixed w-64 top-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-[calc(100vh-80px)] overflow-y-auto'>
        <div className='p-4'>
          <H3>目次</H3>
          {itinerary.dayPlans && itinerary.dayPlans.length > 0 ? (
            itinerary.dayPlans.map((day: DayPlan, index: number) => (
              <div
                key={index}
                className='mb-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded'
                onClick={() => handleDayClick(index + 1)}
              >
                <Text>
                  {index + 1}日目{' '}
                  {day.date && `: ${formatDateWithWeekday(day.date)}`}
                </Text>
                <ul className='ml-4 mt-2 space-y-1'>
                  {day.activities &&
                    day.activities.map((activity: Activity, actIndex: number) => (
                      <li
                        key={actIndex}
                        className='text-sm text-gray-600 dark:text-gray-400'
                      >
                        <div className='flex'>
                          <div className='w-5 flex-shrink-0'>
                            {actIndex + 1}.
                          </div>
                          <div>{activity.title}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          ) : (
            <SmallText>日程がまだ登録されていません</SmallText>
          )}
        </div>
      </div>
    </div>
  );
}