'use client';

import React from 'react';
import { Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { activitySchema } from '@/data/schemas/activitySchema';
import { calculateDistance } from '@/hooks/useCurrentLocation';

type Activity = z.infer<typeof activitySchema>;

type Location = {
  latitude: number;
  longitude: number;
};

type DayRouteNavigationButtonProps = {
  activities: Activity[];
  currentLocation: Location;
  className?: string;
};

// 自宅と現在地が近いと判断する距離（メートル）
const HOME_PROXIMITY_THRESHOLD = 50;

export const DayRouteNavigationButton: React.FC<
  DayRouteNavigationButtonProps
> = ({ activities, currentLocation, className = '' }) => {
  // 住所を返す関数（addressは既に文字列）
  const formatAddress = (address: Activity['place']['address']) => {
    return address || null;
  };

  // 位置情報があるアクティビティを取得
  const activitiesWithLocation = activities.filter(
    (activity) =>
      activity.place.location &&
      activity.place.location.latitude &&
      activity.place.location.longitude &&
      activity.place.location.latitude !== 0 &&
      activity.place.location.longitude !== 0 &&
      !isNaN(activity.place.location.latitude) &&
      !isNaN(activity.place.location.longitude)
  );

  // アクティビティが1つ以上ない場合は非表示
  if (activitiesWithLocation.length < 1) {
    return null;
  }

  // デバイスタイプを検出する関数
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // 全体ルート検索を開く
  const openFullRoute = () => {
    // ルートに含めるアクティビティを決定
    let routeActivities = [...activitiesWithLocation];

    // 最初のアクティビティが自宅タイプで、現在地から50m以内ならスキップ
    if (routeActivities.length > 0) {
      const firstActivity = routeActivities[0];
      const firstLat = firstActivity.place.location?.latitude;
      const firstLng = firstActivity.place.location?.longitude;
      if (
        firstActivity.place.type === 'HOME' &&
        typeof firstLat === 'number' &&
        typeof firstLng === 'number'
      ) {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          firstLat,
          firstLng
        );
        if (distance <= HOME_PROXIMITY_THRESHOLD) {
          routeActivities = routeActivities.slice(1);
        }
      }
    }

    // ルートに含めるアクティビティがない場合は何もしない
    if (routeActivities.length === 0) {
      return;
    }

    // 現在地を出発点として追加
    const waypoints = [
      `${currentLocation.latitude},${currentLocation.longitude}`,
      ...routeActivities.map((activity) => {
        const { latitude, longitude } = activity.place.location!;

        // 住所がある場合はエンコードして使用
        const addressString = formatAddress(activity.place.address);
        if (addressString) {
          return encodeURIComponent(addressString);
        }
        // 座標のみの場合
        return `${latitude},${longitude}`;
      }),
    ];

    // Google Maps の directions URL を構築
    let url = `https://www.google.com/maps/dir/${waypoints.join('/')}`;

    // パラメータを追加
    url += '?travelmode=driving';

    if (isMobileDevice()) {
      // モバイルの場合は同じタブで開く
      window.location.href = url;
    } else {
      // PCの場合は新しいタブで開く
      window.open(url, '_blank');
    }
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={openFullRoute}
      className={`flex items-center gap-2 cursor-pointer ${className}`}
    >
      <Route className='w-4 h-4' />
      <span>全体ルート検索</span>
    </Button>
  );
};
