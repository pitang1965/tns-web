'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type MapboxContext = {
  region?: { name?: string };
  district?: { name?: string };
  place?: { name?: string };
  address?: { name?: string };
  postcode?: { name?: string };
};

function buildJapaneseAddress(
  props: Record<string, unknown> | undefined,
  placeFormatted?: string,
): string {
  if (!props)
    return placeFormatted ? reverseJapaneseAddress(placeFormatted) : '';
  const ctx = props.context as MapboxContext | undefined;
  const postcode = ctx?.postcode?.name ?? '';
  const region = ctx?.region?.name ?? '';
  const district = ctx?.district?.name ?? ctx?.place?.name ?? '';
  const address = ctx?.address?.name ?? '';

  // regionが取れた場合はcontextから組み立て
  if (region) {
    const body = [region, district, address].filter(Boolean).join('');
    return postcode ? `〒${postcode} ${body}` : body;
  }

  // regionがない場合はplace_formattedを逆順に並べて都道府県を補完
  // 例: "舞浜1-1, 浦安市, 千葉県" → "千葉県浦安市舞浜1-1"
  const formatted = placeFormatted ?? (props.place_formatted as string) ?? '';
  if (formatted) {
    const body = reverseJapaneseAddress(formatted);
    return postcode ? `〒${postcode} ${body}` : body;
  }

  return (props.full_address as string) ?? '';
}

function reverseJapaneseAddress(placeFormatted: string): string {
  return placeFormatted.split(', ').reverse().join('');
}

type Suggestion = {
  name: string;
  place_formatted: string;
  mapbox_id: string;
};

type SelectedPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type PlaceNameAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: SelectedPlace) => void;
};

export function PlaceNameAutocomplete({
  value,
  onChange,
  onPlaceSelect,
}: PlaceNameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionToken = useRef<string>(crypto.randomUUID());
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const search = useCallback(
    async (query: string) => {
      setIsSearching(true);
      setNoResults(false);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&country=JP&language=ja&limit=5&session_token=${sessionToken.current}&access_token=${token}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Search API error');
        const data = await res.json();
        const results: Suggestion[] = (data.suggestions || []).map(
          (s: {
            name: string;
            place_formatted?: string;
            mapbox_id: string;
          }) => ({
            name: s.name,
            place_formatted: s.place_formatted ?? '',
            mapbox_id: s.mapbox_id,
          }),
        );
        setSuggestions(results);
        setNoResults(results.length === 0);
        setShowDropdown(true);
      } catch {
        toast({
          title: '検索エラー',
          description: '場所の検索中にエラーが発生しました',
          variant: 'destructive',
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast],
  );

  const handleInput = useCallback(
    (val: string) => {
      onChange(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!val.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        setNoResults(false);
        return;
      }
      debounceRef.current = setTimeout(() => search(val), 300);
    },
    [onChange, search],
  );

  const handleSelect = useCallback(
    async (suggestion: Suggestion) => {
      setShowDropdown(false);
      setSuggestions([]);
      onChange(suggestion.name);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?language=ja&session_token=${sessionToken.current}&access_token=${token}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Retrieve API error');
        const data = await res.json();
        const coords = data.features?.[0]?.geometry?.coordinates as
          | [number, number]
          | undefined;
        const props = data.features?.[0]?.properties;
        if (!coords) throw new Error('No coordinates');
        const [lng, lat] = coords;
        const address = buildJapaneseAddress(props, suggestion.place_formatted);
        onPlaceSelect({
          name: suggestion.name,
          address,
          latitude: lat,
          longitude: lng,
        });
        sessionToken.current = crypto.randomUUID();
      } catch {
        toast({
          title: '取得エラー',
          description: '座標の取得に失敗しました',
          variant: 'destructive',
        });
      }
    },
    [onChange, onPlaceSelect, toast],
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin pointer-events-none" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="場所名で検索（住所・座標・タイプを自動入力）"
          autoComplete="off"
          className="pl-9 pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="クリア"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background rounded-md shadow-lg border border-border overflow-hidden">
          {noResults ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              該当する場所が見つかりませんでした
            </div>
          ) : (
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b border-border last:border-0"
                  >
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    {s.place_formatted && (
                      <div className="text-xs text-muted-foreground truncate">
                        {s.place_formatted}
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
  );
}
