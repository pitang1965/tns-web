'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { calculateSecurityLevel } from '@/lib/campingSpotUtils';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';
import { getMarkerColorByRating } from '@/lib/spotColorUtils';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ShachuHakuMapProps {
  spots: CampingSpotWithId[];
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onCreateSpot: (coordinates: [number, number]) => void;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  initialBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function ShachuHakuMap({
  spots,
  onSpotSelect,
  onCreateSpot,
  onBoundsChange,
  initialCenter = [139.6917, 35.6895],
  initialZoom = 9,
  initialBounds,
}: ShachuHakuMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const currentZoomRef = useRef<number>(9);
  const [markerUpdateTrigger, setMarkerUpdateTrigger] = useState(0);
  const isUserInteractionRef = useRef(false);

  // Hide/show markers during map movement
  const hideMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      const element = marker.getElement();
      element.style.opacity = '0';
    });
  }, []);

  const showMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      const element = marker.getElement();
      element.style.opacity = '1';
    });
  }, []);

  const updateMarkersForZoom = useCallback(() => {
    setMarkerUpdateTrigger((prev) => prev + 1);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for hover effect and popup styles
    if (!document.getElementById('camping-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'camping-marker-styles';
      style.textContent = `
        /* Expanded hover area for easier targeting */
        .camping-marker-hover::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          cursor: pointer;
          border-radius: 50%;
        }
        .camping-marker-hover:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 0 6px rgba(255,255,255,0.9), 0 0 0 8px rgba(59,130,246,0.5) !important;
          z-index: 1000 !important;
          transition: all 0.2s ease-out !important;
        }
        .camping-marker-hover {
          transition: all 0.2s ease-out !important;
          cursor: pointer !important;
        }
        .custom-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .custom-popup .mapboxgl-popup-tip {
          display: block !important;
        }
        .custom-popup .mapboxgl-popup-close-button {
          font-size: 20px !important;
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
          background-color: white !important;
          color: #374151 !important;
          border-radius: 50% !important;
          right: 8px !important;
          top: 8px !important;
          font-weight: bold !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          border: none !important;
        }
        .custom-popup .mapboxgl-popup-close-button:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
      `;
      document.head.appendChild(style);
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // マップの初期化前に、コンソール警告を一時的に抑制
    const restoreConsoleWarn = suppressImageWarnings();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: initialBounds ? [
        (initialBounds.west + initialBounds.east) / 2,
        (initialBounds.south + initialBounds.north) / 2
      ] : initialCenter,
      zoom: initialBounds ? 5 : initialZoom, // Temporary zoom, will be replaced by fitBounds
      minZoom: 3.5, //  北海道全域程度まで表示可能、それ以上はズームアウト不可
      maxBounds: [
        [122.0, 24.0], // 南西端（西端、南端）沖縄より南
        [154.0, 46.0]  // 北東端（東端、北端）北海道より北
      ],
    });

    // エラーハンドラの設定
    map.current.on('error', handleMapError);

    // スタイルが読み込まれる前に、既知の不足アイコンを事前登録
    map.current.on('styledata', () => {
      if (!map.current) return;
      preRegisterKnownIcons(map.current);
    });

    // 不足しているアイコンを動的に処理
    map.current.on('styleimagemissing', (e) => {
      if (!map.current) return;
      handleMissingImage(map.current, e.id);
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // コンソール出力を元に戻す
      restoreConsoleWarn();

      setMapLoaded(true);

      // If initialBounds is provided, fit the map to those bounds
      if (initialBounds) {
        map.current.fitBounds(
          [
            [initialBounds.west, initialBounds.south],
            [initialBounds.east, initialBounds.north],
          ],
          {
            padding: 0, // No padding for consistent display across devices
            duration: 0, // No animation on initial load
          }
        );
      }

      currentZoomRef.current = map.current.getZoom();

      try {
        // 日本語ラベルを設定
        setupJapaneseLabels(map.current);

        // POIアイコンの表示を調整
        setupPOIFilters(map.current);
      } catch (error) {
        console.error('Error setting up Japanese labels:', error);
      }
    });

    // Add double-click event for creating new spots
    map.current.on('dblclick', (e) => {
      const { lng, lat } = e.lngLat;
      onCreateSpot([lng, lat]);
    });

    // Add map movement event listeners to hide/show markers
    map.current.on('movestart', () => {
      isUserInteractionRef.current = true;
      setIsMapMoving(true);
      hideMarkers();
    });

    map.current.on('zoomstart', () => {
      isUserInteractionRef.current = true;
      setIsMapMoving(true);
      hideMarkers();
    });

    map.current.on('moveend', () => {
      setIsMapMoving(false);
      showMarkers();

      // Only notify parent if user manually moved the map (after initial load)
      if (map.current && onBoundsChange && isUserInteractionRef.current) {
        const bounds = map.current.getBounds();
        if (!bounds) return;

        const north = bounds.getNorth();
        const south = bounds.getSouth();
        let east = bounds.getEast();
        let west = bounds.getWest();

        // Normalize longitude to prevent wraparound issues
        // Ensure bounds are within Japan's approximate range
        if (east > 154) east = 154;
        if (west < 122) west = 122;
        if (east < west) {
          // If bounds wrapped around, reset to max bounds
          east = 154;
          west = 122;
        }

        onBoundsChange({
          north: Math.min(north, 46),
          south: Math.max(south, 24),
          east,
          west,
        });
        isUserInteractionRef.current = false; // Reset after handling
      }
    });

    map.current.on('zoomend', () => {
      setIsMapMoving(false);
      showMarkers();
      if (map.current) {
        const newZoom = map.current.getZoom();
        const oldZoom = currentZoomRef.current;
        currentZoomRef.current = newZoom;

        const crossedThreshold =
          (oldZoom < 9 && newZoom >= 9) || (oldZoom >= 9 && newZoom < 9);
        if (crossedThreshold) {
          updateMarkersForZoom();
        }

        // Notify parent of bounds change on zoom (if user initiated)
        if (onBoundsChange && isUserInteractionRef.current) {
          const bounds = map.current.getBounds();
          if (!bounds) return;

          const north = bounds.getNorth();
          const south = bounds.getSouth();
          let east = bounds.getEast();
          let west = bounds.getWest();

          // Normalize longitude
          if (east > 154) east = 154;
          if (west < 122) west = 122;
          if (east < west) {
            east = 154;
            west = 122;
          }

          onBoundsChange({
            north: Math.min(north, 46),
            south: Math.max(south, 24),
            east,
            west,
          });
          isUserInteractionRef.current = false;
        }
      }
    });

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Clean up styles when component unmounts
      const styleElement = document.getElementById('camping-marker-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Update markers when spots change or zoom level changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const markerColor = getMarkerColor(spot);

      // Determine marker size and content based on zoom level
      // Zoom level 9 or higher (市町村レベル): show detailed markers with scores
      const isDetailedView = currentZoomRef.current >= 9;
      const markerSize = isDetailedView ? 25 : 12;
      const borderWidth = isDetailedView ? 3 : 2;
      const fontSize = isDetailedView ? 12 : 0;

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'camping-spot-marker';
      markerElement.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
        transition: opacity 0.15s ease-in-out, box-shadow 0.2s ease;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        will-change: transform, opacity;
        transform: translateZ(0);
        opacity: ${isMapMoving ? '0' : '1'};
      `;

      // Add CSS hover effect with unique class
      markerElement.classList.add('camping-marker-hover');

      // Add security level number to marker only in detailed view
      if (isDetailedView) {
        markerElement.textContent = calculateSecurityLevel(spot).toString();
      }

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(spot.coordinates)
        .addTo(map.current!);

      // Click event - call callback to show custom popup
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event from firing
        onSpotSelect(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, mapLoaded, onSpotSelect, isMapMoving, markerUpdateTrigger]);

  // Initial load only: Trigger bounds change to load spots
  useEffect(() => {
    if (!map.current || !mapLoaded || !onBoundsChange) return;

    const bounds = map.current.getBounds();
    if (!bounds) return;

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    let east = bounds.getEast();
    let west = bounds.getWest();

    // Normalize longitude to prevent wraparound issues
    if (east > 154) east = 154;
    if (west < 122) west = 122;
    if (east < west) {
      east = 154;
      west = 122;
    }

    onBoundsChange({
      north: Math.min(north, 46),
      south: Math.max(south, 24),
      east,
      west,
    });

    // After initial load, only respond to user interactions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]); // Only run on initial map load

  // Track last applied initialBounds to prevent infinite loop while allowing prefecture jumps
  const lastAppliedBoundsRef = useRef<typeof initialBounds | null>(null);

  // Update map center/zoom/bounds when props change (for jump functionality)
  // IMPORTANT: Only apply if initialBounds value has actually changed (not same object from URL update)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // If initialBounds is provided, check if it's different from last applied
    if (initialBounds) {
      // Check if this is a new bounds value (different from last applied)
      const isSameBounds = lastAppliedBoundsRef.current &&
        Math.abs(lastAppliedBoundsRef.current.north - initialBounds.north) < 0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.south - initialBounds.south) < 0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.east - initialBounds.east) < 0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.west - initialBounds.west) < 0.0001;

      // Only apply if bounds have changed (e.g., prefecture jump)
      if (!isSameBounds) {
        lastAppliedBoundsRef.current = { ...initialBounds }; // Save the applied bounds

        const currentBounds = map.current.getBounds();
        if (!currentBounds) return;

        // Check if map bounds differ from target bounds
        const boundsChanged =
          Math.abs(currentBounds.getNorth() - initialBounds.north) > 0.01 ||
          Math.abs(currentBounds.getSouth() - initialBounds.south) > 0.01 ||
          Math.abs(currentBounds.getEast() - initialBounds.east) > 0.01 ||
          Math.abs(currentBounds.getWest() - initialBounds.west) > 0.01;

        if (boundsChanged) {
          isUserInteractionRef.current = false; // Mark as programmatic change
          map.current.fitBounds(
            [
              [initialBounds.west, initialBounds.south],
              [initialBounds.east, initialBounds.north],
            ],
            {
              padding: 0, // No padding for consistent display across devices
              duration: 1000, // Smooth animation
            }
          );
        }
      }
    } else if (!initialBounds) {
      // Fallback to center/zoom if bounds not provided (for jump functionality)
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();

      const centerChanged =
        Math.abs(currentCenter.lng - initialCenter[0]) > 0.001 ||
        Math.abs(currentCenter.lat - initialCenter[1]) > 0.001;
      const zoomChanged = Math.abs(currentZoom - initialZoom) > 0.1;

      if (centerChanged || zoomChanged) {
        isUserInteractionRef.current = false; // Mark as programmatic change
        map.current.flyTo({
          center: initialCenter,
          zoom: initialZoom,
          duration: 1000, // Smooth animation
        });
      }
    }
  }, [initialCenter, initialZoom, initialBounds, mapLoaded]);

  const getMarkerColor = (spot: CampingSpotWithId): string => {
    // Color based on calculated security level
    const rating = calculateSecurityLevel(spot);
    return getMarkerColorByRating(rating);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className='h-[600px] bg-gray-100 flex items-center justify-center rounded-lg'>
        <p className='text-gray-600'>Mapboxトークンが設定されていません</p>
      </div>
    );
  }

  return (
    <div className='relative w-full'>
      {/* Consistent 16:10 aspect ratio across all devices, with max height limits */}
      <div className='w-full aspect-16/10 max-h-[300px] sm:max-h-[600px]'>
        <div ref={mapContainer} className='w-full h-full rounded-lg' />
      </div>
      <div className='absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border dark:border-gray-600'>
        <div className='text-xs text-gray-600 dark:text-gray-400'>
          スポット数: {spots.length}
        </div>
      </div>
    </div>
  );
}
