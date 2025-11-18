/**
 * CSV Utilities
 *
 * Common utilities for CSV parsing, generation, and download.
 * These utilities are designed to be reusable across different entities
 * (camping spots, itineraries, etc.)
 */

/**
 * Parse CSV text into a 2D array of strings
 * Handles quoted fields with newlines and escaped quotes
 *
 * @param csvText - Raw CSV text content
 * @returns 2D array where each inner array represents a row
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
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

/**
 * Escape a CSV field value
 * Handles special characters (comma, quotes, newlines) by quoting and escaping
 *
 * @param field - Field value to escape (can be any type)
 * @returns Properly escaped CSV field string
 */
export function escapeCSVField(field: unknown): string {
  // Use empty string for null/undefined values
  const stringField = field == null ? '' : String(field);

  // Always quote fields that contain special characters
  if (
    stringField.includes(',') ||
    stringField.includes('"') ||
    stringField.includes('\n') ||
    stringField.includes('\r')
  ) {
    // Escape quotes by doubling them
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * Convert a 2D array to CSV string
 *
 * @param rows - 2D array of values
 * @returns CSV formatted string
 */
export function arrayToCSV(rows: unknown[][]): string {
  return rows.map(row => row.map(escapeCSVField).join(',')).join('\r\n');
}

/**
 * Trigger browser download of CSV file
 * Includes BOM for proper UTF-8 encoding in Excel
 *
 * @param csvContent - CSV content string
 * @param filename - Desired filename (should end with .csv)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 encoding (Excel compatibility)
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // Clean up
  URL.revokeObjectURL(link.href);
}

/**
 * Parse CSV rows into objects using header row
 *
 * @param rows - 2D array from parseCSV
 * @returns Array of objects where keys are column headers
 */
export function csvRowsToObjects<T = Record<string, string>>(
  rows: string[][]
): T[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows.map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj as T;
  });
}

/**
 * Convert objects to CSV rows (including header row)
 *
 * @param data - Array of objects
 * @param headers - Array of column headers (object keys to include)
 * @returns 2D array suitable for arrayToCSV
 */
export function objectsToCSVRows<T extends Record<string, unknown>>(
  data: T[],
  headers: (keyof T)[]
): unknown[][] {
  const headerRow = headers.map(String);
  const dataRows = data.map((item) =>
    headers.map((header) => item[header])
  );
  return [headerRow, ...dataRows];
}

/**
 * Generate CSV export result with statistics
 */
export type CSVExportResult = {
  success: boolean;
  processedCount: number;
  errorCount: number;
  csvContent?: string;
  errors?: string[];
}

/**
 * Generate timestamp-based filename
 *
 * @param prefix - Filename prefix (e.g., 'camping-spots')
 * @param extension - File extension (default: 'csv')
 * @returns Filename with current date (e.g., 'camping-spots-2025-11-17.csv')
 */
export function generateCSVFilename(
  prefix: string,
  extension: string = 'csv'
): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
}
