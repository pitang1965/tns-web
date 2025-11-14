'use client';

import Link from 'next/link';
import { Eye, X, Edit, History } from 'lucide-react';
import { useRecentUrls } from '@/hooks/useRecentUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmallText } from './Typography';

type ViewType = 'itinerary' | 'itineraryEdit' | 'campingSpot' | 'campingSpotEdit' | 'other';

type ViewInfo = {
  type: ViewType;
  id?: string;
  isEdit: boolean;
  category: 'itinerary' | 'campingSpot' | 'other';
};

export default function RecentViews() {
  const { recentUrls, removeUrl, clearHistory } = useRecentUrls();

  // URLの種類を判定
  const getViewInfo = (url: string): ViewInfo => {
    // 旅程編集: /itineraries/[id]/edit
    const itineraryEditMatch = url.match(/^\/itineraries\/([^\/]+)\/edit/);
    if (itineraryEditMatch) {
      return {
        type: 'itineraryEdit',
        id: itineraryEditMatch[1],
        isEdit: true,
        category: 'itinerary',
      };
    }

    // 旅程閲覧: /itineraries/[id]
    const itineraryMatch = url.match(/^\/itineraries\/([^\/]+)/);
    if (itineraryMatch && !url.includes('/new') && !url.endsWith('/itineraries')) {
      return {
        type: 'itinerary',
        id: itineraryMatch[1],
        isEdit: false,
        category: 'itinerary',
      };
    }

    // 管理者用車中泊スポット編集: /admin/shachu-haku/[id]
    const campingSpotEditMatch = url.match(/^\/admin\/shachu-haku\/([^\/]+)$/);
    if (campingSpotEditMatch) {
      return {
        type: 'campingSpotEdit',
        id: campingSpotEditMatch[1],
        isEdit: true,
        category: 'campingSpot',
      };
    }

    // 車中泊スポット閲覧: /shachu-haku/[spotId]
    const campingSpotMatch = url.match(/^\/shachu-haku\/([^\/]+)$/);
    if (campingSpotMatch) {
      return {
        type: 'campingSpot',
        id: campingSpotMatch[1],
        isEdit: false,
        category: 'campingSpot',
      };
    }

    return { type: 'other', isEdit: false, category: 'other' };
  };

  // 表示対象のURLをフィルタリング
  const relevantUrls = recentUrls.filter((item) => {
    const info = getViewInfo(item.url);
    return info.category === 'itinerary' || info.category === 'campingSpot';
  });

  const getViewIcon = (info: ViewInfo) => {
    // アイコンは編集/閲覧で決定
    if (info.isEdit) {
      return <Edit size={14} className='text-orange-500' />;
    } else {
      return <Eye size={14} className='text-blue-500' />;
    }
  };

  const getViewBadge = (info: ViewInfo) => {
    // バッジはカテゴリで決定（QuickActionsの色と合わせる）
    switch (info.category) {
      case 'itinerary':
        return (
          <Badge variant='secondary' className='text-xs bg-blue-500 text-white'>
            旅程
          </Badge>
        );
      case 'campingSpot':
        return (
          <Badge variant='secondary' className='text-xs bg-purple-500 text-white'>
            車中泊
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
            <History size={20} />
            アクセス履歴
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
          <History size={20} />
          アクセス履歴
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
                    {getViewIcon(info)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium truncate'>{item.title}</p>
                      {getViewBadge(info)}
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
