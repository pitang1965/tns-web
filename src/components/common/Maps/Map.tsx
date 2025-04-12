import React, { useRef, useEffect, useState } from 'react';
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

// 空のダミー画像を作成する関数
const createEmptyImage = () => {
  // 1x1の透明な画像を作成
  const size = 1;
  const data = new Uint8Array(size * size * 4);

  // 完全に透明に設定
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 0; // Alpha (透明)
  }

  return { width: size, height: size, data };
};

const MapComponent: React.FC<MapProps> = ({
  latitude = 35.68969285280927, // 都庁の緯度
  longitude = 139.69166052784254, // 都庁の経度
  zoom = 14,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 既知の問題アイコンのリスト
  const knownMissingIcons = ['-11', 'skiing-11'];

  // マップの初期化
  useEffect(() => {
    // すでにマップが存在する場合は初期化をスキップ
    if (!mapContainer.current || mapInstance.current) return;

    try {
      // マップの初期化前に、コンソール警告を一時的に抑制
      const originalConsoleWarn = console.warn;
      console.warn = function (msg, ...args) {
        if (
          typeof msg === 'string' &&
          (msg.includes('Image') ||
            msg.includes('image') ||
            msg.includes('sprite'))
        ) {
          // 画像関連の警告を抑制
          return;
        }
        originalConsoleWarn.apply(console, [msg, ...args]);
      };

      // マップの初期化
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude] as [number, number],
        zoom,
      });

      // エラーハンドラの設定
      mapInstance.current.on('error', (e) => {
        // スタイルイメージに関するエラーを除外
        if (
          e.error &&
          e.error.message &&
          (e.error.message.includes('image') ||
            e.error.message.includes('sprite'))
        ) {
          return;
        }
        console.error('Map error:', e.error);
      });

      // スタイルが読み込まれる前に、既知の不足アイコンを事前登録
      mapInstance.current.on('styledata', () => {
        if (!mapInstance.current) return;

        // 既知の問題アイコンをダミー画像として事前登録
        knownMissingIcons.forEach((iconId) => {
          if (mapInstance.current) {
            try {
              // 空の透明な画像を追加（表示されず警告も出ない）
              mapInstance.current.addImage(iconId, createEmptyImage(), {
                sdf: true, // SDFモードでアイコンを追加
              });
            } catch (err) {
              // エラーは無視（すでにアイコンが存在する場合など）
            }
          }
        });
      });

      mapInstance.current.on('styleimagemissing', (e) => {
        if (!mapInstance.current) return;

        try {
          // 不足しているアイコンを空の透明アイコンで置き換え
          mapInstance.current.addImage(e.id, createEmptyImage(), {
            sdf: true, // SDFモードでアイコンを追加
          });
        } catch (err) {
          // エラーは無視
        }
      });

      mapInstance.current.on('load', () => {
        if (!mapInstance.current) return;

        // コンソール出力を元に戻す
        console.warn = originalConsoleWarn;

        console.log('Map loaded successfully');
        setMapLoaded(true);

        try {
          // マーカーを追加
          markerRef.current = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(mapInstance.current);

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

          // POIアイコンの表示を調整
          if (mapInstance.current.getLayer('poi-label')) {
            // POIの表示フィルターを調整
            mapInstance.current.setFilter('poi-label', [
              'all',
              ['!=', ['get', 'maki'], 'skiing'], // スキーアイコンを除外
              ['!=', ['get', 'maki'], '-11'], // 問題のアイコンを除外
            ]);
          }
        } catch (error) {
          console.error('Error setting up map features:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    // コンポーネントのアンマウント時にリソースをクリーンアップ
    return () => {
      clearMapResources();
    };
  }, []); // 空の依存配列で初期化処理を1回だけ実行

  // マップの位置とズームを更新
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    try {
      // マップの中心を更新
      mapInstance.current.setCenter([longitude, latitude]);
      mapInstance.current.setZoom(zoom);

      // マーカーの位置も更新
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      }
    } catch (error) {
      console.error('Error updating map position:', error);
    }
  }, [latitude, longitude, zoom, mapLoaded]);

  // マップリソースをクリアする関数
  const clearMapResources = () => {
    // マーカーを削除
    if (markerRef.current) {
      try {
        markerRef.current.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
      markerRef.current = null;
    }

    // マップを削除
    if (mapInstance.current) {
      try {
        mapInstance.current.remove();
      } catch (e) {
        console.error('Error removing map:', e);
      }
      mapInstance.current = null;
      setMapLoaded(false);
    }
  };

  // マーカーの位置にマップを中央配置する関数
  const centerOnMarker = () => {
    if (!mapInstance.current || !markerRef.current) return;

    try {
      const markerPosition = markerRef.current.getLngLat();
      mapInstance.current.flyTo({
        center: [markerPosition.lng, markerPosition.lat],
        zoom: zoom,
        duration: 500, // 短めの時間に変更
      });
    } catch (error) {
      console.error('Error centering on marker:', error);
    }
  };

  return (
    <div className='relative w-full h-[250px] border border-gray-200 rounded-md overflow-hidden'>
      <div ref={mapContainer} className='w-full h-full' />

      <div className='absolute bottom-2 right-2 z-10'>
        <Button
          onClick={centerOnMarker}
          size='sm'
          variant='outline'
          className='bg-white hover:bg-gray-100 text-gray-800 shadow-md'
        >
          <Crosshair className='h-4 w-4 mr-1' />
          ピンの位置へ
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;
