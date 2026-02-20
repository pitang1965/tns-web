'use client';

import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { H3, Text, SmallText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { useRouter, useSearchParams } from 'next/navigation';
import { ItineraryMetadata, itineraryMetadataAtom } from '@/data/store/itineraryAtoms';
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

  // 編集ページではフォーム変更をリアルタイム反映するためatom優先、閲覧ページはprops使用
  const [atomItinerary] = useAtom(itineraryMetadataAtom);
  const displayData = atomItinerary.title ? atomItinerary : initialItinerary;

  const [topOffset, setTopOffset] = useState(192); // デフォルト値

  // 動的にヘッダー＋広告の高さを計算し、スクロールに応じて調整
  useEffect(() => {
    const calculateOffset = () => {
      const header = document.querySelector('header');
      const adContainer = document.querySelector('[class*="adsbygoogle"]')?.closest('div');

      if (header) {
        const hHeight = header.offsetHeight;

        if (adContainer) {
          const adHeight = adContainer.offsetHeight;
          const scrollY = window.scrollY;
          const adBottom = adContainer.offsetTop + adHeight;

          // スクロール位置に応じて目次の位置を滑らかに調整
          const adTop = adContainer.offsetTop;

          if (scrollY + hHeight >= adBottom) {
            // 広告が完全に隠れた場合はヘッダー直下に配置
            setTopOffset(hHeight + 16);
          } else if (scrollY <= adTop) {
            // 広告が完全に見える場合は広告の下に配置
            setTopOffset(hHeight + adHeight + 16);
          } else {
            // 広告が部分的に見える場合は、見える部分の下に配置
            const visibleAdHeight = adBottom - (scrollY + hHeight);
            setTopOffset(hHeight + Math.max(0, visibleAdHeight) + 16);
          }
        } else {
          setTopOffset(hHeight + 16);
        }
      }
    };

    // 初回計算
    calculateOffset();

    // 広告が読み込まれた後に再計算
    const timer = setTimeout(calculateOffset, 2000);

    // スクロールとリサイズ時に再計算
    const handleScroll = () => calculateOffset();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', calculateOffset);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateOffset);
    };
  }, []);

  const handleDayClick = (dayNumber: number) => {
    // 現在のURLを取得
    const params = new URLSearchParams(searchParams.toString());
    // dayパラメータを設定
    params.set('day', dayNumber.toString());
    // 新しいURLに遷移
    router.push(`?${params.toString()}`);
  };

  // 表示用のデータを取得
  const summaries = displayData?.dayPlanSummaries || [];

  return (
    <div className='w-80 shrink-0'>
      <div 
        className='fixed w-80 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto'
        style={{
          top: `${topOffset}px`,
          maxHeight: `calc(100vh - ${topOffset + 32}px)`
        }}
      >
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
                    <CollapsibleTrigger 
                      className='flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      onClick={(e) => e.stopPropagation()}
                    >
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
