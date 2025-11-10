'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupJapaneseLabels, handleMapError } from '@/lib/mapboxIcons';
import { LoadingState } from '@/components/common/LoadingState';
import 'mapbox-gl/dist/mapbox-gl.css';

type SimpleLocationPickerProps = {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function SimpleLocationPicker({
  onLocationSelect,
  initialLat = 35.6762,
  initialLng = 139.6503,
}: SimpleLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({
    lat: initialLat,
    lng: initialLng,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not set');
      return;
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 13,
      locale: {
        'AttributionControl.ToggleAttribution': '帰属情報の表示切替',
        'NavigationControl.ResetBearing': '方角をリセット',
        'NavigationControl.ZoomIn': 'ズームイン',
        'NavigationControl.ZoomOut': 'ズームアウト',
      },
    });

    // Set crosshair cursor for the map canvas
    map.current.getCanvas().style.cursor = 'crosshair';

    // Add error handling
    map.current.on('error', handleMapError);

    // Setup Japanese labels when style loads
    map.current.on('style.load', () => {
      if (map.current) {
        setupJapaneseLabels(map.current);
      }
    });

    // Add initial marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        setPosition({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationSelect(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setPosition({ lat, lng });
      onLocationSelect(lat, lng);

      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      }
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mounted, initialLat, initialLng, onLocationSelect]);

  if (!mounted) {
    return <LoadingState variant='card' message='地図を読み込み中...' />;
  }

  return (
    <div className='h-[400px] w-full'>
      <div
        ref={mapContainer}
        className='w-full h-full rounded-lg cursor-crosshair'
      />
      <div className='mt-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded'>
        地図をクリック、またはマーカーをドラッグして位置を選択してください。
        <br />
        現在の座標: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
    </div>
  );
}
