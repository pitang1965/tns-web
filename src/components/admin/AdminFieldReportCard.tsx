'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { setFieldReportHidden } from '@/app/actions/fieldReports';
import {
  formatYearMonth,
  type AdminFieldReport,
} from '@/data/schemas/fieldReport';

type AdminFieldReportCardProps = {
  report: AdminFieldReport;
  /** スポット名とスポットへのリンクを出すか（横断一覧で true） */
  showSpotLink?: boolean;
  onChanged: () => void;
};

/**
 * 管理画面での現地報告1件の表示。
 *
 * 管理者にできるのは表示・非表示の切り替えだけで、本文の編集はできない。
 * 現地報告は他人の発言であり、書き換えるとその人が言っていないことを
 * 言ったことにしてしまうため。
 *
 * ADR-0011 の例外として、ここでは投稿日時を表示する（連投の検知に必要）。
 * 公開画面では決して表示しないこと。
 */
export function AdminFieldReportCard({
  report,
  showSpotLink = false,
  onChanged,
}: AdminFieldReportCardProps) {
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);

  const handleToggleHidden = async () => {
    setIsBusy(true);
    const result = await setFieldReportHidden(report.id, !report.isHidden);
    setIsBusy(false);

    if (!result.success) {
      toast({
        title: '操作できませんでした',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: report.isHidden ? '再表示しました' : '非表示にしました' });
    onChanged();
  };

  const postedAt = new Date(report.createdAt).toLocaleString('ja-JP');

  return (
    <div
      className={`rounded-lg border p-4 ${
        report.isHidden
          ? 'border-dashed border-destructive/50 bg-destructive/5'
          : 'border-border'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-semibold">
          {formatYearMonth(report.visitedYearMonth)} の報告
        </span>
        {report.isHidden && (
          <Badge variant="destructive" className="text-xs">
            非表示中
          </Badge>
        )}
        {report.flagCount > 0 && (
          <Badge variant="outline" className="text-xs">
            通報 {report.flagCount}件
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          投稿 {postedAt}
        </span>
      </div>

      {showSpotLink && report.spotName && (
        <p className="text-xs text-muted-foreground mb-2">
          スポット：{report.spotName}
        </p>
      )}

      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
        {report.body}
      </p>

      {report.flagReasons.length > 0 && (
        <div className="mt-2 rounded bg-muted p-2">
          <p className="text-xs font-medium mb-1">通報理由</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {report.flagReasons.map((reason, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">— {report.handle}</span>

        <div className="flex items-center gap-1 flex-wrap">
          {showSpotLink && (
            <Link href={`/admin/shachu-haku/${report.spotId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-xs h-8"
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                スポットを編集
              </Button>
            </Link>
          )}
          <Link
            href={`/shachu-haku/${report.spotId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-xs h-8"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              公開ページ
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleHidden}
            disabled={isBusy}
            className="cursor-pointer text-xs h-8"
          >
            {report.isHidden ? (
              <>
                <Eye className="w-3.5 h-3.5 mr-1" />
                再表示
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1" />
                非表示
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
