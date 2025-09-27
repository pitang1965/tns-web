'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { formatDistance } from '@/lib/formatDistance';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
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
import { UseFormWatch } from 'react-hook-form';
import { ShachuHakuFormData } from './validationSchemas';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface FacilitiesMapProps {
  watch: UseFormWatch<ShachuHakuFormData>;
}

interface FacilityData {
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
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // マーカーの凡例データ
  const legendItems = [
    { type: 'camping', label: '車中泊スポット', icon: '🏕️', color: '#e74c3c' },
    { type: 'toilet', label: 'トイレ', icon: '🚻', color: '#3498db' },
    { type: 'convenience', label: 'コンビニ', icon: '🏪', color: '#2ecc71' },
    { type: 'bath', label: '入浴施設', icon: '♨️', color: '#f39c12' },
  ];

  // 現在開いているポップアップを閉じる
  const closeCurrentPopup = () => {
    if (currentPopupRef.current) {
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
    }
  };

  // Hide/show markers during map movement
  const hideMarkers = () => {
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.opacity = '0';
    });
  };

  const showMarkers = () => {
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.opacity = '1';
    });
  };

  const getMarkerStyle = (type: string) => {
    switch (type) {
      case 'camping':
        return {
          color: '#e74c3c',
          icon: '🏕️',
          size: 24, // 小さめサイズ
        };
      case 'toilet':
        return {
          color: '#3498db',
          icon: '🚻',
          size: 20, // 小さめサイズ
        };
      case 'convenience':
        return {
          color: '#2ecc71',
          icon: '🏪',
          size: 20, // 小さめサイズ
        };
      case 'bath':
        return {
          color: '#f39c12',
          icon: '♨️',
          size: 20, // 小さめサイズ
        };
      default:
        return {
          color: '#95a5a6',
          icon: '📍',
          size: 20,
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

  const addMarker = (facility: FacilityData) => {
    if (!mapInstance.current) return;

    const style = getMarkerStyle(facility.type);

    // マーカー要素を作成
    const markerElement = document.createElement('div');
    markerElement.className = 'admin-facility-marker';
    markerElement.style.cssText = `
      width: ${style.size}px;
      height: ${style.size}px;
      background-color: ${style.color};
      opacity: 1;
      transition: opacity 0.15s ease-in-out;
    `;
    markerElement.textContent = style.icon;
    markerElement.title = getTypeLabel(facility.type);

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'admin-custom-popup',
    }).setHTML(createFacilityPopupHTML(facility));

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

  const createFacilityPopupHTML = (facility: FacilityData): string => {
    const style = getMarkerStyle(facility.type);

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
  const getFacilitiesWithCoordinates = (): FacilityData[] => {
    const facilities: FacilityData[] = [];

    // 車中泊スポット（メイン）
    const mainLat = parseFloat(watch('lat') || '0');
    const mainLng = parseFloat(watch('lng') || '0');
    const mainName = watch('name') || '車中泊スポット';

    if (mainLat && mainLng) {
      facilities.push({
        type: 'camping',
        lat: mainLat,
        lng: mainLng,
        name: mainName,
        color: getMarkerStyle('camping').color,
      });
    }

    // トイレ
    const toiletLat = parseFloat(watch('nearbyToiletLat') || '0');
    const toiletLng = parseFloat(watch('nearbyToiletLng') || '0');
    const toiletDistance = parseFloat(watch('distanceToToilet') || '0');

    if (toiletLat && toiletLng) {
      facilities.push({
        type: 'toilet',
        lat: toiletLat,
        lng: toiletLng,
        name: 'トイレ',
        color: getMarkerStyle('toilet').color,
        distance: toiletDistance || undefined,
      });
    }

    // コンビニ
    const convenienceLat = parseFloat(watch('nearbyConvenienceLat') || '0');
    const convenienceLng = parseFloat(watch('nearbyConvenienceLng') || '0');
    const convenienceDistance = parseFloat(
      watch('distanceToConvenience') || '0'
    );

    if (convenienceLat && convenienceLng) {
      facilities.push({
        type: 'convenience',
        lat: convenienceLat,
        lng: convenienceLng,
        name: 'コンビニ',
        color: getMarkerStyle('convenience').color,
        distance: convenienceDistance || undefined,
      });
    }

    // 入浴施設
    const bathLat = parseFloat(watch('nearbyBathLat') || '0');
    const bathLng = parseFloat(watch('nearbyBathLng') || '0');
    const bathDistance = parseFloat(watch('distanceToBath') || '0');

    if (bathLat && bathLng) {
      facilities.push({
        type: 'bath',
        lat: bathLat,
        lng: bathLng,
        name: '入浴施設',
        color: getMarkerStyle('bath').color,
        distance: bathDistance || undefined,
      });
    }

    return facilities;
  };

  // マップの初期化
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

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

  // マーカーの更新
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    clearMarkers();
    const facilities = getFacilitiesWithCoordinates();

    if (facilities.length > 0) {
      // 各施設のマーカーを追加
      facilities.forEach((facility) => {
        addMarker(facility);
      });

      // 全ての施設が見えるようにマップを調整
      const bounds = new mapboxgl.LngLatBounds();
      facilities.forEach((facility) => {
        bounds.extend([facility.lng, facility.lat]);
      });

      if (facilities.length === 1) {
        // 施設が1つの場合は中心に配置
        mapInstance.current.setCenter([facilities[0].lng, facilities[0].lat]);
        mapInstance.current.setZoom(15);
      } else {
        // 複数の施設がある場合は全体が見えるように調整
        mapInstance.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 16,
        });
      }
    }
  }, [
    watch('lat'),
    watch('lng'),
    watch('name'),
    watch('nearbyToiletLat'),
    watch('nearbyToiletLng'),
    watch('distanceToToilet'),
    watch('nearbyConvenienceLat'),
    watch('nearbyConvenienceLng'),
    watch('distanceToConvenience'),
    watch('nearbyBathLat'),
    watch('nearbyBathLng'),
    watch('distanceToBath'),
    mapLoaded,
  ]);

  const facilities = getFacilitiesWithCoordinates();

  // 施設の存在チェック用のヘルパー関数
  const facilityExists = (type: string) => {
    return facilities.some((f) => f.type === type);
  };

  if (facilities.length === 0) {
    return (
      <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
        <h3 className='text-lg font-medium mb-2'>施設マップ</h3>
        <p className='text-gray-500 text-sm'>
          座標情報が設定されている施設がありません
        </p>
      </div>
    );
  }

  return (
    <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 relative'>
      <div className='flex items-center gap-2 mb-3'>
        <MapPin className='w-5 h-5 text-blue-600 dark:text-blue-400' />
        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          施設マップ
        </h3>
      </div>

      <div
        ref={mapContainer}
        className='w-full h-[300px] rounded-md overflow-hidden border border-gray-300 dark:border-gray-600'
      />

      {/* 凡例 */}
      <div className='absolute top-16 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-600 z-40'>
        <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
          <CollapsibleTrigger className='flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors'>
            <h4 className='font-semibold text-gray-900 dark:text-gray-100'>
              凡例
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
                const exists = facilityExists(item.type);

                // 距離データを取得（座標の有無に関わらず）
                let distance: number | undefined;
                if (item.type === 'toilet') {
                  distance =
                    parseFloat(watch('distanceToToilet') || '0') || undefined;
                } else if (item.type === 'convenience') {
                  distance =
                    parseFloat(watch('distanceToConvenience') || '0') ||
                    undefined;
                } else if (item.type === 'bath') {
                  distance =
                    parseFloat(watch('distanceToBath') || '0') || undefined;
                }

                return (
                  <div
                    key={item.type}
                    className={`flex items-center gap-2 text-sm ${
                      exists
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    <div
                      className='w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs'
                      style={{
                        backgroundColor: exists ? item.color : '#e5e7eb',
                      }}
                    >
                      <span style={{ fontSize: '10px' }}>{item.icon}</span>
                    </div>
                    <span>{item.label}</span>
                    {item.type !== 'camping' && distance && (
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        ({formatDistance(distance)})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <p className='text-xs text-gray-500 mt-2'>
        マーカーをクリックすると詳細が表示されます
      </p>
    </div>
  );
}
