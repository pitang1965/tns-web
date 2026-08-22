'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Trash2, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  deleteFieldReport,
  flagFieldReport,
  setFieldReportHidden,
} from '@/app/actions/fieldReports';
import {
  FIELD_REPORT_FLAG_REASON_MAX,
  formatYearMonth,
  type PublicFieldReport,
} from '@/data/schemas/fieldReport';

type FieldReportItemProps = {
  report: PublicFieldReport;
  /** ログイン済みか。未ログインには通報ボタンを出さない */
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export function FieldReportItem({
  report,
  isLoggedIn,
  isAdmin,
}: FieldReportItemProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleDelete = async () => {
    setIsBusy(true);
    const result = await deleteFieldReport(report.id);
    setIsBusy(false);
    setDeleteOpen(false);

    if (!result.success) {
      toast({
        title: '削除できませんでした',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: '現地報告を削除しました' });
    router.refresh();
  };

  const handleFlag = async () => {
    setIsBusy(true);
    const result = await flagFieldReport({
      reportId: report.id,
      reason: flagReason.trim() || undefined,
    });
    setIsBusy(false);
    setFlagOpen(false);
    setFlagReason('');

    if (!result.success) {
      toast({
        title: '通報できませんでした',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: '通報を受け付けました',
      description: '運営が内容を確認します',
    });
    router.refresh();
  };

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
    toast({
      title: report.isHidden ? '再表示しました' : '非表示にしました',
    });
    router.refresh();
  };

  return (
    <li
      className={`rounded-lg border p-4 ${
        report.isHidden
          ? 'border-dashed border-destructive/50 bg-destructive/5'
          : 'border-border'
      }`}
    >
      {/* 訪問年月を主役にし、ハンドルは添え物として末尾に置く。
          投稿日時は表示しない（ADR-0011） */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-semibold">
          {formatYearMonth(report.visitedYearMonth)} の報告
        </span>
        {report.isOwn && (
          <Badge variant="secondary" className="text-xs">
            あなたの報告
          </Badge>
        )}
        {isAdmin && report.isHidden && (
          <Badge variant="destructive" className="text-xs">
            非表示中
          </Badge>
        )}
        {isAdmin && (report.flagCount ?? 0) > 0 && (
          <Badge variant="outline" className="text-xs">
            通報 {report.flagCount}件
          </Badge>
        )}
      </div>

      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
        {report.body}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">— {report.handle}</span>

        <div className="flex items-center gap-1">
          {report.isOwn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={isBusy}
              className="cursor-pointer text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              削除
            </Button>
          )}

          {!report.isOwn && isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlagOpen(true)}
              disabled={isBusy || report.isFlagged}
              className="cursor-pointer text-xs h-8 text-muted-foreground"
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              {report.isFlagged ? '通報済み' : '通報'}
            </Button>
          )}

          {/* 管理者操作は一般向けの「削除」「通報」と横一列に並ぶため、
              区切り線と「管理者」のラベルで、一般ユーザーには見えていないことを示す。
              ボタン名に「（管理者用）」を付けないのは、操作が増えたときに繰り返しになるため。 */}
          {isAdmin && (
            <div className="flex items-center gap-1 pl-1 ml-1 border-l border-border">
              <span className="text-[10px] text-muted-foreground px-1">
                管理者
              </span>
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
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この報告を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              削除すると元に戻せません。書き直したい場合は、削除してから改めて投稿してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="cursor-pointer"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={flagOpen} onOpenChange={setFlagOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この報告を通報しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              事実と違う、宣伝である、攻撃的であるなど、気になる点があれば運営に知らせてください。運営が内容を確認します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={flagReason}
            onChange={(event) => setFlagReason(event.target.value)}
            rows={3}
            maxLength={FIELD_REPORT_FLAG_REASON_MAX}
            placeholder="理由（任意）"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFlag} className="cursor-pointer">
              通報する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
