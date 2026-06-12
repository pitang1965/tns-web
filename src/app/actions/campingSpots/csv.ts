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
  name: string;
  error: string;
};

export type CSVImportResult = {
  success: number;
  updated: number;
  errors: CSVImportError[];
  totalRows: number;
  processedCount: number;
};

export type CSVImportOptions = {
  updateExisting?: boolean;
};

export async function importCampingSpotsFromCSV(
  csvData: string,
  options?: CSVImportOptions,
): Promise<CSVImportResult> {
  const updateExisting = options?.updateExisting ?? false;
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const rows = parseCSV(csvData.trim());
  if (rows.length === 0) {
    return {
      success: 0,
      updated: 0,
      errors: [],
      totalRows: 0,
      processedCount: 0,
    };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const totalRows = dataRows.length;

  console.log(`[CSV Import] Starting: ${totalRows} rows`);

  const results: CSVImportResult = {
    success: 0,
    updated: 0,
    errors: [],
    totalRows,
    processedCount: 0,
  };

  // Check if headers are in Japanese or English
  const isJapaneseHeaders = headers.includes('名称');
  const nameIndex = isJapaneseHeaders
    ? headers.indexOf('名称')
    : headers.indexOf('name');

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2; // 1-indexed, header is row 1
    results.processedCount = i + 1;
    const spotName = dataRows[i][nameIndex] || `行 ${rowNum}`;

    if ((i + 1) % 20 === 0 || i === 0) {
      console.log(`[CSV Import] Row ${i + 1}/${totalRows}: ${spotName}`);
    }

    try {
      const values = dataRows[i];
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
              spot.coordinates[0],
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
        if (updateExisting) {
          // Overwrite the existing spot with CSV data.
          // submittedBy is intentionally excluded to preserve the original submitter.
          // Fields absent from the CSV ($unset) are cleared because the CSV is
          // treated as the source of truth in update mode.
          const setOps: Record<string, unknown> = {};
          const unsetOps: Record<string, 1> = {};
          for (const [key, value] of Object.entries(campingSpotData)) {
            if (value === undefined) {
              unsetOps[key] = 1;
            } else {
              setOps[key] = value;
            }
          }
          await CampingSpot.updateOne(
            { _id: duplicateSpot._id },
            {
              $set: setOps,
              ...(Object.keys(unsetOps).length > 0 ? { $unset: unsetOps } : {}),
            },
            { runValidators: true },
          );
          results.updated++;
          continue;
        }

        const distance = calculateDistance(
          campingSpotData.coordinates[1],
          campingSpotData.coordinates[0],
          duplicateSpot.coordinates[1],
          duplicateSpot.coordinates[0],
        );
        results.errors.push({
          row: rowNum,
          name: spotName,
          error: `重複スポット: ${duplicateSpot.name} (${Math.round(distance)}m先に存在)`,
        });
        continue;
      }

      // Save the spot
      campingSpotData.submittedBy = user.email;
      const newSpot = new CampingSpot(campingSpotData);
      await newSpot.save();

      results.success++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[CSV Import] Error at row ${rowNum} "${spotName}": ${errorMessage}`,
      );
      results.errors.push({
        row: rowNum,
        name: spotName,
        error: errorMessage,
      });
    }
  }

  console.log(
    `[CSV Import] Done: ${results.success} created, ${results.updated} updated, ${results.errors.length} errors out of ${totalRows}`,
  );

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
