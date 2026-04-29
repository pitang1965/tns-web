/**
 * 日付をISO形式（YYYY-MM-DD）でフォーマットする
 * @param dateString - 日付文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDateWithWeekday(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // 日付が不正な場合
  if (isNaN(date.getTime())) return '';

  // ISO形式（YYYY-MM-DD）に変換
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // 曜日を取得
  const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });

  return `${formattedDate} ${weekday}`;
}

export function formatItineraryDuration(
  startDate?: string,
  numberOfDays?: number,
): string {
  const days = `${numberOfDays ?? 0}日間`;
  if (!startDate) return days;
  return `${formatDateWithWeekday(startDate)} から ${days}`;
}

/**
 * 日付のみをISO形式（YYYY-MM-DD）でフォーマットする（曜日なし）
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // 日付が不正な場合
  if (isNaN(date.getTime())) return '';

  // ISO形式（YYYY-MM-DD）に変換
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
