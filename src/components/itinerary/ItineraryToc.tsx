'use client';

import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { H3, Text, SmallText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';

type ItineraryTocProps = {
  itinerary: ClientItineraryInput;
};

export function ItineraryToc({ itinerary }: ItineraryTocProps) {
  return (
    <div className='w-64 shrink-0'>
      <div className='fixed w-64 top-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-[calc(100vh-80px)] overflow-y-auto'>
        <div className='p-4'>
          <H3>目次</H3>
          {itinerary.dayPlans && itinerary.dayPlans.length > 0 ? (
            itinerary.dayPlans.map((day, index) => (
              <div key={index} className='mb-4'>
                <Text>
                  {index + 1}日目{' '}
                  {day.date && `: ${formatDateWithWeekday(day.date)}`}
                </Text>
                <ul className='ml-4 mt-2 space-y-1'>
                  {day.activities &&
                    day.activities.map((activity, actIndex) => (
                      <li
                        key={actIndex}
                        className='text-sm text-gray-600 dark:text-gray-400'
                      >
                        {activity.title}
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
