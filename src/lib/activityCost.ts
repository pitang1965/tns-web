type CostActivity = {
  title?: string | null;
  cost?: number | null;
  [key: string]: unknown;
};

export type MissingCostEntry = {
  /** 0始まり。旅程全体の集計でのみ入る（日ごとの集計では undefined） */
  dayIndex?: number;
  /** その日の中での0始まりのインデックス */
  activityIndex: number;
  /** タイトル未入力なら空文字。表示側で「N番目」に読み替える */
  title: string;
};

export type CostSummary = {
  /** 入力済みの費用の合計。未入力は加算しないので、旅程の総額とは限らない */
  total: number;
  /** 集計対象のアクティビティ数 */
  totalCount: number;
  /** 費用が入力されている件数 */
  enteredCount: number;
  /** 費用が未入力のアクティビティ */
  missing: MissingCostEntry[];
};

/**
 * 「費用が入力されている」の判定。
 *
 * 0円は入力済みとして扱う。無料の道の駅や入浴なしの日など、意図して0を入れる場面が
 * あり、これを未入力に混ぜると「入れたのに未入力と言われる」ことになるため。
 * 未入力は null（フォームは空欄を null にする）。NaN は壊れた入力なので未入力側に寄せる。
 */
function hasCost(cost: number | null | undefined): cost is number {
  return typeof cost === 'number' && Number.isFinite(cost);
}

/**
 * 1日分の費用を集計する。
 *
 * 合計はあくまで「入力済みの合計」で、ガソリン代のように入力されないことが多い費目は
 * 当然含まれない。そのため未入力の件数と場所も一緒に返し、表示側で
 * 「この数字は全部ではない」と分かるようにしている。
 */
export function summarizeDayCost<T extends CostActivity>(
  activities: T[] | null | undefined,
): CostSummary {
  const list = activities || [];
  let total = 0;
  let enteredCount = 0;
  const missing: MissingCostEntry[] = [];

  list.forEach((activity, activityIndex) => {
    if (hasCost(activity?.cost)) {
      total += activity.cost;
      enteredCount++;
      return;
    }
    missing.push({
      activityIndex,
      title: activity?.title?.trim() || '',
    });
  });

  return { total, totalCount: list.length, enteredCount, missing };
}

/**
 * 旅程全体の費用を集計する。
 *
 * 編集画面は1日ずつしか表示しないため、全体の数字はここでしか得られない。
 * 未入力は日をまたいで並べるので dayIndex を付ける。
 */
export function summarizeItineraryCost<T extends CostActivity>(
  dayPlans: Array<{ activities?: T[] | null }> | null | undefined,
): CostSummary {
  const days = dayPlans || [];
  let total = 0;
  let totalCount = 0;
  let enteredCount = 0;
  const missing: MissingCostEntry[] = [];

  days.forEach((day, dayIndex) => {
    const summary = summarizeDayCost(day?.activities);
    total += summary.total;
    totalCount += summary.totalCount;
    enteredCount += summary.enteredCount;
    summary.missing.forEach((entry) => {
      missing.push({ ...entry, dayIndex });
    });
  });

  return { total, totalCount, enteredCount, missing };
}

/** 「¥12,000」。既存の費用表示（NearbyShachuHakuSpotsList など）と揃える */
export function formatCost(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}
