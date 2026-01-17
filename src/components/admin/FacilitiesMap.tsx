'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/formatDistance';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';
import { FacilityLegend, LegendItem } from '@/components/common/FacilityLegend';
import { UseFormWatch } from 'react-hook-form';
import { ShachuHakuFormData } from './validationSchemas';
import 'mapbox-gl/dist/mapbox-gl.css';

type FacilitiesMapProps = {
  watch: UseFormWatch<ShachuHakuFormData>;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type FacilityData = {
  type: 'camping' | 'toilet' | 'convenience' | 'bath';
  lat: number;
  lng: number;
  name: string;
  color: string;
  distance?: number;
}

export function FacilitiesMap({ watch }: FacilitiesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const currentPopupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);

  // マーカーの凡例データ
  const legendItems: LegendItem[] = [
    { type: 'camping', label: '車中泊スポット', icon: '🛏️', color: '#e74c3c' },
    { type: 'toilet', label: 'トイレ', icon: '🚻', color: '#3498db' },
    { type: 'convenience', label: 'コンビニ', icon: '🏪', color: '#2ecc71' },
    { type: 'bath', label: '入浴施設', icon: '♨️', color: '#f39c12' },
  ];

  // 距離データを取得する関数（メモ化された値を使用）
  const getDistance = (type: string): number | undefined => {
    if (type === 'toilet') {
      return parseFloat(distanceToToilet || '0') || undefined;
    } else if (type === 'convenience') {
      return parseFloat(distanceToConvenience || '0') || undefined;
    } else if (type === 'bath') {
      return parseFloat(distanceToBath || '0') || undefined;
    }
    return undefined;
  };

  // 現在開いているポップアップを閉じる
  const closeCurrentPopup = () => {
    if (currentPopupRef.current) {
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
    }
  };

  // Hide/show markers during map movement
  const hideMarkers = () => {
    markersRef.current.forEach((marker) => {
      const element = marker.getElement();
      element.style.opacity = '0';
    });
  };

  const showMarkers = () => {
    markersRef.current.forEach((marker) => {
      const element = marker.getElement();
      element.style.opacity = '1';
    });
  };

  const getMarkerStyle = (type: string, zoom: number) => {
    // Determine marker size based on zoom level
    // Zoom level 9 or higher (市町村レベル): show larger markers
    const isDetailedView = zoom >= 9;
    const baseSizeMultiplier = isDetailedView ? 1 : 0.7;

    switch (type) {
      case 'camping':
        return {
          color: '#e74c3c',
          icon: '🛏️',
          size: Math.round(24 * baseSizeMultiplier),
          borderWidth: isDetailedView ? 2 : 1.5,
        };
      case 'toilet':
        return {
          color: '#3498db',
          icon: '🚻',
          size: Math.round(20 * baseSizeMultiplier),
          borderWidth: isDetailedView ? 2 : 1.5,
        };
      case 'convenience':
        return {
          color: '#2ecc71',
          icon: '🏪',
          size: Math.round(20 * baseSizeMultiplier),
          borderWidth: isDetailedView ? 2 : 1.5,
        };
      case 'bath':
        return {
          color: '#f39c12',
          icon: '♨️',
          size: Math.round(20 * baseSizeMultiplier),
          borderWidth: isDetailedView ? 2 : 1.5,
        };
      default:
        return {
          color: '#95a5a6',
          icon: '📍',
          size: Math.round(20 * baseSizeMultiplier),
          borderWidth: isDetailedView ? 2 : 1.5,
        };
    }
  };

  const clearMarkers = () => {
    // 現在のポップアップを閉じる
    closeCurrentPopup();
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    markersRef.current = [];
  };

  const addMarker = (facility: FacilityData, zoom: number) => {
    if (!mapInstance.current) return;

    const style = getMarkerStyle(facility.type, zoom);

    // マーカー要素を作成
    const markerElement = document.createElement('div');
    markerElement.className = 'admin-facility-marker';
    markerElement.style.cssText = `
      width: ${style.size}px;
      height: ${style.size}px;
      background-color: ${style.color};
      border-width: ${style.borderWidth}px;
      opacity: 1;
      transition: opacity 0.15s ease-in-out, width 0.2s ease, height 0.2s ease;
    `;
    markerElement.textContent = style.icon;
    markerElement.title = getTypeLabel(facility.type);

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'admin-custom-popup',
    }).setHTML(createFacilityPopupHTML(facility, zoom));

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([facility.lng, facility.lat])
      .addTo(mapInstance.current);

    // クリック時のポップアップ処理
    markerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      // 既存のポップアップを閉じる
      closeCurrentPopup();
      // 新しいポップアップを開く
      popup.setLngLat([facility.lng, facility.lat]).addTo(mapInstance.current!);
      currentPopupRef.current = popup;
    });

    markersRef.current.push(marker);
  };

  const createFacilityPopupHTML = (
    facility: FacilityData,
    zoom: number
  ): string => {
    const style = getMarkerStyle(facility.type, zoom);

    return `
      <div class="p-3 bg-white text-gray-900 rounded-lg shadow-lg" style="width: 200px;">
        <div class="flex items-center gap-2 mb-2">
          <span style="font-size: 20px;">${style.icon}</span>
          <h3 class="font-semibold text-gray-900">${getTypeLabel(
            facility.type
          )}</h3>
        </div>
        ${
          facility.type === 'camping'
            ? `<div class="text-sm text-gray-600">${facility.name}</div>`
            : ''
        }
        ${
          facility.distance
            ? `<div class="text-sm text-gray-600">
                車中泊スポットから約 <strong>${formatDistance(
                  facility.distance
                )}</strong>
              </div>`
            : ''
        }
      </div>
    `;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'camping':
        return '車中泊スポット';
      case 'toilet':
        return 'トイレ';
      case 'convenience':
        return 'コンビニ';
      case 'bath':
        return '入浴施設';
      default:
        return '施設';
    }
  };

  // 座標情報を持つ施設を取得
  // フォームの値を監視（個別のwatch呼び出しで即座の更新を実現）
  const lat = watch('lat');
  const lng = watch('lng');
  const name = watch('name');
  const nearbyToiletLat = watch('nearbyToiletLat');
  const nearbyToiletLng = watch('nearbyToiletLng');
  const distanceToToilet = watch('distanceToToilet');
  const nearbyConvenienceLat = watch('nearbyConvenienceLat');
  const nearbyConvenienceLng = watch('nearbyConvenienceLng');
  const distanceToConvenience = watch('distanceToConvenience');
  const nearbyBathLat = watch('nearbyBathLat');
  const nearbyBathLng = watch('nearbyBathLng');
  const distanceToBath = watch('distanceToBath');

  const facilities = useMemo((): FacilityData[] => {
    const result: FacilityData[] = [];

    // 車中泊スポット（メイン）
    const mainLat = parseFloat(lat || '0');
    const mainLng = parseFloat(lng || '0');
    const mainName = name || '車中泊スポット';

    if (mainLat && mainLng) {
      result.push({
        type: 'camping',
        lat: mainLat,
        lng: mainLng,
        name: mainName,
        color: '#e74c3c', // 固定色を使用
      });
    }

    // トイレ
    const toiletLat = parseFloat(nearbyToiletLat || '0');
    const toiletLng = parseFloat(nearbyToiletLng || '0');
    const toiletDistance = parseFloat(distanceToToilet || '0');

    if (toiletLat && toiletLng) {
      result.push({
        type: 'toilet',
        lat: toiletLat,
        lng: toiletLng,
        name: 'トイレ',
        color: '#3498db', // 固定色を使用
        distance: toiletDistance || undefined,
      });
    }

    // コンビニ
    const convenienceLat = parseFloat(nearbyConvenienceLat || '0');
    const convenienceLng = parseFloat(nearbyConvenienceLng || '0');
    const convenienceDistance = parseFloat(distanceToConvenience || '0');

    if (convenienceLat && convenienceLng) {
      result.push({
        type: 'convenience',
        lat: convenienceLat,
        lng: convenienceLng,
        name: 'コンビニ',
        color: '#2ecc71', // 固定色を使用
        distance: convenienceDistance || undefined,
      });
    }

    // 入浴施設
    const bathLat = parseFloat(nearbyBathLat || '0');
    const bathLng = parseFloat(nearbyBathLng || '0');
    const bathDistance = parseFloat(distanceToBath || '0');

    if (bathLat && bathLng) {
      result.push({
        type: 'bath',
        lat: bathLat,
        lng: bathLng,
        name: '入浴施設',
        color: '#f39c12', // 固定色を使用
        distance: bathDistance || undefined,
      });
    }

    return result;
  }, [
    lat,
    lng,
    name,
    nearbyToiletLat,
    nearbyToiletLng,
    distanceToToilet,
    nearbyConvenienceLat,
    nearbyConvenienceLng,
    distanceToConvenience,
    nearbyBathLat,
    nearbyBathLng,
    distanceToBath,
  ]);

  // マップの初期化
  useEffect(() => {
    if (!mapContainer.current) {
      console.warn('[FacilitiesMap] mapContainer is not ready');
      return;
    }
    if (mapInstance.current) {
      console.log('[FacilitiesMap] Map already initialized');
      return;
    }
    if (!MAPBOX_TOKEN) {
      console.error('[FacilitiesMap] MAPBOX_TOKEN is not set:', MAPBOX_TOKEN);
      return;
    }

    // Add CSS for marker styles
    if (!document.getElementById('admin-facility-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'admin-facility-marker-styles';
      style.textContent = `
        .admin-facility-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s ease;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-size: 12px;
        }
        .admin-facility-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .admin-custom-popup .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .admin-custom-popup .mapboxgl-popup-tip {
          display: block !important;
        }
        .admin-custom-popup .mapboxgl-popup-close-button {
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
        .admin-custom-popup .mapboxgl-popup-close-button:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }
      `;
      document.head.appendChild(style);
    }

    try {
      const restoreConsoleWarn = suppressImageWarnings();

      mapboxgl.accessToken = MAPBOX_TOKEN;

      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [139.5631214, 35.3325289], // デフォルト位置（相模湾）
        zoom: 12,
      });

      mapInstance.current.on('error', handleMapError);

      mapInstance.current.on('styledata', () => {
        if (!mapInstance.current) return;
        preRegisterKnownIcons(mapInstance.current);
      });

      mapInstance.current.on('styleimagemissing', (e) => {
        if (!mapInstance.current) return;
        handleMissingImage(mapInstance.current, e.id);
      });

      mapInstance.current.on('load', () => {
        if (!mapInstance.current) return;

        restoreConsoleWarn();
        setMapLoaded(true);
        setCurrentZoom(mapInstance.current.getZoom());

        try {
          setupJapaneseLabels(mapInstance.current);
          setupPOIFilters(mapInstance.current);
        } catch (error) {
          console.error('Error setting up map features:', error);
        }
      });

      // Add map movement event listeners to hide/show markers
      mapInstance.current.on('movestart', () => {
        setIsMapMoving(true);
        hideMarkers();
      });

      mapInstance.current.on('zoomstart', () => {
        setIsMapMoving(true);
        hideMarkers();
      });

      mapInstance.current.on('moveend', () => {
        setIsMapMoving(false);
        showMarkers();
      });

      mapInstance.current.on('zoomend', () => {
        setIsMapMoving(false);
        showMarkers();
        if (mapInstance.current) {
          setCurrentZoom(mapInstance.current.getZoom());
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      clearMarkers();
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstance.current = null;
        setMapLoaded(false);
      }
      // Clean up styles when component unmounts
      const styleElement = document.getElementById(
        'admin-facility-marker-styles'
      );
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // マーカーの更新（ズームレベル変更時も含む）
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    // debounce: 50ms後にマーカーを更新（ほぼ即座に更新）
    const timeoutId = setTimeout(() => {
      clearMarkers();

      if (facilities.length > 0) {
        // 各施設のマーカーを追加
        facilities.forEach((facility) => {
          addMarker(facility, currentZoom);
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [facilities, mapLoaded, currentZoom]);

  // 全ての施設が見えるようにマップを調整（施設変更時のみ、ズーム時は除外）
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    // debounce: 50ms後にマップを調整（ほぼ即座に更新）
    const timeoutId = setTimeout(() => {
      if (facilities.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        facilities.forEach((facility) => {
          bounds.extend([facility.lng, facility.lat]);
        });

        if (facilities.length === 1) {
          // 施設が1つの場合は中心に配置
          mapInstance.current!.setCenter([facilities[0].lng, facilities[0].lat]);
          mapInstance.current!.setZoom(15);
        } else {
          // 複数の施設がある場合は全体が見えるように調整
          mapInstance.current!.fitBounds(bounds, {
            padding: 50,
            maxZoom: 16,
          });
        }
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [facilities, mapLoaded]);

  // 施設の存在チェック用のヘルパー関数
  const facilityExists = (type: string) => {
    return facilities.some((f) => f.type === type);
  };

  // Mapboxトークンが設定されていない場合
  if (!MAPBOX_TOKEN) {
    return (
      <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
        <h3 className='text-lg font-medium mb-2'>施設マップ</h3>
        <p className='text-red-500 text-sm'>
          Mapboxトークンが設定されていません
        </p>
      </div>
    );
  }

  return (
    <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 relative'>
      <div className='flex items-center justify-between mb-3 gap-4 flex-wrap'>
        <div className='flex items-center gap-2'>
          <MapPin className='w-5 h-5 text-blue-600 dark:text-blue-400' />
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
            施設マップ
          </h3>
        </div>

        {facilities.length > 0 && (
          <FacilityLegend
            legendItems={legendItems}
            facilityExists={facilityExists}
            getDistance={getDistance}
          />
        )}
      </div>

      <div
        ref={mapContainer}
        className='w-full h-[300px] rounded-md overflow-hidden border border-gray-300 dark:border-gray-600'
      />

      {facilities.length > 0 && (
        <p className='text-xs text-gray-500 mt-2'>
          マーカーをクリックすると詳細が表示されます
        </p>
      )}
    </div>
  );
}
