import { ServerItineraryDocument, ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import {
  isValidCoordinate,
  isMobileDevice,
  formatAddress,
  filterValidActivities,
} from '@/lib/utils/navigationUtils';

type ServerActivity =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ClientActivity =
  ClientItineraryDocument['dayPlans'][number]['activities'][number];
type Activity = ServerActivity | ClientActivity;

interface UseNavigationProps {
  latitude?: number;
  longitude?: number;
  activities?: Activity[];
  currentActivityIndex?: number;
}

export const useNavigation = ({
  latitude,
  longitude,
  activities = [],
  currentActivityIndex = -1,
}: UseNavigationProps) => {
  const openCurrentLocationRoute = () => {
    if (!isValidCoordinate(latitude, longitude)) return;

    if (isMobileDevice()) {
      let mapUrl;

      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        mapUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

        if (!navigator.userAgent.match('CriOS')) {
          window.location.href = mapUrl;
          setTimeout(() => {
            window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
          }, 2000);
          return;
        }
      } else if (/Android/i.test(navigator.userAgent)) {
        mapUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
      } else {
        mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      }

      window.location.href = mapUrl;
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const openCurrentToFinalRoute = () => {
    if (!activities.length || currentActivityIndex < 0) return;

    const remainingActivities = filterValidActivities(
      activities.slice(currentActivityIndex)
    );

    if (remainingActivities.length < 2) return;

    const waypoints = remainingActivities.map((activity) => {
      const { latitude, longitude } = activity.place.location!;
      const addressString = formatAddress(activity.place.address);

      if (addressString) {
        return encodeURIComponent(addressString);
      }
      return `${latitude},${longitude}`;
    });

    const destination = waypoints[waypoints.length - 1];
    const waypointsParam = waypoints.slice(0, -1).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    if (waypointsParam) {
      url += `&waypoints=${waypointsParam}`;
    }

    if (isMobileDevice()) {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const mobileUrl = `https://www.google.com/maps/dir/Current+Location/${waypoints.join(
          '/'
        )}?travelmode=driving`;
        window.location.href = mobileUrl;
      } else {
        window.location.href = url;
      }
    } else {
      window.open(url, '_blank');
    }
  };

  const showOnMap = () => {
    if (!isValidCoordinate(latitude, longitude)) return;
    const url = `https://www.google.com/maps/place/${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const canShowMultiWaypointRoute = () => {
    if (!activities.length || currentActivityIndex < 0) return false;

    const remainingActivities = filterValidActivities(
      activities.slice(currentActivityIndex)
    );

    return remainingActivities.length >= 2;
  };

  return {
    openCurrentLocationRoute,
    openCurrentToFinalRoute,
    showOnMap,
    canShowMultiWaypointRoute,
    isValidCoordinate: () => isValidCoordinate(latitude, longitude),
  };
};
