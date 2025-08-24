'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import CampingSpot from '@/lib/models/CampingSpot';
import mongoose from 'mongoose';
import {
  CampingSpotSchema,
  CampingSpotFilter,
  CampingSpotCSVJapanese,
  csvRowToCampingSpot,
  csvJapaneseRowToCampingSpot,
  CampingSpotCSVSchema,
  CampingSpotCSVJapaneseSchema,
} from '@/data/schemas/campingSpot';

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect('/api/auth/login');
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];
  if (!adminEmails.includes(session.user.email)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return session.user;
}

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    // Connect to the same database as itineraries (itinerary_db)
    const uri = process.env.MONGODB_URI!;
    const dbName = 'itinerary_db';
    await mongoose.connect(uri, { dbName });
  }
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

    if (filter.minOverallRating !== undefined) {
      query.overallRating = { $gte: filter.minOverallRating };
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

export async function getCampingSpotById(id: string) {
  await ensureDbConnection();

  const spot = await CampingSpot.findById(id).lean();
  if (!spot) {
    throw new Error('Camping spot not found');
  }

  return JSON.parse(JSON.stringify(spot));
}

export async function createCampingSpot(data: FormData) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const formObject: Record<string, any> = {};
  data.forEach((value, key) => {
    formObject[key] = value;
  });

  // Convert form data to proper types
  const spotData = {
    ...formObject,
    coordinates: [Number(formObject.lng), Number(formObject.lat)],
    distanceToToilet: formObject.distanceToToilet && formObject.distanceToToilet.trim() !== ''
      ? Number(formObject.distanceToToilet)
      : undefined,
    distanceToBath: formObject.distanceToBath && formObject.distanceToBath.trim() !== ''
      ? Number(formObject.distanceToBath)
      : undefined,
    distanceToConvenience: formObject.distanceToConvenience && formObject.distanceToConvenience.trim() !== ''
      ? Number(formObject.distanceToConvenience)
      : undefined,
    elevation: formObject.elevation && formObject.elevation.trim() !== ''
      ? Number(formObject.elevation)
      : undefined,
    quietnessLevel: formObject.quietnessLevel && formObject.quietnessLevel.trim() !== ''
      ? Number(formObject.quietnessLevel)
      : undefined,
    securityLevel: formObject.securityLevel && formObject.securityLevel.trim() !== ''
      ? Number(formObject.securityLevel)
      : undefined,
    overallRating: formObject.overallRating && formObject.overallRating.trim() !== ''
      ? Number(formObject.overallRating)
      : undefined,
    hasRoof: formObject.hasRoof === 'true',
    hasPowerOutlet: formObject.hasPowerOutlet === 'true',
    isGatedPaid: formObject.isGatedPaid === 'true',
    pricing: {
      isFree: formObject.isFree === 'true',
      pricePerNight: formObject.pricePerNight
        ? Number(formObject.pricePerNight)
        : undefined,
      priceNote: formObject.priceNote || undefined,
    },
    capacity: formObject.capacity && formObject.capacity.trim() !== ''
      ? Number(formObject.capacity)
      : undefined,
    restrictions: formObject.restrictions
      ? String(formObject.restrictions)
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r)
      : [],
    amenities: formObject.amenities
      ? String(formObject.amenities)
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a)
      : [],
    notes: formObject.notes && formObject.notes.trim() !== ''
      ? formObject.notes.trim()
      : undefined,
    submittedBy: user.email,
  };

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  // Remove undefined fields to prevent them from being stored
  const cleanData = Object.fromEntries(
    Object.entries(validatedData).filter(([key, value]) => value !== undefined)
  );

  // Handle nested pricing object
  if (cleanData.pricing) {
    cleanData.pricing = Object.fromEntries(
      Object.entries(cleanData.pricing as any).filter(([key, value]) => value !== undefined)
    );
  }

  const newSpot = new CampingSpot(cleanData);
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

  // Convert form data to proper types
  const spotData = {
    ...formObject,
    coordinates: [Number(formObject.lng), Number(formObject.lat)],
    distanceToToilet: formObject.distanceToToilet && formObject.distanceToToilet.trim() !== ''
      ? Number(formObject.distanceToToilet)
      : undefined,
    distanceToBath: formObject.distanceToBath && formObject.distanceToBath.trim() !== ''
      ? Number(formObject.distanceToBath)
      : undefined,
    distanceToConvenience: formObject.distanceToConvenience && formObject.distanceToConvenience.trim() !== ''
      ? Number(formObject.distanceToConvenience)
      : undefined,
    elevation: formObject.elevation && formObject.elevation.trim() !== ''
      ? Number(formObject.elevation)
      : undefined,
    quietnessLevel: formObject.quietnessLevel && formObject.quietnessLevel.trim() !== ''
      ? Number(formObject.quietnessLevel)
      : undefined,
    securityLevel: formObject.securityLevel && formObject.securityLevel.trim() !== ''
      ? Number(formObject.securityLevel)
      : undefined,
    overallRating: formObject.overallRating && formObject.overallRating.trim() !== ''
      ? Number(formObject.overallRating)
      : undefined,
    hasRoof: formObject.hasRoof === 'true',
    hasPowerOutlet: formObject.hasPowerOutlet === 'true',
    isGatedPaid: formObject.isGatedPaid === 'true',
    pricing: {
      isFree: formObject.isFree === 'true',
      pricePerNight: formObject.pricePerNight
        ? Number(formObject.pricePerNight)
        : undefined,
      priceNote: formObject.priceNote || undefined,
    },
    capacity: formObject.capacity && formObject.capacity.trim() !== ''
      ? Number(formObject.capacity)
      : undefined,
    restrictions: formObject.restrictions
      ? String(formObject.restrictions)
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r)
      : [],
    amenities: formObject.amenities
      ? String(formObject.amenities)
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a)
      : [],
    notes: formObject.notes && formObject.notes.trim() !== ''
      ? formObject.notes.trim()
      : undefined,
  };

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  // Prepare update operations - separate set and unset operations
  const updateOperations: any = { $set: {} };
  const unsetFields: any = {};

  // Handle optional fields that should be unset when undefined
  const optionalFields = ['distanceToToilet', 'distanceToBath', 'distanceToConvenience', 'elevation', 'quietnessLevel', 'securityLevel', 'overallRating', 'capacity', 'notes'];

  Object.keys(validatedData).forEach(key => {
    const value = (validatedData as any)[key];
    if (key === 'pricing') {
      // Skip pricing here, handle it separately below
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
    if (validatedData.pricing.pricePerNight === undefined || validatedData.pricing.pricePerNight === null) {
      unsetFields['pricing.pricePerNight'] = '';
    } else {
      updateOperations.$set['pricing.pricePerNight'] = validatedData.pricing.pricePerNight;
    }

    if (validatedData.pricing.priceNote === undefined || validatedData.pricing.priceNote === null || validatedData.pricing.priceNote === '') {
      unsetFields['pricing.priceNote'] = '';
    } else {
      updateOperations.$set['pricing.priceNote'] = validatedData.pricing.priceNote;
    }
  }

  // Add $unset operation if there are fields to unset
  if (Object.keys(unsetFields).length > 0) {
    updateOperations.$unset = unsetFields;
  }

  const updatedSpot = await CampingSpot.findByIdAndUpdate(id, updateOperations, {
    new: true,
  });

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
  const isJapaneseHeaders = headers.includes('スポット名');

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
