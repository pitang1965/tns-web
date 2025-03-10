/**
 * 日付を「YYYY/MM/DD 曜日」形式でフォーマットする
 * @param dateString - 日付文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDateWithWeekday(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // 日付が不正な場合
  if (isNaN(date.getTime())) return '';

  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  // 曜日を取得
  const weekday = date.toLocaleDateString('ja-JP', { weekday: 'short' });

  return `${formattedDate} ${weekday}`;
}

/**
 * 日付のみをフォーマットする（曜日なし）
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // 日付が不正な場合
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
