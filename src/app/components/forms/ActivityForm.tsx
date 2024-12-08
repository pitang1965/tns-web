'use client';

import { PlaceForm } from './PlaceForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type ActivityFormProps = {
  dayIndex: number;
  activityIndex: number;
  register: any; // useFormから渡される
  remove: (dayIndex: number, activityIndex: number) => void;
  errors: any;
};

export function ActivityForm({
  dayIndex,
  activityIndex,
  register,
  remove,
  errors,
}: ActivityFormProps) {
  const basePath = `dayPlans.${dayIndex}.activities.${activityIndex}`;

  return (
    <div className='space-y-2 p-4 border rounded-lg'>
      <div className='flex justify-between items-center'>
        <h4 className='font-medium'>アクティビティ {activityIndex + 1}</h4>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => remove(dayIndex, activityIndex)}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>

      <div className='space-y-2'>
        <Label>タイトル</Label>
        <Input
          {...register(
            `dayPlans.${dayIndex}.activities.${activityIndex}.title`
          )}
          placeholder='例: 昼食、観光、休憩'
        />
      </div>

      <PlaceForm
        dayIndex={dayIndex}
        activityIndex={activityIndex}
        register={register}
        basePath={basePath}
      />

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>開始時間</Label>
          <Input
            type='time'
            {...register(
              `dayPlans.${dayIndex}.activities.${activityIndex}.startTime`
            )}
          />
        </div>
        <div className='space-y-2'>
          <Label>終了時間</Label>
          <Input
            type='time'
            {...register(
              `dayPlans.${dayIndex}.activities.${activityIndex}.endTime`
            )}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label>説明</Label>
        <Textarea
          {...register(
            `dayPlans.${dayIndex}.activities.${activityIndex}.description`
          )}
          placeholder='詳細な説明'
        />
      </div>

      <div className='space-y-2'>
        <Label>予算</Label>
        <Input
          type='number'
          {...register(`dayPlans.${dayIndex}.activities.${activityIndex}.cost`)}
          placeholder='0'
        />
      </div>
    </div>
  );
}
