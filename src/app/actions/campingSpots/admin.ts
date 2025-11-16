'use server';

import { revalidatePath } from 'next/cache';
import CampingSpot from '@/lib/models/CampingSpot';
import {
  CampingSpotSchema,
  CampingSpotFilter,
} from '@/data/schemas/campingSpot';
import { ensureDbConnection } from '@/lib/database';
import { checkAdminAuth, convertFormDataToCampingSpot } from './helpers';

export async function getCampingSpots(filter?: CampingSpotFilter) {
  await checkAdminAuth();
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

// Admin function for map view with bounds-based filtering
export async function getCampingSpotsByBounds(
  bounds: { north: number; south: number; east: number; west: number },
  options?: {
    searchTerm?: string;
    prefecture?: string;
    type?: string;
  }
) {
  await checkAdminAuth();
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
    query.name = { $regex: options.searchTerm, $options: 'i' };
  }

  if (options?.prefecture && options.prefecture !== 'all') {
    query.prefecture = options.prefecture;
  }

  if (options?.type && options.type !== 'all') {
    query.type = options.type;
  }

  // Get total count without bounds filter for "全○○件中" display
  const totalQuery: Record<string, unknown> = {};
  if (options?.searchTerm) {
    totalQuery.name = { $regex: options.searchTerm, $options: 'i' };
  }
  if (options?.prefecture && options.prefecture !== 'all') {
    totalQuery.prefecture = options.prefecture;
  }
  if (options?.type && options.type !== 'all') {
    totalQuery.type = options.type;
  }

  const [spots, total] = await Promise.all([
    CampingSpot.find(query).sort({ createdAt: -1 }).lean(),
    CampingSpot.countDocuments(totalQuery),
  ]);

  return {
    spots: JSON.parse(JSON.stringify(spots)),
    total,
  };
}

