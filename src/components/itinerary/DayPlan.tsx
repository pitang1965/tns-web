import { ItineraryDocument } from '@/data/types/itinerary';
import { Activity } from './Activity';

type DayPlan = ItineraryDocument['dayPlans'][number];

type DayPlanProps = {
  day: DayPlan;
};

export const DayPlan: React.FC<DayPlanProps> = ({ day }) => (
  <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
    <h3 className='text-xl font-semibold mb-2'>{day.date}</h3>
    {day.activities.length > 0 ? (
      <ul className='space-y-2'>
        {day.activities.map((activity) => (
          <Activity key={activity.id} activity={activity} />
        ))}
      </ul>
    ) : (
      <p>この日の予定はありません。</p>
    )}
  </div>
);
