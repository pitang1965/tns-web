import React, { useState } from 'react';
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
import {
  TransportationBadge,
  TransportationType,
} from '@/components/itinerary/TransportationBadge';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';
import { formatDateWithWeekday } from '@/lib/date';
import { useUser } from '@auth0/nextjs-auth0/client';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const ItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const deleteItinerary = useDeleteItinerary();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleDelete = async () => {
    if (!itinerary.id) {
      throw new Error('無効な旅程IDです。');
    }
    return deleteItinerary(itinerary.id);
  };

  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <CardTitle className='line-clamp-2'>{itinerary.title}</CardTitle>
          {itinerary.isPublic ? (
            <Badge>公開</Badge>
          ) : (
            <Badge variant='outline'>非公開</Badge>
          )}
        </div>
        {itinerary.transportation && (
          <TransportationBadge
            type={
              (itinerary.transportation.type as TransportationType) || 'OTHER'
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <CardDescription className='mb-2'>
          {itinerary.startDate && formatDateWithWeekday(itinerary.startDate)}{' '}
          から {itinerary.numberOfDays}日間
        </CardDescription>
        <CardDescription className='line-clamp-3'>
          {itinerary.description}
        </CardDescription>
      </CardContent>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Button
            size='sm'
            variant='secondary'
            className='flex-1 cursor-pointer'
            onClick={() => router.push(`/itineraries/${itinerary.id}`)}
          >
            見る
          </Button>
          {user && itinerary.owner && user.sub === itinerary.owner.id && (
            <>
              <Button
                size='sm'
                className='flex-1 cursor-pointer'
                onClick={() => router.push(`/itineraries/${itinerary.id}/edit`)}
              >
                編集
              </Button>
              <Button
                variant='destructive'
                size='sm'
                className='flex-1 cursor-pointer'
                onClick={() => setIsConfirmOpen(true)}
              >
                削除
              </Button>
            </>
          )}
        </div>
      </CardFooter>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title='旅程の削除'
        description='この旅程を削除してもよろしいですか？この操作は取り消せません。'
        confirmLabel='削除'
        onConfirm={handleDelete}
        variant='destructive'
      />
    </Card>
  );
};
