'use client';
import { useState, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  PlusCircle,
  Map,
  Clock,
  Tent,
  Navigation,
  MapPin,
} from 'lucide-react';
import { ActivityForm } from './ActivityForm';
import { ActivityOrderList } from './ActivityOrderList';
import { H3 } from '@/components/common/Typography';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { formatDateWithWeekday } from '@/lib/date';
import { sortActivitiesByTime } from '@/lib/activitySort';
import DailyRouteMap, {
  ActivityLocation,
} from '@/components/common/Maps/DailyRouteMap';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AddShachuHakuSpotDialog } from '../AddShachuHakuSpotDialog';
import { DayRouteNavigationButton } from '../DayRouteNavigationButton';
import { useLocationRouting } from '@/hooks/useLocationRouting';

type DayPlanFormProps = {
  day: { date: string | null; activities: any[]; notes?: string };
  dayIndex: number;
  daysCount: number;
  addActivity: (dayIndex: number) => void;
  insertActivity: (dayIndex: number, atIndex: number) => void;
  removeActivity: (dayIndex: number, activityIndex: number) => void;
  moveToPreviousDay?: (dayIndex: number, activityIndex: number) => void;
  moveToNextDay?: (dayIndex: number, activityIndex: number) => void;
};

export function DayPlanForm({
  day,
  dayIndex,
  daysCount,
  addActivity,
  insertActivity,
  removeActivity,
  moveToPreviousDay,
  moveToNextDay,
}: DayPlanFormProps) {
  'use memo';
  const [showFullMap, setShowFullMap] = useState(false);
  const [showCampingSpotDialog, setShowCampingSpotDialog] = useState(false);
  const {
    formState: { errors },
    watch,
    setValue,
    register,
    control,
  } = useFormContext<ClientItineraryInput>();

  // useWatchを使用してリアルタイムで監視
  const watchedActivities = useWatch({
    control,
    name: `dayPlans.${dayIndex}.activities`,
    defaultValue: [],
  });

  const moveActivity = (
    dayIndex: number,
    fromIndex: number,
    toIndex: number,
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

  const handleSortActivitiesByTime = () => {
    const activities = watch(`dayPlans.${dayIndex}.activities`);
    if (!activities) return;

    const sortedActivities = sortActivitiesByTime(activities);

    setValue(`dayPlans.${dayIndex}.activities`, sortedActivities, {
      shouldValidate: true,
    });
  };

  const handleAddCampingSpot = (newActivities: any[]) => {
    const activities = watch(`dayPlans.${dayIndex}.activities`) || [];
    setValue(
      `dayPlans.${dayIndex}.activities`,
      [...activities, ...newActivities],
      { shouldValidate: true },
    );
  };

  const previousDayActivities =
    dayIndex > 0 ? watch(`dayPlans.${dayIndex - 1}.activities`) || [] : [];
  const previousDayLastActivity =
    previousDayActivities.length > 0
      ? previousDayActivities[previousDayActivities.length - 1]
      : null;

  const showCopyPreviousDayButton =
    dayIndex > 0 &&
    watchedActivities.length === 0 &&
    previousDayLastActivity !== null;

  const handleCopyPreviousDayLastActivity = () => {
    if (!previousDayLastActivity) return;
    const newActivity = {
      id: crypto.randomUUID(),
      title: previousDayLastActivity.title || '',
      place: {
        name: previousDayLastActivity.place?.name || '',
        type: (previousDayLastActivity.place?.type || 'ATTRACTION') as
          | 'HOME'
          | 'ATTRACTION'
          | 'RESTAURANT'
          | 'HOTEL'
          | 'PARKING_PAID_RV_PARK'
          | 'PARKING_PAID_OTHER'
          | 'PARKING_FREE_SERVICE_AREA'
          | 'PARKING_FREE_MICHINOEKI'
          | 'PARKING_FREE_OTHER'
          | 'GAS_STATION'
          | 'CONVENIENCE_SUPERMARKET'
          | 'BATHING_FACILITY'
          | 'COIN_LAUNDRY'
          | 'OTHER',
        address: previousDayLastActivity.place?.address ?? null,
        location: previousDayLastActivity.place?.location
          ? { ...previousDayLastActivity.place.location }
          : null,
      },
      description: null,
      startTime: null,
      endTime: null,
      cost: null,
      url: previousDayLastActivity.url ?? null,
    };
    setValue(`dayPlans.${dayIndex}.activities`, [newActivity], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // 日付表示の生成
  const dayDisplay = day.date
    ? `${dayIndex + 1}日目: ${formatDateWithWeekday(day.date)}`
    : `${dayIndex + 1}日目`;

  // その日の活動の総数を取得
  const totalActivities = day.activities?.length || 0;

  // 位置情報を持つアクティビティのみマップに表示
  // useMemoで計算結果をメモ化し、必要な時だけ再計算
  const activitiesWithLocation: ActivityLocation[] = useMemo(() => {
    const activities = watchedActivities || [];

    const result = activities
      .map((activity: any, originalIndex: number): ActivityLocation | null => {
        // 位置情報がない場合はnullを返す
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
          type: activity?.place?.type as string | undefined,
        };
      })
      .filter((activity): activity is ActivityLocation => activity !== null);

    return result;
  }, [watchedActivities]);

  const shouldShowMap = activitiesWithLocation.length >= 1;
  const shouldShowRouteButton = activitiesWithLocation.length >= 1;

  const {
    includeCurrentLocation,
    setIncludeCurrentLocation,
    showLocationAlert,
    setShowLocationAlert,
    shouldShowLocationCheckbox,
    shouldShowLocationPermissionButton,
    mapActivities,
    currentLocation,
    loading,
    error,
    requestLocation,
    clearError,
  } = useLocationRouting(activitiesWithLocation);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex flex-col gap-2">
        <H3>{dayDisplay}</H3>

        <div className="flex flex-col gap-2 items-start">
          {/* 時間順並び替えボタン - アクティビティが2つ以上ある場合のみ表示 */}
          {totalActivities >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortActivitiesByTime}
              className="flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <Clock className="h-4 w-4" />
              <span>時間でソート</span>
            </Button>
          )}

          {/* 現在地を含めるチェックボックス + 全体ルート検索ボタン（常に同一行） */}
          {(shouldShowLocationCheckbox || shouldShowRouteButton) && (
            <div className="flex items-center gap-2">
              {shouldShowLocationCheckbox && (
                <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={includeCurrentLocation}
                    onCheckedChange={(checked) =>
                      setIncludeCurrentLocation(checked === true)
                    }
                  />
                  現在地から出発
                </label>
              )}
              {shouldShowRouteButton && (
                <DayRouteNavigationButton
                  activities={watchedActivities}
                  currentLocation={
                    includeCurrentLocation && currentLocation
                      ? currentLocation
                      : undefined
                  }
                />
              )}
            </div>
          )}

          {/* ルートマップボタン */}
          {shouldShowMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullMap(true)}
              className="flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <Map className="h-4 w-4" />
              <span>ルートマップ</span>
            </Button>
          )}

          {/* 位置情報許可ボタン */}
          {shouldShowLocationPermissionButton && (
            <div className="flex flex-col items-start gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLocationAlert(true)}
                disabled={loading}
                className="flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span>{loading ? '取得中...' : '位置情報を許可'}</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                現在位置からのルート検索が利用できます
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ルートマップ (コンパクト表示) */}
      {shouldShowMap && (
        <div className="mb-4">
          <DailyRouteMap
            activities={mapActivities}
            compact={true}
            onExpandClick={() => setShowFullMap(true)}
          />
        </div>
      )}

      {/* アクティビティの順序リスト - アクティビティが1つ以上ある場合のみ表示 */}
      {totalActivities > 0 && (
        <div className="mb-4 p-3 border border-border/50 rounded-lg bg-muted/10">
          <ActivityOrderList
            activities={watchedActivities.map((activity: any) => ({
              id: activity.id,
              title: activity.title,
            }))}
            onReorder={(fromIndex, toIndex) =>
              moveActivity(dayIndex, fromIndex, toIndex)
            }
            onAdd={() => addActivity(dayIndex)}
          />
        </div>
      )}

      {/* デイノート - その日のメモ */}
      <div className="mb-4">
        <Label htmlFor={`dayPlans.${dayIndex}.notes`} className="mb-2 block">
          この日のメモ
        </Label>
        <Textarea
          id={`dayPlans.${dayIndex}.notes`}
          placeholder="旅行の計画やメモを記入してください..."
          className="min-h-24"
          {...register(`dayPlans.${dayIndex}.notes`)}
        />
      </div>

      <div className="space-y-4">
        {day.activities?.map((activity, activityIndex) => (
          <div key={activity.id} id={`activity-${dayIndex}-${activityIndex}`}>
            {/* アクティビティ間の挿入ボタン */}
            <div className="group/insert flex items-center gap-2 -mt-2 mb-2">
              <div className="flex-1 border-t border-muted-foreground/20 group-hover/insert:border-muted-foreground/40 transition-colors" />
              <button
                type="button"
                onClick={() => insertActivity(dayIndex, activityIndex)}
                className="opacity-30 group-hover/insert:opacity-100 focus-visible:opacity-100 flex items-center justify-center h-6 w-6 rounded-full border border-muted-foreground/30 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                title="ここにアクティビティを挿入"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 border-t border-muted-foreground/20 group-hover/insert:border-muted-foreground/40 transition-colors" />
            </div>
            <ActivityForm
              dayIndex={dayIndex}
              activityIndex={activityIndex}
              total={totalActivities}
              remove={removeActivity}
              moveActivity={moveActivity}
              insertActivity={insertActivity}
              moveToPreviousDay={moveToPreviousDay}
              moveToNextDay={moveToNextDay}
              isFirst={activityIndex === 0}
              isLast={activityIndex === day.activities.length - 1}
              isPreviousDayAvailable={dayIndex > 0}
              isNextDayAvailable={dayIndex < daysCount - 1}
              errors={errors}
            />
          </div>
        ))}

        {showCopyPreviousDayButton && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyPreviousDayLastActivity}
            className="w-full cursor-pointer"
          >
            <Navigation className="h-4 w-4 mr-2" />
            前日最終地点を追加
          </Button>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => addActivity(dayIndex)}
            className="flex-1 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            アクティビティを追加
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCampingSpotDialog(true)}
            className="flex-1 cursor-pointer"
          >
            <Tent className="h-4 w-4 mr-2" />
            車中泊スポットを追加
          </Button>
        </div>
      </div>

      {/* 車中泊スポット追加ダイアログ */}
      <AddShachuHakuSpotDialog
        open={showCampingSpotDialog}
        onOpenChange={setShowCampingSpotDialog}
        onAdd={handleAddCampingSpot}
      />

      {/* フルスクリーンマップダイアログ */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{dayDisplay}のルートマップ</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] w-full">
            <DailyRouteMap
              activities={mapActivities}
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
              位置情報を許可すると、現在位置からのルート検索が利用できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLocationAlert(false);
                requestLocation();
              }}
            >
              位置情報を許可する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 位置情報エラーのAlertDialog */}
      <AlertDialog
        open={!!error}
        onOpenChange={(open) => {
          if (!open) clearError();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>位置情報を取得できませんでした</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{error}</span>
              <span className="block text-sm">
                位置情報がブロックされている場合は、ブラウザのアドレスバー左側のアイコンから設定を変更してください。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={clearError}>閉じる</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
