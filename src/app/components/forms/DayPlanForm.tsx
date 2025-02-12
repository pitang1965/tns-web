'use client';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ActivityForm } from './ActivityForm';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type DayPlanFormProps = {
  day: { date: string; activities: any[] };
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
  } = useFormContext<ClientItineraryInput>();
  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <h3 className='text-lg font-medium'>
        {new Date(day.date).toLocaleDateString('ja-JP')} - {dayIndex + 1}日目
      </h3>

      <div className='space-y-4'>
        {day.activities?.map((activity, activityIndex) => (
          <ActivityForm
            key={activity.id}
            dayIndex={dayIndex}
            activityIndex={activityIndex}
            remove={removeActivity}
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
