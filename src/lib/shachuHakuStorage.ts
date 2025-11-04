import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';

const STORAGE_KEY = 'shachu-haku-filters';

export interface SavedShachuHakuFilters {
  searchTerm: string;
  typeFilter: string;
  clientFilters: ClientSideFilterValues;
  activeTab: 'map' | 'list';
  // Map display info in URL-compatible format
  lat: number;
  lng: number;
  lng_span?: number;
  aspect_ratio?: number;
  zoom?: number; // Fallback when bounds are not available
}

/**
 * ローカルストレージにフィルター条件を保存する
 */
export const saveFiltersToLocalStorage = (
  filters: SavedShachuHakuFilters
): void => {
  // SSR時はlocalStorageが存在しないのでスキップ
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
};

/**
 * ローカルストレージからフィルター条件を読み込む
 * @returns 保存されていた条件、または null
 */
export const loadFiltersFromLocalStorage =
  (): SavedShachuHakuFilters | null => {
    // SSR時はlocalStorageが存在しないのでnullを返す
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved);

      // Validate the structure
      if (
        typeof parsed.searchTerm !== 'string' ||
        typeof parsed.typeFilter !== 'string' ||
        typeof parsed.activeTab !== 'string' ||
        typeof parsed.lat !== 'number' ||
        typeof parsed.lng !== 'number'
      ) {
        console.warn('Invalid saved filters structure, ignoring');
        return null;
      }

      return parsed as SavedShachuHakuFilters;
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
      return null;
    }
  };

/**
 * ローカルストレージからフィルター条件を削除する
 */
export const clearFiltersFromLocalStorage = (): void => {
  // SSR時はlocalStorageが存在しないのでスキップ
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear filters from localStorage:', error);
  }
};
