type Activity = {
  startTime?: string | null;
  endTime?: string | null;
  [key: string]: any;
};

export function sortActivitiesByTime<T extends Activity>(activities: T[]): T[] {
  if (!activities || activities.length < 2) return activities;

  // 時間が設定されているアクティビティのみを抽出
  const activitiesWithTime = activities.filter(
    (activity) => activity.startTime || activity.endTime
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
