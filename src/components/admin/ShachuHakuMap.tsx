'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
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
  onCreateSpot: (coordinates: [number, number]) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function ShachuHakuMap({
  spots,
  onSpotSelect,
  onCreateSpot,
}: ShachuHakuMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Hide/show markers during map movement
  const hideMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.opacity = '0';
    });
  }, []);

  const showMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.opacity = '1';
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for hover effect and popup styles
    if (!document.getElementById('camping-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'camping-marker-styles';
      style.textContent = `
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

    // Add double-click event for creating new spots
    map.current.on('dblclick', (e) => {
      const { lng, lat } = e.lngLat;
      onCreateSpot([lng, lat]);
    });

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
  }, [onCreateSpot, hideMarkers, showMarkers]);

  // Update markers when spots change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Check if markers are visible on the map
    const markersVisibleOnMap = markersRef.current.filter(marker => {
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
      markerElement.className = 'camping-spot-marker';
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
      markerElement.classList.add('camping-marker-hover');

      // Add rating number to marker
      markerElement.textContent = spot.overallRating?.toString() || '?';

      // Add simple tooltip using title attribute
      markerElement.title = spot.name;

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(spot.coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup'
      }).setHTML(createPopupHTML(spot));

      marker.setPopup(popup);

      // Click event
      markerElement.addEventListener('click', () => {
        onSpotSelect(spot);
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
  }, [spots, mapLoaded, onSpotSelect]);

  const getMarkerColor = (spot: CampingSpotWithId): string => {
    // Color based on overall rating
    const rating = spot.overallRating || 1; // デフォルトで1とする
    if (rating >= 5) return '#22c55e'; // green
    if (rating >= 4) return '#3b82f6'; // blue
    if (rating >= 3) return '#f59e0b'; // yellow
    if (rating >= 2) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const createPopupHTML = (spot: CampingSpotWithId): string => {
    const isNotesLong = spot.notes && spot.notes.length > 100;
    const truncatedNotes = isNotesLong
      ? spot.notes?.substring(0, 100) + '...'
      : spot.notes;
    const spotId = `spot-${spot._id}`;

    return `
      <div class="p-3 bg-white text-gray-900 rounded-lg shadow-lg" style="width: clamp(280px, 50vw, 400px); max-height: 70vh; overflow-y: auto;">
        <h3 class="font-semibold text-lg mb-2 text-gray-900 break-words">${spot.name}</h3>
        <div class="space-y-1 text-sm text-gray-700">
          <div><strong class="text-gray-900">種別:</strong> ${CampingSpotTypeLabels[spot.type]}</div>
          <div><strong class="text-gray-900">都道府県:</strong> ${spot.prefecture}</div>
          ${spot.overallRating ? `<div><strong class="text-gray-900">総合評価:</strong> ${spot.overallRating}/5 ⭐</div>` : ''}
          ${spot.quietnessLevel ? `<div><strong class="text-gray-900">静けさ:</strong> ${spot.quietnessLevel}/5</div>` : ''}
          ${spot.securityLevel ? `<div><strong class="text-gray-900">治安:</strong> ${spot.securityLevel}/5</div>` : ''}
          <div><strong class="text-gray-900">料金:</strong> ${
            spot.pricing.isFree ? '無料' : `¥${spot.pricing.pricePerNight || '未設定'}/泊`
          }</div>
          ${spot.distanceToToilet ? `<div><strong class="text-gray-900">トイレ:</strong> ${spot.distanceToToilet}m</div>` : ''}
          ${
            spot.distanceToBath
              ? `<div><strong class="text-gray-900">入浴施設:</strong> ${spot.distanceToBath}m</div>`
              : ''
          }
          ${
            spot.distanceToConvenience
              ? `<div><strong class="text-gray-900">コンビニ:</strong> ${spot.distanceToConvenience}m</div>`
              : ''
          }
          ${spot.elevation ? `<div><strong class="text-gray-900">標高:</strong> ${spot.elevation}m</div>` : ''}
          <div class="flex gap-1 mt-2 flex-wrap">
            ${
              spot.hasRoof
                ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">屋根付き</span>'
                : ''
            }
            ${
              spot.hasPowerOutlet
                ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">電源</span>'
                : ''
            }
            ${
              spot.hasGate
                ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">ゲート付き</span>'
                : ''
            }
          </div>
          ${
            spot.notes
              ? `<div class="mt-2 text-gray-700">
                  <strong class="text-gray-900">備考:</strong>
                  <span class="break-words">
                    <span id="${spotId}-short"${isNotesLong ? '' : ' style="display: none;"'}>${truncatedNotes}</span>
                    <span id="${spotId}-full" style="display: ${isNotesLong ? 'none' : 'inline'};">${spot.notes}</span>
                  </span>
                  ${isNotesLong ? `
                    <button
                      id="${spotId}-toggle"
                      onclick="
                        const short = document.getElementById('${spotId}-short');
                        const full = document.getElementById('${spotId}-full');
                        const btn = document.getElementById('${spotId}-toggle');
                        if (full.style.display === 'none') {
                          short.style.display = 'none';
                          full.style.display = 'inline';
                          btn.textContent = '閉じる';
                        } else {
                          short.style.display = 'inline';
                          full.style.display = 'none';
                          btn.textContent = 'もっと見る';
                        }
                      "
                      class="ml-1 text-blue-600 hover:text-blue-800 underline text-xs cursor-pointer"
                    >もっと見る</button>
                  ` : ''}
                </div>`
              : ''
          }
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
      <div className='absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600'>
        <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
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
              <div>• マーカーをクリック: スポット編集</div>
              <div>• 地図をダブルクリック: 新規作成</div>
              <div>• マーカー色: 緑=5点 → 青=4点 → 黄=3点 → 橙=2点 → 赤=1点・未評価(?)</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className='absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border dark:border-gray-600'>
        <div className='text-xs text-gray-600 dark:text-gray-400'>
          スポット数: {spots.length}
        </div>
      </div>
    </div>
  );
}
