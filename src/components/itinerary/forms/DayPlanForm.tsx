'use client';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Map } from 'lucide-react';
import { ActivityForm } from './ActivityForm';
import { H3 } from '@/components/common/Typography';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { formatDateWithWeekday } from '@/lib/date';
import DailyRouteMap, {
  ActivityLocation,
} from '@/components/common/Maps/DailyRouteMap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DayPlanFormProps = {
  day: { date: string | null; activities: any[] };
  dayIndex: number;
  daysCount: number;
  addActivity: (dayIndex: number) => void;
  removeActivity: (dayIndex: number, activityIndex: number) => void;
  moveToPreviousDay?: (dayIndex: number, activityIndex: number) => void;
  moveToNextDay?: (dayIndex: number, activityIndex: number) => void;
};

export function DayPlanForm({
  day,
  dayIndex,
  daysCount,
  addActivity,
  removeActivity,
  moveToPreviousDay,
  moveToNextDay,
}: DayPlanFormProps) {
  const [showFullMap, setShowFullMap] = useState(false);
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ClientItineraryInput>();

  const moveActivity = (
    dayIndex: number,
    fromIndex: number,
    toIndex: number
  ) => {
    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    const newActivities = [...activities];
    const [movedItem] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, movedItem);

    setValue(`dayPlans.${dayIndex}.activities`, newActivities, {
      shouldValidate: true,
    });
  };

  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  // その日の活動の総数を取得
  const totalActivities = day.activities?.length || 0;

  // 現在のフォームの値を監視して地図データを生成
  const activitiesData = watch(`dayPlans.${dayIndex}.activities`) || [];

  // 位置情報を持つアクティビティのみマップに表示
  const activitiesWithLocation: ActivityLocation[] = activitiesData
    .filter(
      (activity) =>
        activity.place?.location &&
        typeof activity.place.location.latitude === 'number' &&
        typeof activity.place.location.longitude === 'number'
    )
    .map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      order: index + 1,
      title: activity.title || `アクティビティ ${index + 1}`,
      latitude: activity.place.location!.latitude as number,
      longitude: activity.place.location!.longitude as number,
    }));

  // 位置情報が設定されているアクティビティが2つ以上ある場合にのみ地図を表示
  const shouldShowMap = activitiesWithLocation.length >= 2;

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <div className='flex justify-between items-center'>
        <H3>{dayDisplay}</H3>

        {/* 位置情報を持つアクティビティが2つ以上ある場合のみボタンを表示 */}
        {shouldShowMap && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowFullMap(true)}
            className='flex items-center gap-1'
          >
            <Map className='h-4 w-4' />
            <span>ルートマップ</span>
          </Button>
        )}
      </div>

      {/* ルートマップ (コンパクト表示) */}
      {shouldShowMap && (
        <div className='mb-4'>
          <DailyRouteMap
            activities={activitiesWithLocation}
            compact={true}
            onExpandClick={() => setShowFullMap(true)}
          />
        </div>
      )}

      <div className='space-y-4'>
        {day.activities?.map((activity, activityIndex) => (
          <ActivityForm
            key={activity.id}
            dayIndex={dayIndex}
            activityIndex={activityIndex}
            total={totalActivities}
            remove={removeActivity}
            moveActivity={moveActivity}
            moveToPreviousDay={moveToPreviousDay}
            moveToNextDay={moveToNextDay}
            isFirst={activityIndex === 0}
            isLast={activityIndex === day.activities.length - 1}
            isPreviousDayAvailable={dayIndex > 0}
            isNextDayAvailable={dayIndex < daysCount - 1}
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

      {/* フルスクリーンマップダイアログ */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
        <DialogContent className='sm:max-w-[90vw] max-h-[90vh]'>
          <DialogHeader>
            <DialogTitle>{dayDisplay}のルートマップ</DialogTitle>
          </DialogHeader>
          <div className='h-[70vh] w-full'>
            <DailyRouteMap
              activities={activitiesWithLocation}
              compact={false}
              initialZoom={13}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
