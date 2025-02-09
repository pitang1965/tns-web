'use client';
import { UseFormRegister, UseFormTrigger, FieldErrors  } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ActivityForm } from './ActivityForm';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type DayPlanFormProps = {
  day: { date: string; activities: any[] };
  dayIndex: number;
  register: UseFormRegister<ClientItineraryInput>;
  trigger: UseFormTrigger<ClientItineraryInput>;
  addActivity: (dayIndex: number) => void;
  removeActivity: (dayIndex: number, activityIndex: number) => void;
  errors: FieldErrors<ClientItineraryInput>;
}

export function DayPlanForm({
  day,
  dayIndex,
  register,
  trigger,
  addActivity,
  removeActivity,
  errors,
}: DayPlanFormProps) {
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
            register={register}
            trigger={trigger}
            remove={removeActivity}
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
