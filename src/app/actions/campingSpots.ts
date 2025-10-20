'use server';

import { revalidatePath } from 'next/cache';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import CampingSpot from '@/lib/models/CampingSpot';
import mongoose from 'mongoose';
import {
  CampingSpotSchema,
  CampingSpotFilter,
  csvRowToCampingSpot,
  csvJapaneseRowToCampingSpot,
  CampingSpotCSVSchema,
  CampingSpotCSVJapaneseSchema,
} from '@/data/schemas/campingSpot';

// Helper function to check admin authorization
async function checkAdminAuth() {
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

// Helper function to ensure database connection with enhanced error handling
async function ensureDbConnection() {
  try {
    if (mongoose.connection.readyState === 0) {
      // データベース名は MONGODB_URI から自動取得
      const uri = process.env.MONGODB_URI!;

      // Enhanced connection options for stability in various environments
      await mongoose.connect(uri, {
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
        serverSelectionTimeoutMS: 10000, // 10 seconds
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Maintain a minimum of 2 socket connections
      });

      console.log('MongoDB connection established successfully');
    } else if (mongoose.connection.readyState === 2) {
      // Connection is connecting, wait for it
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 15000);

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });

        mongoose.connection.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      readyState: mongoose.connection.readyState,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side',
    });
    throw new Error(
      `Database connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// Helper function to convert FormData to CampingSpot format
function convertFormDataToCampingSpot(formObject: Record<string, any>) {
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

// Public function for general users (no authentication required)
export async function getPublicCampingSpots(filter?: CampingSpotFilter) {
  await ensureDbConnection();

  const query: any = {};

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

  const query: any = {
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

  const query: any = {};

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

export async function getCampingSpots(filter?: CampingSpotFilter) {
  await checkAdminAuth();
  await ensureDbConnection();

  const query: any = {};

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

  const query: any = {
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

  const spots = await CampingSpot.find(query).sort({ createdAt: -1 }).lean();

  return JSON.parse(JSON.stringify(spots));
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

  const query: any = {};

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

  revalidatePath('/admin/camping-spots');
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
  const updateOperations: any = { $set: {} };
  const unsetFields: any = {};

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
    const value = (validatedData as any)[key];
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
    }
  );

  if (!updatedSpot) {
    throw new Error('Camping spot not found');
  }

  revalidatePath('/admin/camping-spots');
  return { success: true };
}

export async function deleteCampingSpot(id: string) {
  await checkAdminAuth();
  await ensureDbConnection();

  const deletedSpot = await CampingSpot.findByIdAndDelete(id);

  if (!deletedSpot) {
    throw new Error('Camping spot not found');
  }

  revalidatePath('/admin/camping-spots');
  return { success: true };
}

export async function importCampingSpotsFromCSV(csvData: string) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  // Simple CSV parser that handles basic cases
  function parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  const lines = csvData.trim().split('\n');
  const headers = parseCSVRow(lines[0]);

  const results = {
    success: 0,
    errors: [] as { row: number; error: string; data: any }[],
  };

  // Check if headers are in Japanese or English
  const isJapaneseHeaders = headers.includes('名称');

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVRow(lines[i]);
      const rowData: any = {};

      headers.forEach((header, index) => {
        // Remove quotes if present and clean up the value
        let value = values[index] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        rowData[header] = value;
      });

      // Validate CSV row and convert to CampingSpot format
      let campingSpotData: any;

      if (isJapaneseHeaders) {
        // Validate with Japanese schema
        const validatedCSVData = CampingSpotCSVJapaneseSchema.parse(rowData);
        campingSpotData = csvJapaneseRowToCampingSpot(validatedCSVData);
      } else {
        // Validate with English schema
        const validatedCSVData = CampingSpotCSVSchema.parse(rowData);
        campingSpotData = csvRowToCampingSpot(validatedCSVData);
      }

      campingSpotData.submittedBy = user.email;

      // Check for duplicates (within 100m)
      const existingSpot = await CampingSpot.findOne({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: campingSpotData.coordinates,
            },
            $maxDistance: 100,
          },
        },
      });

      if (existingSpot) {
        results.errors.push({
          row: i + 1,
          error: `Duplicate spot found within 100m: ${existingSpot.name}`,
          data: rowData,
        });
        continue;
      }

      // Save the spot
      const newSpot = new CampingSpot(campingSpotData);
      await newSpot.save();

      results.success++;
    } catch (error) {
      results.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: lines[i],
      });
    }
  }

  revalidatePath('/admin/camping-spots');
  return results;
}

export async function getCampingSpotsForExport() {
  await checkAdminAuth();
  await ensureDbConnection();

  const spots = await CampingSpot.find({})
    .sort({ prefecture: 1, name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(spots));
}
