'use client';

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
} from '@/components/itinerary/TransportationBadge';
import { formatDateWithWeekday } from '@/lib/date';

type Props = {
  itinerary: ClientItineraryDocument;
};

export const PublicItineraryItem: React.FC<Props> = ({ itinerary }) => {
  return (
    <Card className='flex flex-col h-full'>
      <CardHeader>
        <CardTitle className='line-clamp-2'>{itinerary.title}</CardTitle>
        <div className='flex justify-between items-center mt-1'>
          {itinerary.transportation && (
            <TransportationBadge
              type={
                (itinerary.transportation.type as TransportationType) || 'OTHER'
              }
            />
          )}
          {itinerary.owner && (
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              作成者: {itinerary.owner.name || itinerary.owner.email}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className='mb-2'>
          {itinerary.startDate && formatDateWithWeekday(itinerary.startDate)} から {itinerary.numberOfDays}日間
        </CardDescription>
        <CardDescription className='line-clamp-3'>
          {itinerary.description}
        </CardDescription>
      </CardContent>
      <CardFooter className='mt-auto'>
        <div className='flex gap-2 w-full'>
          <Link href={`/itineraries/${itinerary.id}`} className='flex-1'>
            <Button
              size='sm'
              variant='secondary'
              className='flex-1 cursor-pointer'
            >
              見る
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
