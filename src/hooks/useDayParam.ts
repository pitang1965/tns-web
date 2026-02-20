'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * URLのday=Xクエリパラメータを管理するカスタムフック
 * URL上は1ベース（day=1, day=2...）
 * 内部処理は0ベース（0, 1, 2...）
 *
 * @param maxDays 最大日数（範囲外の値を検証するため、0ベース）
 * @returns 現在の日付と日付変更関数のオブジェクト
 */
export function useDayParam(maxDays: number = 0) {
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

  // 選択日が範囲外の場合、最終日に自動クランプ
  useEffect(() => {
    if (selectedDay > maxDays && maxDays >= 0) {
      const url = new URL(window.location.href);
      url.searchParams.set('day', String(maxDays + 1)); // URL は1ベース
      router.push(url.toString());
    }
  }, [selectedDay, maxDays, router]);

  // 日付切り替え時にURLを更新する関数
  const handleDayChange = (day: number) => {
    // DayPaginationからの入力は既に1ベース（例: 14日目 = 14）
    // URLも1ベース表記なので、そのまま使用
    const url = new URL(window.location.href);
    url.searchParams.set('day', day.toString());

    // 更新したURLオブジェクトを使ってページ遷移
    router.push(url.toString());
  };

  return {
    selectedDay, // 0ベース
    handleDayChange, // 1ベースの値を受け取る
  };
}
