'use client';

import Link from 'next/link';
import { Clock, ExternalLink, X, Calendar, MapPin } from 'lucide-react';
import { useRecentUrls } from '@/hooks/useRecentUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmallText } from './Typography';

export default function RecentItineraryViews() {
  const { recentUrls, removeUrl, clearHistory } = useRecentUrls();

  // 旅程関連のURLのみをフィルタリング
  const itineraryUrls = recentUrls.filter(
    (item) =>
      item.url.includes('/itineraries/') &&
      !item.url.includes('/new') &&
      !item.url.endsWith('/itineraries')
  );

  if (itineraryUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock size={20} />
            最近見た旅程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SmallText className='text-muted-foreground'>
            まだ閲覧履歴がありません
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

  const getItineraryInfo = (url: string) => {
    // URLから旅程IDと日程を抽出
    const match = url.match(/\/itineraries\/([^\/]+)(?:\/day\/(\d+))?/);
    if (match) {
      const itineraryId = match[1];
      const dayIndex = match[2] ? parseInt(match[2]) + 1 : null;
      return { itineraryId, dayIndex };
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Clock size={20} />
          最近見た旅程
        </CardTitle>
        {itineraryUrls.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearHistory}
            className='text-muted-foreground hover:text-destructive cursor-pointer'
          >
            履歴をクリア
          </Button>
        )}
      </CardHeader>
      <CardContent className='space-y-3'>
        {itineraryUrls.map((item, index) => {
          const info = getItineraryInfo(item.url);

          return (
            <div
              key={`${item.url}-${index}`}
              className='flex items-center justify-between group hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors'
            >
              <div className='flex-1 min-w-0'>
                <Link
                  href={item.url}
                  className='flex items-center gap-2 text-sm hover:text-primary transition-colors'
                >
                  <div className='flex items-center gap-1 flex-shrink-0'>
                    {info?.dayIndex ? (
                      <Calendar size={14} className='text-blue-500' />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium truncate'>
                      {item.title}
                      {info?.dayIndex && (
                        <span className='text-blue-600 ml-1'>
                          - {info.dayIndex}日目
                        </span>
                      )}
                    </p>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span>{formatTimestamp(item.timestamp)}</span>
                      {info?.dayIndex && (
                        <div className='flex items-center gap-1'>
                          <MapPin size={10} />
                          <span>日程詳細</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => removeUrl(item.url)}
                className='opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-muted-foreground hover:text-destructive cursor-pointer'
              >
                <X size={14} />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
