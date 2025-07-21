import React from 'react';
import { Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { activitySchema } from '@/data/schemas/activitySchema';

type Activity = z.infer<typeof activitySchema>;

type DayRouteNavigationButtonProps = {
  activities: Activity[];
  className?: string;
};

export const DayRouteNavigationButton: React.FC<DayRouteNavigationButtonProps> = ({
  activities,
  className = '',
}) => {
  // 住所オブジェクトを文字列に変換する関数
  const formatAddress = (address: Activity['place']['address']) => {
    if (!address) return null;
    
    const parts = [
      address.prefecture,
      address.city,
      address.town,
      address.block,
      address.building
    ].filter(part => part && part.trim() !== '');
    
    return parts.join('');
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

  // 2つ以上のアクティビティがない場合は非表示
  if (activitiesWithLocation.length < 2) {
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
    const waypoints = activitiesWithLocation.map((activity) => {
      const { latitude, longitude } = activity.place.location!;
      
      // 住所がある場合はエンコードして使用
      const addressString = formatAddress(activity.place.address);
      if (addressString) {
        return encodeURIComponent(addressString);
      }
      // 座標のみの場合
      return `${latitude},${longitude}`;
    });

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
      className={`flex items-center gap-2 ${className}`}
    >
      <Route className='w-4 h-4' />
      <span>全体ルート検索</span>
    </Button>
  );
};