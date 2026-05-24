'use client';

import { useState, useMemo } from 'react';
import { ActivityLocation } from '@/components/common/Maps/DailyRouteMap';
import {
  useCurrentLocation,
  calculateDistance,
} from '@/hooks/useCurrentLocation';

export const HOME_PROXIMITY_THRESHOLD = 50;

type UseLocationRoutingResult = {
  includeCurrentLocation: boolean;
  setIncludeCurrentLocation: (value: boolean) => void;
  showLocationAlert: boolean;
  setShowLocationAlert: (value: boolean) => void;
  shouldShowLocationCheckbox: boolean;
  shouldShowLocationPermissionButton: boolean;
  mapActivities: ActivityLocation[];
  currentLocation: { latitude: number; longitude: number } | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  clearError: () => void;
};

export function useLocationRouting(
  activitiesWithLocation: ActivityLocation[],
): UseLocationRoutingResult {
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [includeCurrentLocation, setIncludeCurrentLocation] = useState(false);
  const {
    currentLocation,
    permissionGranted,
    loading,
    error,
    requestLocation,
    clearError,
  } = useCurrentLocation();

  const shouldShowLocationCheckbox =
    permissionGranted &&
    !!currentLocation &&
    activitiesWithLocation.length >= 1;

  const shouldShowLocationPermissionButton =
    !permissionGranted && activitiesWithLocation.length >= 1;

  const routeActivitiesWithCurrentLocation: ActivityLocation[] = useMemo(() => {
    if (!currentLocation || activitiesWithLocation.length === 0) {
      return activitiesWithLocation;
    }

    let routeActivities = [...activitiesWithLocation];

    if (routeActivities.length > 0) {
      const firstActivity = routeActivities[0];
      if (firstActivity.type === 'HOME') {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          firstActivity.latitude,
          firstActivity.longitude,
        );
        if (distance <= HOME_PROXIMITY_THRESHOLD) {
          routeActivities = routeActivities.slice(1);
        }
      }
    }

    return [
      {
        id: 'current-location',
        order: 0,
        title: '現在地',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        isCurrentLocation: true,
      },
      ...routeActivities,
    ];
  }, [currentLocation, activitiesWithLocation]);

  const mapActivities =
    includeCurrentLocation && currentLocation
      ? routeActivitiesWithCurrentLocation
      : activitiesWithLocation;

  return {
    includeCurrentLocation,
    setIncludeCurrentLocation,
    showLocationAlert,
    setShowLocationAlert,
    shouldShowLocationCheckbox,
    shouldShowLocationPermissionButton,
    mapActivities,
    currentLocation,
    loading,
    error,
    requestLocation,
    clearError,
  };
}
