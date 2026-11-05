import { useState, useEffect } from 'react';
import { DetailItineraryDocument } from '@/data/schemas/itinerarySchema';
import {
  deleteCachedItinerary,
  getCachedItinerary,
  getCachedUpdatedAt,
  setCachedItinerary,
} from '@/lib/itineraryCache';

type UseGetItineraryResult = {
  itinerary: DetailItineraryDocument | undefined;
  loading: boolean;
  error: string | null;
};

export const useGetItinerary = (id: string): UseGetItineraryResult => {
  const [itinerary, setItinerary] = useState<
    DetailItineraryDocument | undefined
  >();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // 値渡しだとクリーンアップ後の変更が fetchFull に届かないため関数で渡す
    const isCancelled = () => cancelled;

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
        // 404 = 削除・非公開化・権限喪失。見る権利のないキャッシュは捨てる
        if (metaRes.status === 404) {
          await deleteCachedItinerary(id);
          if (!cancelled) {
            setItinerary(undefined);
            setError('旅程が見つかりません');
            setLoading(false);
          }
          return;
        }
        if (!metaRes.ok) {
          // metaが失敗した場合、キャッシュがあればそのまま表示
          // キャッシュがなければフルフェッチにフォールスルー
          if (!cached)
            await fetchFull(id, isCancelled, setItinerary, setLoading, setError);
          return;
        }

        const { updatedAt: serverUpdatedAt } = await metaRes.json();
        const cachedUpdatedAt = await getCachedUpdatedAt(id);

        if (cachedUpdatedAt && cachedUpdatedAt === serverUpdatedAt) {
          // キャッシュが最新 → フルフェッチ不要
          return;
        }

        // Step 3: 更新があった場合のみフルデータを取得
        await fetchFull(id, isCancelled, setItinerary, setLoading, setError);
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
  isCancelled: () => boolean,
  setItinerary: (v: DetailItineraryDocument) => void,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
) {
  try {
    const res = await fetch(`/api/itineraries/${id}`);
    if (!res.ok) {
      const data = await res.json();
      if (!isCancelled()) {
        setError(data.error || `旅程を取得できませんでした。: ${res.status}`);
        setLoading(false);
      }
      return;
    }
    const data: DetailItineraryDocument = await res.json();
    await setCachedItinerary(id, data);
    if (!isCancelled()) {
      setItinerary(data);
      setLoading(false);
    }
  } catch (err) {
    if (!isCancelled()) {
      setError(err instanceof Error ? err.message : '不明なエラー');
      setLoading(false);
    }
  }
}
