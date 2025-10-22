import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { ActivityLocation } from '@/components/common/Maps/DailyRouteMap';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

type UseMapboxProps = {
  activities: ActivityLocation[];
  initialZoom?: number;
};

export function useMapbox({ activities, initialZoom = 12 }: UseMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // すべてのアクティビティを表示範囲に収めるための境界ボックスを計算
  const calculateBounds = useCallback(() => {
    if (activities.length === 0) return null;

    // 初期値として最初のアクティビティの位置を設定
    let minLng = activities[0].longitude;
    let maxLng = activities[0].longitude;
    let minLat = activities[0].latitude;
    let maxLat = activities[0].latitude;

    // すべてのアクティビティをループして境界を更新
    activities.forEach((activity) => {
      minLng = Math.min(minLng, activity.longitude);
      maxLng = Math.max(maxLng, activity.longitude);
      minLat = Math.min(minLat, activity.latitude);
      maxLat = Math.max(maxLat, activity.latitude);
    });

    // 境界に少しパディングを追加
    const padding = 0.01; // 約1kmのパディング
    return [
      [minLng - padding, minLat - padding], // 南西
      [maxLng + padding, maxLat + padding], // 北東
    ];
  }, [activities]);

  // マップの表示範囲を調整する関数
  const updateMapBounds = useCallback(() => {
    if (!mapInstance.current) return;

    try {
      const bounds = calculateBounds();
      if (bounds && activities.length > 1) {
        mapInstance.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
          padding: 50,
        });
      } else if (activities.length === 1) {
        mapInstance.current.flyTo({
          center: [activities[0].longitude, activities[0].latitude],
          zoom: initialZoom,
          duration: 500,
        });
      }
    } catch (error) {
      console.error('Error updating map bounds:', error);
    }
  }, [activities, calculateBounds, initialZoom]);

  // 全てのマーカーを表示する範囲に調整する関数
  const fitAllMarkers = useCallback(() => {
    if (mapInstance.current && activities.length > 0) {
      try {
        const bounds = calculateBounds();
        if (bounds) {
          mapInstance.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
            padding: 50,
          });
        }
      } catch (error) {
        console.error('Error fitting markers:', error);
      }
    }
  }, [activities, calculateBounds]);

  // マップの初期化
  useEffect(() => {
    // マップコンテナが存在し、まだマップが初期化されていない場合のみ初期化
    if (!mapContainer.current || mapInstance.current) return;

    if (activities.length === 0) return;

    // 緯度経度の中心を計算
    let centerLng, centerLat;

    if (activities.length === 1) {
      centerLng = activities[0].longitude;
      centerLat = activities[0].latitude;
    } else {
      // すべてのアクティビティの平均位置を中心にする
      const sumLng = activities.reduce((sum, act) => sum + act.longitude, 0);
      const sumLat = activities.reduce((sum, act) => sum + act.latitude, 0);
      centerLng = sumLng / activities.length;
      centerLat = sumLat / activities.length;
    }

    // 座標が有効な数値かチェック
    if (
      isNaN(centerLng) ||
      isNaN(centerLat) ||
      !isFinite(centerLng) ||
      !isFinite(centerLat)
    ) {
      console.warn('Invalid coordinates detected, skipping map initialization');
      return;
    }

    try {
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat] as [number, number],
        zoom: initialZoom,
      });

      // エラーハンドリングを追加
      mapInstance.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
      });

      mapInstance.current.on('load', () => {
        if (!mapInstance.current) return;
        setMapLoaded(true);

        try {
          // 日本語ラベルを設定
          const layers = [
            'country-label',
            'state-label',
            'settlement-label',
            'poi-label',
          ];

          layers.forEach((layer) => {
            if (mapInstance.current?.getLayer(layer)) {
              mapInstance.current.setLayoutProperty(layer, 'text-field', [
                'coalesce',
                ['get', 'name_ja'],
                ['get', 'name'],
              ]);
            }
          });

          // 境界ボックスがある場合は、それを使用して表示範囲を調整
          const bounds = calculateBounds();
          if (bounds && activities.length > 1 && mapInstance.current) {
            mapInstance.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
              padding: 50,
            });
          }
        } catch (error) {
          console.error('Error during map setup:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    // クリーンアップ関数
    return () => {
      if (mapInstance.current) {
        try {
          // ルートラインのレイヤーとソースを削除
          if (mapInstance.current.getLayer('route-line')) {
            mapInstance.current.removeLayer('route-line');
          }

          if (mapInstance.current.getSource('route')) {
            mapInstance.current.removeSource('route');
          }

          // マップを削除
          mapInstance.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }

        mapInstance.current = null;
        setMapLoaded(false);
      }
    };
  }, []); // 空の依存配列で初期化時のみ実行

  return {
    mapContainer,
    mapInstance: mapInstance.current,
    mapLoaded,
    updateMapBounds,
    fitAllMarkers,
    calculateBounds,
  };
}
