'use client';

import Link from 'next/link';
import { Eye, X, MapPin, Map } from 'lucide-react';
import { useRecentUrls } from '@/hooks/useRecentUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmallText } from './Typography';

type ViewType = 'itinerary' | 'campingSpot' | 'other';

type ViewInfo = {
  type: ViewType;
  id?: string;
};

export default function RecentViews() {
  const { recentUrls, removeUrl, clearHistory } = useRecentUrls();

  // URLの種類を判定
  const getViewInfo = (url: string): ViewInfo => {
    // 車中泊スポット: /shachu-haku/[spotId]
    const campingSpotMatch = url.match(/^\/shachu-haku\/([^\/]+)$/);
    if (campingSpotMatch) {
      return { type: 'campingSpot', id: campingSpotMatch[1] };
    }

    // 旅程: /itineraries/[id] (day パラメータを含む場合もある)
    const itineraryMatch = url.match(/^\/itineraries\/([^\/]+)/);
    if (itineraryMatch && !url.includes('/new') && !url.endsWith('/itineraries')) {
      return { type: 'itinerary', id: itineraryMatch[1] };
    }

    return { type: 'other' };
  };

  // 表示対象のURLをフィルタリング
  const relevantUrls = recentUrls.filter((item) => {
    const info = getViewInfo(item.url);
    return info.type === 'itinerary' || info.type === 'campingSpot';
  });

  const getViewIcon = (type: ViewType) => {
    switch (type) {
      case 'campingSpot':
        return <Map size={14} className='text-green-500' />;
      case 'itinerary':
        return <MapPin size={14} className='text-purple-500' />;
      default:
        return <Eye size={14} />;
    }
  };

  const getViewBadge = (type: ViewType) => {
    switch (type) {
      case 'campingSpot':
        return (
          <Badge variant='secondary' className='text-xs'>
            車中泊
          </Badge>
        );
      case 'itinerary':
        return (
          <Badge variant='secondary' className='text-xs'>
            旅程
          </Badge>
        );
      default:
        return null;
    }
  };

  if (relevantUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye size={20} />
            閲覧履歴
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

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Eye size={20} />
          閲覧履歴
        </CardTitle>
        {relevantUrls.length > 0 && (
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
        {relevantUrls.map((item, index) => {
          const info = getViewInfo(item.url);

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
                    {getViewIcon(info.type)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium truncate'>{item.title}</p>
                      {getViewBadge(info.type)}
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                      <span>{formatTimestamp(item.timestamp)}</span>
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
