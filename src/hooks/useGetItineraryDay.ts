import { useState, useEffect } from 'react';
import { DayPlan } from '@/data/schemas/itinerarySchema';

type ItineraryMetadata = {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  owner: { id: string; name: string; email: string };
  sharedWith?: { id: string; name: string; email: string }[];
  totalDays: number;
  createdAt?: string;
  updatedAt?: string;
  dayPlanSummaries: { date: string | null; notes?: string }[];
};

type UseGetItineraryDayResult = {
  metadata: ItineraryMetadata | undefined;
  dayPlan: DayPlan | undefined;
  dayIndex: number;
  loading: boolean;
  error: string | null;
};

export const useGetItineraryDay = (
  id: string,
  dayIndex: number // 0ベースのインデックス（useDayParamからの値）
): UseGetItineraryDayResult => {
  const [metadata, setMetadata] = useState<ItineraryMetadata | undefined>();
  const [dayPlan, setDayPlan] = useState<DayPlan | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItineraryDay = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // dayIndexはそのまま使用（0ベースのままAPI呼び出し）
        console.log(
          `Fetching day data for day ${dayIndex} (API index: ${dayIndex})`
        );

        const response = await fetch(`/api/itineraries/${id}/day/${dayIndex}`);

        if (!response.ok) {
          const errorData = await response.json();

          // 構造化されたエラーメッセージを処理
          if (errorData.error === 'NO_DAY_PLANS') {
            throw new Error(
              `${errorData.message}\n${errorData.suggestion || ''}`
            );
          } else if (errorData.error === 'DAY_INDEX_OUT_OF_RANGE') {
            throw new Error(
              `${errorData.message}\n${errorData.details || ''}`
            );
          }

          // 従来のエラーフォーマット
          throw new Error(
            errorData.error ||
              `旅程データを取得できませんでした。: ${response.status}`
          );
        }

        const data = await response.json();
        setMetadata(data.metadata);
        setDayPlan(data.dayPlan);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
        console.error('Day data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryDay();
  }, [id, dayIndex]);

  return { metadata, dayPlan, dayIndex, loading, error };
};
