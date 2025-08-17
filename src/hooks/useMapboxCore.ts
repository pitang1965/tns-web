import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

type UseMapboxCoreProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

export function useMapboxCore({
  latitude = 35.68969285280927, // 都庁の緯度
  longitude = 139.69166052784254, // 都庁の経度
  zoom = 14,
}: UseMapboxCoreProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // マップリソースをクリアする関数
  const clearMapResources = useCallback(() => {
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
  }, []);

  // マーカーの位置にマップを中央配置する関数
  const centerOnMarker = useCallback(() => {
    if (!mapInstance.current || !markerRef.current) return;

    try {
      const markerPosition = markerRef.current.getLngLat();
      mapInstance.current.flyTo({
        center: [markerPosition.lng, markerPosition.lat],
        zoom: zoom,
        duration: 500,
      });
    } catch (error) {
      console.error('Error centering on marker:', error);
    }
  }, [zoom]);

  // マップの初期化
  useEffect(() => {
    // すでにマップが存在する場合は初期化をスキップ
    if (!mapContainer.current || mapInstance.current) return;

    try {
      // マップの初期化前に、コンソール警告を一時的に抑制
      const restoreConsoleWarn = suppressImageWarnings();

      // マップの初期化
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude] as [number, number],
        zoom,
      });

      // エラーハンドラの設定
      mapInstance.current.on('error', handleMapError);

      // スタイルが読み込まれる前に、既知の不足アイコンを事前登録
      mapInstance.current.on('styledata', () => {
        if (!mapInstance.current) return;
        preRegisterKnownIcons(mapInstance.current);
      });

      // 不足しているアイコンを動的に処理
      mapInstance.current.on('styleimagemissing', (e) => {
        if (!mapInstance.current) return;
        handleMissingImage(mapInstance.current, e.id);
      });

      mapInstance.current.on('load', () => {
        if (!mapInstance.current) return;

        // コンソール出力を元に戻す
        restoreConsoleWarn();

        console.log('Map loaded successfully');
        setMapLoaded(true);

        try {
          // マーカーを追加
          markerRef.current = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(mapInstance.current);

          // 日本語ラベルを設定
          setupJapaneseLabels(mapInstance.current);

          // POIアイコンの表示を調整
          setupPOIFilters(mapInstance.current);
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

  return {
    mapContainer,
    mapInstance: mapInstance.current,
    markerRef: markerRef.current,
    mapLoaded,
    centerOnMarker,
    clearMapResources,
  };
}
