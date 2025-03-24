'use client';

import { PlaceForm } from './PlaceForm';
import { useFormContext, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { ActivityControls } from './ActivityControls.tsx';

type ActivityFormProps = {
  dayIndex: number;
  activityIndex: number;
  remove: (dayIndex: number, activityIndex: number) => void;
  moveActivity?: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  onValidationError?: (hasError: boolean) => void;
  errors: FieldErrors<ClientItineraryInput>; //
};

export function ActivityForm({
  dayIndex,
  activityIndex,
  remove,
  moveActivity,
  isFirst = false,
  isLast = false,
  onValidationError,
}: ActivityFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ClientItineraryInput>();

  const basePath = `dayPlans.${dayIndex}.activities.${activityIndex}`;

  // エラーメッセージの取得用のヘルパー関数
  const getFieldError = (
    fieldName: keyof ClientItineraryInput['dayPlans'][number]['activities'][number]
  ) => {
    return errors?.dayPlans?.[dayIndex]?.activities?.[activityIndex]?.[
      fieldName
    ]?.message;
  };

  const handleShiftSubsequentActivities = () => {
    // 「以降のアクティビティの時間をずらす」の処理をここに実装
    // 具体的な処理は後で実装
    console.log('以降のアクティビティの時間をずらす', {
      dayIndex,
      activityIndex,
    });
  };

  return (
    <div className='space-y-2 p-4 border border-border rounded-lg bg-muted/30 dark:bg-muted/20'>
      <div className='flex justify-between items-center'>
        <h4 className='font-medium'>アクティビティ {activityIndex + 1}</h4>
        <ActivityControls
          dayIndex={dayIndex}
          activityIndex={activityIndex}
          remove={remove}
          moveActivity={moveActivity}
          isFirst={isFirst}
          isLast={isLast}
          onShiftSubsequentActivities={handleShiftSubsequentActivities}
        />
      </div>

      <div className='space-y-2'>
        <Label
          htmlFor='title'
          className="after:content-['*'] after:ml-0.5 after:text-red-500"
        >
          タイトル
        </Label>
        <Input
          id='title'
          {...register(
            `dayPlans.${dayIndex}.activities.${activityIndex}.title`
          )}
          placeholder='例: 出発、休憩、散策、昼食、宿泊地到着、入浴'
        />
        {getFieldError('title') && (
          <p className='text-red-500 text-sm'>{getFieldError('title')}</p>
        )}
      </div>
      {getFieldError('title') && (
        <p className='text-red-500 text-sm mt-1'>{getFieldError('title')}</p>
      )}
      <PlaceForm
        dayIndex={dayIndex}
        activityIndex={activityIndex}
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
          {getFieldError('startTime') && (
            <p className='text-red-500 text-sm'>{getFieldError('startTime')}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label>終了時間</Label>
          <Input
            type='time'
            {...register(
              `dayPlans.${dayIndex}.activities.${activityIndex}.endTime`
            )}
          />
          {getFieldError('endTime') && (
            <p className='text-red-500 text-sm'>{getFieldError('endTime')}</p>
          )}
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
          {...register(
            `dayPlans.${dayIndex}.activities.${activityIndex}.cost`,
            {
              setValueAs: (value: string) => {
                if (value === '') return null;
                return Number(value);
              },
            }
          )}
          placeholder='0'
        />
        {getFieldError('cost') && (
          <p className='text-red-500 text-sm'>{getFieldError('cost')}</p>
        )}
      </div>
    </div>
  );
}
