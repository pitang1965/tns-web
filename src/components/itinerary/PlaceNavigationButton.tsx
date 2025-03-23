import React from 'react';
import { MapPin, Navigation, Map } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type PlaceNavigationButtonProps = {
  latitude?: number;
  longitude?: number;
  className?: string;
};

export const PlaceNavigationButton: React.FC<PlaceNavigationButtonProps> = ({
  latitude,
  longitude,
  className = '',
}) => {
  // 有効な座標かどうかを確認
  const isValidCoordinate = () => {
    // 0,0の座標または未設定の座標は無効とみなす
    const isValid =
      latitude !== undefined &&
      longitude !== undefined &&
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      // 以下の条件で0,0座標を除外
      !(latitude === 0 && longitude === 0);

    return isValid;
  };

  // 現在地からのルート検索を開く
  const openCurrentLocationRoute = () => {
    if (!isValidCoordinate()) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // 地図上で場所を表示
  const showOnMap = () => {
    if (!isValidCoordinate()) return;
    const url = `https://www.google.com/maps/place/${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  // 座標が無効な場合は無効なボタンを表示
  if (!isValidCoordinate()) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 text-sm px-3 h-8 border border-input bg-background rounded-md text-muted-foreground cursor-not-allowed ${className}`}
        aria-label='ナビゲーション (無効)'
      >
        <MapPin className='w-4 h-4' />
        <span className='text-sm'>地図を開く</span>
      </button>
    );
  }

  // 有効な座標の場合はドロップダウンメニューを表示
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center justify-center gap-2 text-sm px-3 border bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-8 text-foreground w-full'>
        <MapPin className='w-4 h-4' />
        地図を開く
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={openCurrentLocationRoute}>
          <Navigation className='mr-2 h-4 w-4' />
          <span>現在地からのルート検索</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={showOnMap}>
          <Map className='mr-2 h-4 w-4' />
          <span>地図で表示</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
