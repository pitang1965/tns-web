import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import { parseSpotTypes } from '@/lib/spotTypeFilter';

const STORAGE_KEY = 'shachu-haku-filters';

export type SavedShachuHakuFilters = {
  searchTerm: string;
  // 複数選択（空配列＝全種別）。旧形式の単一文字列は読み込み時に配列へ移行する。
  typeFilter: string[];
  clientFilters: ClientSideFilterValues;
  activeTab: 'map' | 'list';
  // Map display info in URL-compatible format
  lat: number;
  lng: number;
  lng_span?: number;
  aspect_ratio?: number;
  zoom?: number; // Fallback when bounds are not available
  sortField?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

/**
 * ローカルストレージにフィルター条件を保存する
 */
export const saveFiltersToLocalStorage = (
  filters: SavedShachuHakuFilters,
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
        typeof parsed.activeTab !== 'string' ||
        typeof parsed.lat !== 'number' ||
        typeof parsed.lng !== 'number'
      ) {
        console.warn('Invalid saved filters structure, ignoring');
        return null;
      }

      // 旧形式（typeFilter が単一文字列 'all'/種別キー）を配列へ移行して読み込む。
      // 保存済みの地図位置・タブ等はそのまま維持する。
      return {
        ...parsed,
        typeFilter: parseSpotTypes(parsed.typeFilter),
      } as SavedShachuHakuFilters;
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
