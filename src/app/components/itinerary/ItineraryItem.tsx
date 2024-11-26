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
import { useDeleteItinerary } from '@/hooks/useDeleteItinerary';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const ItineraryItem: React.FC<Props> = ({ itinerary }) => {
  const deleteItinerary = useDeleteItinerary();

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (itinerary.id) {
      deleteItinerary(itinerary.id);
    }
  };

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
            {itinerary.startDate} - {itinerary.endDate}
          </CardDescription>
          <CardDescription className='line-clamp-3'>
            {itinerary.description}
          </CardDescription>
        </CardContent>
      </Link>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Button className='flex-1' onClick={() => {}}>
            編集
          </Button>
          <Button
            className='flex-1 delete-itinerary'
            onClick={handleDelete}
            variant='destructive'
          >
            削除
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
