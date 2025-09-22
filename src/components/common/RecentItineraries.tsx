'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SmallText } from './Typography';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

type RecentItinerariesProps = {
  itineraries: ClientItineraryDocument[];
  limit?: number;
};

export default function RecentItineraries({ itineraries, limit = 3 }: RecentItinerariesProps) {
  const recentItineraries = itineraries
    .filter(itinerary => itinerary.updatedAt) // updatedAtが存在するもののみ
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
    .slice(0, limit);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '日付未設定';

    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastUpdated = (updatedAt: string | undefined) => {
    if (!updatedAt) return '不明';

    const date = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}日前`;
    } else if (diffHours > 0) {
      return `${diffHours}時間前`;
    } else {
      return '1時間以内';
    }
  };

  if (recentItineraries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock size={20} />
            最近の旅程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SmallText className='text-muted-foreground'>
            まだ旅程がありません
          </SmallText>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock size={20} />
          最近の旅程
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {recentItineraries.map((itinerary) => (
          <Link
            key={itinerary.id}
            href={`/itineraries/${itinerary.id}`}
            className='block group hover:bg-muted/50 rounded-md p-3 -m-3 transition-colors'
          >
            <div className='space-y-2'>
              <div className='flex items-start justify-between'>
                <h4 className='font-medium line-clamp-1 group-hover:text-primary transition-colors'>
                  {itinerary.title}
                </h4>
                <div className='flex gap-1 ml-2 flex-shrink-0'>
                  {itinerary.isPublic && (
                    <Badge variant='secondary' className='text-xs'>
                      <Users size={10} className='mr-1' />
                      公開
                    </Badge>
                  )}
                </div>
              </div>

              {itinerary.description && (
                <p className='text-sm text-muted-foreground line-clamp-2'>
                  {itinerary.description}
                </p>
              )}

              <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar size={12} />
                  {formatDate(itinerary.startDate)}
                </div>
                <div className='flex items-center gap-1'>
                  <MapPin size={12} />
                  {itinerary.numberOfDays}日間
                </div>
                <div className='flex items-center gap-1'>
                  <Clock size={12} />
                  {formatLastUpdated(itinerary.updatedAt)}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {itineraries.length > limit && (
          <div className='pt-2 border-t'>
            <Link
              href='/itineraries'
              className='text-sm text-primary hover:underline'
            >
              すべての旅程を見る →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}