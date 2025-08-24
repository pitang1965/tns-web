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
    distanceToToilet: Number(formObject.distanceToToilet),
    distanceToBath: formObject.distanceToBath
      ? Number(formObject.distanceToBath)
      : undefined,
    quietnessLevel: Number(formObject.quietnessLevel),
    securityLevel: Number(formObject.securityLevel),
    overallRating: Number(formObject.overallRating),
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
    capacity: Number(formObject.capacity),
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
    submittedBy: user.email,
  };

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  const newSpot = new CampingSpot(validatedData);
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
    distanceToToilet: Number(formObject.distanceToToilet),
    distanceToBath: formObject.distanceToBath
      ? Number(formObject.distanceToBath)
      : undefined,
    quietnessLevel: Number(formObject.quietnessLevel),
    securityLevel: Number(formObject.securityLevel),
    overallRating: Number(formObject.overallRating),
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
    capacity: Number(formObject.capacity),
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
  };

  // Validate the data
  const validatedData = CampingSpotSchema.parse(spotData);

  const updatedSpot = await CampingSpot.findByIdAndUpdate(id, validatedData, {
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
  console.log('Headers detected:', headers);
  console.log('Is Japanese headers:', isJapaneseHeaders);

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
