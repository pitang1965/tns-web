'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * URLのday=Xクエリパラメータを管理するカスタムフック
 *
 * @param itineraryId 旅程ID
 * @param maxDays 最大日数（範囲外の値を検証するため）
 * @returns 現在の日付と日付変更関数のオブジェクト
 */
export function useDayParam(itineraryId: string, maxDays: number = 1) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLのクエリパラメータから日付を取得（デフォルトは1日目）
  const dayParam = searchParams.get('day');
  const initialDay = dayParam ? parseInt(dayParam, 10) : 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // URLのday変更時に選択日を更新
  useEffect(() => {
    if (dayParam) {
      const dayNumber = parseInt(dayParam, 10);
      if (!isNaN(dayNumber) && dayNumber > 0) {
        setSelectedDay(dayNumber);
      }
    } else {
      setSelectedDay(1);
    }
  }, [dayParam]);

  // 日付切り替え時にURLを更新する関数
  const handleDayChange = (day: number) => {
    // 現在のURLを取得し、dayパラメータだけを更新した新しいURLを構築
    const url = new URL(window.location.href);
    url.searchParams.set('day', day.toString());

    // 更新したURLオブジェクトを使ってページ遷移
    router.push(url.toString());
  };

  // 選択された日が範囲外かをチェック
  const isDayOutOfRange = selectedDay > maxDays;

  // 無効な日付の場合、1日目にリダイレクトする関数
  const redirectToFirstDay = () => {
    if (maxDays > 0) {
      router.push(`/itineraries/${itineraryId}?day=1`);
    }
  };

  return {
    selectedDay,
    handleDayChange,
    isDayOutOfRange,
    redirectToFirstDay,
  };
}
