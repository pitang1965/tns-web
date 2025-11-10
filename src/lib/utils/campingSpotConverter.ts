import { PlaceType } from '@/constants/placeTypes';

/**
 * CampingSpot type from server action (with distance)
 */
export type CampingSpotWithDistance = {
  _id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  prefecture: string;
  address?: string;
  url?: string;
  type: string;
  distanceToToilet?: number;
  distanceToBath?: number;
  distanceToConvenience?: number;
  hasRoof: boolean;
  hasPowerOutlet: boolean;
  pricing: {
    isFree: boolean;
    pricePerNight?: number;
    priceNote?: string;
  };
  security?: {
    hasGate: boolean;
    hasLighting: boolean;
    hasStaff: boolean;
  };
  nightNoise?: {
    hasNoiseIssues: boolean;
    nearBusyRoad: boolean;
    isQuietArea: boolean;
  };
  capacity?: number;
  capacityLarge?: number;
  restrictions?: string[];
  amenities?: string[];
  notes?: string;
  distance: number; // in meters
};

/**
 * Maps camping spot type to PlaceType
 */
export function mapCampingSpotTypeToPlaceType(
  campingType: string
): PlaceType {
  const mapping: Record<string, PlaceType> = {
    roadside_station: 'PARKING_FREE_MICHINOEKI',
    sa_pa: 'PARKING_FREE_SERVICE_AREA',
    rv_park: 'PARKING_PAID_RV_PARK',
    auto_campground: 'PARKING_PAID_OTHER',
    onsen_facility: 'BATHING_FACILITY',
    convenience_store: 'CONVENIENCE_SUPERMARKET',
    parking_lot: 'PARKING_FREE_OTHER',
    other: 'OTHER',
  };

  return mapping[campingType] || 'OTHER';
}

/**
 * Builds a description string from camping spot information
 */
export function buildCampingSpotDescription(
  spot: CampingSpotWithDistance
): string {
  const parts: string[] = [];

  // Pricing information
  if (spot.pricing.isFree) {
    parts.push('無料');
  } else if (spot.pricing.pricePerNight !== undefined) {
    parts.push(`¥${spot.pricing.pricePerNight.toLocaleString()}/泊`);
  }

  // Distance to toilet
  if (spot.distanceToToilet !== undefined) {
    if (spot.distanceToToilet < 1000) {
      parts.push(`トイレまで${spot.distanceToToilet}m`);
    } else {
      parts.push(`トイレまで${(spot.distanceToToilet / 1000).toFixed(1)}km`);
    }
  }

  // Distance to bath
  if (spot.distanceToBath !== undefined) {
    if (spot.distanceToBath < 1000) {
      parts.push(`入浴施設まで${spot.distanceToBath}m`);
    } else {
      parts.push(`入浴施設まで${(spot.distanceToBath / 1000).toFixed(1)}km`);
    }
  }

  // Amenities
  if (spot.hasRoof) {
    parts.push('屋根あり');
  }
  if (spot.hasPowerOutlet) {
    parts.push('電源あり');
  }

  // Security features
  if (spot.security) {
    const securityFeatures: string[] = [];
    if (spot.security.hasGate) securityFeatures.push('ゲート');
    if (spot.security.hasLighting) securityFeatures.push('照明');
    if (spot.security.hasStaff) securityFeatures.push('管理人');

    if (securityFeatures.length > 0) {
      parts.push(`セキュリティ: ${securityFeatures.join('・')}`);
    }
  }

  // Night noise information
  if (spot.nightNoise) {
    if (spot.nightNoise.isQuietArea) {
      parts.push('静かなエリア');
    } else if (spot.nightNoise.nearBusyRoad) {
      parts.push('交通量多め');
    }
  }

  // Capacity
  if (spot.capacity !== undefined) {
    parts.push(`収容台数: ${spot.capacity}台`);
  }

  // Additional amenities
  if (spot.amenities && spot.amenities.length > 0) {
    parts.push(`設備: ${spot.amenities.join('、')}`);
  }

  // Restrictions
  if (spot.restrictions && spot.restrictions.length > 0) {
    parts.push(`制限事項: ${spot.restrictions.join('、')}`);
  }

  // Notes
  if (spot.notes) {
    parts.push(spot.notes);
  }

  // Pricing notes
  if (spot.pricing.priceNote) {
    parts.push(spot.pricing.priceNote);
  }

  return parts.join(' | ');
}

/**
 * Converts a camping spot to an Activity object
 */
export function campingSpotToActivity(spot: CampingSpotWithDistance) {
  return {
    id: crypto.randomUUID(),
    title: `車中泊：${spot.name}`,
    place: {
      name: spot.name,
      type: mapCampingSpotTypeToPlaceType(spot.type),
      address: spot.address || null,
      location: {
        latitude: spot.coordinates[1], // lat
        longitude: spot.coordinates[0], // lng
      },
    },
    description: buildCampingSpotDescription(spot),
    startTime: null,
    endTime: null,
    cost: spot.pricing.isFree
      ? 0
      : spot.pricing.pricePerNight !== undefined
        ? spot.pricing.pricePerNight
        : null,
    url: spot.url || null,
  };
}
