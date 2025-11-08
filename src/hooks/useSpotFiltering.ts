import { useMemo } from 'react';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { filterSpotsClientSide } from '@/lib/clientSideFilterSpots';
import { getActiveFilterDescriptions } from '@/lib/filterDescriptions';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';

interface UseSpotFilteringProps {
  spots: CampingSpotWithId[];
  clientFilters: ClientSideFilterValues;
  savedBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  searchTerm: string;
  typeFilter: string;
}

/**
 * Custom hook for filtering camping spots
 * Provides filtered spots, visible spots, and active filter descriptions
 */
export function useSpotFiltering({
  spots,
  clientFilters,
  savedBounds,
  searchTerm,
  typeFilter,
}: UseSpotFilteringProps) {
  // Apply client-side filters to spots
  const filteredSpots = useMemo(
    () => filterSpotsClientSide(spots, clientFilters),
    [spots, clientFilters]
  );

  // Filter spots within visible bounds
  const visibleSpots = useMemo(() => {
    if (!savedBounds) return filteredSpots;

    return filteredSpots.filter((spot) => {
      const lat = spot.coordinates[1];
      const lng = spot.coordinates[0];
      return (
        lat <= savedBounds.north &&
        lat >= savedBounds.south &&
        lng <= savedBounds.east &&
        lng >= savedBounds.west
      );
    });
  }, [filteredSpots, savedBounds]);

  // Generate active filter descriptions for display
  const activeFilterDescriptions = useMemo(
    () => getActiveFilterDescriptions(searchTerm, typeFilter, clientFilters),
    [searchTerm, typeFilter, clientFilters]
  );

  return {
    filteredSpots,
    visibleSpots,
    activeFilterDescriptions,
  };
}
