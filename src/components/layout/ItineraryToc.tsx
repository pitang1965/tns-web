'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { H3, Text, SmallText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ItineraryMetadata,
  itineraryMetadataAtom,
} from '@/data/store/itineraryAtoms';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

type ActivitySummary = {
  id?: string;
  title: string;
};

type DaySummary = {
  date: string | null;
  notes?: string;
  activities?: ActivitySummary[];
};

type ItineraryTocProps = {
  initialItinerary?: Partial<ItineraryMetadata>;
};

export function ItineraryToc({ initialItinerary }: ItineraryTocProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [metadata, setMetadata] = useAtom(itineraryMetadataAtom);

  // コンポーネントがマウントされたときに初期データをロード
  useEffect(() => {
    if (initialItinerary && Object.keys(initialItinerary).length > 0) {
      setMetadata(initialItinerary as ItineraryMetadata);
    }
  }, [initialItinerary, setMetadata]);

  const handleDayClick = (dayNumber: number) => {
    // 現在のURLを取得
    const params = new URLSearchParams(searchParams.toString());
    // dayパラメータを設定
    params.set('day', dayNumber.toString());
    // 新しいURLに遷移
    router.push(`?${params.toString()}`);
  };

  // 表示用のデータを取得
  const summaries =
    initialItinerary?.dayPlanSummaries || metadata.dayPlanSummaries || [];

  return (
    <div className='w-80 shrink-0'>
      <div className='fixed w-80 top-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-[calc(100vh-80px)] overflow-y-auto'>
        <div className='p-4'>
          <H3>目次</H3>
          {summaries.length > 0 ? (
            summaries.map((day: DaySummary, index: number) => (
              <div
                key={index}
                className='mb-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded'
                onClick={() => handleDayClick(index + 1)}
              >
                <Text>
                  {index + 1}日目{' '}
                  {day.date && `: ${formatDateWithWeekday(day.date)}`}
                </Text>
                {day.notes && (
                  <SmallText className='mt-1 ml-2'>{day.notes}</SmallText>
                )}

                {day.activities && day.activities.length > 0 && (
                  <Collapsible className='mt-2'>
                    <CollapsibleTrigger className='flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'>
                      <ChevronDown className='h-4 w-4 mr-1' />
                      <span>アクティビティ一覧</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className='ml-4 mt-2 space-y-1'>
                        {day.activities.map((activity, actIndex) => (
                          <li
                            key={actIndex}
                            className='text-sm text-gray-600 dark:text-gray-400'
                          >
                            <div className='flex'>
                              <div className='w-5 flex-shrink-0'>
                                {actIndex + 1}.
                              </div>
                              <SmallText>{activity.title}</SmallText>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                )}
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
