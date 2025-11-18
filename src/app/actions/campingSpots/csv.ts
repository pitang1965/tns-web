'use server';

import { revalidatePath } from 'next/cache';
import CampingSpot from '@/lib/models/CampingSpot';
import {
  csvRowToCampingSpot,
  csvJapaneseRowToCampingSpot,
  CampingSpotCSVSchema,
  CampingSpotCSVJapaneseSchema,
} from '@/data/schemas/campingSpot';
import { calculateDistance } from '@/lib/utils/distance';
import { ensureDbConnection } from '@/lib/database';
import { checkAdminAuth } from './auth';
import { parseCSV } from '@/lib/csv/utils';

export type CSVImportError = {
  row: number;
  error: string;
  data: unknown;
}

export type CSVImportResult = {
  success: number;
  errors: CSVImportError[];
}

export async function importCampingSpotsFromCSV(csvData: string): Promise<CSVImportResult> {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const rows = parseCSV(csvData.trim());
  if (rows.length === 0) {
    return { success: 0, errors: [] };
  }

  const headers = rows[0];

  const results: CSVImportResult = {
    success: 0,
    errors: [],
  };

  // Check if headers are in Japanese or English
  const isJapaneseHeaders = headers.includes('名称');

  for (let i = 1; i < rows.length; i++) {
    try {
      const values = rows[i];
      const rowData: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
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

      // Check for duplicates with improved logic:
      // - If name matches exactly: reject if within 100m (likely duplicate submission)
      // - If name differs: reject only if within 10m (likely same location but different facility)
      const nearbySpots = await CampingSpot.find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: campingSpotData.coordinates,
            },
            $maxDistance: 100, // Check within 100m radius
          },
        },
      }).limit(5); // Get up to 5 nearest spots

      // Check if any nearby spot is a duplicate
      const duplicateSpot = nearbySpots.find((spot) => {
        const distance = spot.coordinates
          ? calculateDistance(
              campingSpotData.coordinates[1],
              campingSpotData.coordinates[0],
              spot.coordinates[1],
              spot.coordinates[0]
            )
          : Infinity;

        // If names match exactly, consider it duplicate within 100m
        if (spot.name === campingSpotData.name) {
          return distance <= 100;
        }

        // If names differ, only consider duplicate if within 10m (same physical location)
        return distance <= 10;
      });

      if (duplicateSpot) {
        const distance = calculateDistance(
          campingSpotData.coordinates[1],
          campingSpotData.coordinates[0],
          duplicateSpot.coordinates[1],
          duplicateSpot.coordinates[0]
        );
        results.errors.push({
          row: i + 1,
          error: `Duplicate spot found: ${duplicateSpot.name} (${Math.round(distance)}m away)`,
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
        data: rows[i].join(','),
      });
    }
  }

  revalidatePath('/admin/shachu-haku');
  revalidatePath('/shachu-haku');
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
