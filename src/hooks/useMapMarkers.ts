import { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { ActivityLocation } from '@/components/common/Maps/DailyRouteMap';

type UseMapMarkersProps = {
  mapInstance: mapboxgl.Map | null;
  mapLoaded: boolean;
  activities: ActivityLocation[];
  updateMapBounds: () => void;
};

export function useMapMarkers({
  mapInstance,
  mapLoaded,
  activities,
  updateMapBounds,
}: UseMapMarkersProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // マーカーをクリアする関数
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    markersRef.current = [];
  }, []);

  // カスタムマーカー要素を作成する関数
  const createMarkerElement = useCallback((activity: ActivityLocation) => {
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.width = '36px';
    markerElement.style.height = '36px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = '#3b82f6';
    markerElement.style.color = 'white';
    markerElement.style.fontWeight = 'bold';
    markerElement.style.display = 'flex';
    markerElement.style.justifyContent = 'center';
    markerElement.style.alignItems = 'center';
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    markerElement.innerText = activity.order.toString();

    return markerElement;
  }, []);

  // ポップアップを作成する関数
  const createPopup = useCallback(() => {
    return new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
    });
  }, []);

  // マーカーにホバーイベントを追加する関数
  const addMarkerEvents = useCallback(
    (
      markerElement: HTMLElement,
      marker: mapboxgl.Marker,
      activity: ActivityLocation,
      popup: mapboxgl.Popup
    ) => {
      markerElement.addEventListener('mouseenter', () => {
        marker.getElement().style.zIndex = '10';
        popup
          .setLngLat([activity.longitude, activity.latitude])
          .setHTML(
            `<div style="font-weight: bold; color: black; padding: 5px;">${activity.order}. ${activity.title}</div>`
          )
          .addTo(mapInstance!);
      });

      markerElement.addEventListener('mouseleave', () => {
        marker.getElement().style.zIndex = '1';
        popup.remove();
      });
    },
    [mapInstance]
  );

  // マーカーの更新と位置調整
  useEffect(() => {
    if (!mapInstance || !mapLoaded) return;

    try {
      // 以前のマーカーをすべて削除
      clearMarkers();

      // 各アクティビティにマーカーを追加
      activities.forEach((activity) => {
        if (!mapInstance) return;

        // カスタムマーカー要素を作成
        const markerElement = createMarkerElement(activity);

        // ポップアップを作成
        const popup = createPopup();

        // マーカーを作成し、マップに追加
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([activity.longitude, activity.latitude])
          .addTo(mapInstance);

        // ホバーイベントを追加
        addMarkerEvents(markerElement, marker, activity, popup);

        // マーカーの配列に追加
        markersRef.current.push(marker);
      });

      // マップの表示範囲を調整
      updateMapBounds();
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [
    mapInstance,
    mapLoaded,
    activities,
    clearMarkers,
    createMarkerElement,
    createPopup,
    addMarkerEvents,
    updateMapBounds,
  ]);

  // クリーンアップ時にマーカーを削除
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    markersRef: markersRef.current,
    clearMarkers,
  };
}
