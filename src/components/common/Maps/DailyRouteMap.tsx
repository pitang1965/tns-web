import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { Maximize2, ChevronsUp } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// 1つのアクティビティの情報を表す型
export type ActivityLocation = {
  id: string;
  order: number;
  title: string;
  latitude: number;
  longitude: number;
};

type DailyRouteMapProps = {
  activities: ActivityLocation[];
  initialZoom?: number;
  compact?: boolean;
  onExpandClick?: () => void;
};

const DailyRouteMap: React.FC<DailyRouteMapProps> = ({
  activities,
  initialZoom = 12,
  compact = true,
  onExpandClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // すべてのアクティビティを表示範囲に収めるための境界ボックスを計算
  const calculateBounds = () => {
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
  };

  useEffect(() => {
    // マップコンテナが存在し、まだマップが初期化されていない場合のみ初期化
    if (mapContainer.current && !map.current) {
      // 緯度経度の中心を計算
      let centerLng, centerLat;

      if (activities.length > 0) {
        if (activities.length === 1) {
          centerLng = activities[0].longitude;
          centerLat = activities[0].latitude;
        } else {
          // すべてのアクティビティの平均位置を中心にする
          const sumLng = activities.reduce(
            (sum, act) => sum + act.longitude,
            0
          );
          const sumLat = activities.reduce((sum, act) => sum + act.latitude, 0);
          centerLng = sumLng / activities.length;
          centerLat = sumLat / activities.length;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [centerLng, centerLat] as [number, number],
          zoom: initialZoom,
          language: 'ja',
        });

        map.current.on('load', () => {
          setMapLoaded(true);

          // 日本語ラベルを設定
          const layers = [
            'country-label',
            'state-label',
            'settlement-label',
            'poi-label',
          ];
          layers.forEach((layer) => {
            if (map.current?.getLayer(layer)) {
              map.current.setLayoutProperty(layer, 'text-field', [
                'coalesce',
                ['get', 'name_ja'],
                ['get', 'name'],
              ]);
            }
          });

          // 境界ボックスがある場合は、それを使用して表示範囲を調整
          const bounds = calculateBounds();
          if (bounds && activities.length > 1 && map.current) {
            map.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
              padding: 50, // 境界とマップエッジの間にパディングを追加
            });
          }

          // 線を追加（複数のポイントがある場合）
          if (activities.length > 1) {
            addRouteLines();
          }
        });
      }
    }

    // クリーンアップ関数
    return () => {
      // 以前のマーカーをすべて削除
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, []);

  // マップが読み込まれた後、またはアクティビティが変更された時にマーカーを追加
  useEffect(() => {
    if (map.current && mapLoaded) {
      // 以前のマーカーをすべて削除
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      // 各アクティビティにマーカーを追加
      activities.forEach((activity) => {
        // カスタムマーカー要素を作成
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.style.width = '36px';
        markerElement.style.height = '36px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.backgroundColor = '#3b82f6';
        markerElement.style.color = 'white';
        markerElement.style.fontWeight = 'bold';
        markerElement.style.display = 'flex';
        markerElement.style.justifyContent = 'center';
        markerElement.style.alignItems = 'center';
        markerElement.style.border = '2px solid white';
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        markerElement.innerText = activity.order.toString();

        // ポップアップを作成
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`<strong>${activity.order}. ${activity.title}</strong>`);

        // マーカーを作成し、マップに追加
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([activity.longitude, activity.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        // ホバー時にポップアップを表示
        markerElement.addEventListener('mouseenter', () => {
          marker.getElement().style.zIndex = '10';
          marker.togglePopup();
        });
        markerElement.addEventListener('mouseleave', () => {
          marker.getElement().style.zIndex = '1';
          marker.togglePopup();
        });

        // マーカーの配列に追加
        markers.current.push(marker);
      });

      // 境界ボックスを再計算し、ビューを調整
      const bounds = calculateBounds();
      if (bounds && activities.length > 1) {
        map.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
          padding: 50,
        });
      } else if (activities.length === 1) {
        map.current.flyTo({
          center: [activities[0].longitude, activities[0].latitude],
          zoom: initialZoom,
          duration: 1000,
        });
      }

      // 線を更新（複数のポイントがある場合）
      if (activities.length > 1) {
        addRouteLines();
      }
    }
  }, [activities, mapLoaded]);

  // ルートライン（アクティビティ間の線）を追加する関数
  const addRouteLines = () => {
    if (!map.current || activities.length < 2) return;

    // すでに存在する場合はルートレイヤーを削除
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    // ルートラインのためのGeoJSON形式のデータを作成
    const routeCoordinates = activities.map((activity) => [
      activity.longitude,
      activity.latitude,
    ]);

    // ルートラインのソースを追加
    map.current.addSource('route', {
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
    map.current.addLayer({
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
  };

  // 全てのマーカーを表示する範囲に調整する関数
  const fitAllMarkers = () => {
    if (map.current && activities.length > 0) {
      const bounds = calculateBounds();
      if (bounds) {
        map.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
          padding: 50,
        });
      }
    }
  };

  const handleExpand = () => {
    if (onExpandClick) {
      onExpandClick();
    }
  };

  return (
    <div
      className={`relative w-full border border-gray-200 rounded-md overflow-hidden ${
        compact ? 'h-[400px]' : 'h-[600px]'
      }`}
    >
      <div ref={mapContainer} className='w-full h-full' />

      {/* コントロールボタン */}
      <div className='absolute bottom-2 right-2 z-10 flex flex-col gap-2'>
        {activities.length > 1 && (
          <Button
            onClick={fitAllMarkers}
            size='sm'
            variant='outline'
            className='bg-white hover:bg-gray-100 text-gray-800 shadow-md'
          >
            <ChevronsUp className='mr-2 h-4 w-4' />
            全て表示
          </Button>
        )}

        {compact && onExpandClick && (
          <Button
            onClick={handleExpand}
            size='sm'
            variant='outline'
            className='bg-white hover:bg-gray-100 text-gray-800 shadow-md'
          >
            <Maximize2 className='mr-2 h-4 w-4' />
            拡大表示
          </Button>
        )}
      </div>
    </div>
  );
};

export default DailyRouteMap;
