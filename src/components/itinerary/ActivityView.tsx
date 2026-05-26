import { useState } from 'react';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PlaceView } from './PlaceView';
import { TimeRangeDisplay } from '@/components/common/TimeRangeDisplay';
import { H3, Text } from '@/components/common/Typography';
import {
  ActivityRouteButton,
  hasValidLocation,
} from './ActivityRouteButton';
import { Checkbox } from '@/components/ui/checkbox';

type ActivityType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];

type ActivityProps = {
  activity: ActivityType;
  index?: number; // 活動の順番（0から始まる）- オプショナル
  total?: number; // その日の活動の総数 - オプショナル
  // 複数経由地ルート検索用のプロパティ
  allActivities?: ActivityType[];
  isOwner?: boolean; // 所有者かどうか（自宅の座標・住所表示制御用）
  dayIndex?: number; // 目次からのスクロールターゲット用
  gpsLocation?: { latitude: number; longitude: number }; // 生のGPS座標（マップに影響しない）
};

export const ActivityView: React.FC<ActivityProps> = ({
  activity,
  index,
  total,
  allActivities,
  isOwner = false,
  dayIndex,
  gpsLocation,
}) => {
  const [includeCurrentLocation, setIncludeCurrentLocation] = useState(false);
  // indexとtotalが両方提供された場合のみ、番号表示を追加
  const titlePrefix =
    index !== undefined && total !== undefined ? `${index + 1}/${total}: ` : '';

  const elementId =
    dayIndex !== undefined && index !== undefined
      ? `activity-${dayIndex}-${index}`
      : undefined;

  const remainingActivities =
    index !== undefined && allActivities
      ? allActivities.slice(index + 1).filter(hasValidLocation)
      : [];
  const showRouteButton =
    hasValidLocation(activity) && remainingActivities.length > 0;
  const effectiveLocation =
    includeCurrentLocation && gpsLocation ? gpsLocation : undefined;

  return (
    <li id={elementId} className="bg-card text-card-foreground p-3 rounded shadow-md dark:shadow-slate-500/50">
      <div>
        <H3>
          {titlePrefix}
          {activity.title}
        </H3>
        <div className="flex items-baseline gap-1 mt-1">
          <TimeRangeDisplay
            startTime={activity.startTime ?? undefined}
            endTime={activity.endTime ?? undefined}
            className="ml-0"
          />
          {activity.cost !== null &&
            activity.cost !== undefined &&
            activity.cost > 0 && (
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                ({activity.cost}円)
              </span>
            )}
        </div>
      </div>
      <PlaceView
        name={activity.place.name}
        type={activity.place.type}
        address={activity.place.address}
        location={activity.place.location}
        allActivities={allActivities}
        currentActivityIndex={index}
        url={activity.url}
        isOwner={isOwner}
      />
      {activity.description && <Text>{activity.description}</Text>}
      {showRouteButton && (
        <div className="mt-2 flex items-center justify-end gap-2 flex-wrap">
          {gpsLocation && (
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={includeCurrentLocation}
                onCheckedChange={(checked) =>
                  setIncludeCurrentLocation(!!checked)
                }
              />
              現在地から出発
            </label>
          )}
          <ActivityRouteButton
            activity={activity}
            remainingActivities={remainingActivities}
            currentLocation={effectiveLocation}
          />
        </div>
      )}
    </li>
  );
};
