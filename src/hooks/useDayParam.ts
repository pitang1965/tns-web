'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * URLのday=Xクエリパラメータを管理するカスタムフック
 * URL上は1ベース（day=1, day=2...）
 * 内部処理は0ベース（0, 1, 2...）
 *
 * @param itineraryId 旅程ID
 * @param maxDays 最大日数（範囲外の値を検証するため、0ベース）
 * @returns 現在の日付と日付変更関数のオブジェクト
 */
export function useDayParam(itineraryId: string, maxDays: number = 0) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLのクエリパラメータから日付を取得（URLは1ベース、内部では0ベース）
  const dayParam = searchParams.get('day');
  // URLから1を引いて内部の0ベースに変換
  const initialDay = dayParam ? Math.max(parseInt(dayParam, 10) - 1, 0) : 0;
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // URLのday変更時に選択日を更新
  useEffect(() => {
    if (dayParam) {
      const dayNumber = parseInt(dayParam, 10);
      if (!isNaN(dayNumber) && dayNumber >= 1) {
        // URLは1ベース、内部では0ベース
        setSelectedDay(dayNumber - 1);
      }
    } else {
      setSelectedDay(0);
    }
  }, [dayParam]);

  // 日付切り替え時にURLを更新する関数
  const handleDayChange = (day: number) => {
    // 現在のURLを取得し、dayパラメータだけを更新した新しいURLを構築
    // 内部は0ベース、URLは1ベース
    const url = new URL(window.location.href);
    url.searchParams.set('day', (day + 1).toString());

    // 更新したURLオブジェクトを使ってページ遷移
    router.push(url.toString());
  };

  // 選択された日が範囲外かをチェック（内部は0ベース）
  const isDayOutOfRange = selectedDay > maxDays;

  // 無効な日付の場合、1日目にリダイレクトする関数（URLは1ベース）
  const redirectToFirstDay = () => {
    if (maxDays >= 0) {
      router.push(`/itineraries/${itineraryId}?day=1`);
    }
  };

  return {
    selectedDay, // 0ベース
    handleDayChange, // 0ベースの値を受け取る
    isDayOutOfRange,
    redirectToFirstDay,
  };
}
