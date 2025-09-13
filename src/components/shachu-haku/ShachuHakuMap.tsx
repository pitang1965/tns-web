'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ShachuHakuMapProps {
  spots: CampingSpotWithId[];
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onCreateSpot?: (coordinates: [number, number]) => void;
  readonly?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function ShachuHakuMap({
  spots,
  onSpotSelect,
  onCreateSpot,
  readonly = false,
}: ShachuHakuMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapMoving, setIsMapMoving] = useState(false);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for hover effect and popup styles
    if (!document.getElementById('shachu-haku-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'shachu-haku-marker-styles';
      style.textContent = `
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
      center: [139.5631214, 35.332528935], // 相模湾
      zoom: 5,
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
      setIsMapMoving(true);
      hideMarkers();
    });

    map.current.on('zoomstart', () => {
      setIsMapMoving(true);
      hideMarkers();
    });

    map.current.on('moveend', () => {
      setIsMapMoving(false);
      showMarkers();
    });

    map.current.on('zoomend', () => {
      setIsMapMoving(false);
      showMarkers();
    });

    // Close all popups when clicking on the map (not on markers)
    map.current.on('click', () => {
      // Close all existing popups
      const existingPopups = document.querySelectorAll('.mapboxgl-popup');
      existingPopups.forEach((popup) => {
        const closeButton = popup.querySelector(
          '.mapboxgl-popup-close-button'
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
  }, [onCreateSpot, hideMarkers, showMarkers, readonly]);

  // Update markers when spots change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Check if markers are visible on the map
    const markersVisibleOnMap = markersRef.current.filter((marker) => {
      const element = marker.getElement();
      return element && element.parentNode && document.contains(element);
    });

    // Always recreate markers if they're not visible or count doesn't match
    if (markersVisibleOnMap.length === spots.length) {
      return; // No need to recreate markers
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const markerColor = getMarkerColor(spot);

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'shachu-haku-spot-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
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

      // Add security level number to marker
      markerElement.textContent = calculateSecurityLevel(spot).toString();

      // Add simple tooltip using title attribute
      markerElement.title = spot.name;

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(spot.coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup',
      }).setHTML(createPopupHTML(spot, readonly));

      marker.setPopup(popup);

      // Click event
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event from firing

        // Close all existing popups first
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach((popup) => {
          const closeButton = popup.querySelector(
            '.mapboxgl-popup-close-button'
          ) as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        });

        // Then show this marker's popup
        marker.togglePopup();

        // For admin mode, also call the spot selection handler
        if (!readonly) {
          onSpotSelect(spot);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all spots if there are any
    if (spots.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      spots.forEach((spot) => {
        bounds.extend(spot.coordinates);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 10,
      });
    }
  }, [spots, mapLoaded, onSpotSelect, readonly]);

  const getMarkerColor = (spot: CampingSpotWithId): string => {
    // Color based on overall rating
    const rating = calculateSecurityLevel(spot);
    if (rating >= 5) return '#22c55e'; // green
    if (rating >= 4) return '#3b82f6'; // blue
    if (rating >= 3) return '#f59e0b'; // yellow
    if (rating >= 2) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const createPopupHTML = (
    spot: CampingSpotWithId,
    isReadonly: boolean
  ): string => {
    return `
      <div class="p-3 bg-white text-gray-900 rounded-lg shadow-lg" style="width: clamp(250px, 40vw, 300px);">
        <h3 class="font-semibold text-lg mb-2 text-gray-900 break-words">${
          spot.name
        }</h3>
        <div class="space-y-1 text-sm text-gray-700">
          <div><strong class="text-gray-900">種別:</strong> ${
            CampingSpotTypeLabels[spot.type]
          }</div>
          <div class="flex justify-between items-center">
            <span><strong class="text-gray-900">治安:</strong> ${calculateSecurityLevel(
              spot
            )}/5 🔒</span>
            <span><strong class="text-gray-900">静けさ:</strong> ${calculateQuietnessLevel(
              spot
            )}/5 🔇</span>
          </div>
          <div><strong class="text-gray-900">料金:</strong> ${
            spot.pricing.isFree
              ? '無料'
              : `¥${spot.pricing.pricePerNight || '未設定'}/泊`
          }</div>
          <div class="mt-3 pt-2 border-t border-gray-200">
            <button
              onclick="window.location.href='/shachu-haku/${spot._id}'"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
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
      <div className='h-[600px] bg-gray-100 flex items-center justify-center rounded-lg'>
        <p className='text-gray-600'>Mapboxトークンが設定されていません</p>
      </div>
    );
  }

  return (
    <div className='relative'>
      <div ref={mapContainer} className='h-[600px] w-full rounded-lg' />
      <div className='absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600 z-40'>
        <Collapsible
          open={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
        >
          <CollapsibleTrigger className='flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors'>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              操作方法
            </h4>
            {isInstructionsOpen ? (
              <ChevronUp className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            ) : (
              <ChevronDown className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className='px-3 pb-3'>
            <div className='text-sm space-y-1 text-gray-700 dark:text-gray-300'>
              <div>
                • マーカーをクリック: スポット{readonly ? '詳細表示' : '編集'}
              </div>
              {!readonly && <div>• 地図をダブルクリック: 新規作成</div>}
              <div>
                • マーカー色: 緑=5点 → 青=4点 → 黄=3点 → 橙=2点 →
                赤=1点・未評価(?)
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
