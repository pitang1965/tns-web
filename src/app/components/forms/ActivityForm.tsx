'use client';

import { useState } from 'react';
import { PlaceForm } from './PlaceForm';
import {
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  FieldErrors,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type ActivityFormProps = {
  dayIndex: number;
  activityIndex: number;
  register: UseFormRegister<ClientItineraryInput>;
  trigger: UseFormTrigger<ClientItineraryInput>;
  setValue: UseFormSetValue<ClientItineraryInput>;
  remove: (dayIndex: number, activityIndex: number) => void;
  errors: FieldErrors<ClientItineraryInput>;
  onValidationError?: (hasError: boolean) => void;
};

export function ActivityForm({
  dayIndex,
  activityIndex,
  register,
  trigger,
  setValue,
  remove,
  errors,
  onValidationError,
}: ActivityFormProps) {
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
        register={register}
        trigger={trigger}
        setValue={setValue}
        basePath={basePath}
        errors={errors}
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
