'use client';

import { PlaceForm } from './PlaceForm';
import { ActivityFormFields } from './ActivityFormFields';
import { FieldErrors } from 'react-hook-form';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { ActivityControls } from './ActivityControls.tsx';
import { useActivityTime } from '@/hooks/useActivityTime';

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

      <ActivityFormFields
        dayIndex={dayIndex}
        activityIndex={activityIndex}
      />
      <PlaceForm
        dayIndex={dayIndex}
        activityIndex={activityIndex}
        basePath={basePath}
      />
    </div>
  );
}