// Admin function for list view with pagination
export async function getCampingSpotsWithPagination(
  page: number = 1,
  limit: number = 20,
  options?: {
    searchTerm?: string;
    prefecture?: string;
    type?: string;
    bounds?: { north: number; south: number; east: number; west: number };
  }
) {
  await checkAdminAuth();
  await ensureDbConnection();

  const query: Record<string, unknown> = {};

  if (options?.searchTerm) {
    query.name = { $regex: options.searchTerm, $options: 'i' };
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

export async function getCampingSpotById(id: string) {
  try {
    // Validate input
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid spot ID provided');
    }

    // Ensure database connection with timeout
    await ensureDbConnection();

    // Find the spot with proper error handling
    const spot = await CampingSpot.findById(id).lean().exec();

    if (!spot) {
      throw new Error(`Camping spot not found for ID: ${id}`);
    }

    // Return properly serialized data
    return JSON.parse(JSON.stringify(spot));
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error in getCampingSpotById:', {
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side',
    });

    // Always throw a proper Error object, never undefined
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to retrieve camping spot: ${String(error)}`);
    }
  }
}

export async function createCampingSpot(data: FormData) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const formObject: Record<string, any> = {};
  data.forEach((value, key) => {
    formObject[key] = value;
  });

  // Convert form data to proper types using helper function
  const spotData = convertFormDataToCampingSpot({
    ...formObject,
    submittedBy: user.email,
  });

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  // Remove undefined fields to prevent them from being stored
  const cleanData = Object.fromEntries(
    Object.entries(validatedData).filter(([key, value]) => value !== undefined)
  );

  // Handle nested pricing object
  if (cleanData.pricing) {
    const cleanPricing = Object.fromEntries(
      Object.entries(cleanData.pricing as any).filter(
        ([key, value]) => value !== undefined
      )
    );
    cleanData.pricing = cleanPricing as typeof cleanData.pricing;
  }

  // Explicitly remove coordinate fields if they are undefined to prevent Mongoose from creating empty arrays
  const finalData = { ...cleanData };
  if (!cleanData.nearbyToiletCoordinates) {
    delete finalData.nearbyToiletCoordinates;
  }
  if (!cleanData.nearbyConvenienceCoordinates) {
    delete finalData.nearbyConvenienceCoordinates;
  }
  if (!cleanData.nearbyBathCoordinates) {
    delete finalData.nearbyBathCoordinates;
  }

  const newSpot = new CampingSpot(finalData);
  await newSpot.save();

  revalidatePath('/admin/shachu-haku');
  revalidatePath('/shachu-haku');
  return { success: true, id: newSpot._id.toString() };
}

export async function updateCampingSpot(id: string, data: FormData) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const formObject: Record<string, any> = {};
  data.forEach((value, key) => {
    formObject[key] = value;
  });

  // Convert form data to proper types using helper function
  const spotData = convertFormDataToCampingSpot(formObject);

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  // Prepare update operations - separate set and unset operations
  const updateOperations: { $set: Record<string, unknown>; $unset?: Record<string, string> } = { $set: {} };
  const unsetFields: Record<string, string> = {};

  // Handle optional fields that should be unset when undefined
  const optionalFields = [
    'distanceToToilet',
    'distanceToBath',
    'distanceToConvenience',
    'nearbyToiletCoordinates',
    'nearbyConvenienceCoordinates',
    'nearbyBathCoordinates',
    'elevation',
    'quietnessLevel',
    'securityLevel',
    'overallRating',
    'capacity',
    'url',
    'notes',
  ];

  Object.keys(validatedData).forEach((key) => {
    const value = (validatedData as Record<string, unknown>)[key];
    if (key === 'pricing' || key === 'security' || key === 'nightNoise') {
      // Skip nested objects here, handle them separately below
      return;
    }

    if (optionalFields.includes(key)) {
      if (value === undefined || value === null) {
        unsetFields[key] = '';
      } else {
        updateOperations.$set[key] = value;
      }
    } else {
      updateOperations.$set[key] = value;
    }
  });

  // Handle nested pricing fields separately to avoid conflicts
  if (validatedData.pricing) {
    // Always set required pricing fields
    updateOperations.$set['pricing.isFree'] = validatedData.pricing.isFree;

    // Handle optional pricing fields
    if (
      validatedData.pricing.pricePerNight === undefined ||
      validatedData.pricing.pricePerNight === null
    ) {
      unsetFields['pricing.pricePerNight'] = '';
    } else {
      updateOperations.$set['pricing.pricePerNight'] =
        validatedData.pricing.pricePerNight;
    }

    if (
      validatedData.pricing.priceNote === undefined ||
      validatedData.pricing.priceNote === null ||
      validatedData.pricing.priceNote === ''
    ) {
      unsetFields['pricing.priceNote'] = '';
    } else {
      updateOperations.$set['pricing.priceNote'] =
        validatedData.pricing.priceNote;
    }
  }

  // Handle nested security fields
  if (validatedData.security) {
    updateOperations.$set['security.hasGate'] = validatedData.security.hasGate;
    updateOperations.$set['security.hasLighting'] =
      validatedData.security.hasLighting;
    updateOperations.$set['security.hasStaff'] =
      validatedData.security.hasStaff;
  }

  // Handle nested nightNoise fields
  if (validatedData.nightNoise) {
    updateOperations.$set['nightNoise.hasNoiseIssues'] =
      validatedData.nightNoise.hasNoiseIssues;
    updateOperations.$set['nightNoise.nearBusyRoad'] =
      validatedData.nightNoise.nearBusyRoad;
    updateOperations.$set['nightNoise.isQuietArea'] =
      validatedData.nightNoise.isQuietArea;
  }

  // Add $unset operation if there are fields to unset
  if (Object.keys(unsetFields).length > 0) {
    updateOperations.$unset = unsetFields;
  }

  const updatedSpot = await CampingSpot.findByIdAndUpdate(
    id,
    updateOperations,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedSpot) {
    throw new Error('Camping spot not found');
  }

  revalidatePath('/admin/shachu-haku');
  revalidatePath('/shachu-haku');
  return { success: true };
}

export async function deleteCampingSpot(id: string) {
  await checkAdminAuth();
  await ensureDbConnection();

  const deletedSpot = await CampingSpot.findByIdAndDelete(id);

  if (!deletedSpot) {
    throw new Error('Camping spot not found');
  }

  revalidatePath('/admin/shachu-haku');
  revalidatePath('/shachu-haku');
  return { success: true };
}
