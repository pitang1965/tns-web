'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { NotebookPen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { capture } from '@/lib/analytics';
import { getFieldReportsBySpot } from '@/app/actions/fieldReports';
import { FieldReportDialog } from './FieldReportDialog';
import { FieldReportItem } from './FieldReportItem';
import type { PublicFieldReport } from '@/data/schemas/fieldReport';

/** ログイン後に「報告を書く」へ復帰させるための目印。復帰時に一度だけ使って消す */
export const FIELD_REPORT_RETURN_PARAM = 'report';

type FieldReportSectionProps = {
  spotId: string;
  spotName: string;
  spotType: string;
  reports: PublicFieldReport[];
};

/** 投稿できるかどうかの状態。計測の内訳（どこで落ちているか）の軸になる */
type AuthState = 'anonymous' | 'unverified' | 'verified';

/**
 * 現地報告の一覧と投稿導線。
 *
 * 初版は詳細ページにのみ置く。地図・一覧への展開は、1年以内の報告があるスポットが
 * 100件を超えてから（CampingSpot への抜粋の非正規化とセットで行う）。
 *
 * セクションの「位置」は意図的に据え置いている。到達率（camping_spot_viewed →
 * field_report_prompt_viewed）を先に測らないと、投稿が少ない原因が「最下部まで
 * 来られていない」のか「見たうえで書かれていない」のか区別できず、打ち手が正反対に
 * なるため。位置を動かすのは到達率のベースラインが取れてから。
 */
export function FieldReportSection({
  spotId,
  spotName,
  spotType,
  reports,
}: FieldReportSectionProps) {
  const { user, isLoading } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const pathname = usePathname();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasCapturedViewRef = useRef(false);
  const hasHandledReturnRef = useRef(false);

  const isLoggedIn = !!user;
  const needsEmailVerification = isLoggedIn && !user?.email_verified;
  const canPost = isLoggedIn && !needsEmailVerification;

  // props の reports は ISR ページが匿名ビューで取得したもので、
  // isOwn / isFlagged / 管理者項目が入っていない。ログイン中だけ
  // ビューアー固有情報付きで取り直して上書きする。
  const [viewerReports, setViewerReports] = useState<
    PublicFieldReport[] | null
  >(null);
  const userSub = user?.sub ?? null;

  // 投稿・削除・通報・非表示の成功時に、子コンポーネントから取り直しを発火させる。
  // props（ISRページの匿名ビュー）の更新に頼ると、router.refresh() の反映タイミング
  // 次第で古い viewerReports が表示に残り続けるため、明示的に取り直す。
  const [refreshTick, setRefreshTick] = useState(0);
  const handleMutated = () => setRefreshTick((tick) => tick + 1);

  // props の内容が実際に変わったときだけ取り直すための指紋。
  // 依存配列に reports（配列そのもの）を入れてはならない：Server Action の応答は
  // ページの再レンダリングを伴い props が毎回新しい配列になるため、
  // 「取り直し→再レンダリング→取り直し…」の無限ループになる（実際に起きた）。
  const reportsKey = useMemo(
    () => reports.map((report) => report.id).join(','),
    [reports],
  );

  useEffect(() => {
    if (isLoading || !userSub) return;
    let cancelled = false;
    getFieldReportsBySpot(spotId)
      .then((result) => {
        if (!cancelled) setViewerReports(result);
      })
      .catch(() => {
        // 失敗しても匿名ビュー（props）のまま表示できるので握りつぶす
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, userSub, spotId, reportsKey, refreshTick]);

  // 未ログインに戻ったら state は消さず導出で匿名ビューへ切り替える
  // （Auth0 のログアウトはフルリダイレクトなので実際は再マウントされる）
  const displayReports = isLoggedIn && viewerReports ? viewerReports : reports;

  const authState: AuthState = !isLoggedIn
    ? 'anonymous'
    : needsEmailVerification
      ? 'unverified'
      : 'verified';

  // 認証状態と管理者判定が確定するまでは計測しない（内訳が誤った値で記録されるため）
  const isAnalyticsReady = !isLoading && !isAdminLoading;

  const analyticsProps = useMemo(
    () => ({
      spot_id: spotId,
      spot_type: spotType,
      auth_state: authState,
      // 1件目を書かせるのと2件目以降を書かせるのは別の難易度なので必ず分けて記録する
      has_reports: displayReports.length > 0,
      report_count: displayReports.length,
      is_admin: isAdmin,
    }),
    [spotId, spotType, authState, displayReports.length, isAdmin],
  );

  // セクションが実際に画面内へ入ったときだけ「到達」として1回記録する。
  // ページ閲覧数を分母にすると、最下部まで来ていない人まで数えてしまう。
  useEffect(() => {
    if (!isAnalyticsReady || hasCapturedViewRef.current) return;
    const element = sectionRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (hasCapturedViewRef.current) return;
        hasCapturedViewRef.current = true;
        capture('field_report_prompt_viewed', analyticsProps);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isAnalyticsReady, analyticsProps]);

  // ログインから復帰したときは、投稿ダイアログまで連れ戻す。
  // これがないと、認証を通した直後にページ先頭へ着地し、最下部まで
  // 自力でスクロールし直さないと書けない（＝意思表示した人を取りこぼす）。
  useEffect(() => {
    if (!isAnalyticsReady || hasHandledReturnRef.current) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get(FIELD_REPORT_RETURN_PARAM) !== '1') return;

    hasHandledReturnRef.current = true;

    // 目印は一度使ったら消す。この状態のURLが共有・ブックマークされても、
    // 別の人の画面で勝手にダイアログが開かないようにするため。
    router.replace(pathname, { scroll: false });

    // メール未認証のまま戻ってきた場合は開けない（セクションまでは案内する）
    if (!canPost) {
      sectionRef.current?.scrollIntoView({ block: 'start' });
      return;
    }

    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 開くのは次のフレーム。effect 内で同期的に state を変えると連鎖レンダリングになる。
    const frame = requestAnimationFrame(() => setDialogOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isAnalyticsReady, canPost, pathname, router]);

  const handleCtaClick = () => {
    capture('field_report_cta_clicked', analyticsProps);
  };

  const renderAction = () => {
    if (isLoading) return null;

    if (!isLoggedIn) {
      const returnTo = `${pathname}?${FIELD_REPORT_RETURN_PARAM}=1`;
      return (
        <Link
          href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
          className="shrink-0"
          onClick={handleCtaClick}
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
        <Link href="/account" className="shrink-0" onClick={handleCtaClick}>
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
        onClick={() => {
          handleCtaClick();
          setDialogOpen(true);
        }}
        className="cursor-pointer shrink-0"
      >
        <PenLine className="w-4 h-4 mr-1" />
        報告を書く
      </Button>
    );
  };

  return (
    <Card ref={sectionRef}>
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
        {displayReports.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-medium">まだ報告がありません。</p>
            <p className="text-sm text-muted-foreground">
              最初の1件を書きませんか？
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {displayReports.map((report) => (
              <FieldReportItem
                key={report.id}
                report={report}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                onMutated={handleMutated}
              />
            ))}
          </ul>
        )}
      </CardContent>

      {canPost && (
        <FieldReportDialog
          spotId={spotId}
          spotName={spotName}
          spotType={spotType}
          hadReportsBefore={displayReports.length > 0}
          reportCountBefore={displayReports.length}
          isAdmin={isAdmin}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onMutated={handleMutated}
        />
      )}
    </Card>
  );
}
