'use server';

import CampingSpot from '@/lib/models/CampingSpot';
import { CampingSpotFilter } from '@/data/schemas/campingSpot';
import { calculateDistance } from '@/lib/utils/distance';
import { ensureDbConnection } from '@/lib/database';
import { parseSearchTermToFuzzyPatterns } from '@/lib/utils/searchNormalize';

// Public function for general users (no authentication required)
export async function getPublicCampingSpots(filter?: CampingSpotFilter) {
  await ensureDbConnection();

  const query: Record<string, unknown> = {};

  if (filter) {
    if (filter.prefecture) {
      query.prefecture = filter.prefecture;
    }

    if (filter.type && filter.type.length > 0) {
      query.type = { $in: filter.type };
    }

    if (filter.maxDistanceToToilet !== undefined) {
      query.distanceToToilet = { $lte: filter.maxDistanceToToilet };
    }

    if (filter.maxDistanceToBath !== undefined) {
      query.distanceToBath = { $lte: filter.maxDistanceToBath };
    }

    if (filter.minQuietnessLevel !== undefined) {
      query.quietnessLevel = { $gte: filter.minQuietnessLevel };
    }

    if (filter.minSecurityLevel !== undefined) {
      query.securityLevel = { $gte: filter.minSecurityLevel };
    }

    if (filter.hasRoof !== undefined) {
      query.hasRoof = filter.hasRoof;
    }

    if (filter.hasPowerOutlet !== undefined) {
      query.hasPowerOutlet = filter.hasPowerOutlet;
    }

    if (filter.isGatedPaid !== undefined) {
      query.isGatedPaid = filter.isGatedPaid;
    }

    if (filter.isFreeOnly) {
      query['pricing.isFree'] = true;
    }

    if (filter.maxPricePerNight !== undefined) {
      query.$or = [
        { 'pricing.isFree': true },
        { 'pricing.pricePerNight': { $lte: filter.maxPricePerNight } },
      ];
    }

    if (filter.bounds) {
      query.coordinates = {
        $geoWithin: {
          $box: [
            [filter.bounds.west, filter.bounds.south],
            [filter.bounds.east, filter.bounds.north],
          ],
        },
      };
    }
  }

  const spots = await CampingSpot.find(query).sort({ createdAt: -1 }).lean();

  return JSON.parse(JSON.stringify(spots));
}

// Public function for map view with bounds-based filtering
export async function getPublicCampingSpotsByBounds(
  bounds: { north: number; south: number; east: number; west: number },
  options?: {
    searchTerm?: string;
    prefecture?: string;
    type?: string;
  }
) {
  await ensureDbConnection();

  const query: Record<string, unknown> = {
    coordinates: {
      $geoWithin: {
        $box: [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
      },
    },
  };

  if (options?.searchTerm) {
    // Parse search term into fuzzy regex patterns (handles Japanese character variants)
    const fuzzyPatterns = parseSearchTermToFuzzyPatterns(options.searchTerm);

    // Only add $and condition if there are actual patterns
    if (fuzzyPatterns.length > 0) {
      // Each keyword must match at least one of: name, prefecture, address, or notes
      query.$and = fuzzyPatterns.map(pattern => ({
        $or: [
          { name: { $regex: pattern, $options: 'i' } },
          { prefecture: { $regex: pattern, $options: 'i' } },
          { address: { $regex: pattern, $options: 'i' } },
          { notes: { $regex: pattern, $options: 'i' } }
        ]
      }));
    }
  }

  if (options?.prefecture && options.prefecture !== 'all') {
    query.prefecture = options.prefecture;
  }

  if (options?.type && options.type !== 'all') {
    query.type = options.type;
  }

  const spots = await CampingSpot.find(query).sort({ createdAt: -1 }).lean();

  return JSON.parse(JSON.stringify(spots));
}

// Public function for list view with pagination
export async function getPublicCampingSpotsWithPagination(
  page: number = 1,
  limit: number = 20,
  options?: {
    searchTerm?: string;
    prefecture?: string;
    type?: string;
    bounds?: { north: number; south: number; east: number; west: number };
  }
) {
  await ensureDbConnection();

  const query: Record<string, unknown> = {};

  if (options?.searchTerm) {
    // Parse search term into fuzzy regex patterns (handles Japanese character variants)
    const fuzzyPatterns = parseSearchTermToFuzzyPatterns(options.searchTerm);

    // Only add $and condition if there are actual patterns
    if (fuzzyPatterns.length > 0) {
      // Each keyword must match at least one of: name, prefecture, address, or notes
      query.$and = fuzzyPatterns.map(pattern => ({
        $or: [
          { name: { $regex: pattern, $options: 'i' } },
          { prefecture: { $regex: pattern, $options: 'i' } },
          { address: { $regex: pattern, $options: 'i' } },
          { notes: { $regex: pattern, $options: 'i' } }
        ]
      }));
    }
  }

  if (options?.prefecture && options.prefecture !== 'all') {
    query.prefecture = options.prefecture;
  }

  if (options?.type && options.type !== 'all') {
    query.type = options.type;
  }

  // Add bounds filter if provided
  if (options?.bounds) {
    query.coordinates = {
      $geoWithin: {
        $box: [
          [options.bounds.west, options.bounds.south],
          [options.bounds.east, options.bounds.north],
        ],
      },
    };
  }

  const skip = (page - 1) * limit;

  const [spots, total] = await Promise.all([
    CampingSpot.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CampingSpot.countDocuments(query),
  ]);

  return {
    spots: JSON.parse(JSON.stringify(spots)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Public function to get nearest camping spots from a coordinate
export async function getNearestCampingSpots(
  latitude: number,
  longitude: number,
  limit: number = 5,
  maxDistance?: number // in meters
) {
  await ensureDbConnection();

  const query: Record<string, unknown> = {
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
        },
      },
    },
  };

  // Add maxDistance filter if provided
  if (maxDistance !== undefined) {
    (query.coordinates as Record<string, Record<string, unknown>>).$near.$maxDistance = maxDistance;
  }

  const spots = await CampingSpot.find(query).limit(limit).lean();

  // Calculate distance for each spot and add it to the result
  const spotsWithDistance = spots.map((spot) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      spot.coordinates[1], // lat
      spot.coordinates[0] // lng
    );

    return {
      ...spot,
      distance: Math.round(distance), // Distance in meters, rounded
    };
  });

  return JSON.parse(JSON.stringify(spotsWithDistance));
}
