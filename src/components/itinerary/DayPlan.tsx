import { Itinerary } from '@/data/types/itinerary';
import { ActivityItem } from './ActivityItem';

type DayPlanProps =  {
  day: Itinerary['dayPlans'][0];
}

export const DayPlan: React.FC<DayPlanProps> = ({ day }) => (
  <div className='mb-6 bg-gray-100 p-4 rounded-lg'>
    <h3 className='text-xl font-semibold mb-2'>{day.date}</h3>
    {day.activities.length > 0 ? (
      <ul className='space-y-2'>
        {day.activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </ul>
    ) : (
      <p>この日の予定はありません。</p>
    )}
  </div>
);
