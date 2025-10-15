'use client';

import { PlaceForm } from './PlaceForm';
import { FieldErrors } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { ActivityControls } from './ActivityControls.tsx';
import { useActivityTime } from '@/hooks/useActivityTime';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmallText } from '@/components/common/Typography';
import { useActivityForm } from '@/hooks/useActivityForm';

type ActivityFormProps = {
  dayIndex: number;
  activityIndex: number;
  total?: number;
  remove: (dayIndex: number, activityIndex: number) => void;
  moveActivity?: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  moveToPreviousDay?: (dayIndex: number, activityIndex: number) => void;
  moveToNextDay?: (dayIndex: number, activityIndex: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isPreviousDayAvailable?: boolean;
  isNextDayAvailable?: boolean;
  onValidationError?: (hasError: boolean) => void;
  errors: FieldErrors<ClientItineraryInput>;
};

export function ActivityForm({
  dayIndex,
  activityIndex,
  total,
  remove,
  moveActivity,
  moveToPreviousDay,
  moveToNextDay,
  isFirst = false,
  isLast = false,
  isPreviousDayAvailable = false,
  isNextDayAvailable = false,
  onValidationError,
}: ActivityFormProps) {
  const { handleShiftSubsequentActivities } = useActivityTime();
  const basePath = `dayPlans.${dayIndex}.activities.${activityIndex}`;
  const { getFieldError, getFieldRegister, register } = useActivityForm(
    dayIndex,
    activityIndex
  );

  // アクティビティのタイトル表示を生成
  const activityHeader = total
    ? `アクティビティ ${activityIndex + 1}/${total}`
    : `アクティビティ ${activityIndex + 1}`;

  return (
    <div className='space-y-2 p-4 border border-border rounded-lg bg-muted/30 dark:bg-muted/20'>
      <div className='flex justify-between items-center'>
        <h4 className='font-medium'>{activityHeader}</h4>
        <ActivityControls
          dayIndex={dayIndex}
          activityIndex={activityIndex}
          remove={remove}
          moveActivity={moveActivity}
          moveToPreviousDay={moveToPreviousDay}
          moveToNextDay={moveToNextDay}
          isFirst={isFirst}
          isLast={isLast}
          isPreviousDayAvailable={isPreviousDayAvailable}
          isNextDayAvailable={isNextDayAvailable}
          onShiftSubsequentActivities={handleShiftSubsequentActivities}
        />
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label
            htmlFor='title'
            className="after:content-['*'] after:ml-0.5 after:text-red-500"
          >
            タイトル
          </Label>
          <Input
            id='title'
            {...getFieldRegister('title')}
            placeholder='例: 出発、休憩、散策、昼食、宿泊地到着、入浴'
          />
          {getFieldError('title') && (
            <SmallText>{getFieldError('title')}</SmallText>
          )}
        </div>

        <PlaceForm
          dayIndex={dayIndex}
          activityIndex={activityIndex}
          basePath={basePath}
        />

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>開始時間</Label>
            <Input type='time' {...getFieldRegister('startTime')} />
            {getFieldError('startTime') && (
              <SmallText>{getFieldError('startTime')}</SmallText>
            )}
          </div>
          <div className='space-y-2'>
            <Label>終了時間</Label>
            <Input type='time' {...getFieldRegister('endTime')} />
            {getFieldError('endTime') && (
              <SmallText>{getFieldError('endTime')}</SmallText>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label>説明</Label>
          <Textarea
            {...getFieldRegister('description')}
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
            <SmallText>{getFieldError('cost')}</SmallText>
          )}
        </div>

        <div className='space-y-2'>
          <Label>URL</Label>
          <Input
            type='url'
            {...getFieldRegister('url')}
            placeholder='https://example.com'
          />
          {getFieldError('url') && (
            <SmallText>{getFieldError('url')}</SmallText>
          )}
        </div>
      </div>
    </div>
  );
}
