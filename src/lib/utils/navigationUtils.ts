import {
  ServerItineraryDocument,
  ClientItineraryDocument,
} from '@/data/schemas/itinerarySchema';

type ServerActivity =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ClientActivity =
  ClientItineraryDocument['dayPlans'][number]['activities'][number];
type Activity = ServerActivity | ClientActivity;

export const isValidCoordinate = (
  latitude?: number,
  longitude?: number,
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
    navigator.userAgent,
  );
};

/**
 * Google Maps URLs の公式形式（api=1）で経路URLを作る。
 * points はエンコード済みの地点（"lat,lng" か encodeURIComponent 済み住所）を順に並べたもの。
 * 地点が1つなら origin を省き、Google 側で現在地を出発地とする。
 */
export const buildDirectionsUrl = (points: string[]): string => {
  const destination = points[points.length - 1];
  const via = points.slice(1, -1);
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  if (points.length > 1) url += `&origin=${points[0]}`;
  if (via.length > 0) url += `&waypoints=${via.join('%7C')}`;
  return url;
};

export const formatAddress = (
  address: Activity['place']['address'],
): string | null => {
  // addressは既に文字列なのでそのまま返す
  return address || null;
};

export const filterValidActivities = (activities: Activity[]): Activity[] => {
  return activities.filter(
    (activity) =>
      activity.place.location &&
      isValidCoordinate(
        activity.place.location.latitude,
        activity.place.location.longitude,
      ),
  );
};
