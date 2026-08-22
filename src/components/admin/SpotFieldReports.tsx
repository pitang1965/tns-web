'use client';

import { useCallback, useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpotFieldReportsForAdmin } from '@/app/actions/fieldReports';
import type { AdminFieldReport } from '@/data/schemas/fieldReport';
import { AdminFieldReportCard } from './AdminFieldReportCard';

type SpotFieldReportsProps = {
  spotId: string;
};

/**
 * スポット編集画面に置く現地報告の一覧。
 *
 * この機能の中心のループは「ユーザーの現地報告を読む → 管理者が掲載データを見直す」で、
 * 掲載データを直す場所はこの編集画面なので、報告もここで読めるようにする。
 *
 * 報告が0件のときは何も描画しない。大半のスポットは当分0件のため、
 * 空のセクションで編集画面を埋めないようにする。
 */
export function SpotFieldReports({ spotId }: SpotFieldReportsProps) {
  const [reports, setReports] = useState<AdminFieldReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  // 非表示・再表示の後に再取得するための契機
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // エフェクト本体で同期的に setState しない（連鎖レンダリングを避ける）
    void (async () => {
      const result = await getSpotFieldReportsForAdmin(spotId);
      if (cancelled) return;
      setReports(result);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [spotId, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  if (!loaded || reports.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <NotebookPen className="w-5 h-5" />
          現地報告
          <span className="text-sm font-normal text-muted-foreground">
            {reports.length}件
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          実際に訪れた方の報告です。掲載データと食い違う内容があれば、下のフォームで見直してください。本文は編集できません（表示・非表示のみ）。
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((report) => (
          <AdminFieldReportCard
            key={report.id}
            report={report}
            onChanged={reload}
          />
        ))}
      </CardContent>
    </Card>
  );
}
