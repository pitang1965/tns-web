'use client';

import { useEffect, useRef, useState } from 'react';
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
import 'mapbox-gl/dist/mapbox-gl.css';

interface CampingSpotMapProps {
  spots: CampingSpotWithId[];
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onCreateSpot: (coordinates: [number, number]) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function CampingSpotMap({
  spots,
  onSpotSelect,
  onCreateSpot,
}: CampingSpotMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !MAPBOX_TOKEN) return;

    // Add CSS for hover effect
    if (!document.getElementById('camping-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'camping-marker-styles';
      style.textContent = `
        .camping-marker-hover:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.8) !important;
          z-index: 1000 !important;
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
      center: [139.6917, 35.6895], // Tokyo center
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
  }, [onCreateSpot]);

  // Update markers when spots change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

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
        transition: box-shadow 0.2s ease;
      `;

      // Add CSS hover effect with unique class
      markerElement.classList.add('camping-marker-hover');

      // Add rating number to marker
      markerElement.textContent = spot.overallRating?.toString() || '?';

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(spot.coordinates)
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
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
    return `
      <div class="p-3 max-w-xs">
        <h3 class="font-semibold text-lg mb-2">${spot.name}</h3>
        <div class="space-y-1 text-sm">
          <div><strong>種別:</strong> ${CampingSpotTypeLabels[spot.type]}</div>
          <div><strong>都道府県:</strong> ${spot.prefecture}</div>
          ${spot.overallRating ? `<div><strong>総合評価:</strong> ${spot.overallRating}/5 ⭐</div>` : ''}
          ${spot.quietnessLevel ? `<div><strong>静けさ:</strong> ${spot.quietnessLevel}/5</div>` : ''}
          ${spot.securityLevel ? `<div><strong>治安:</strong> ${spot.securityLevel}/5</div>` : ''}
          <div><strong>料金:</strong> ${
            spot.pricing.isFree ? '無料' : `¥${spot.pricing.pricePerNight || '未設定'}/泊`
          }</div>
          ${spot.distanceToToilet ? `<div><strong>トイレ:</strong> ${spot.distanceToToilet}m</div>` : ''}
          ${
            spot.distanceToBath
              ? `<div><strong>入浴施設:</strong> ${spot.distanceToBath}m</div>`
              : ''
          }
          ${
            spot.distanceToConvenience
              ? `<div><strong>コンビニ:</strong> ${spot.distanceToConvenience}m</div>`
              : ''
          }
          ${spot.elevation ? `<div><strong>標高:</strong> ${spot.elevation}m</div>` : ''}
          <div class="flex gap-1 mt-2">
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
              spot.isGatedPaid
                ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">ゲート付き</span>'
                : ''
            }
          </div>
          ${
            spot.notes
              ? `<div class="mt-2"><strong>備考:</strong> ${spot.notes}</div>`
              : ''
          }
        </div>
        <div class="mt-3 text-xs text-gray-500">
          クリックして編集
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
      <div className='absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border dark:border-gray-600'>
        <h4 className='font-semibold mb-2 text-gray-900 dark:text-gray-100'>
          操作方法
        </h4>
        <div className='text-sm space-y-1 text-gray-700 dark:text-gray-300'>
          <div>• マーカーをクリック: スポット編集</div>
          <div>• 地図をダブルクリック: 新規作成</div>
          <div>
            • マーカーの色: 評価（緑=5点、青=4点、黄=3点、橙=2点、赤=1点）
          </div>
        </div>
      </div>
      <div className='absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border dark:border-gray-600'>
        <div className='text-xs text-gray-600 dark:text-gray-400'>
          スポット数: {spots.length}
        </div>
      </div>
    </div>
  );
}
