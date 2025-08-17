import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SmallText } from '@/components/common/Typography';
import { useActivityForm } from '@/hooks/useActivityForm';

interface ActivityFormFieldsProps {
  dayIndex: number;
  activityIndex: number;
}

export const ActivityFormFields: React.FC<ActivityFormFieldsProps> = ({
  dayIndex,
  activityIndex,
}) => {
  const { getFieldError, getFieldRegister, register } = useActivityForm(
    dayIndex,
    activityIndex
  );

  return (
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
    </div>
  );
};
