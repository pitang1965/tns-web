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

  // デバイスタイプを検出する関数
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // 現在地からのルート検索を開く - モバイル対応版
  const openCurrentLocationRoute = () => {
    if (!isValidCoordinate()) return;

    // モバイルデバイスの場合
    if (isMobileDevice()) {
      let mapUrl;

      // iOSの場合
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // iOS用のURLスキーム（comgooglemaps://）を使用
        mapUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

        // Googleマップアプリがインストールされていない場合のフォールバック
        if (!navigator.userAgent.match('CriOS')) {
          // Chrome on iOSでない場合
          window.location.href = mapUrl;
          // 少し遅延してアプリが開かなかった場合はウェブ版にリダイレクト
          setTimeout(() => {
            window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          }, 2000);
          return;
        }
      }
      // Androidの場合
      else if (/Android/i.test(navigator.userAgent)) {
        // Android用のインテント構文
        mapUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
      }
      // その他のモバイルデバイスの場合はウェブ版を使用
      else {
        mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      }

      // URLを開く
      window.location.href = mapUrl;
    }
    // PCの場合は元の動作を維持
    else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      window.open(url, '_blank');
    }
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
