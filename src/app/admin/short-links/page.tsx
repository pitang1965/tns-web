'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LoginButton } from '@/components/auth/LoginButton';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Link2, Copy } from 'lucide-react';
import {
  getOrCreateShortLink,
  listShortLinks,
  type ShortLinkRow,
} from '@/app/actions/shortLinks';

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 管理者：汎用短縮URL発行ページ。車中泊スポットに限らず、提携先なふだ
 * (nafuda.me)のURLなど任意のURLを短縮できる。
 */
export default function AdminShortLinksPage() {
  const { user, isLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<ShortLinkRow[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    listShortLinks()
      .then(setLinks)
      .catch(() => setLinks([]));
  }, [isAdmin]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const row = await getOrCreateShortLink(url.trim());
      setLinks((prev) => [row, ...(prev ?? []).filter((r) => r.code !== row.code)]);
      const copied = await copyToClipboard(row.shortUrl);
      toast({
        title: copied ? '発行してコピーしました' : '発行しました',
        description: row.shortUrl,
      });
      setUrl('');
    } catch (error) {
      toast({
        title: '発行できませんでした',
        description: error instanceof Error ? error.message : '不明なエラー',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
        <LoginButton />
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
          <Link2 className="h-5 w-5" />
          短縮URL管理
        </h1>
        <p className="text-sm mt-1">
          任意のURLを短縮します。本アプリのページに限らず、なふだ(nafuda.me)のURLなども対象です。同じURLは常に同じ短縮URLを返します。
        </p>
      </AdminPageHeader>

      <Card>
        <CardHeader>
          <CardTitle>短縮する</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">元のURL*</label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tabi.over40web.club/shachu-haku/..."
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !url.trim()}
            className="w-full"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {creating ? '発行中…' : '短縮してコピーする'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>発行済みの短縮URL</CardTitle>
        </CardHeader>
        <CardContent>
          {links === null ? (
            <LoadingSpinner />
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだありません。</p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.code}
                  className="rounded border p-3 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={link.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 underline break-all"
                    >
                      {link.shortUrl}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 cursor-pointer"
                      onClick={async () => {
                        const copied = await copyToClipboard(link.shortUrl);
                        toast({
                          title: copied ? 'コピーしました' : 'コピーできませんでした',
                          variant: copied ? undefined : 'destructive',
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground break-all">
                    {link.targetUrl}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
