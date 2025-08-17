import React from 'react';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';

type MapControlsProps = {
  onCenterOnMarker: () => void;
};

const MapControls: React.FC<MapControlsProps> = ({ onCenterOnMarker }) => {
  return (
    <div className="absolute bottom-2 right-2 z-10">
      <Button
        onClick={onCenterOnMarker}
        size="sm"
        variant="outline"
        className="bg-white hover:bg-gray-100 text-gray-800 shadow-md"
      >
        <Crosshair className="h-4 w-4 mr-1" />
        ピンの位置へ
      </Button>
    </div>
  );
};

export default MapControls;