'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { NotebookPen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { FieldReportDialog } from './FieldReportDialog';
import { FieldReportItem } from './FieldReportItem';
import type { PublicFieldReport } from '@/data/schemas/fieldReport';

type FieldReportSectionProps = {
  spotId: string;
  spotName: string;
  reports: PublicFieldReport[];
};

/**
 * 現地報告の一覧と投稿導線。
 *
 * 初版は詳細ページにのみ置く。地図・一覧への展開は、1年以内の報告があるスポットが
 * 100件を超えてから（CampingSpot への抜粋の非正規化とセットで行う）。
 */
export function FieldReportSection({
  spotId,
  spotName,
  reports,
}: FieldReportSectionProps) {
  const { user, isLoading } = useUser();
  const { isAdmin } = useAdminStatus();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isLoggedIn = !!user;
  const needsEmailVerification = isLoggedIn && !user?.email_verified;

  const renderAction = () => {
    if (isLoading) return null;

    if (!isLoggedIn) {
      return (
        <Link
          href={`/auth/login?returnTo=${encodeURIComponent(pathname)}`}
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="cursor-pointer">
            <PenLine className="w-4 h-4 mr-1" />
            ログインして報告を書く
          </Button>
        </Link>
      );
    }

    if (needsEmailVerification) {
      return (
        <Link href="/account" className="shrink-0">
          <Button variant="outline" size="sm" className="cursor-pointer">
            メール認証をして報告を書く
          </Button>
        </Link>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="cursor-pointer shrink-0"
      >
        <PenLine className="w-4 h-4 mr-1" />
        報告を書く
      </Button>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <NotebookPen className="w-5 h-5" />
              現地報告
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              実際に訪れた方が見聞きしたことです。掲載情報より新しい場合があります。
            </p>
          </div>
          {renderAction()}
        </div>
      </CardHeader>

      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-medium">まだ報告がありません。</p>
            <p className="text-sm text-muted-foreground">
              最初の1件を書きませんか？
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <FieldReportItem
                key={report.id}
                report={report}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </CardContent>

      {isLoggedIn && !needsEmailVerification && (
        <FieldReportDialog
          spotId={spotId}
          spotName={spotName}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </Card>
  );
}
