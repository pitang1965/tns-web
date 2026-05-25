'use client';

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupJapaneseLabels, handleMapError } from '@/lib/mapboxIcons';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { LocateFixed, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import 'mapbox-gl/dist/mapbox-gl.css';

type SearchSuggestion = {
  name: string;
  place_formatted: string;
  mapbox_id: string;
};

type SimpleLocationPickerProps = {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
};

export default function SimpleLocationPicker({
  onLocationSelect,
  initialLat = 35.6762,
  initialLng = 139.6503,
}: SimpleLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  // Session token is required by Search Box API and must remain stable across suggest/retrieve calls
  const sessionToken = useRef<string>(crypto.randomUUID());
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [position, setPosition] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not set');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 13,
      cooperativeGestures: true,
      locale: {
        'AttributionControl.ToggleAttribution': '帰属情報の表示切替',
        'NavigationControl.ResetBearing': '方角をリセット',
        'NavigationControl.ZoomIn': 'ズームイン',
        'NavigationControl.ZoomOut': 'ズームアウト',
        'ScrollZoomBlocker.CtrlMessage': 'Ctrl + スクロールでズーム',
        'ScrollZoomBlocker.CmdMessage': '⌘ + スクロールでズーム',
        'TouchPanBlocker.Message': '2本指で地図を移動',
      },
    });

    map.current.getCanvas().style.cursor = 'crosshair';
    map.current.on('error', handleMapError);

    map.current.on('style.load', () => {
      if (map.current) {
        setupJapaneseLabels(map.current);
      }
    });

    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        setPosition({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationSelect(lngLat.lat, lngLat.lng);
      }
    });

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setPosition({ lat, lng });
      onLocationSelect(lat, lng);
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [initialLat, initialLng, onLocationSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      setNoResults(false);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&country=JP&language=ja&limit=5&session_token=${sessionToken.current}&access_token=${token}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search API error');
        const data = await response.json();
        const suggestions: SearchSuggestion[] = (data.suggestions || []).map(
          (s: { name: string; place_formatted?: string; mapbox_id: string }) => ({
            name: s.name,
            place_formatted: s.place_formatted ?? '',
            mapbox_id: s.mapbox_id,
          }),
        );
        setSearchResults(suggestions);
        setNoResults(suggestions.length === 0);
        setShowDropdown(true);
      } catch {
        toast({
          title: '検索エラー',
          description: '場所の検索中にエラーが発生しました',
          variant: 'destructive',
        });
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    },
    [toast],
  );

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
      if (!value.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        setNoResults(false);
        return;
      }
      searchDebounce.current = setTimeout(() => handleSearch(value), 300);
    },
    [handleSearch],
  );

  const handleSelectResult = useCallback(
    async (suggestion: SearchSuggestion) => {
      setShowDropdown(false);
      setSearchResults([]);
      setSearchQuery(suggestion.name);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken.current}&access_token=${token}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Retrieve API error');
        const data = await response.json();
        const coords = data.features?.[0]?.geometry?.coordinates as
          | [number, number]
          | undefined;
        if (!coords) throw new Error('No coordinates in response');
        const [lng, lat] = coords;
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
        // Reset session token after retrieve to start a new billing session
        sessionToken.current = crypto.randomUUID();
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 15 });
        }
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        }
      } catch {
        toast({
          title: '取得エラー',
          description: '座標の取得に失敗しました',
          variant: 'destructive',
        });
      }
    },
    [onLocationSelect, toast],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setNoResults(false);
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocateError('このブラウザは位置情報に対応していません');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 15 });
        }
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        }
        setLocating(false);
      },
      () => {
        setLocateError('現在地を取得できませんでした');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!mounted) {
    return <LoadingState variant="card" message="地図を読み込み中..." />;
  }

  return (
    <div className="h-[400px] w-full">
      <div className="relative w-full h-full">
        <div
          ref={mapContainer}
          className="w-full h-full rounded-lg cursor-crosshair"
        />

        {/* Search overlay - top left */}
        <div
          ref={searchContainerRef}
          className="absolute top-2 left-2 z-10 w-72"
        >
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-600">
            {isSearching ? (
              <Loader2 className="w-4 h-4 ml-2 text-gray-400 animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 ml-2 text-gray-400 flex-shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="地名・施設名で検索"
              className="flex-1 px-2 py-2 text-sm bg-transparent outline-none dark:text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="検索をクリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {noResults ? (
                <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                  該当する場所が見つかりませんでした
                </div>
              ) : (
                <ul>
                  {searchResults.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectResult(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.name}
                        </div>
                        {suggestion.place_formatted && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {suggestion.place_formatted}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Locate button - top right */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleLocate}
            disabled={locating}
            className="shadow-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="現在地に移動"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            現在地
          </Button>
        </div>
      </div>
      {locateError && (
        <p className="mt-1 text-xs text-red-500">{locateError}</p>
      )}
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded">
        地図をクリック、またはマーカーをドラッグして位置を選択してください。
        <br />
        現在の座標: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
    </div>
  );
}
