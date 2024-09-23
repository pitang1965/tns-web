import React from 'react';
import Link from 'next/link';
import { ItineraryClient } from '@/data/types/itinerary';
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

type Props = {
  itinerary: ItineraryClient;
};

export const ItineraryItem: React.FC<Props> = ({ itinerary }) => {
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
            onClick={() => {}}
            variant='destructive'
          >
            削除
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
