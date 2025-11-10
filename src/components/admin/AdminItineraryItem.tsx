import React from 'react';
import { useRouter } from 'next/navigation';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateWithWeekday } from '@/lib/date';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const AdminItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const router = useRouter();

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '不明';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '不明';
    }
  };

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <div className='flex flex-col gap-2'>
          <div className='flex items-start justify-between gap-2'>
            <CardTitle className='line-clamp-2 flex-1'>
              {itinerary.title}
            </CardTitle>
            {itinerary.isPublic ? (
              <Badge className='flex-shrink-0'>公開</Badge>
            ) : (
              <Badge variant='outline' className='flex-shrink-0'>
                非公開
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        <CardDescription className='mb-2'>
          {itinerary.startDate && formatDateWithWeekday(itinerary.startDate)}{' '}
          から {itinerary.numberOfDays}日間
        </CardDescription>
        <CardDescription className='line-clamp-3'>
          {itinerary.description}
        </CardDescription>
        <div className='pt-2 space-y-1 text-xs text-muted-foreground border-t'>
          <div>作成者: {itinerary.owner?.name || '不明'}</div>
          <div>作成日: {formatDate(itinerary.createdAt)}</div>
          <div>更新日: {formatDate(itinerary.updatedAt)}</div>
        </div>
      </CardContent>
      <CardFooter className='mt-auto'>
        <Button
          size='sm'
          variant='secondary'
          className='w-full cursor-pointer'
          onClick={() => router.push(`/itineraries/${itinerary.id}`)}
        >
          見る
        </Button>
      </CardFooter>
    </Card>
  );
};
