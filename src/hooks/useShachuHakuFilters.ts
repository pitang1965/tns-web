import { useState, useEffect, useMemo, useRef } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import {
  loadFiltersFromLocalStorage,
  saveFiltersToLocalStorage,
  clearFiltersFromLocalStorage,
} from '@/lib/shachuHakuStorage';

type UseShachuHakuFiltersOptions = {
  searchParams: ReadonlyURLSearchParams;
  onResetComplete?: () => void;
};

export const useShachuHakuFilters = ({
  searchParams,
  onResetComplete,
}: UseShachuHakuFiltersOptions) => {
  // Load saved filters once during initialization (only if no URL params)
  const savedFilters = useMemo(() => {
    // URLパラメータが存在する場合はローカルストレージを使わない
    if (searchParams.toString()) {
      return null;
    }
    return loadFiltersFromLocalStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: searchParams is intentionally omitted to only load once

  // Active tab state
  const [activeTab, setActiveTab] = useState<'map' | 'list'>(() => {
    // URLパラメータからタブを決定
    const tabParam = searchParams.get('tab');
    if (tabParam === 'list') return 'list';
    if (tabParam === 'map') return 'map';
    // URLパラメータがない場合、ローカルストレージから復元
    return savedFilters?.activeTab || 'map';
  });

  // Search term state
  const [searchTerm, setSearchTerm] = useState(() => {
    // URLパラメータから検索クエリを取得
    const urlParam = searchParams.get('q');
    if (urlParam !== null) return urlParam;
    // URLパラメータがない場合、ローカルストレージから復元
    return savedFilters?.searchTerm || '';
  });

  // Type filter state
  const [typeFilter, setTypeFilter] = useState(() => {
    // URLパラメータから種別フィルターを取得
    const urlParam = searchParams.get('type');
    if (urlParam !== null) return urlParam;
    // URLパラメータがない場合、ローカルストレージから復元
    return savedFilters?.typeFilter || 'all';
  });

  // Client-side filters state
  const [clientFilters, setClientFilters] = useState<ClientSideFilterValues>(
    () => {
      // URLパラメータからクライアント側フィルターを取得
      const hasUrlParams =
        searchParams.get('pricing') !== null ||
        searchParams.get('min_security') !== null ||
        searchParams.get('min_quietness') !== null ||
        searchParams.get('max_toilet_dist') !== null ||
        searchParams.get('min_elevation') !== null ||
        searchParams.get('max_elevation') !== null;

      if (hasUrlParams) {
        return {
          pricingFilter:
            (searchParams.get(
              'pricing'
            ) as ClientSideFilterValues['pricingFilter']) || 'all',
          minSecurityLevel: parseInt(searchParams.get('min_security') || '0'),
          minQuietnessLevel: parseInt(searchParams.get('min_quietness') || '0'),
          maxToiletDistance: searchParams.get('max_toilet_dist')
            ? parseInt(searchParams.get('max_toilet_dist')!)
            : null,
          minElevation: searchParams.get('min_elevation')
            ? parseInt(searchParams.get('min_elevation')!)
            : null,
          maxElevation: searchParams.get('max_elevation')
            ? parseInt(searchParams.get('max_elevation')!)
            : null,
        };
      }

      // URLパラメータがない場合、ローカルストレージから復元
      if (savedFilters?.clientFilters) {
        return savedFilters.clientFilters;
      }

      // デフォルト値
      return {
        pricingFilter: 'all',
        minSecurityLevel: 0,
        minQuietnessLevel: 0,
        maxToiletDistance: null,
        minElevation: null,
        maxElevation: null,
      };
    }
  );

  // Map state for zoom and center
  const [mapZoom, setMapZoom] = useState(() => {
    const zoom = searchParams.get('zoom');
    if (zoom) return parseFloat(zoom);
    // URLパラメータがない場合、ローカルストレージから復元
    return savedFilters?.zoom || 9;
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      return [parseFloat(lng), parseFloat(lat)];
    }
    // URLパラメータがない場合、ローカルストレージから復元
    if (savedFilters?.lat && savedFilters?.lng) {
      return [savedFilters.lng, savedFilters.lat];
    }
    return [139.6917, 35.6895]; // デフォルト: 東京
  });

  // Saved bounds from map (used for list view filtering)
  const [savedBounds, setSavedBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(() => {
    // 新形式: center+lng_span+aspect_ratio を取得してboundsに変換
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const lngSpan = searchParams.get('lng_span');
    const aspectRatio = searchParams.get('aspect_ratio');

    if (lat && lng && lngSpan && aspectRatio) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const lngSpanVal = parseFloat(lngSpan);
      const aspectRatioVal = parseFloat(aspectRatio);
      const latSpanVal = lngSpanVal / aspectRatioVal; // lat_span = lng_span / aspect_ratio

      return {
        north: centerLat + latSpanVal / 2,
        south: centerLat - latSpanVal / 2,
        east: centerLng + lngSpanVal / 2,
        west: centerLng - lngSpanVal / 2,
      };
    }

    // 旧形式（lat_span指定）: 後方互換性のため
    const latSpan = searchParams.get('lat_span');
    if (lat && lng && latSpan && lngSpan) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const latSpanVal = parseFloat(latSpan);
      const lngSpanVal = parseFloat(lngSpan);

      return {
        north: centerLat + latSpanVal / 2,
        south: centerLat - latSpanVal / 2,
        east: centerLng + lngSpanVal / 2,
        west: centerLng - lngSpanVal / 2,
      };
    }

    // 旧形式: bounds_* を直接取得（後方互換性）
    const boundsNorth = searchParams.get('bounds_north');
    const boundsSouth = searchParams.get('bounds_south');
    const boundsEast = searchParams.get('bounds_east');
    const boundsWest = searchParams.get('bounds_west');

    if (boundsNorth && boundsSouth && boundsEast && boundsWest) {
      return {
        north: parseFloat(boundsNorth),
        south: parseFloat(boundsSouth),
        east: parseFloat(boundsEast),
        west: parseFloat(boundsWest),
      };
    }

    // URLパラメータがない場合、ローカルストレージから復元
    if (
      savedFilters?.lat &&
      savedFilters?.lng &&
      savedFilters?.lng_span &&
      savedFilters?.aspect_ratio
    ) {
      const centerLat = savedFilters.lat;
      const centerLng = savedFilters.lng;
      const lngSpanVal = savedFilters.lng_span;
      const aspectRatioVal = savedFilters.aspect_ratio;
      const latSpanVal = lngSpanVal / aspectRatioVal;

      return {
        north: centerLat + latSpanVal / 2,
        south: centerLat - latSpanVal / 2,
        east: centerLng + lngSpanVal / 2,
        west: centerLng - lngSpanVal / 2,
      };
    }

    return null;
  });

  // Track if this is the initial mount to skip URL update
  const isInitialMountRef = useRef(true);

  // Auto-save to localStorage whenever filters or map state changes
  useEffect(() => {
    // Skip saving on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Calculate center and spans for saving
    const centerLat = savedBounds
      ? (savedBounds.north + savedBounds.south) / 2
      : mapCenter[1];
    const centerLng = savedBounds
      ? (savedBounds.east + savedBounds.west) / 2
      : mapCenter[0];
    const lngSpan = savedBounds
      ? savedBounds.east - savedBounds.west
      : undefined;
    const aspectRatio =
      savedBounds && lngSpan
        ? lngSpan / (savedBounds.north - savedBounds.south)
        : undefined;

    saveFiltersToLocalStorage({
      searchTerm,
      typeFilter,
      clientFilters,
      activeTab,
      lat: centerLat,
      lng: centerLng,
      lng_span: lngSpan,
      aspect_ratio: aspectRatio,
      zoom: !savedBounds ? mapZoom : undefined,
    });
  }, [
    searchTerm,
    typeFilter,
    clientFilters,
    activeTab,
    mapZoom,
    mapCenter,
    savedBounds,
  ]);

  // Handle reset all filters
  const handleResetAll = () => {
    // Reset all filter states to defaults
    setSearchTerm('');
    setTypeFilter('all');
    setClientFilters({
      pricingFilter: 'all',
      minSecurityLevel: 0,
      minQuietnessLevel: 0,
      maxToiletDistance: null,
      minElevation: null,
      maxElevation: null,
    });
    setActiveTab('map');

    // Reset map to default location (Tokyo)
    setMapCenter([139.6917, 35.6895]);
    setMapZoom(9);
    setSavedBounds(null);

    // Clear localStorage
    clearFiltersFromLocalStorage();

    // Call the callback if provided
    if (onResetComplete) {
      onResetComplete();
    }
  };

  return {
    // Filter states
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    clientFilters,
    setClientFilters,

    // Tab state
    activeTab,
    setActiveTab,

    // Map states
    mapZoom,
    setMapZoom,
    mapCenter,
    setMapCenter,
    savedBounds,
    setSavedBounds,

    // Handlers
    handleResetAll,
  };
};
