import { useState, useEffect } from 'react';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

type UseGetItineraryResult = {
  itinerary: ClientItineraryDocument | undefined;
  loading: boolean;
  error: string | null;
};

export const useGetItinerary = (id: string): UseGetItineraryResult => {
  const [itinerary, setItinerary] = useState<
    ClientItineraryDocument | undefined
  >();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/itineraries/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `旅程を取得できませんでした。: ${response.status}`
          );
        }
        const data = await response.json();
        setItinerary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  return { itinerary, loading, error };
};
