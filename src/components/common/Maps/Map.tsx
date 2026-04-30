import React from 'react';
import { useMapboxCore } from '@/hooks/useMapboxCore';
import MapControls from '@/components/common/Maps/MapControls';
import 'mapbox-gl/dist/mapbox-gl.css';

type MapProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

const MapComponent: React.FC<MapProps> = ({ latitude, longitude, zoom }) => {
  // カスタムフックを使用してマップの基本機能を管理
  const { mapContainer, centerOnMarker, isVisible, mapLoaded } = useMapboxCore({
    latitude,
    longitude,
    zoom,
  });

  return (
    <div className="relative w-full h-[250px] border border-gray-200 rounded-md overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />

      {/* ローディング表示 - 画面内に表示されているがまだ地図が読み込まれていない時 */}
      {isVisible && !mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              地図を読み込んでいます...
            </p>
          </div>
        </div>
      )}

      {/* プレースホルダー - まだ画面内に表示されていない時 */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm text-gray-500 dark:text-gray-500">地図</p>
          </div>
        </div>
      )}

      <MapControls onCenterOnMarker={centerOnMarker} />
    </div>
  );
};

export default MapComponent;
