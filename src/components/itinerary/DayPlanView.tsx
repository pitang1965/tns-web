import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ActivityView } from './ActivityView';
import { H3, LargeText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';

type DayPlan = ServerItineraryDocument['dayPlans'][number];

type DayPlanProps = {
  day: DayPlan;
  dayIndex: number;
};

export function DayPlanView({ day, dayIndex }: DayPlanProps) {
  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  return (
    <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
      <H3>{dayDisplay}</H3>
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
}
