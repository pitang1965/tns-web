import {
  isInAppBrowser,
  safeWindowOpen,
} from '@/lib/browserDetection';
import { isValidCoordinate } from '@/lib/coordinates';
import { toast as toastFn } from '@/components/ui/use-toast';

type ToastFn = typeof toastFn;

// 現在地からのルート検索を開く（iOS/Android/Desktop 対応）
export function openCurrentLocationRoute(
  coordinates: [number, number] | undefined | null,
  toast: ToastFn
): void {
  if (!isValidCoordinate(coordinates)) {
    toast({
      title: 'エラー',
      description:
        '座標情報が正しく設定されていないため、ルート検索を実行できません。',
      variant: 'destructive',
    });
    return;
  }

  const [longitude, latitude] = coordinates;

  try {
    if (
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ) {
      const mapUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

      if (isInAppBrowser()) {
        safeWindowOpen(mapUrl, '_self');
        setTimeout(() => {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          safeWindowOpen(webUrl, '_blank');
        }, 500);
      } else {
        window.location.href = mapUrl;
        setTimeout(() => {
          window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        }, 2000);
      }
    } else if (
      typeof navigator !== 'undefined' &&
      /Android/i.test(navigator.userAgent)
    ) {
      const mapUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;

      if (isInAppBrowser()) {
        safeWindowOpen(mapUrl, '_self');
      } else {
        window.location.href = mapUrl;
      }
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      safeWindowOpen(url, '_blank');
    }
  } catch (error) {
    console.error('Error opening route:', error);
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    safeWindowOpen(fallbackUrl, '_blank');
    toast({
      title: '注意',
      description: 'ルート検索を外部ブラウザで開きます',
    });
  }
}

// Google Maps でスポットを表示する
export function showSpotOnMap(
  coordinates: [number, number] | undefined | null,
  toast: ToastFn
): void {
  if (!isValidCoordinate(coordinates)) {
    toast({
      title: 'エラー',
      description:
        '座標情報が正しく設定されていないため、地図を表示できません。',
      variant: 'destructive',
    });
    return;
  }

  const [longitude, latitude] = coordinates;
  const url = `https://www.google.com/maps/place/${latitude},${longitude}`;
  safeWindowOpen(url, '_blank');
}
