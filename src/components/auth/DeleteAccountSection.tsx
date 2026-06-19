'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { deleteAccountAction } from '@/app/actions/deleteAccount';

// 誤操作防止のため、この文字列を入力させてから退会を実行する
const CONFIRM_WORD = '退会';

export function DeleteAccountSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmText.trim() === CONFIRM_WORD && !isProcessing;

  const handleOpenChange = (open: boolean) => {
    if (isProcessing) return; // 処理中はダイアログを閉じさせない
    setIsOpen(open);
    if (!open) {
      setConfirmText('');
      setError(null);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await deleteAccountAction();
      if (!result.success) {
        setError(result.error ?? '退会処理に失敗しました。');
        setIsProcessing(false);
        return;
      }
      // セッション破棄のためログアウトへ遷移（成功時はそのまま離脱）
      window.location.href = '/auth/logout';
    } catch (e) {
      console.error('Account deletion failed:', e);
      setError('退会処理に失敗しました。時間をおいて再度お試しください。');
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">退会</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          退会すると、アカウントと作成したすべての旅程が完全に削除されます。
          この操作は取り消せません。
        </p>
        <Button
          variant="destructive"
          className="cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          退会する
        </Button>
      </CardContent>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に退会しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              アカウントと作成したすべての旅程が完全に削除され、元に戻すことはできません。
              続行するには下の欄に「{CONFIRM_WORD}」と入力してください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">
              確認のため「{CONFIRM_WORD}」と入力
            </Label>
            <Input
              id="delete-account-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              disabled={isProcessing}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isProcessing}
              className="cursor-pointer"
            >
              キャンセル
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={cn('cursor-pointer', !canConfirm && 'opacity-50')}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  退会処理中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  退会する
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
