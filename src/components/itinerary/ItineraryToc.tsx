'use client';

import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type ItineraryTocProps = {
  itinerary: ClientItineraryInput;
};

export function ItineraryToc({ itinerary }: ItineraryTocProps) {
  return (
    <div className='w-64 shrink-0'>
      <div className='fixed w-64 top-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-[calc(100vh-80px)] overflow-y-auto'>
        <div className='p-4'>
          <h2 className='text-lg font-bold mb-4 dark:text-gray-100'>目次</h2>
          {itinerary.dayPlans && itinerary.dayPlans.length > 0 ? (
            itinerary.dayPlans.map((day, index) => (
              <div key={index} className='mb-4'>
                <h3 className='font-medium text-gray-700 dark:text-gray-300'>
                  {index + 1}日目
                  {day.date && (
                    <span>
                      ({new Date(day.date).toLocaleDateString('ja-JP')})
                    </span>
                  )}
                </h3>
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
            <p className='text-gray-500 dark:text-gray-400'>
              日程がまだ登録されていません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
