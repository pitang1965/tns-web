import { useState, useEffect } from 'react';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import {
  getCachedItinerary,
  getCachedUpdatedAt,
  setCachedItinerary,
} from '@/lib/itineraryCache';

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
    let cancelled = false;

    const run = async () => {
      // Step 1: IndexedDB からキャッシュを取得して即座に表示
      const cached = await getCachedItinerary(id);
      if (cached && !cancelled) {
        setItinerary(cached);
        setLoading(false);
      }

      // Step 2: updatedAt のみを取得してキャッシュの鮮度を確認
      try {
        const metaRes = await fetch(`/api/itineraries/${id}/meta`);
        if (!metaRes.ok) {
          // metaが失敗した場合、キャッシュがあればそのまま表示
          // キャッシュがなければフルフェッチにフォールスルー
          if (!cached) await fetchFull(id, cancelled, setItinerary, setLoading, setError);
          return;
        }

        const { updatedAt: serverUpdatedAt } = await metaRes.json();
        const cachedUpdatedAt = await getCachedUpdatedAt(id);

        if (cachedUpdatedAt && cachedUpdatedAt === serverUpdatedAt) {
          // キャッシュが最新 → フルフェッチ不要
          return;
        }

        // Step 3: 更新があった場合のみフルデータを取得
        await fetchFull(id, cancelled, setItinerary, setLoading, setError);
      } catch {
        // ネットワークエラー時はキャッシュをそのまま使用
        if (!cached && !cancelled) {
          setError('ネットワークエラーが発生しました');
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { itinerary, loading, error };
};

async function fetchFull(
  id: string,
  cancelled: boolean,
  setItinerary: (v: ClientItineraryDocument) => void,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void
) {
  try {
    const res = await fetch(`/api/itineraries/${id}`);
    if (!res.ok) {
      const data = await res.json();
      if (!cancelled) {
        setError(data.error || `旅程を取得できませんでした。: ${res.status}`);
        setLoading(false);
      }
      return;
    }
    const data: ClientItineraryDocument = await res.json();
    if (!cancelled) {
      setItinerary(data);
      setLoading(false);
    }
    await setCachedItinerary(id, data);
  } catch (err) {
    if (!cancelled) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      setLoading(false);
    }
  }
}
