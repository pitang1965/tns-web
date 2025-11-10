import { useCallback } from 'react';
import {
  PREFECTURE_COORDINATES,
  REGION_COORDINATES,
} from '@/lib/prefectureCoordinates';
import { calculateBoundsFromZoomAndCenter } from '@/lib/maps';

type UseLocationNavigationProps = {
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  setSavedBounds: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  toast: (params: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => void;
};

/**
 * Custom hook for location navigation (prefecture, region, current location)
 * Provides handlers for jumping to prefectures, regions, and current location
 */
export function useLocationNavigation({
  setMapCenter,
  setMapZoom,
  setSavedBounds,
  toast,
}: UseLocationNavigationProps) {
  // Handle prefecture jump
  const handlePrefectureJump = useCallback(
    (prefecture: string) => {
      const coords = PREFECTURE_COORDINATES[prefecture];
      if (coords) {
        const center: [number, number] = [coords.lng, coords.lat];

        // Calculate lat_span from lng_span and aspect_ratio
        const latSpan = coords.lng_span / coords.aspect_ratio;

        // Calculate bounds directly from center and span for consistent display across devices
        const bounds = {
          north: coords.lat + latSpan / 2,
          south: coords.lat - latSpan / 2,
          east: coords.lng + coords.lng_span / 2,
          west: coords.lng - coords.lng_span / 2,
        };

        setMapCenter(center);
        setMapZoom(9); // Default zoom, will be overridden by fitBounds
        setSavedBounds(bounds);
      }
    },
    [setMapCenter, setMapZoom, setSavedBounds]
  );

  // Handle region jump
  const handleRegionJump = useCallback(
    (region: string) => {
      const coords = REGION_COORDINATES[region];
      if (coords) {
        const center: [number, number] = [coords.lng, coords.lat];

        // Calculate lat_span from lng_span and aspect_ratio
        const latSpan = coords.lng_span / coords.aspect_ratio;

        // Calculate bounds directly from center and span for consistent display across devices
        const bounds = {
          north: coords.lat + latSpan / 2,
          south: coords.lat - latSpan / 2,
          east: coords.lng + coords.lng_span / 2,
          west: coords.lng - coords.lng_span / 2,
        };

        setMapCenter(center);
        setMapZoom(9); // Default zoom, will be overridden by fitBounds
        setSavedBounds(bounds);
      }
    },
    [setMapCenter, setMapZoom, setSavedBounds]
  );

  // Handle current location jump
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'エラー',
        description: 'お使いのブラウザは位置情報取得に対応していません',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        const zoom = 12;

        // Calculate bounds from center and zoom for consistent display across devices
        const bounds = calculateBoundsFromZoomAndCenter(center, zoom);

        setMapCenter(center);
        setMapZoom(zoom);
        setSavedBounds(bounds);

        toast({
          title: '成功',
          description: '現在地に移動しました',
        });
      },
      (error) => {
        toast({
          title: 'エラー',
          description:
            '位置情報の取得に失敗しました。ブラウザの設定を確認してください。',
          variant: 'destructive',
        });
        console.error('Geolocation error:', error);
      }
    );
  }, [setMapCenter, setMapZoom, setSavedBounds, toast]);

  return {
    handlePrefectureJump,
    handleRegionJump,
    handleCurrentLocation,
  };
}
