import { useState, useEffect, useCallback } from 'react';

type Location = {
  latitude: number;
  longitude: number;
};

type UseCurrentLocationResult = {
  currentLocation: Location | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  requestLocation: () => void;
  clearError: () => void;
};

/**
 * 2点間の距離を計算する（メートル単位）
 * ハバーサインの公式を使用
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 現在地を取得するカスタムフック
 */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報取得に対応していません');
      return;
    }

    setLoading(true);
    setError(null);

    // IPジオロケーションのフォールバック時に国をまたいだ誤差が生じることがあるため、
    // 精度が10km超の場合（IPベース測位の典型値）は信頼できないとして無視する
    const MAX_ACCURACY_METERS = 10000;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy >= MAX_ACCURACY_METERS) {
          setError(
            '位置情報の精度が低すぎるため使用できませんでした（有線LAN接続時はWi-Fiまたはモバイル回線をご利用ください）',
          );
          setPermissionGranted(false);
          setLoading(false);
          return;
        }

        // 日本の地理的範囲チェック（沖縄〜北海道）
        // 注意: 単純なバウンディングボックスでは朝鮮半島（経度124〜130°E）が含まれてしまうため、
        // 緯度35.5°以北かつ経度130°未満の領域（朝鮮半島の大部分）を除外する
        const isInJapanBounds =
          latitude >= 24.0 &&
          latitude <= 46.0 &&
          longitude >= 122.0 &&
          longitude <= 154.0;

        const isKoreanPeninsula = latitude >= 35.5 && longitude < 130.0;

        if (!isInJapanBounds || isKoreanPeninsula) {
          setError(
            '位置情報が日本国外を示しています。有線LAN接続時はWi-Fiまたはモバイル回線をご利用ください',
          );
          setPermissionGranted(false);
          setLoading(false);
          return;
        }

        setCurrentLocation({ latitude, longitude });
        setPermissionGranted(true);
        setLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('位置情報へのアクセスが拒否されました');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('位置情報を取得できませんでした');
            break;
          case err.TIMEOUT:
            setError('位置情報の取得がタイムアウトしました');
            break;
          default:
            setError('位置情報の取得に失敗しました');
        }
        setPermissionGranted(false);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1分間キャッシュ
      },
    );
  }, []);

  // 初期化時に位置情報の権限状態を確認
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, [requestLocation]);

  return {
    currentLocation,
    loading,
    error,
    permissionGranted,
    requestLocation,
    clearError,
  };
}
