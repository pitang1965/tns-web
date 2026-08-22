'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { NotebookPen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFieldReportCard } from '@/components/admin/AdminFieldReportCard';
import { LoadingState } from '@/components/common/LoadingState';
import { listFieldReportsForAdmin } from '@/app/actions/fieldReports';
import type {
  AdminFieldReport,
  AdminFieldReportFilter,
} from '@/data/schemas/fieldReport';

const TABS: { value: AdminFieldReportFilter; label: string; empty: string }[] = [
  {
    value: 'flagged',
    label: '通報あり',
    empty: '通報された現地報告はありません。',
  },
  {
    value: 'hidden',
    label: '非表示中',
    empty: '非表示にした現地報告はありません。',
  },
  {
    value: 'all',
    label: 'すべて',
    empty: 'まだ現地報告が投稿されていません。',
  },
];

export default function FieldReportsAdminPage() {
  const { user, isLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();

  const [activeTab, setActiveTab] = useState<AdminFieldReportFilter>('flagged');
  const [reports, setReports] = useState<AdminFieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  // 再読み込みの契機。ボタンや非表示操作から増やす
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    // エフェクト本体で同期的に setState しない（連鎖レンダリングを避ける）。
    // ローディング表示の開始はタブ切替・再読み込みのハンドラ側で行う。
    void (async () => {
      const result = await listFieldReportsForAdmin(activeTab);
      if (cancelled) return;
      setReports(result);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, activeTab, reloadToken]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setLoading(true);
    setActiveTab(value as AdminFieldReportFilter);
  }, []);

  if (isLoading || adminLoading) {
    return <LoadingState variant="fullscreen" />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">アクセス拒否</h1>
        <p className="mt-2">このページは管理者のみが利用できます。</p>
      </div>
    );
  }

  const activeTabConfig = TABS.find((tab) => tab.value === activeTab);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <AdminPageHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <NotebookPen className="w-7 h-7" />
            現地報告管理
          </h1>
          <p className="text-sm mt-1">
            通報された報告の確認と、表示・非表示の切り替えを行います。本文の編集はできません。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reload}
          disabled={loading}
          className="cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          再読み込み
        </Button>
      </AdminPageHeader>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {loading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {activeTabConfig?.empty}
            </p>
          ) : (
            reports.map((report) => (
              <AdminFieldReportCard
                key={report.id}
                report={report}
                showSpotLink
                onChanged={reload}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
