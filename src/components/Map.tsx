import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

type MapProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

const MapComponent: React.FC<MapProps> = ({
  latitude = 35.6586, // デフォルトは東京の緯度
  longitude = 139.7525, // デフォルトは東京の経度
  zoom = 14,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude], // Mapboxは [経度, 緯度] の順序を期待する
        zoom: zoom,
        language: 'ja', // 言語を日本語に設定
        localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK JP', sans-serif",
      });

      map.current.on('load', () => {
        if (map.current) {
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

    // マーカーを作成または更新
    if (map.current) {
      if (marker.current) {
        marker.current.setLngLat([longitude, latitude]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      }

      map.current.setCenter([longitude, latitude]);
      map.current.setZoom(zoom);
    }

    return () => {
      if (map.current) {
        map.current.remove();
         // map が削除されると、それに関連するすべてのマーカーも自動的に削除
        map.current = null;
        marker.current = null;
      }
    };
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '250px' }} />;
};

export default MapComponent;
