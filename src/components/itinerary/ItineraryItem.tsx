import React from 'react';
import Link from 'next/link';
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
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const ItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const deleteItinerary = useDeleteItinerary();

  return (
    <Card className='flex flex-col h-full'>
      <Link
        href={`/itineraries/${itinerary.id}`}
        className='flex-grow hover:opacity-80 transition-opacity duration-300'
      >
        <CardHeader>
          <CardTitle className='line-clamp-2'>{itinerary.title}</CardTitle>
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
            {itinerary.startDate} から {itinerary.numberOfDays}日間
          </CardDescription>
          <CardDescription className='line-clamp-3'>
            {itinerary.description}
          </CardDescription>
        </CardContent>
      </Link>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Button size="sm" className='flex-1' onClick={() => {}}>
            編集
          </Button>
          <div className='flex-1'>
            <DeleteConfirmationDialog
              itineraryId={itinerary.id || ''}
              deleteItinerary={deleteItinerary}
              onSuccess={() => {
                // リストの更新は親コンポーネントで行われる想定
                // router.refresh() は自動的に行われる
              }}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
