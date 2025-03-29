import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ActivityView } from './ActivityView';
import { H3, LargeText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';

type DayPlan = ServerItineraryDocument['dayPlans'][number];

type DayPlanProps = {
  day: DayPlan;
};

export const DayPlanView: React.FC<DayPlanProps> = ({ day }) => (
  <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
    <H3>{day.date && formatDateWithWeekday(day.date)}</H3>
    {day.activities.length > 0 ? (
      <ul className='space-y-2'>
        {day.activities.map((activity) => (
          <ActivityView key={activity.id} activity={activity} />
        ))}
      </ul>
    ) : (
      <LargeText>この日の予定はありません。</LargeText>
    )}
  </div>
);
