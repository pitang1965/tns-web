// Helper function to convert FormData to CampingSpot format
export function convertFormDataToCampingSpot(formObject: Record<string, unknown>) {
  const obj = formObject as Record<string, string | boolean | number | undefined>;
  return {
    ...formObject,
    coordinates: [Number(obj.lng), Number(obj.lat)],
    distanceToToilet:
      obj.distanceToToilet && String(obj.distanceToToilet).trim() !== ''
        ? Number(obj.distanceToToilet)
        : undefined,
    distanceToBath:
      obj.distanceToBath && String(obj.distanceToBath).trim() !== ''
        ? Number(obj.distanceToBath)
        : undefined,
    distanceToConvenience:
      obj.distanceToConvenience &&
      String(obj.distanceToConvenience).trim() !== ''
        ? Number(obj.distanceToConvenience)
        : undefined,
    nearbyToiletCoordinates:
      obj.nearbyToiletLat &&
      obj.nearbyToiletLng &&
      String(obj.nearbyToiletLat).trim() !== '' &&
      String(obj.nearbyToiletLng).trim() !== '' &&
      !isNaN(Number(obj.nearbyToiletLat)) &&
      !isNaN(Number(obj.nearbyToiletLng))
        ? [
            Number(obj.nearbyToiletLng),
            Number(obj.nearbyToiletLat),
          ]
        : undefined,
    nearbyConvenienceCoordinates:
      obj.nearbyConvenienceLat &&
      obj.nearbyConvenienceLng &&
      String(obj.nearbyConvenienceLat).trim() !== '' &&
      String(obj.nearbyConvenienceLng).trim() !== '' &&
      !isNaN(Number(obj.nearbyConvenienceLat)) &&
      !isNaN(Number(obj.nearbyConvenienceLng))
        ? [
            Number(obj.nearbyConvenienceLng),
            Number(obj.nearbyConvenienceLat),
          ]
        : undefined,
    nearbyBathCoordinates:
      obj.nearbyBathLat &&
      obj.nearbyBathLng &&
      String(obj.nearbyBathLat).trim() !== '' &&
      String(obj.nearbyBathLng).trim() !== '' &&
      !isNaN(Number(obj.nearbyBathLat)) &&
      !isNaN(Number(obj.nearbyBathLng))
        ? [Number(obj.nearbyBathLng), Number(obj.nearbyBathLat)]
        : undefined,
    elevation:
      obj.elevation && String(obj.elevation).trim() !== ''
        ? Number(obj.elevation)
        : undefined,
    // 新評価システム（客観的データ）
    security: {
      hasGate: obj.securityHasGate === 'true',
      hasLighting: obj.securityHasLighting === 'true',
      hasStaff: obj.securityHasStaff === 'true',
    },
    nightNoise: {
      hasNoiseIssues: obj.nightNoiseHasNoiseIssues === 'true',
      nearBusyRoad: obj.nightNoiseNearBusyRoad === 'true',
      isQuietArea: obj.nightNoiseIsQuietArea === 'true',
    },
    // 旧評価システム（段階的廃止予定）
    quietnessLevel:
      obj.quietnessLevel && String(obj.quietnessLevel).trim() !== ''
        ? Number(obj.quietnessLevel)
        : undefined,
    securityLevel:
      obj.securityLevel && String(obj.securityLevel).trim() !== ''
        ? Number(obj.securityLevel)
        : undefined,
    overallRating:
      obj.overallRating && String(obj.overallRating).trim() !== ''
        ? Number(obj.overallRating)
        : undefined,
    hasRoof: obj.hasRoof === 'true',
    hasPowerOutlet: obj.hasPowerOutlet === 'true',
    pricing: {
      isFree: obj.isFree === 'true',
      pricePerNight: obj.pricePerNight
        ? Number(obj.pricePerNight)
        : undefined,
      priceNote: (obj.priceNote as string | undefined) || undefined,
    },
    capacity:
      obj.capacity && String(obj.capacity).trim() !== ''
        ? Number(obj.capacity)
        : undefined,
    capacityLarge:
      obj.capacityLarge && String(obj.capacityLarge).trim() !== ''
        ? Number(obj.capacityLarge)
        : undefined,
    restrictions: obj.restrictions
      ? String(obj.restrictions)
          .split(',')
          .map((r: string) => r.trim())
          .filter((r: string) => r)
      : [],
    amenities: obj.amenities
      ? String(obj.amenities)
          .split(',')
          .map((a: string) => a.trim())
          .filter((a: string) => a)
      : [],
    notes: (obj.notes as string | undefined) || undefined,
    submittedBy: obj.submittedBy,
    isVerified: false,
  };
}
