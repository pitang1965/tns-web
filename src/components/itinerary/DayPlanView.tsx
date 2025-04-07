import { useState } from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ActivityView } from './ActivityView';
import { H3, LargeText } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import DailyRouteMap, {
  ActivityLocation,
} from '@/components/common/Maps/DailyRouteMap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DayPlan = ServerItineraryDocument['dayPlans'][number];

type DayPlanProps = {
  day: DayPlan;
  dayIndex: number;
};

export function DayPlanView({ day, dayIndex }: DayPlanProps) {
  const [showFullMap, setShowFullMap] = useState(false);

  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  // アクティビティが存在するかチェック
  const hasActivities = day.activities.length > 0;

  // 位置情報を持つアクティビティのみマップに表示
  const activitiesWithLocation: ActivityLocation[] = hasActivities
    ? day.activities
        .filter(
          (activity) =>
            activity.place.location &&
            typeof activity.place.location.latitude === 'number' &&
            typeof activity.place.location.longitude === 'number'
        )
        .map((activity, index) => ({
          id: activity.id || `activity-${index}`,
          order: index + 1,
          title: activity.title || `アクティビティ ${index + 1}`,
          latitude: activity.place.location!.latitude!,
          longitude: activity.place.location!.longitude!,
        }))
    : [];

  // 位置情報が設定されているアクティビティが2つ以上ある場合にのみ地図を表示
  const shouldShowMap = activitiesWithLocation.length >= 2;

  return (
    <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
      <div className='flex justify-between items-center mb-4'>
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

      {/* ルートマップ (コンパクト表示) - 位置情報を持つアクティビティが2つ以上ある場合のみ */}
      {shouldShowMap && (
        <div className='mb-4'>
          <DailyRouteMap
            activities={activitiesWithLocation}
            compact={true}
            onExpandClick={() => setShowFullMap(true)}
          />
        </div>
      )}

      {/* アクティビティリスト */}
      {hasActivities ? (
        <ul className='space-y-2'>
          {day.activities.map((activity, activityIndex) => (
            <ActivityView
              key={activity.id}
              activity={activity}
              index={activityIndex}
              total={day.activities.length}
            />
          ))}
        </ul>
      ) : (
        <LargeText>この日の予定はありません。</LargeText>
      )}

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
