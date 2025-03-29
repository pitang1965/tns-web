'use client';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ActivityForm } from './ActivityForm';
import { H3 } from '@/components/common/Typography';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { formatDateWithWeekday } from '@/lib/date';

type DayPlanFormProps = {
  day: { date: string | null; activities: any[]; };
  dayIndex: number;
  addActivity: (dayIndex: number) => void;
  removeActivity: (dayIndex: number, activityIndex: number) => void;
};

export function DayPlanForm({
  day,
  dayIndex,
  addActivity,
  removeActivity,
}: DayPlanFormProps) {
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ClientItineraryInput>();

  const moveActivity = (dayIndex: number, fromIndex: number, toIndex: number) => {
    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    const newActivities = [...activities];
    const [movedItem] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedItem);

    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });
  };

  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <H3>{dayDisplay}</H3>
      <div className='space-y-4'>
        {day.activities?.map((activity, activityIndex) => (
          <ActivityForm
            key={activity.id}
            dayIndex={dayIndex}
            activityIndex={activityIndex}
            remove={removeActivity}
            moveActivity={moveActivity}
            isFirst={activityIndex === 0}
            isLast={activityIndex === day.activities.length - 1}
            errors={errors}
          />
        ))}

        <Button
          type='button'
          variant='outline'
          onClick={() => addActivity(dayIndex)}
          className='w-full'
        >
          <PlusCircle className='h-4 w-4 mr-2' />
          アクティビティを追加
        </Button>
      </div>
    </div>
  );
}
