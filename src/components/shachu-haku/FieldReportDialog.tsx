'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { createFieldReport } from '@/app/actions/fieldReports';
import {
  FIELD_REPORT_BODY_MAX,
  FIELD_REPORT_MIN_YEAR,
  currentYearMonth,
} from '@/data/schemas/fieldReport';

type FieldReportDialogProps = {
  spotId: string;
  spotName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FieldReportDialog({
  spotId,
  spotName,
  open,
  onOpenChange,
}: FieldReportDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const thisMonth = currentYearMonth();

  // 既定値は「今月」。大半の報告は泊まった直後に書かれるため、
  // これがそのまま正解になり入力の摩擦がほぼ生じない。
  const [visitedYearMonth, setVisitedYearMonth] = useState(thisMonth);
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = FIELD_REPORT_BODY_MAX - body.length;
  const isOverLimit = remaining < 0;
  const canSubmit = body.trim().length > 0 && !isOverLimit && !isSubmitting;

  const resetForm = () => {
    setVisitedYearMonth(thisMonth);
    setBody('');
  };

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const result = await createFieldReport({
      spotId,
      visitedYearMonth,
      body: body.trim(),
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast({
        title: '投稿できませんでした',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    resetForm();
    onOpenChange(false);
    toast({
      title: '現地報告を投稿しました',
      description: 'ご協力ありがとうございます',
    });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>現地報告を書く</DialogTitle>
          <DialogDescription>
            {spotName}で見聞きしたことを教えてください。感想でも、掲載情報との違いでもかまいません。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-report-visited">いつ訪れましたか</Label>
            <input
              id="field-report-visited"
              type="month"
              value={visitedYearMonth}
              max={thisMonth}
              min={`${FIELD_REPORT_MIN_YEAR}-01`}
              onChange={(event) => setVisitedYearMonth(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              日付までは記録しません。年月だけが公開されます。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-report-body">報告の内容</Label>
            <Textarea
              id="field-report-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              placeholder="例）夜通し静かでした。トイレは24時間使えます。入口の看板に「車中泊はご遠慮ください」と追加されていました。"
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                URLは投稿できません
              </span>
              <span
                className={
                  isOverLimit ? 'text-destructive' : 'text-muted-foreground'
                }
              >
                残り{remaining}文字
              </span>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p>
              投稿すると、匿名のニックネームと訪問年月とともにすぐ公開されます。
              本名やメールアドレスは表示されません。
            </p>
            <p>投稿した日時は公開されません。投稿はいつでも削除できます。</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            投稿する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
