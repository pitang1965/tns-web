'use client';

import { useState } from 'react';
import { PlaceForm } from './PlaceForm';
import { useFormContext, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MoveUp, MoveDown, Trash2 } from 'lucide-react';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

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
  const [customErrors, setCustomErrors] = useState<{ [key: string]: string }>(
    {}
  );

  const setCustomError = (path: string, message: string) => {
    setCustomErrors((prev) => {
      const newErrors = { ...prev, [path]: message };
      // エラーが存在する場合は親コンポーネントに通知
      onValidationError?.(Object.keys(newErrors).length > 0);
      return newErrors;
    });
  };

  const clearCustomError = (path: string) => {
    setCustomErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[path];
      // エラーが存在する場合は親コンポーネントに通知
      onValidationError?.(Object.keys(newErrors).length > 0);
      return newErrors;
    });
  };

  return (
    <div className='space-y-2 p-4 border border-border rounded-lg bg-muted/30 dark:bg-muted/20'>
      <div className='flex justify-between items-center'>
        <h4 className='font-medium'>アクティビティ {activityIndex + 1}</h4>
        <div className='flex gap-1'>
          {moveActivity && !isFirst && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() =>
                moveActivity(dayIndex, activityIndex, activityIndex - 1)
              }
              title='上に移動'
            >
              <MoveUp className='h-4 w-4' />
            </Button>
          )}
          {moveActivity && !isLast && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() =>
                moveActivity(dayIndex, activityIndex, activityIndex + 1)
              }
              title='下に移動'
            >
              <MoveDown className='h-4 w-4' />
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => remove(dayIndex, activityIndex)}
            title='削除'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
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
      </div>
      {getFieldError('title') && (
        <p className='text-red-500 text-sm mt-1'>{getFieldError('title')}</p>
      )}
      <PlaceForm
        dayIndex={dayIndex}
        activityIndex={activityIndex}
        basePath={basePath}
      />
      {/* エラーメッセージの表示 */}
      {Object.entries(customErrors).map(([path, message]) => (
        <p key={path} className='text-red-500 text-sm'>
          {message}
        </p>
      ))}
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
