import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

// Helper function to check admin authorization
export async function checkAdminAuth() {
  const session = await auth0.getSession();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];
  if (!adminEmails.includes(session.user.email)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return session.user;
}

// Helper function to convert FormData to CampingSpot format
export function convertFormDataToCampingSpot(formObject: Record<string, any>) {
  return {
    ...formObject,
    coordinates: [Number(formObject.lng), Number(formObject.lat)],
    distanceToToilet:
      formObject.distanceToToilet && formObject.distanceToToilet.trim() !== ''
        ? Number(formObject.distanceToToilet)
        : undefined,
    distanceToBath:
      formObject.distanceToBath && formObject.distanceToBath.trim() !== ''
        ? Number(formObject.distanceToBath)
        : undefined,
    distanceToConvenience:
      formObject.distanceToConvenience &&
      formObject.distanceToConvenience.trim() !== ''
        ? Number(formObject.distanceToConvenience)
        : undefined,
    nearbyToiletCoordinates:
      formObject.nearbyToiletLat &&
      formObject.nearbyToiletLng &&
      formObject.nearbyToiletLat.trim() !== '' &&
      formObject.nearbyToiletLng.trim() !== '' &&
      !isNaN(Number(formObject.nearbyToiletLat)) &&
      !isNaN(Number(formObject.nearbyToiletLng))
        ? [
            Number(formObject.nearbyToiletLng),
            Number(formObject.nearbyToiletLat),
          ]
        : undefined,
    nearbyConvenienceCoordinates:
      formObject.nearbyConvenienceLat &&
      formObject.nearbyConvenienceLng &&
      formObject.nearbyConvenienceLat.trim() !== '' &&
      formObject.nearbyConvenienceLng.trim() !== '' &&
      !isNaN(Number(formObject.nearbyConvenienceLat)) &&
      !isNaN(Number(formObject.nearbyConvenienceLng))
        ? [
            Number(formObject.nearbyConvenienceLng),
            Number(formObject.nearbyConvenienceLat),
          ]
        : undefined,
    nearbyBathCoordinates:
      formObject.nearbyBathLat &&
      formObject.nearbyBathLng &&
      formObject.nearbyBathLat.trim() !== '' &&
      formObject.nearbyBathLng.trim() !== '' &&
      !isNaN(Number(formObject.nearbyBathLat)) &&
      !isNaN(Number(formObject.nearbyBathLng))
        ? [Number(formObject.nearbyBathLng), Number(formObject.nearbyBathLat)]
        : undefined,
    elevation:
      formObject.elevation && formObject.elevation.trim() !== ''
        ? Number(formObject.elevation)
        : undefined,
    // 新評価システム（客観的データ）
    security: {
      hasGate: formObject.securityHasGate === 'true',
      hasLighting: formObject.securityHasLighting === 'true',
      hasStaff: formObject.securityHasStaff === 'true',
    },
    nightNoise: {
      hasNoiseIssues: formObject.nightNoiseHasNoiseIssues === 'true',
      nearBusyRoad: formObject.nightNoiseNearBusyRoad === 'true',
      isQuietArea: formObject.nightNoiseIsQuietArea === 'true',
    },
    // 旧評価システム（段階的廃止予定）
    quietnessLevel:
      formObject.quietnessLevel && formObject.quietnessLevel.trim() !== ''
        ? Number(formObject.quietnessLevel)
        : undefined,
    securityLevel:
      formObject.securityLevel && formObject.securityLevel.trim() !== ''
        ? Number(formObject.securityLevel)
        : undefined,
    overallRating:
      formObject.overallRating && formObject.overallRating.trim() !== ''
        ? Number(formObject.overallRating)
        : undefined,
    hasRoof: formObject.hasRoof === 'true',
    hasPowerOutlet: formObject.hasPowerOutlet === 'true',
    pricing: {
      isFree: formObject.isFree === 'true',
      pricePerNight: formObject.pricePerNight
        ? Number(formObject.pricePerNight)
        : undefined,
      priceNote: formObject.priceNote || undefined,
    },
    capacity:
      formObject.capacity && formObject.capacity.trim() !== ''
        ? Number(formObject.capacity)
        : undefined,
    capacityLarge:
      formObject.capacityLarge && formObject.capacityLarge.trim() !== ''
        ? Number(formObject.capacityLarge)
        : undefined,
    restrictions: formObject.restrictions
      ? formObject.restrictions
          .split(',')
          .map((r: string) => r.trim())
          .filter((r: string) => r)
      : [],
    amenities: formObject.amenities
      ? formObject.amenities
          .split(',')
          .map((a: string) => a.trim())
          .filter((a: string) => a)
      : [],
    notes: formObject.notes || undefined,
    submittedBy: formObject.submittedBy,
    isVerified: false,
  };
}
