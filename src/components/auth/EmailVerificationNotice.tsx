'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { resendVerificationEmail } from '@/app/actions/resendVerificationEmail';

/**
 * メール未認証の利用者に、認証メールの再送手段を与える。
 *
 * これがないと「メール認証をして報告を書く」の導線がアカウント画面で行き止まりになり、
 * 最初の認証メールを見落とした人は現地報告もアズキも永久に使えない。
 *
 * email_verified はログイン時に発行された ID トークンのクレームで、セッションCookieに
 * 入ったまま更新されない。Auth0 側で認証を済ませても再読み込みでは「未認証」のままなので、
 * ログインし直す導線を必ず添える（ここが無いと、救済した人が結局そこで詰まる）。
 */
export function EmailVerificationNotice() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    const result = await resendVerificationEmail();
    setIsSending(false);

    if (!result.success) {
      toast({
        title: '送信できませんでした',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    setHasSent(true);
    toast({
      title: '認証メールを送りました',
      description: 'メールのリンクを開くと認証が完了します',
    });
  };

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              メールアドレスの認証が済んでいません
            </p>
            <p className="text-sm text-muted-foreground">
              認証が済むと、車中泊スポットへの現地報告の投稿や、アズキを使う機能がご利用いただけます。
              登録時にお送りしたメールが見つからない場合は、こちらから再送できます（迷惑メールフォルダもご確認ください）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isSending}
              className="cursor-pointer"
            >
              {isSending && <Spinner className="mr-2 h-4 w-4" />}
              認証メールを再送する
            </Button>
            <Link href="/auth/login?returnTo=/account">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                認証が済んだ方はこちら
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            {hasSent
              ? 'メールのリンクを開いて認証を済ませたら、「認証が済んだ方はこちら」を押してください。この表示は、ログインし直すまで「未認証」のままになります。'
              : 'メールのリンクを開いた後も未認証と表示される場合は、「認証が済んだ方はこちら」を押してください。'}
          </p>
        </div>
      </div>
    </div>
  );
}
