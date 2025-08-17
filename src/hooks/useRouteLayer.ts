import { useEffect, useCallback } from 'react';
import { ActivityLocation } from '@/components/common/Maps/DailyRouteMap';

type UseRouteLayerProps = {
  mapInstance: mapboxgl.Map | null;
  mapLoaded: boolean;
  activities: ActivityLocation[];
};

export function useRouteLayer({
  mapInstance,
  mapLoaded,
  activities,
}: UseRouteLayerProps) {
  // ルートライン（アクティビティ間の線）を追加する関数
  const addRouteLines = useCallback(() => {
    if (!mapInstance || activities.length < 2) return;

    try {
      // すでに存在する場合はルートレイヤーを削除
      if (mapInstance.getLayer('route-line')) {
        mapInstance.removeLayer('route-line');
      }

      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }

      // ルートラインのためのGeoJSON形式のデータを作成
      const routeCoordinates = activities.map((activity) => [
        activity.longitude,
        activity.latitude,
      ]);

      // ルートラインのソースを追加
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
      });

      // ルートラインのレイヤーを追加
      mapInstance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.8,
          'line-dasharray': [1, 1],
        },
      });
    } catch (error) {
      console.error('Error adding route lines:', error);
    }
  }, [mapInstance, activities]);

  // ルートレイヤーを削除する関数
  const removeRouteLines = useCallback(() => {
    if (!mapInstance) return;

    try {
      if (mapInstance.getLayer('route-line')) {
        mapInstance.removeLayer('route-line');
      }

      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }
    } catch (error) {
      console.error('Error removing route lines:', error);
    }
  }, [mapInstance]);

  // マップロード時とアクティビティ変更時にルートラインを更新
  useEffect(() => {
    if (!mapInstance || !mapLoaded) return;

    // 線を追加（複数のポイントがある場合）
    if (activities.length > 1) {
      addRouteLines();
    } else {
      // アクティビティが1つ以下の場合はルートラインを削除
      removeRouteLines();
    }
  }, [mapInstance, mapLoaded, activities, addRouteLines, removeRouteLines]);

  // クリーンアップ時にルートラインを削除
  useEffect(() => {
    return () => {
      removeRouteLines();
    };
  }, [removeRouteLines]);

  return {
    addRouteLines,
    removeRouteLines,
  };
}
