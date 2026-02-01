'use client';

import { useState, useMemo } from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ActivityView } from './ActivityView';
import { H3, LargeText, Text } from '@/components/common/Typography';
import { formatDateWithWeekday } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Map, MapPin } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCurrentLocation, calculateDistance } from '@/hooks/useCurrentLocation';

type DayPlan = ServerItineraryDocument['dayPlans'][number];

type DayPlanProps = {
  day: DayPlan;
  dayIndex: number;
  isOwner?: boolean;
};

// 自宅と現在地が近いと判断する距離（メートル）
const HOME_PROXIMITY_THRESHOLD = 50;

export function DayPlanView({ day, dayIndex, isOwner = false }: DayPlanProps) {
  const [showFullMap, setShowFullMap] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const { currentLocation, permissionGranted, loading, requestLocation } = useCurrentLocation();

  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  // アクティビティが存在するかチェック
  const hasActivities = day.activities.length > 0;

  // 位置情報を持つアクティビティのみマップに表示（タイプ情報も含める）
  // 非所有者の場合は自宅タイプのアクティビティを除外
  const activitiesWithLocation: ActivityLocation[] = useMemo(() => {
    if (!hasActivities) return [];

    const result: ActivityLocation[] = [];

    day.activities.forEach((activity, originalIndex) => {
      const lat = activity?.place?.location?.latitude;
      const lon = activity?.place?.location?.longitude;

      if (
        !activity?.place?.location ||
        typeof lat !== 'number' ||
        typeof lon !== 'number' ||
        isNaN(lat) ||
        isNaN(lon)
      ) {
        return;
      }

      // 非所有者の場合は自宅タイプのアクティビティをマップに表示しない
      if (!isOwner && activity.place.type === 'HOME') {
        return;
      }

      result.push({
        id: activity.id || `activity-${originalIndex}`,
        order: originalIndex + 1,
        title: activity.title || `アクティビティ ${originalIndex + 1}`,
        latitude: lat,
        longitude: lon,
        type: activity.place.type as string,
      });
    });

    return result;
  }, [day.activities, hasActivities, isOwner]);

  // 現在地を含めたルート用アクティビティを計算
  const routeActivitiesWithCurrentLocation: ActivityLocation[] = useMemo(() => {
    if (!currentLocation || activitiesWithLocation.length === 0) {
      return activitiesWithLocation;
    }

    let routeActivities = [...activitiesWithLocation];

    // 最初のアクティビティが自宅タイプで、現在地から50m以内ならスキップ
    if (routeActivities.length > 0) {
      const firstActivity = routeActivities[0];
      if (firstActivity.type === 'HOME') {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          firstActivity.latitude,
          firstActivity.longitude
        );
        if (distance <= HOME_PROXIMITY_THRESHOLD) {
          routeActivities = routeActivities.slice(1);
        }
      }
    }

    // 現在地を先頭に追加
    const currentLocationActivity: ActivityLocation = {
      id: 'current-location',
      order: 0,
      title: '現在地',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      isCurrentLocation: true,
    };

    return [currentLocationActivity, ...routeActivities];
  }, [currentLocation, activitiesWithLocation]);

  // 現在地が許可されていて、アクティビティが1つ以上ある場合にマップを表示
  const shouldShowMap = permissionGranted && currentLocation && activitiesWithLocation.length >= 1;

  // 位置情報許可ボタンを表示するかどうか
  const shouldShowLocationPermissionButton = !permissionGranted && activitiesWithLocation.length >= 1;

  // メモが存在するかチェック
  const hasNotes = day.notes && day.notes.trim().length > 0;

  // 位置情報許可のハンドラー
  const handleRequestLocation = () => {
    setShowLocationAlert(false);
    requestLocation();
  };

  return (
    <div className='mb-6 bg-background text-foreground p-4 rounded-lg'>
      <div className='flex justify-between items-center mb-4'>
        <H3>{dayDisplay}</H3>

        <div className='flex items-center gap-2'>
          {/* 位置情報が許可されている場合のみルート検索ボタンを表示 */}
          {permissionGranted && currentLocation && (
            <DayRouteNavigationButton
              activities={day.activities}
              currentLocation={currentLocation}
            />
          )}

          {/* ルートマップボタン */}
          {shouldShowMap && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFullMap(true)}
              className='flex items-center gap-1 cursor-pointer'
            >
              <Map className='h-4 w-4' />
              <span>ルートマップ</span>
            </Button>
          )}

          {/* 位置情報許可ボタン */}
          {shouldShowLocationPermissionButton && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowLocationAlert(true)}
              disabled={loading}
              className='flex items-center gap-1 cursor-pointer'
            >
              <MapPin className='h-4 w-4' />
              <span>{loading ? '取得中...' : '位置情報を許可'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ルートマップ (コンパクト表示) */}
      {shouldShowMap && (
        <div className='mb-4'>
          <DailyRouteMap
            activities={routeActivitiesWithCurrentLocation}
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
              isOwner={isOwner}
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
              activities={routeActivitiesWithCurrentLocation}
              compact={false}
              initialZoom={13}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 位置情報許可のAlertDialog */}
      <AlertDialog open={showLocationAlert} onOpenChange={setShowLocationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>位置情報の許可</AlertDialogTitle>
            <AlertDialogDescription>
              位置情報が許可されていないと現在位置からのルート検索やルートマップ表示はできません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestLocation}>
              位置情報を許可する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
