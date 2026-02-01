import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, ChevronsUp } from 'lucide-react';
import { useMapbox } from '@/hooks/useMapbox';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useRouteLayer } from '@/hooks/useRouteLayer';
import 'mapbox-gl/dist/mapbox-gl.css';

// 1つのアクティビティの情報を表す型
export type ActivityLocation = {
  id: string;
  order: number;
  title: string;
  latitude: number;
  longitude: number;
  type?: string; // 場所タイプ（HOME等）
  isCurrentLocation?: boolean; // 現在地フラグ
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
  // カスタムフックを使用してマップ機能を分離
  const { mapContainer, mapInstance, mapLoaded, updateMapBounds, fitAllMarkers } = useMapbox({
    activities,
    initialZoom,
  });

  // マーカー管理
  useMapMarkers({
    mapInstance,
    mapLoaded,
    activities,
    updateMapBounds,
  });

  // ルートライン管理
  useRouteLayer({
    mapInstance,
    mapLoaded,
    activities,
  });

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
            <ChevronsUp className='h-4 w-4 mr-1' />
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
            <Maximize2 className='h-4 w-4 mr-1' />
            拡大表示
          </Button>
        )}
      </div>
    </div>
  );
};

export default DailyRouteMap;