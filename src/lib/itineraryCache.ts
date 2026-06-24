import { openDB, IDBPDatabase } from 'idb';
import { DetailItineraryDocument } from '@/data/schemas/itinerarySchema';

const DB_NAME = 'tns-itinerary-cache';
const STORE_NAME = 'itineraries';
// v2: 旧バージョンは owner の生PII（name/email/id）と sharedWith を
// キャッシュしていた。詳細ページの payload から生PIIを除去した変更
// （docs/adr/0003-public-creator-handle.md S2）に伴い、既存ユーザーの
// ブラウザに残る旧キャッシュを purge するためストアを作り直す。
const DB_VERSION = 2;

type CacheEntry = {
  data: DetailItineraryDocument;
  cachedAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 旧ストアが存在する場合は削除して作り直す（生PII入りキャッシュを破棄）
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

export async function getCachedItinerary(
  id: string,
): Promise<DetailItineraryDocument | null> {
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
  data: DetailItineraryDocument,
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

export async function getAllCachedItineraries(): Promise<
  DetailItineraryDocument[]
> {
  try {
    const db = await getDB();
    const all = (await db.getAll(STORE_NAME)) as CacheEntry[];
    return all.map((entry) => entry.data).filter(Boolean);
  } catch {
    return [];
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
