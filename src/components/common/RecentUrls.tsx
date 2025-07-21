'use client';

import Link from 'next/link';
import { Clock, ExternalLink, X } from 'lucide-react';
import { useRecentUrls } from '@/hooks/useRecentUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmallText } from './Typography';

export default function RecentUrls() {
  const { recentUrls, removeUrl, clearHistory } = useRecentUrls();

  if (recentUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock size={20} />
            最近アクセスしたページ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SmallText className='text-muted-foreground'>
            まだアクセス履歴がありません
          </SmallText>
        </CardContent>
      </Card>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays}日前`;
    } else if (diffHours > 0) {
      return `${diffHours}時間前`;
    } else {
      return '1時間以内';
    }
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Clock size={20} />
          最近アクセスしたページ
        </CardTitle>
        {recentUrls.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearHistory}
            className='text-muted-foreground hover:text-destructive'
          >
            履歴をすべてクリア
          </Button>
        )}
      </CardHeader>
      <CardContent className='space-y-3'>
        {recentUrls.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className='flex items-center justify-between group hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors'
          >
            <div className='flex-1 min-w-0'>
              <Link
                href={item.url}
                className='flex items-center gap-2 text-sm hover:text-primary transition-colors'
              >
                <ExternalLink size={14} className='flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='font-medium truncate'>{item.title}</p>
                  <p className='text-xs text-muted-foreground truncate'>
                    {item.url}
                  </p>
                </div>
              </Link>
              <p className='text-xs text-muted-foreground mt-1'>
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => removeUrl(item.url)}
              className='opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-muted-foreground hover:text-destructive'
            >
              <X size={14} />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
