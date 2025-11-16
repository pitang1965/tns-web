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
import { checkAdminAuth } from './helpers';

export async function importCampingSpotsFromCSV(csvData: string) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  // CSV parser that handles quoted fields with newlines
  function parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split('\n');
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < csvText.length) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (!inQuotes && char === ',') {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if (!inQuotes && (char === '\n' || char === '\r')) {
        // End of row
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \r in \r\n
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0) || rows.length === 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      }

      // Regular character
      currentField += char;
      i++;
    }

    // Handle last field/row
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  const rows = parseCSV(csvData.trim());
  if (rows.length === 0) {
    return { success: 0, errors: [] };
  }

  const headers = rows[0];

  const results = {
    success: 0,
    errors: [] as { row: number; error: string; data: any }[],
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
