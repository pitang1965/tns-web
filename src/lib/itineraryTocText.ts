import { formatDateWithWeekday } from '@/lib/date';

export type TocActivitySummary = {
  id?: string;
  title: string;
};

export type TocDaySummary = {
  date: string | null;
  notes?: string;
  activities?: TocActivitySummary[];
};

export type ItineraryTocTextSource = {
  title?: string;
  dayPlanSummaries?: TocDaySummary[];
};

/**
 * 目次をプレーンテキストに変換する（クリップボードコピー用）
 *
 * 例:
 * 北海道の旅
 *
 * 1日目: 2026-08-23 日
 *   メモ: フェリーで移動
 *   1. 函館朝市
 *   2. 五稜郭
 */
export function formatItineraryTocText(
  source: ItineraryTocTextSource | undefined,
): string {
  const lines: string[] = [];

  const title = source?.title?.trim();
  if (title) {
    lines.push(title);
    lines.push('');
  }

  const summaries = source?.dayPlanSummaries || [];

  if (summaries.length === 0) {
    lines.push('日程がまだ登録されていません');
    return lines.join('\n');
  }

  summaries.forEach((day, index) => {
    const formattedDate = day.date ? formatDateWithWeekday(day.date) : '';
    lines.push(`${index + 1}日目${formattedDate ? `: ${formattedDate}` : ''}`);

    if (day.notes?.trim()) {
      lines.push(`  メモ: ${day.notes.trim()}`);
    }

    day.activities?.forEach((activity, actIndex) => {
      lines.push(`  ${actIndex + 1}. ${activity.title || '(無題)'}`);
    });

    // 日の区切りに空行を入れる（最終日を除く）
    if (index < summaries.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
}
