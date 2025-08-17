import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';

type Activity =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];

export const isValidCoordinate = (
  latitude?: number,
  longitude?: number
): boolean => {
  return (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const formatAddress = (
  address: Activity['place']['address']
): string | null => {
  if (!address) return null;

  const parts = [
    address.prefecture,
    address.city,
    address.town,
    address.block,
    address.building,
  ].filter((part) => part && part.trim() !== '');

  return parts.join('');
};

export const filterValidActivities = (activities: Activity[]): Activity[] => {
  return activities.filter(
    (activity) =>
      activity.place.location &&
      isValidCoordinate(
        activity.place.location.latitude,
        activity.place.location.longitude
      )
  );
};
