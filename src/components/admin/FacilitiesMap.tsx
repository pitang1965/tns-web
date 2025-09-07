'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  suppressImageWarnings,
  handleMapError,
  preRegisterKnownIcons,
  handleMissingImage,
  setupJapaneseLabels,
  setupPOIFilters,
} from '@/lib/mapboxIcons';
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
}

export function FacilitiesMap({ watch }: FacilitiesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getFacilityColor = (type: string) => {
    switch (type) {
      case 'camping':
        return '#e74c3c'; // 赤 - 車中泊スポット
      case 'toilet':
        return '#3498db'; // 青 - トイレ
      case 'convenience':
        return '#2ecc71'; // 緑 - コンビニ
      case 'bath':
        return '#f39c12'; // オレンジ - 入浴施設
      default:
        return '#95a5a6'; // グレー - デフォルト
    }
  };

  const clearMarkers = () => {
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

    // マーカー要素を作成
    const markerElement = document.createElement('div');
    markerElement.style.width = '20px';
    markerElement.style.height = '20px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = facility.color;
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    markerElement.style.cursor = 'pointer';
    markerElement.title = `${facility.name} (${facility.type})`;

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([facility.lng, facility.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <strong>${facility.name}</strong><br>
            <span class="text-sm text-gray-600">${getTypeLabel(
              facility.type
            )}</span>
          </div>`
        )
      )
      .addTo(mapInstance.current);

    markersRef.current.push(marker);
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
        color: getFacilityColor('camping'),
      });
    }

    // トイレ
    const toiletLat = parseFloat(watch('nearbyToiletLat') || '0');
    const toiletLng = parseFloat(watch('nearbyToiletLng') || '0');

    if (toiletLat && toiletLng) {
      facilities.push({
        type: 'toilet',
        lat: toiletLat,
        lng: toiletLng,
        name: 'トイレ',
        color: getFacilityColor('toilet'),
      });
    }

    // コンビニ
    const convenienceLat = parseFloat(watch('nearbyConvenienceLat') || '0');
    const convenienceLng = parseFloat(watch('nearbyConvenienceLng') || '0');

    if (convenienceLat && convenienceLng) {
      facilities.push({
        type: 'convenience',
        lat: convenienceLat,
        lng: convenienceLng,
        name: 'コンビニ',
        color: getFacilityColor('convenience'),
      });
    }

    // 入浴施設
    const bathLat = parseFloat(watch('nearbyBathLat') || '0');
    const bathLng = parseFloat(watch('nearbyBathLng') || '0');

    if (bathLat && bathLng) {
      facilities.push({
        type: 'bath',
        lat: bathLat,
        lng: bathLng,
        name: '入浴施設',
        color: getFacilityColor('bath'),
      });
    }

    return facilities;
  };

  // マップの初期化
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

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
    watch('nearbyConvenienceLat'),
    watch('nearbyConvenienceLng'),
    watch('nearbyBathLat'),
    watch('nearbyBathLng'),
    mapLoaded,
  ]);

  const facilities = getFacilitiesWithCoordinates();

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
    <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3'>
        <h3 className='text-lg font-medium'>施設マップ</h3>
        <div className='flex flex-wrap gap-2 mt-2 sm:mt-0'>
          <div className='flex items-center gap-1 text-sm'>
            <div className='w-3 h-3 rounded-full bg-red-500 border border-white'></div>
            車中泊スポット
          </div>
          <div className='flex items-center gap-1 text-sm'>
            <div className='w-3 h-3 rounded-full bg-blue-500 border border-white'></div>
            トイレ
          </div>
          <div className='flex items-center gap-1 text-sm'>
            <div className='w-3 h-3 rounded-full bg-green-500 border border-white'></div>
            コンビニ
          </div>
          <div className='flex items-center gap-1 text-sm'>
            <div className='w-3 h-3 rounded-full bg-orange-500 border border-white'></div>
            入浴施設
          </div>
        </div>
      </div>
      <div
        ref={mapContainer}
        className='w-full h-[300px] rounded-md overflow-hidden border border-gray-300 dark:border-gray-600'
      />
      <p className='text-xs text-gray-500 mt-2'>
        マーカーをクリックすると詳細が表示されます
      </p>
    </div>
  );
}
