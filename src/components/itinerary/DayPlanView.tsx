import { useState } from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ActivityView } from './ActivityView';
import { H3, LargeText, Text } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import DailyRouteMap, {
  ActivityLocation,
} from '@/components/common/Maps/DailyRouteMap';
import { DayRouteNavigationButton } from './DayRouteNavigationButton';
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
        .map((activity, originalIndex) => {
          const lat = activity?.place?.location?.latitude;
          const lon = activity?.place?.location?.longitude;

          if (
            !activity?.place?.location ||
            typeof lat !== 'number' ||
            typeof lon !== 'number' ||
            isNaN(lat) ||
            isNaN(lon)
          ) {
            return null;
          }

          return {
            id: activity.id || `activity-${originalIndex}`,
            order: originalIndex + 1, // 元のインデックスを使用
            title: activity.title || `アクティビティ ${originalIndex + 1}`,
            latitude: lat,
            longitude: lon,
          };
        })
        .filter((activity): activity is ActivityLocation => activity !== null)
    : [];

  // 位置情報が設定されているアクティビティが2つ以上ある場合にのみ地図を表示
  const shouldShowMap = activitiesWithLocation.length >= 2;

  // メモが存在するかチェック
  const hasNotes = day.notes && day.notes.trim().length > 0;

  return (
    <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
      <div className='flex justify-between items-center mb-4'>
        <H3>{dayDisplay}</H3>

        <div className='flex items-center gap-2'>
          {/* ルート検索ボタン - 位置情報を持つアクティビティが2つ以上ある場合のみ表示 */}
          {shouldShowMap && (
            <DayRouteNavigationButton activities={day.activities} />
          )}

          {/* 位置情報を持つアクティビティが2つ以上ある場合のみマップボタンを表示 */}
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

      {/* その日のメモ */}
      {hasNotes && (
        <div className='mb-4 bg-muted/50 p-3 rounded-md'>
          <H3>メモ</H3>
          <Text className='whitespace-pre-wrap'>{day.notes}</Text>
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
              allActivities={day.activities}
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
