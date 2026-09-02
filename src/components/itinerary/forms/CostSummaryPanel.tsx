'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CostSummary, formatCost } from '@/lib/activityCost';

type CostSummaryPanelProps = {
  summary: CostSummary;
  /** 「この日」「旅程全体」など、何の合計かを示す見出し */
  label: string;
  /**
   * summary.missing に dayIndex が入っていないとき（日ごとの集計）の遷移先の日。
   * 旅程全体の集計では各エントリの dayIndex が優先される。
   */
  fallbackDayIndex?: number;
};

/**
 * 予算の合計を参考情報として出すパネル。
 *
 * 保存も公開もしない。編集中のフォームの値から毎回計算しているだけで、
 * 「入力した分だけの合計」であることが伝わる文言にしている（ガソリン代のように
 * そもそも入力されない費目があり、総額として読まれると誤解になるため）。
 * 時間の矛盾の注意と違って異常を知らせるものではないので、固定バーにはせず
 * 目立たない見た目で置いている。
 */
export function CostSummaryPanel({
  summary,
  label,
  fallbackDayIndex,
}: CostSummaryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // アクティビティが無い日には何も出さない（0円と表示しても意味がないため）
  if (summary.totalCount === 0) return null;

  const missingCount = summary.missing.length;

  // ItineraryToc と同じ方式で該当アクティビティへ移動する。
  // 同じ日なら既にDOMにあるので直接スクロールし、別の日ならURLの day を変えて
  // ハッシュを付ける（ItineraryForm 側の useEffect がスクロールを引き受ける）。
  const handleJump = (dayIndex: number | undefined, activityIndex: number) => {
    const targetDayIndex = dayIndex ?? fallbackDayIndex;
    if (targetDayIndex === undefined) return;

    const hash = `activity-${targetDayIndex}-${activityIndex}`;
    const currentDay = parseInt(searchParams.get('day') || '1', 10);

    if (targetDayIndex + 1 === currentDay) {
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('day', String(targetDayIndex + 1));
    router.push(`?${params.toString()}#${hash}`);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>{label}の入力済み合計</span>
        </div>
        <span className="text-base font-semibold tabular-nums">
          {formatCost(summary.total)}
        </span>
      </div>

      {missingCount === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {summary.totalCount}件すべて入力済み
        </p>
      ) : (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-1">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            <span>
              {summary.totalCount}件中{summary.enteredCount}件入力・
              {missingCount}件未入力
            </span>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-1">
              {summary.missing.map((entry) => (
                <li
                  key={`${entry.dayIndex ?? 'day'}-${entry.activityIndex}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleJump(entry.dayIndex, entry.activityIndex)
                    }
                    className="w-full truncate rounded px-1 py-0.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    {entry.dayIndex !== undefined &&
                      `${entry.dayIndex + 1}日目 `}
                    {entry.activityIndex + 1}番目
                    {entry.title ? `: ${entry.title}` : ''}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              未入力があるため、実際の総額とは異なります。この合計は保存されません。
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
