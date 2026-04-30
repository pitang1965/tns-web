'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { formatDistance } from '@/lib/formatDistance';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
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

type ShachuHakuMapProps = {
  spots: CampingSpotWithId[];
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onCreateSpot?: (coordinates: [number, number]) => void;
  readonly?: boolean;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  initialZoom?: number;
  initialCenter?: [number, number];
  initialBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: [number, number]) => void;
  isLandscape?: boolean;
  /** 親コンポーネントで選択中のスポットID。nullになると施設マーカーをクリア */
  activatedSpotId?: string | null;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function ShachuHakuMap({
  spots,
  onSpotSelect,
  onCreateSpot,
  readonly = false,
  onBoundsChange,
  initialZoom = 9,
  initialCenter = [139.6917, 35.6895],
  initialBounds,
  onZoomChange,
  onCenterChange,
  isLandscape = false,
  activatedSpotId,
}: ShachuHakuMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const facilityMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const currentZoomRef = useRef<number>(9); // Use ref instead of state to avoid re-renders
  const [markerUpdateTrigger, setMarkerUpdateTrigger] = useState(0); // Trigger marker updates
  const isUserInteractionRef = useRef(false); // Track if user is interacting

  const clearFacilityMarkers = useCallback(() => {
    facilityMarkersRef.current.forEach((marker) => marker.remove());
    facilityMarkersRef.current = [];
  }, []);

  const isValidCoords = (coords: unknown): coords is [number, number] =>
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    !isNaN(coords[0]) &&
    !isNaN(coords[1]);

  const FACILITY_CONFIGS = [
    {
      key: 'nearbyToiletCoordinates' as const,
      distKey: 'distanceToToilet' as const,
      emoji: '🚻',
      label: 'トイレ',
      color: '#8b5cf6',
    },
    {
      key: 'nearbyConvenienceCoordinates' as const,
      distKey: 'distanceToConvenience' as const,
      emoji: '🏪',
      label: 'コンビニ',
      color: '#10b981',
    },
    {
      key: 'nearbyBathCoordinates' as const,
      distKey: 'distanceToBath' as const,
      emoji: '♨️',
      label: '入浴施設',
      color: '#f59e0b',
    },
  ] as const;

  const showFacilityMarkers = useCallback(
    (spot: CampingSpotWithId) => {
      if (!map.current) return;
      clearFacilityMarkers();

      FACILITY_CONFIGS.forEach(({ key, distKey, emoji, color }) => {
        const coords = spot[key];
        if (!isValidCoords(coords)) return;

        const el = document.createElement('div');
        el.className = 'facility-marker';
        el.style.cssText = `
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: default;
        pointer-events: none;
        animation: facilityFadeIn 0.15s ease-out;
      `;
        el.textContent = emoji;

        const distance = spot[distKey];
        el.title =
          distance !== undefined
            ? `${emoji} ${formatDistance(distance)}`
            : emoji;

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coords as [number, number])
          .addTo(map.current!);

        facilityMarkersRef.current.push(marker);
      });
    },
    [clearFacilityMarkers],
  );

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

  // Function to trigger marker update when zoom crosses threshold
  const updateMarkersForZoom = useCallback(() => {
    setMarkerUpdateTrigger((prev) => prev + 1);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for hover effect and popup styles
    if (!document.getElementById('shachu-haku-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'shachu-haku-marker-styles';
      style.textContent = `
        /* Expanded hover area for easier targeting */
        .shachu-haku-marker-hover::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          cursor: pointer;
          border-radius: 50%;
        }
        .shachu-haku-marker-hover:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 0 6px rgba(255,255,255,0.9), 0 0 0 8px rgba(59,130,246,0.5) !important;
          z-index: 1000 !important;
          transition: all 0.2s ease-out !important;
        }
        .shachu-haku-marker-hover {
          transition: all 0.2s ease-out !important;
          cursor: pointer !important;
        }
        .custom-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          position: relative !important;
          overflow: visible !important;
        }
        .custom-popup .mapboxgl-popup-tip {
          display: block !important;
        }
        .custom-popup .mapboxgl-popup-close-button {
          position: absolute !important;
          font-size: 18px !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 26px !important;
          background-color: white !important;
          color: #374151 !important;
          border-radius: 50% !important;
          left: 8px !important;
          top: 8px !important;
          font-weight: bold !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          border: 1px solid #e5e7eb !important;
          z-index: 100 !important;
          text-align: center !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .custom-popup .mapboxgl-popup-close-button:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
        .facility-marker {
          transition: transform 0.2s ease;
        }
        @keyframes facilityFadeIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        /* Mapbox UI elements z-index adjustments */
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          z-index: 10 !important;
        }
        .mapboxgl-ctrl-top-left,
        .mapboxgl-ctrl-top-right {
          z-index: 30 !important;
        }
        .mapboxgl-popup {
          z-index: 40 !important;
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
      center: initialBounds
        ? [
            (initialBounds.west + initialBounds.east) / 2,
            (initialBounds.south + initialBounds.north) / 2,
          ]
        : initialCenter,
      zoom: initialBounds ? 5 : initialZoom, // Temporary zoom, will be replaced by fitBounds
      minZoom: 3.5, // 小画面デバイス（iPhone SEなど）でも北海道全域を表示可能
      maxBounds: [
        [122.0, 24.0], // 南西端（西端、南端）沖縄より南
        [154.0, 46.0], // 北東端（東端、北端）北海道より北
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
          },
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

    // Add double-click event for creating new spots (admin only)
    if (!readonly && onCreateSpot) {
      map.current.on('dblclick', (e) => {
        const { lng, lat } = e.lngLat;
        onCreateSpot([lng, lat]);
      });
    }

    // Add map movement event listeners to hide/show markers
    map.current.on('movestart', () => {
      isUserInteractionRef.current = true; // User is interacting
      setIsMapMoving(true);
      hideMarkers();
      clearFacilityMarkers();
    });

    map.current.on('zoomstart', () => {
      isUserInteractionRef.current = true; // User is interacting
      setIsMapMoving(true);
      hideMarkers();
      clearFacilityMarkers();
    });

    map.current.on('moveend', () => {
      setIsMapMoving(false);
      showMarkers();

      // Only notify parent if user manually moved the map (after initial load)
      if (map.current && isUserInteractionRef.current) {
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

        if (onBoundsChange) {
          onBoundsChange({
            north: Math.min(north, 46),
            south: Math.max(south, 24),
            east,
            west,
          });
        }

        // Notify parent of center change
        if (onCenterChange) {
          const center = map.current.getCenter();
          onCenterChange([center.lng, center.lat]);
        }

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

        // Only update markers if zoom crosses the threshold (9.0)
        const crossedThreshold =
          (oldZoom < 9 && newZoom >= 9) || (oldZoom >= 9 && newZoom < 9);
        if (crossedThreshold) {
          // Trigger marker update by updating a separate state
          updateMarkersForZoom();
        }

        // Notify parent of zoom change (if user initiated)
        if (isUserInteractionRef.current && onZoomChange) {
          onZoomChange(newZoom);
        }
        // Note: onBoundsChange and onCenterChange are handled in moveend event only
        // to prevent center drift during wheel zoom
      }
    });

    // Close all popups when clicking on the map (not on markers)
    map.current.on('click', () => {
      // Close all existing popups
      const existingPopups = document.querySelectorAll('.mapboxgl-popup');
      existingPopups.forEach((popup) => {
        const closeButton = popup.querySelector(
          '.mapboxgl-popup-close-button',
        ) as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      });
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
      const styleElement = document.getElementById('shachu-haku-marker-styles');
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
      markerElement.className = 'shachu-haku-spot-marker';
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
      markerElement.classList.add('shachu-haku-marker-hover');

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

      // Create popup only for admin mode
      if (!readonly) {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          className: 'custom-popup',
        }).setHTML(createPopupHTML(spot, readonly));

        marker.setPopup(popup);
      }

      // Click event
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event from firing

        if (readonly) {
          // For readonly mode (public view), show facility markers + call callback
          showFacilityMarkers(spot);
          onSpotSelect(spot);
        } else {
          // For admin mode, show Mapbox popup
          // Close all existing popups first
          const existingPopups = document.querySelectorAll('.mapboxgl-popup');
          existingPopups.forEach((popup) => {
            const closeButton = popup.querySelector(
              '.mapboxgl-popup-close-button',
            ) as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          });

          // Then show this marker's popup
          marker.togglePopup();

          // Also call the spot selection handler
          showFacilityMarkers(spot);
          onSpotSelect(spot);
        }
      });

      markersRef.current.push(marker);
    });
  }, [
    spots,
    mapLoaded,
    onSpotSelect,
    readonly,
    isMapMoving,
    markerUpdateTrigger,
    showFacilityMarkers,
    clearFacilityMarkers,
  ]);

  // Clear facility markers when parent deselects the spot (e.g. ✕ button in SpotPopup)
  useEffect(() => {
    if (!activatedSpotId) {
      clearFacilityMarkers();
    }
  }, [activatedSpotId, clearFacilityMarkers]);

  // Clear facility markers when clicking map background
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.on('click', clearFacilityMarkers);
    return () => {
      map.current?.off('click', clearFacilityMarkers);
    };
  }, [mapLoaded, clearFacilityMarkers]);

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
      const isSameBounds =
        lastAppliedBoundsRef.current &&
        Math.abs(lastAppliedBoundsRef.current.north - initialBounds.north) <
          0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.south - initialBounds.south) <
          0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.east - initialBounds.east) <
          0.0001 &&
        Math.abs(lastAppliedBoundsRef.current.west - initialBounds.west) <
          0.0001;

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
            },
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
    // Color based on overall rating
    const rating = calculateSecurityLevel(spot);
    return getMarkerColorByRating(rating);
  };

  const createPopupHTML = (
    spot: CampingSpotWithId,
    isReadonly: boolean,
  ): string => {
    return `
      <div class="bg-white text-gray-900 rounded-lg shadow-lg" style="width: clamp(250px, 40vw, 300px); padding: 12px 12px 12px 44px;">
        <h3 class="font-semibold text-lg mb-2 text-gray-900 wrap-break-word">${
          spot.name
        }</h3>
        <div class="space-y-1 text-sm text-gray-700">
          <div><strong class="text-gray-900">種別:</strong> ${
            CampingSpotTypeLabels[spot.type]
          }</div>
          <div class="flex justify-between items-center">
            <span><strong class="text-gray-900">治安:</strong> ${calculateSecurityLevel(
              spot,
            )}/5 🔒</span>
            <span><strong class="text-gray-900">静けさ:</strong> ${calculateQuietnessLevel(
              spot,
            )}/5 🔇</span>
          </div>
          <div><strong class="text-gray-900">料金:</strong> ${
            spot.pricing.isFree
              ? '無料'
              : spot.pricing.pricePerNight
                ? `¥${spot.pricing.pricePerNight}/泊`
                : '有料：？円/泊'
          }</div>
          <div class="mt-3 pt-2 border-t border-gray-200">
            <button
              onclick="window.location.href='/shachu-haku/${spot._id}'"
              class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
            >
              もっと見る
            </button>
          </div>
        </div>
      </div>
    `;
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">Mapboxトークンが設定されていません</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* 16:10 aspect ratio with max height limits */}
      <div className="w-full aspect-16/10 max-h-[300px] sm:max-h-[600px]">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      </div>
    </div>
  );
}
