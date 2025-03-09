import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

type MapProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

const MapComponent: React.FC<MapProps> = ({
  latitude = 35.68969285280927, // 都庁の緯度
  longitude = 139.69166052784254, // 都庁の経度
  zoom = 14,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // マップコンテナが存在し、まだマップが初期化されていない場合のみ初期化
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude] as [number, number],
        zoom,
        language: 'ja',
      });

      // マップの読み込みエラーを監視
      map.current.on('error', (e) => {
        console.error('Map error:', e.error);
      });

      map.current.on('load', () => {
        if (map.current) {
          // マーカーを追加
          marker.current = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(map.current);

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
        }
      });
    }

    // マップが存在する場合は位置を更新
    if (map.current) {
      console.log('Updating map position to:', [longitude, latitude]);
      map.current.setCenter([longitude, latitude]);

      // マーカーも更新
      if (marker.current) {
        marker.current.setLngLat([longitude, latitude]);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [latitude, longitude, zoom]);

  const centerOnMarker = () => {
    if (map.current && marker.current) {
      const markerPosition = marker.current.getLngLat();
      map.current.flyTo({
        center: [markerPosition.lng, markerPosition.lat],
        zoom: zoom,
        duration: 1000,
      });
    }
  };

  return (
    <div className='relative w-full h-[250px] border border-gray-200 rounded-md overflow-hidden'>
      {/* mapContainer要素には明示的な幅と高さを設定 */}
      <div ref={mapContainer} className='w-full h-full' />

      {/* ボタンは相対位置で配置 */}
      <div className='absolute bottom-2 right-2 z-10'>
        <Button
          onClick={centerOnMarker}
          size='sm'
          variant='outline'
          className='bg-white hover:bg-gray-100 text-gray-800 shadow-md'
        >
          <Crosshair className='mr-2 h-4 w-4' />
          ピンの位置へ
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;
