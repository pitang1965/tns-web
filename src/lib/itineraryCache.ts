import { openDB, IDBPDatabase } from 'idb';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

const DB_NAME = 'tns-itinerary-cache';
const STORE_NAME = 'itineraries';
const DB_VERSION = 1;

type CacheEntry = {
  data: ClientItineraryDocument;
  cachedAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedItinerary(
  id: string,
): Promise<ClientItineraryDocument | null> {
  try {
    const db = await getDB();
    const entry = (await db.get(STORE_NAME, id)) as CacheEntry | undefined;
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

export async function getCachedUpdatedAt(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    const entry = (await db.get(STORE_NAME, id)) as CacheEntry | undefined;
    return entry?.data.updatedAt ?? null;
  } catch {
    return null;
  }
}

export async function setCachedItinerary(
  id: string,
  data: ClientItineraryDocument,
): Promise<void> {
  try {
    const db = await getDB();
    const entry: CacheEntry = { data, cachedAt: Date.now() };
    await db.put(STORE_NAME, entry, id);
  } catch {
    // キャッシュ書き込み失敗は無視する
  }
}

export async function deleteCachedItinerary(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  } catch {
    // 無視する
  }
}

export async function clearAllCachedItineraries(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch {
    // 無視する
  }
}
