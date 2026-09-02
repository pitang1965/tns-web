type Activity = {
  startTime?: string | null;
  endTime?: string | null;
  [key: string]: unknown;
};

export function sortActivitiesByTime<T extends Activity>(activities: T[]): T[] {
  if (!activities || activities.length < 2) return activities;

  // 時間が設定されているアクティビティのみを抽出
  const activitiesWithTime = activities.filter(
    (activity) => activity.startTime || activity.endTime,
  );

  if (activitiesWithTime.length < 2) return activities; // 時間設定されたアクティビティが2つ未満なら元のまま

  // 時間が設定されているアクティビティを時間順でソート
  const sortedWithTime = [...activitiesWithTime].sort((a, b) => {
    const aTime = a.startTime || a.endTime;
    const bTime = b.startTime || b.endTime;

    // 時間形式（HH:MM）を比較用の数値に変換
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    return timeToMinutes(aTime!) - timeToMinutes(bTime!);
  });

  // 元の配列を再構築：時間が設定されたアクティビティは時間順に、設定されていないものは元の位置を維持
  const result = [...activities];
  let sortedIndex = 0;

  for (let i = 0; i < result.length; i++) {
    const activity = result[i];
    if (activity.startTime || activity.endTime) {
      result[i] = sortedWithTime[sortedIndex];
      sortedIndex++;
    }
  }

  return result;
}

export type TimeOrderConflict = {
  /** 元の配列でのインデックス（0始まり） */
  previousIndex: number;
  nextIndex: number;
};

/**
 * 日をまたぐ移動（23:30 の次が 01:00 など）を「逆転」と誤検知しないための閾値。
 * 前後の差がこれ以上あれば、並べ間違いではなく日またぎとみなして黙る。
 */
const OVERNIGHT_THRESHOLD_MINUTES = 12 * 60;

function parseTimeToMinutes(timeStr: string): number | null {
  const matched = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!matched) return null;

  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * 同じ日の中で、開始時間が前のアクティビティより早くなっている箇所を探す。
 *
 * 判定は sortActivitiesByTime と同じキー（開始時間、なければ終了時間）で行う。
 * こうすることで、警告が出たときに「時間でソート」を押せば必ず解消する。
 * 時間が入っていないアクティビティは判定から除外し、間に挟まっていても
 * 前後の時間付きアクティビティ同士を比較する。
 */
export function findTimeOrderConflicts<T extends Activity>(
  activities: T[],
): TimeOrderConflict[] {
  if (!activities || activities.length < 2) return [];

  const timed = activities
    .map((activity, index) => {
      const raw = activity?.startTime || activity?.endTime;
      const minutes = raw ? parseTimeToMinutes(raw) : null;
      return minutes === null ? null : { index, minutes };
    })
    .filter(
      (entry): entry is { index: number; minutes: number } => entry !== null,
    );

  const conflicts: TimeOrderConflict[] = [];

  for (let i = 1; i < timed.length; i++) {
    const previous = timed[i - 1];
    const current = timed[i];
    const gap = previous.minutes - current.minutes;

    if (gap > 0 && gap < OVERNIGHT_THRESHOLD_MINUTES) {
      conflicts.push({
        previousIndex: previous.index,
        nextIndex: current.index,
      });
    }
  }

  return conflicts;
}

export type TimeRangeOverlap = {
  /** 元の配列でのインデックス（0始まり）。firstIndex < secondIndex */
  firstIndex: number;
  secondIndex: number;
  /** 一方の時間帯がもう一方に完全に含まれている */
  contained: boolean;
};

/**
 * 時間帯が重なっているアクティビティの組を探す。
 *
 * findTimeOrderConflicts（並び順の逆転）とは別物で、こちらは「時間でソート」しても
 * 解消しない。開始時間・終了時間が両方入っているものだけを対象とし、
 * 日をまたぐ時間帯（23:00〜01:00 のように終了が開始より前）は範囲を作れないため除外する。
 * 端が接するだけ（10:00 終了 → 10:00 開始）は重なりとみなさない。
 */
export function findTimeRangeOverlaps<T extends Activity>(
  activities: T[],
): TimeRangeOverlap[] {
  if (!activities || activities.length < 2) return [];

  const ranges = activities
    .map((activity, index) => {
      const start = activity?.startTime
        ? parseTimeToMinutes(activity.startTime)
        : null;
      const end = activity?.endTime
        ? parseTimeToMinutes(activity.endTime)
        : null;
      if (start === null || end === null || start >= end) return null;
      return { index, start, end };
    })
    .filter(
      (range): range is { index: number; start: number; end: number } =>
        range !== null,
    );

  const overlaps: TimeRangeOverlap[] = [];

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.start >= b.end || b.start >= a.end) continue;

      const contained =
        (a.start <= b.start && b.end <= a.end) ||
        (b.start <= a.start && a.end <= b.end);

      overlaps.push({
        firstIndex: Math.min(a.index, b.index),
        secondIndex: Math.max(a.index, b.index),
        contained,
      });
    }
  }

  return overlaps;
}
