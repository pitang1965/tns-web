'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Coins, Search } from 'lucide-react';
import {
  grantPointsAction,
  lookupPointAccountAction,
  type PointAccountRow,
} from '@/app/actions/points';

/**
 * 管理者：ポイント（アズキ）付与ページ（ADR-0010）。
 * メール／ポイント数／理由 を入力して付与（$incで加算）。事前登録（アカウント作成前）も可。
 */
export default function AdminPointsPage() {
  const { user, isLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState('');
  const [granting, setGranting] = useState(false);

  const [lookupEmail, setLookupEmail] = useState('');
  const [looking, setLooking] = useState(false);
  const [account, setAccount] = useState<PointAccountRow | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  const handleGrant = async () => {
    setGranting(true);
    try {
      const res = await grantPointsAction({ email, amount, reason });
      if (res.success) {
        toast({
          title: '付与しました',
          description: `${res.email} は現在 ${res.balance} アズキ`,
        });
        // 付与先を照会欄にも反映して最新残高を見せる
        setLookupEmail(res.email);
        setAccount({
          email: res.email,
          balance: res.balance,
          recentGranted: 0,
          recentConsumed: 0,
        });
        setLookupDone(false);
      } else {
        toast({
          title: '付与できませんでした',
          description: res.error,
          variant: 'destructive',
        });
      }
    } finally {
      setGranting(false);
    }
  };

  const handleLookup = async () => {
    setLooking(true);
    setLookupDone(false);
    try {
      const res = await lookupPointAccountAction(lookupEmail);
      if (res.success) {
        setAccount(res.row);
        setLookupDone(true);
      } else {
        toast({
          title: '照会できませんでした',
          description: res.error,
          variant: 'destructive',
        });
      }
    } finally {
      setLooking(false);
    }
  };

  if (isLoading || adminLoading) {
    return (
      <main className="container mx-auto p-4">
        <LoadingSpinner />
      </main>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-2">
        <p className="text-gray-600 dark:text-gray-300">ログインが必要です。</p>
        <a className="text-blue-600 underline" href="/auth/login">
          ログイン
        </a>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-2">
        <h1 className="text-2xl font-bold text-red-600">アクセス権限がありません</h1>
        <p className="text-gray-600 dark:text-gray-300">
          このページは管理者のみが利用できます。
        </p>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <AdminPageHeader>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Coins className="h-5 w-5" />
          アズキ（ポイント）付与
        </h1>
        <p className="text-sm mt-1">
          メールアドレスにアズキを付与します。アカウント作成前のメールにも事前付与できます（1アズキ＝1回のAI旅程ドラフト生成）。
        </p>
      </AdminPageHeader>

      <Card>
        <CardHeader>
          <CardTitle>付与する</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">メールアドレス*</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tester@example.com"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">付与するアズキ数*</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">理由（任意）</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="クローズドテスト協力"
              />
            </div>
          </div>
          <Button
            onClick={handleGrant}
            disabled={granting || !email.trim() || amount <= 0}
            className="w-full"
          >
            <Coins className="h-4 w-4 mr-2" />
            {granting ? '付与中…' : `${amount} アズキを付与する`}
          </Button>
          <p className="text-xs text-muted-foreground">
            付与は加算です（既存残高に上乗せ）。使い切った人への補充も同じ操作で行えます。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>残高を確認する</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="tester@example.com"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleLookup}
              disabled={looking || !lookupEmail.trim()}
            >
              <Search className="h-4 w-4 mr-1" />
              照会
            </Button>
          </div>

          {account ? (
            <div className="rounded border p-3 text-sm space-y-1">
              <p className="font-medium">{account.email}</p>
              <p>
                残高：<span className="font-bold">{account.balance}</span> アズキ
              </p>
              <p className="text-muted-foreground">
                付与 {account.recentGranted} 件 / 消費 {account.recentConsumed} 件
              </p>
            </div>
          ) : (
            lookupDone && (
              <p className="text-sm text-muted-foreground">
                このメールにはまだ付与記録がありません（未付与）。
              </p>
            )
          )}
        </CardContent>
      </Card>
    </main>
  );
}
