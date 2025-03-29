'use client';

import { PlaceForm } from './PlaceForm';
import { useFormContext, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { ActivityControls } from './ActivityControls.tsx';
import { SmallText } from '@/components/common/Typography';

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
  const { getValues, setValue } = useFormContext<ClientItineraryInput>();
  const basePath = `dayPlans.${dayIndex}.activities.${activityIndex}`;

  // エラーメッセージの取得用のヘルパー関数
  const getFieldError = (
    fieldName: keyof ClientItineraryInput['dayPlans'][number]['activities'][number]
  ) => {
    return errors?.dayPlans?.[dayIndex]?.activities?.[activityIndex]?.[
      fieldName
    ]?.message;
  };

  const handleShiftSubsequentActivities = (
    dayIndex: number,
    activityIndex: number,
    delayMinutes: number
  ) => {
    const activities = getValues(`dayPlans.${dayIndex}.activities`);

    // 選択されたアクティビティ以降の時間を調整（同じ日のみ）
    for (let i = activityIndex; i < activities.length; i++) {
      const activity = activities[i];

      // 開始時間の調整（設定されている場合のみ）
      if (activity.startTime) {
        const startTime = adjustTime(activity.startTime, delayMinutes);
        setValue(`dayPlans.${dayIndex}.activities.${i}.startTime`, startTime);
      }

      // 終了時間の調整（設定されている場合のみ）
      if (activity.endTime) {
        const endTime = adjustTime(activity.endTime, delayMinutes);
        setValue(`dayPlans.${dayIndex}.activities.${i}.endTime`, endTime);
      }
    }
  };

  // 時間をずらす関数（24時間制で処理、日をまたいでも単純に時刻を調整）
  const adjustTime = (timeString: string, delayMinutes: number): string => {
    // 時間文字列から時間と分を取得
    const [hours, minutes] = timeString.split(':').map(Number);

    // 総分数を計算
    let totalMinutes = hours * 60 + minutes + delayMinutes;

    // 24時間制で調整（負の値や24時間を超える値に対応）
    totalMinutes = ((totalMinutes % 1440) + 1440) % 1440; // 1440 = 24時間 * 60分

    // 時間と分に戻す
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    // HH:MM 形式に整形
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(
      2,
      '0'
    )}`;
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
          <SmallText>{getFieldError('title')}</SmallText>
        )}
      </div>
      {getFieldError('title') && (
        <SmallText>{getFieldError('title')}</SmallText>
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
            <SmallText>{getFieldError('startTime')}</SmallText>
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
            <SmallText>{getFieldError('endTime')}</SmallText>
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
          <SmallText>{getFieldError('cost')}</SmallText>
        )}
      </div>
    </div>
  );
}
