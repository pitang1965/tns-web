'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';
import { isInAppBrowser } from '@/lib/browserDetection';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import 'mapbox-gl/dist/mapbox-gl.css';

interface FacilityMapProps {
  spot: CampingSpotWithId;
}

interface FacilityMarker {
  coordinates: [number, number];
  type: 'camping' | 'toilet' | 'convenience' | 'bath';
  name: string;
  distance?: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function FacilityMap({ spot }: FacilityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // 座標の有効性をチェック
  const isValidCoordinate = (
    coords: [number, number] | undefined | null
  ): coords is [number, number] => {
    return (
      coords != null &&
      Array.isArray(coords) &&
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1]) &&
      isFinite(coords[0]) &&
      isFinite(coords[1]) &&
      coords[0] >= -180 &&
      coords[0] <= 180 &&
      coords[1] >= -90 &&
      coords[1] <= 90
    );
  };

  // 施設マーカーのデータを生成（useMemoでメモ化してre-renderを防ぐ）
  const facilityMarkers: FacilityMarker[] = useMemo(
    () => [
      // メインの車中泊スポット（有効な座標の場合のみ）
      ...(isValidCoordinate(spot.coordinates)
        ? [
            {
              coordinates: spot.coordinates,
              type: 'camping' as const,
              name: spot.name,
            },
          ]
        : []),
      // 近隣トイレ（有効な座標の場合のみ）
      ...(isValidCoordinate(spot.nearbyToiletCoordinates)
        ? [
            {
              coordinates: spot.nearbyToiletCoordinates,
              type: 'toilet' as const,
              name: 'トイレ',
              distance: spot.distanceToToilet,
            },
          ]
        : []),
      // 近隣コンビニ（有効な座標の場合のみ）
      ...(isValidCoordinate(spot.nearbyConvenienceCoordinates)
        ? [
            {
              coordinates: spot.nearbyConvenienceCoordinates,
              type: 'convenience' as const,
              name: 'コンビニ',
              distance: spot.distanceToConvenience,
            },
          ]
        : []),
      // 近隣入浴施設（有効な座標の場合のみ）
      ...(isValidCoordinate(spot.nearbyBathCoordinates)
        ? [
            {
              coordinates: spot.nearbyBathCoordinates,
              type: 'bath' as const,
              name: '入浴施設',
              distance: spot.distanceToBath,
            },
          ]
        : []),
    ],
    [
      spot.coordinates,
      spot.name,
      spot.nearbyToiletCoordinates,
      spot.distanceToToilet,
      spot.nearbyConvenienceCoordinates,
      spot.distanceToConvenience,
      spot.nearbyBathCoordinates,
      spot.distanceToBath,
    ]
  );

  // マーカーの色とアイコンを取得
  const getMarkerStyle = (type: string) => {
    switch (type) {
      case 'camping':
        return {
          color: '#3b82f6',
          icon: '🏕️',
          size: 36,
        };
      case 'toilet':
        return {
          color: '#8b5cf6',
          icon: '🚻',
          size: 32,
        };
      case 'convenience':
        return {
          color: '#10b981',
          icon: '🏪',
          size: 32,
        };
      case 'bath':
        return {
          color: '#f59e0b',
          icon: '♨️',
          size: 32,
        };
      default:
        return {
          color: '#6b7280',
          icon: '📍',
          size: 28,
        };
    }
  };

  // マーカーの凡例データ
  const legendItems = [
    { type: 'camping', label: '車中泊スポット', icon: '🏕️', color: '#3b82f6' },
    { type: 'toilet', label: 'トイレ', icon: '🚻', color: '#8b5cf6' },
    { type: 'convenience', label: 'コンビニ', icon: '🏪', color: '#10b981' },
    { type: 'bath', label: '入浴施設', icon: '♨️', color: '#f59e0b' },
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for marker styles
    if (!document.getElementById('facility-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'facility-marker-styles';
      style.textContent = `
        .facility-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .facility-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
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
          font-size: 18px !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
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

    // 座標の有効性チェック
    if (!isValidCoordinate(spot.coordinates)) {
      console.error('Invalid coordinates for spot:', spot.coordinates);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // マップの初期化前に、コンソール警告を一時的に抑制
    const restoreConsoleWarn = suppressImageWarnings();

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: spot.coordinates,
      zoom: 14,
    });

    // エラーハンドラの設定（In-App Browser対応）
    map.current.on('error', (error) => {
      // In-App BrowserでのpostMessageエラーを無視
      if (
        isInAppBrowser() &&
        error.error &&
        error.error.message &&
        error.error.message.includes('postMessage')
      ) {
        console.log('Suppressed postMessage error in In-App Browser');
        return;
      }
      handleMapError(error);
    });

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

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Clean up styles when component unmounts
      const styleElement = document.getElementById('facility-marker-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [spot.coordinates]);

  // Update markers when facilities change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add facility markers
    facilityMarkers.forEach((facility) => {
      const style = getMarkerStyle(facility.type);

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'facility-marker';
      markerElement.style.cssText = `
        width: ${style.size}px;
        height: ${style.size}px;
        background-color: ${style.color};
      `;
      markerElement.textContent = style.icon;

      // Add simple tooltip using title attribute
      markerElement.title = facility.name;

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat(facility.coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup',
      }).setHTML(createFacilityPopupHTML(facility));

      marker.setPopup(popup);

      // Click event to show popup
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all facilities
    if (facilityMarkers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      facilityMarkers.forEach((facility) => {
        bounds.extend(facility.coordinates);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
      });
    }
  }, [facilityMarkers, mapLoaded]);

  const createFacilityPopupHTML = (facility: FacilityMarker): string => {
    const style = getMarkerStyle(facility.type);

    return `
      <div class="p-3 bg-white text-gray-900 rounded-lg shadow-lg" style="width: 200px;">
        <div class="flex items-center gap-2 mb-2">
          <span style="font-size: 20px;">${style.icon}</span>
          <h3 class="font-semibold text-gray-900">${facility.name}</h3>
        </div>
        ${
          facility.distance
            ? `<div class="text-sm text-gray-600">
                車中泊スポットから約 <strong>${facility.distance}m</strong>
              </div>`
            : ''
        }
        ${
          facility.type === 'camping'
            ? '<div class="text-sm text-gray-600">車中泊スポット</div>'
            : ''
        }
      </div>
    `;
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className='h-[400px] bg-gray-100 flex items-center justify-center rounded-lg'>
        <p className='text-gray-600 dark:text-gray-400'>
          Mapboxトークンが設定されていません
        </p>
      </div>
    );
  }

  // 有効な座標がない場合のエラー表示
  if (!isValidCoordinate(spot.coordinates)) {
    return (
      <div className='h-[400px] bg-gray-100 flex items-center justify-center rounded-lg'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400 mb-2'>
            地図情報が正しく設定されていません
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-500'>
            座標データ: [{spot.coordinates?.[0] || 'N/A'},{' '}
            {spot.coordinates?.[1] || 'N/A'}]
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      <div ref={mapContainer} className='h-[400px] w-full rounded-lg' />

      {/* 凡例 */}
      <div className='absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600 z-40'>
        <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
          <CollapsibleTrigger className='flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors'>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              施設マップ
            </h4>
            {isLegendOpen ? (
              <ChevronUp className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            ) : (
              <ChevronDown className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className='px-3 pb-3'>
            <div className='space-y-2'>
              {legendItems.map((item) => {
                const facilityExists = facilityMarkers.some(
                  (f) => f.type === item.type
                );
                return (
                  <div
                    key={item.type}
                    className={`flex items-center gap-2 text-sm ${
                      facilityExists
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <div
                      className='w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs'
                      style={{
                        backgroundColor: facilityExists
                          ? item.color
                          : '#e5e7eb',
                      }}
                    >
                      <span style={{ fontSize: '10px' }}>{item.icon}</span>
                    </div>
                    <span>{item.label}</span>
                    {facilityExists && item.type !== 'camping' && (
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        (
                        {
                          facilityMarkers.find((f) => f.type === item.type)
                            ?.distance
                        }
                        m)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 施設数表示 */}
      <div className='absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border dark:border-gray-600'>
        <div className='text-xs text-gray-600 dark:text-gray-400'>
          施設数: {facilityMarkers.length}
        </div>
      </div>
    </div>
  );
}
