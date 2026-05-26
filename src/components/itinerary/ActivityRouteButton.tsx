'use client';

import { Route } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Location = { latitude: number; longitude: number };

export type ActivityForRoute = {
  place: {
    location?: { latitude?: number | null; longitude?: number | null } | null;
    address?: string | null;
  };
};

export function hasValidLocation(activity: ActivityForRoute): boolean {
  const loc = activity.place.location;
  if (!loc) return false;
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
}

export function openActivityRoute(
  activity: ActivityForRoute,
  remainingActivities: ActivityForRoute[],
  currentLocation?: Location,
) {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const formatActivity = (a: ActivityForRoute) => {
    const loc = a.place.location!;
    return a.place.address
      ? encodeURIComponent(a.place.address)
      : `${Number(loc.latitude)},${Number(loc.longitude)}`;
  };

  const waypoints = currentLocation
    ? [
        `${currentLocation.latitude},${currentLocation.longitude}`,
        formatActivity(activity),
        ...remainingActivities.map(formatActivity),
      ]
    : [formatActivity(activity), ...remainingActivities.map(formatActivity)];

  const url = `https://www.google.com/maps/dir/${waypoints.join('/')}?travelmode=driving`;

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}

type ActivityRouteButtonProps = {
  activity: ActivityForRoute;
  remainingActivities: ActivityForRoute[];
  currentLocation?: Location;
  className?: string;
};

export function ActivityRouteButton({
  activity,
  remainingActivities,
  currentLocation,
  className = '',
}: ActivityRouteButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        openActivityRoute(activity, remainingActivities, currentLocation)
      }
      className={`flex items-center gap-2 cursor-pointer ${className}`}
    >
      <Route className="w-4 h-4" />
      <span>ここから最後までのルート検索</span>
    </Button>
  );
}
