import React from 'react';
import { useMapboxCore } from '@/hooks/useMapboxCore';
import MapControls from '@/components/common/Maps/MapControls';
import 'mapbox-gl/dist/mapbox-gl.css';

type MapProps = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
};

const MapComponent: React.FC<MapProps> = ({
  latitude,
  longitude,
  zoom,
}) => {
  // カスタムフックを使用してマップの基本機能を管理
  const { mapContainer, centerOnMarker } = useMapboxCore({
    latitude,
    longitude,
    zoom,
  });

  return (
    <div className="relative w-full h-[250px] border border-gray-200 rounded-md overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      <MapControls onCenterOnMarker={centerOnMarker} />
    </div>
  );
};

export default MapComponent;
